import { describe, it, expect } from 'vitest';
import { buildIndex, fuzzyScore, groupByKind, search } from './search';
import { SERVER_PLUS } from './data/seed/serverPlus';
import { CYSA_PLUS } from './data/seed/cysa';

describe('fuzzyScore', () => {
  it('ranks a prefix above a word start above a scattered subsequence', () => {
    const prefix = fuzzyScore('wire', 'Wire the ops network');
    const wordStart = fuzzyScore('ops', 'Wire the ops network');
    const scattered = fuzzyScore('wtn', 'Wire the ops network');
    expect(prefix).toBeGreaterThan(wordStart);
    expect(wordStart).toBeGreaterThan(scattered);
    expect(scattered).toBeGreaterThan(0);
  });

  it('returns 0 when the query is not a subsequence', () => {
    expect(fuzzyScore('xyz', 'Wire the ops network')).toBe(0);
    expect(fuzzyScore('network wire', 'Wire the ops network')).toBe(0);
  });

  it('is case-insensitive and treats an empty query as a match', () => {
    expect(fuzzyScore('WIRE', 'wire the ops')).toBeGreaterThan(0);
    expect(fuzzyScore('', 'anything')).toBe(1);
  });
});

describe('buildIndex + search', () => {
  const items = buildIndex({
    courses: [SERVER_PLUS, CYSA_PLUS],
    signedIn: true,
    isInstructor: false,
    hasTeam: (id) => id === 'server-plus',
  });

  it('an empty query lists pages and courses first', () => {
    const r = search(items, '');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((i) => i.kind === 'page' || i.kind === 'course')).toBe(true);
  });

  it('a step href carries the task and step deep link', () => {
    const r = search(items, 'ifreload');
    const step = r.find((i) => i.kind === 'step');
    expect(step).toBeTruthy();
    expect(step!.href).toMatch(/\/courses\/server-plus\?tab=tasks&week=\d&task=sp-w6-[a-z]+&step=sp-w6-[a-z]+-s\d/);
  });

  it('finds a command by its text, a procedure by its title, a term by its name', () => {
    expect(search(items, 'terraform plan').some((i) => i.kind === 'step')).toBe(true);
    const proc = search(items, 'Destroy a server and rebuild').find((i) => i.kind === 'procedure');
    expect(proc?.href).toBe('/courses/server-plus/guide#rebuild-from-git');
    expect(search(items, 'idempotent').find((i) => i.kind === 'term')?.title).toBe('idempotent');
  });

  it('shows forms only with a team, and the studio only to instructors', () => {
    expect(items.some((i) => i.kind === 'form' && i.courseId === 'server-plus')).toBe(true);
    expect(items.some((i) => i.kind === 'form' && i.courseId === 'cysa-plus')).toBe(false);
    expect(items.some((i) => i.id === 'page:instructor')).toBe(false);
    const asInstructor = buildIndex({ courses: [SERVER_PLUS], signedIn: true, isInstructor: true, hasTeam: () => false });
    expect(asInstructor.some((i) => i.id === 'page:instructor')).toBe(true);
    expect(asInstructor.some((i) => i.id === 'cohort:server-plus')).toBe(true);
  });

  it('groups results in the palette order and drops empty groups', () => {
    const g = groupByKind(search(items, 'week 6', 30));
    expect(g.map((x) => x.kind)).toEqual([...new Set(g.map((x) => x.kind))]);
    expect(g.every((x) => x.items.length > 0)).toBe(true);
    expect(g[0].kind).toBe('week');
  });

  it('caps results at the limit', () => {
    expect(search(items, 'the', 5)).toHaveLength(5);
  });
});

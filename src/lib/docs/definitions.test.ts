import { describe, it, expect } from 'vitest';
import {
  DELIVERABLES,
  seedDeliverable,
  withoutSeedRows,
  deliverableIdByTitle,
  deliverableIdByFile,
  deliverablesForRole,
  deliverablesForCourse,
  courseIdOf,
  getDeliverable,
} from './definitions';
import { emptyData } from './types';

describe('DELIVERABLES integrity', () => {
  it('has globally-unique ids and per-course-unique numbers', () => {
    const ids = DELIVERABLES.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Numbers are the display ordinal within a course, so they only need to be
    // unique per course (Security+ 1..14, MSSP 1..8, …).
    const byCourse = new Map<string, number[]>();
    for (const d of DELIVERABLES) {
      const key = courseIdOf(d);
      byCourse.set(key, [...(byCourse.get(key) ?? []), d.num]);
    }
    for (const [course, nums] of byCourse) {
      expect(new Set(nums).size, course).toBe(nums.length);
    }
  });

  it('every deliverable has an owner, file and at least one week', () => {
    for (const d of DELIVERABLES) {
      expect(d.owner, d.id).toBeTruthy();
      expect(d.file, d.id).toMatch(/\.\w+$/);
      expect(d.weeks.length, d.id).toBeGreaterThan(0);
    }
  });
});

describe('DoD checks are robust', () => {
  // DoD `test` functions run against arbitrary saved form data on the gate-
  // readiness panel; they must never throw and must return a boolean for both
  // empty data and the seeded example (seeds are illustrative, so they may or
  // may not "pass").
  it('every DoD check returns a boolean and never throws', () => {
    for (const d of DELIVERABLES) {
      for (const check of d.dod ?? []) {
        for (const data of [emptyData(), seedDeliverable(d)]) {
          expect(() => check.test(data), `${d.id}: "${check.label}"`).not.toThrow();
          expect(typeof check.test(data), `${d.id}: "${check.label}"`).toBe('boolean');
        }
      }
    }
  });

  it('the ethics form (scope_roe) is not satisfied by empty data', () => {
    const scope = DELIVERABLES.find((d) => d.id === 'scope_roe');
    expect(scope?.dod?.length).toBeGreaterThan(0);
    expect(scope!.dod!.every((c) => c.test(emptyData()))).toBe(false);
  });
});

/**
 * The worked example is not the student's work.
 *
 * Every seed row is written to pass its own DoD check, so a form that is only
 * the example ticked every box — and on the Deliverables page that meant one
 * typed character made the form "done" and swapped the next form in. The DoD
 * is judged on the data with seed-identical rows subtracted.
 */
describe('withoutSeedRows', () => {
  const seeded = DELIVERABLES.filter((d) =>
    d.sections.some((s) => s.kind === 'group' && (s.group.seed?.length ?? 0) > 0)
  );

  it('every seeded form has at least one', () => {
    expect(seeded.length).toBeGreaterThan(0);
  });

  it('the untouched example satisfies no DoD check that a blank form fails', () => {
    for (const d of seeded) {
      const blank = emptyData();
      const example = withoutSeedRows(d, seedDeliverable(d));
      for (const c of d.dod ?? []) {
        if (!c.test(blank)) expect(c.test(example), `${d.id}: "${c.label}" passes on the example alone`).toBe(false);
      }
    }
  });

  it('a row the student changed in any cell is kept; an identical one is not', () => {
    const d = seeded[0];
    const group = d.sections.find((s) => s.kind === 'group' && s.group.seed?.length);
    if (!group || group.kind !== 'group') throw new Error('no seeded group');
    const name = group.group.group;
    const seed = group.group.seed![0];
    const col = Object.keys(seed)[0];
    const data = seedDeliverable(d);
    data.groups[name] = [{ ...seed }, { ...seed, [col]: seed[col] + ' — mine' }, {}];
    const kept = withoutSeedRows(d, data).groups[name];
    expect(kept).toHaveLength(2);
    expect(kept[0][col]).toBe(seed[col] + ' — mine');
  });

  it('returns the same object when nothing is subtracted', () => {
    const d = seeded[0];
    const blank = emptyData();
    expect(withoutSeedRows(d, blank)).toBe(blank);
  });
});

describe('lookup helpers', () => {
  it('deliverableIdByTitle resolves titles case-insensitively', () => {
    const d = DELIVERABLES[0];
    expect(deliverableIdByTitle(d.title)).toBe(d.id);
    expect(deliverableIdByTitle(d.title.toUpperCase())).toBe(d.id);
    expect(deliverableIdByTitle('no such form')).toBeUndefined();
  });

  it('deliverableIdByFile resolves output filenames case-insensitively', () => {
    const d = DELIVERABLES[0];
    expect(deliverableIdByFile(d.file)).toBe(d.id);
    expect(deliverableIdByFile(d.file.toUpperCase())).toBe(d.id);
    expect(deliverableIdByFile('99_no_such_file.md')).toBeUndefined();
  });

  it('deliverablesForRole returns only that role+course and matches getDeliverable', () => {
    const grc = deliverablesForRole('grc', 'security-plus');
    expect(grc.length).toBeGreaterThan(0);
    expect(grc.every((d) => d.owner === 'grc')).toBe(true);
    expect(grc.every((d) => courseIdOf(d) === 'security-plus')).toBe(true);
    expect(getDeliverable(grc[0].id)).toEqual(grc[0]);
  });

  it('deliverablesForCourse isolates each course (no cross-course leak)', () => {
    const sp = deliverablesForCourse('security-plus');
    const mssp = deliverablesForCourse('mssp');
    const cysa = deliverablesForCourse('cysa-plus');
    const server = deliverablesForCourse('server-plus');
    const sets = [sp, mssp, cysa, server];
    sets.forEach((s) => expect(s.length).toBeGreaterThan(0));
    // No form appears in more than one course's set.
    sets.forEach((a, i) =>
      sets.slice(i + 1).forEach((b) => expect(a.some((d) => b.includes(d))).toBe(false))
    );
    // The per-course sets partition the full list (every form belongs to exactly
    // one course). This is the assertion that breaks the moment a new course is
    // added without being listed here — which is the point.
    expect(sets.reduce((n, s) => n + s.length, 0)).toBe(DELIVERABLES.length);
  });
});

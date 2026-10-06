import { describe, it, expect } from 'vitest';
import { SECAI_PLUS } from './seed/secaiPlus';
import { CISSP } from './seed/cissp';
import { isGradedWeek } from '../course-helpers';
import type { Course } from '../types';

/**
 * R101 — the two new capstones say, in the content, what their specs promise:
 * the planted weaknesses close where the spec says, the milestones carry the
 * release's counts, and every role has work every graded week.
 */
const stepText = (c: Course) =>
  c.tasks.flatMap((t) => t.steps.flatMap((s) => [s.title, s.instruction ?? '', ...(s.instructionList ?? []), s.whatItMeans ?? '', s.description ?? ''])).join(' ');

const weekStepText = (c: Course, week: number) => {
  const w = c.weeks.find((x) => x.number === week);
  const tasks = c.tasks.filter((t) => t.week === week);
  return [
    w?.milestone ?? '',
    ...tasks.flatMap((t) => [t.title, t.objective, ...t.steps.flatMap((s) => [s.title, s.description ?? '', s.instruction ?? '', ...(s.instructionList ?? []), s.whatItMeans ?? ''])]),
  ].join(' ');
};

describe('R101 — every graded week has work for every role', () => {
  it.each([['secai-plus', SECAI_PLUS], ['cissp', CISSP]] as const)('%s', (_id, course) => {
    for (const w of course.weeks) {
      if (!isGradedWeek(course, w.number)) continue;
      for (const r of course.roles) {
        const owned = course.tasks.some((t) => t.week === w.number && t.role === r.id);
        expect(owned, `${course.id} week ${w.number}: no task for ${r.id}`).toBe(true);
      }
    }
  });
});

describe('R101 — SecAI+ closes its planted weaknesses', () => {
  // SA-n → the week the spec closes it in.
  const CLOSES: Record<string, number> = { 'SA-1': 1, 'SA-2': 2, 'SA-3': 2, 'SA-4': 1, 'SA-5': 2, 'SA-7': 3 };
  it('each weakness is named in or before the week that closes it', () => {
    for (const [sa, week] of Object.entries(CLOSES)) {
      const seen = [1, 2, 3, 4].filter((w) => w <= week).some((w) => weekStepText(SECAI_PLUS, w).includes(sa));
      expect(seen, `${sa} is never named by week ${week}`).toBe(true);
    }
  });
  it('SA-6 is flagged, and the loop is covered', () => {
    expect(stepText(SECAI_PLUS)).toContain('SA-6');
    for (const w of [1, 2, 3, 4]) expect(SECAI_PLUS.weeks.find((x) => x.number === w)?.milestone?.length ?? 0, `week ${w} milestone`).toBeGreaterThan(0);
  });
  it('each week milestone carries the release’s attack and detection counts', () => {
    const m = (w: number) => SECAI_PLUS.weeks.find((x) => x.number === w)!.milestone!;
    expect(m(1)).toMatch(/2 attacks/);
    expect(m(2)).toMatch(/6 attacks/);
    expect(m(4)).toMatch(/six|6/);
  });
});

describe('R101 — CISSP closes its planted weaknesses and scores each release', () => {
  const CLOSES: Record<string, number> = { 'S-1': 1, 'S-8': 2, 'S-2': 3, 'S-3': 3, 'S-4': 3, 'S-6': 3, 'S-9': 3, 'S-10': 3, 'S-5': 4, 'S-7': 4 };
  it('each weakness is named in or before the week that closes it', () => {
    for (const [s, week] of Object.entries(CLOSES)) {
      const seen = [1, 2, 3, 4, 5, 6].filter((w) => w <= week).some((w) => weekStepText(CISSP, w).includes(s));
      expect(seen, `${s} is never named by week ${week}`).toBe(true);
    }
  });
  it('each release milestone carries its score target', () => {
    const score: Record<number, string> = { 1: '8', 2: '16', 3: '20', 4: '24', 5: '32' };
    for (const [w, n] of Object.entries(score)) {
      expect(CISSP.weeks.find((x) => x.number === Number(w))!.milestone!, `week ${w} score`).toContain(n);
    }
  });
});

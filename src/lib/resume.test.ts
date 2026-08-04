import { describe, it, expect } from 'vitest';
import { CYSA_PLUS } from './data/seed/cysa';
import { SECURITY_PLUS } from './data/seed/securityPlus';
import { resolveActiveWeek, hasNoProgress, type ResumePoint } from './resume';

const point = (week: number, taskId: string, stepId: string): ResumePoint => ({
  week,
  taskId,
  stepId,
  at: 1,
});

describe('resolveActiveWeek', () => {
  it('prefers the week the student last ticked a checkbox in', () => {
    const pct = { 0: 0, 1: 100, 2: 100, 3: 40, 4: 0 };
    expect(resolveActiveWeek(CYSA_PLUS, 'blue', pct, point(2, 'cb-w2', 'cb-w2-s1'))).toBe(2);
  });

  it('never resumes into the setup week when there is real progress', () => {
    // The old behaviour: week 0 sits at 0%, so "first week under 100" chose it
    // forever, no matter how far through the course the student actually was.
    const pct = { 0: 0, 1: 100, 2: 30, 3: 0, 4: 0 };
    expect(resolveActiveWeek(CYSA_PLUS, 'blue', pct, null)).toBe(2);
  });

  it('sends a brand-new student to the first graded week, not week 0', () => {
    const pct = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    expect(resolveActiveWeek(CYSA_PLUS, 'blue', pct, null)).toBe(1);
    expect(resolveActiveWeek(SECURITY_PLUS, 'red', pct, null)).toBe(1);
  });

  it('lands on the last graded week once everything is complete', () => {
    const pct = { 0: 100, 1: 100, 2: 100, 3: 100, 4: 100 };
    expect(resolveActiveWeek(CYSA_PLUS, 'blue', pct, null)).toBe(1);
  });

  it('skips weeks the role has no tasks in', () => {
    // MSSP red has no week-2 or week-4 task; an empty week is not "where you are".
    const pct = { 0: 100, 1: 100, 2: 0, 3: 0, 4: 0 };
    expect(resolveActiveWeek(CYSA_PLUS, 'red', pct, null)).toBe(2);
  });

  it('always returns a week that exists in the course', () => {
    const numbers = new Set(CYSA_PLUS.weeks.map((w) => w.number));
    const cases: Record<number, number>[] = [{}, { 0: 100 }, { 1: 100, 2: 100, 3: 100, 4: 100 }];
    for (const pct of cases) {
      expect(numbers.has(resolveActiveWeek(CYSA_PLUS, 'grc', pct, null))).toBe(true);
    }
  });
});

describe('hasNoProgress', () => {
  it('is true only when nothing anywhere has been started', () => {
    expect(hasNoProgress({})).toBe(true);
    expect(hasNoProgress({ 0: 0, 1: 0 })).toBe(true);
    expect(hasNoProgress({ 0: 0, 1: 5 })).toBe(false);
    expect(hasNoProgress({ 0: 100 })).toBe(false);
  });
});

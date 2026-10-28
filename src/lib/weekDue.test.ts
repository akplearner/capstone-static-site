import { describe, expect, it } from 'vitest';
import { cohortKeyOf, weekDueFrom } from './weekDue';

describe('R136 — the cohort calendar as the projection reads it', () => {
  it('is undefined without a start date, so "on time" stays not loaded', () => {
    expect(weekDueFrom(null)).toBeUndefined();
    expect(weekDueFrom(undefined)).toBeUndefined();
    expect(weekDueFrom({ courseId: 'c', cohort: '2026-09', startsOn: '' })).toBeUndefined();
  });

  it('turns the due day into its last millisecond, local time, seven days per week', () => {
    const due = weekDueFrom({ courseId: 'server-plus', cohort: '2026-09', startsOn: '2026-09-07' })!;
    const w1 = due(1)!;
    const w2 = due(2)!;
    expect(new Date(w1).toISOString().slice(0, 10)).toBe(new Date('2026-09-14T23:59:59.999').toISOString().slice(0, 10));
    expect(w2 - w1).toBe(7 * 86_400_000);
    expect(due(0)).toBe(new Date('2026-09-07T23:59:59.999').getTime());
    // A verification at 23:30 on the due day is on time; one at 00:30 the next day is not.
    expect(new Date('2026-09-14T23:30:00').getTime() <= w1).toBe(true);
    expect(new Date('2026-09-15T00:30:00').getTime() <= w1).toBe(false);
  });

  it('reads the cohort from the team id, falling back to the membership column', () => {
    expect(cohortKeyOf({ teamId: '2026-09-t03', cohort: '' })).toBe('2026-09');
    expect(cohortKeyOf({ teamId: 'team-3', cohort: '2026-01' })).toBe('2026-01');
    expect(cohortKeyOf({ teamId: 'team-3', cohort: '' })).toBeNull();
  });
});

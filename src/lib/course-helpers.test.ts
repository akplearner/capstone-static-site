import { describe, it, expect } from 'vitest';
import { SECURITY_PLUS } from './data/seed/securityPlus';
import { getTasksByRole, getRequiredSteps, getRequiredStepCount, getWeekNumbers } from './course-helpers';

describe('course-helpers on the Security+ seed', () => {
  it('getTasksByRole filters by role (and optionally week)', () => {
    const redAll = getTasksByRole(SECURITY_PLUS, 'red');
    expect(redAll.length).toBeGreaterThan(0);
    expect(redAll.every((t) => t.role === 'red')).toBe(true);

    const week = redAll[0].week;
    const redWeek = getTasksByRole(SECURITY_PLUS, 'red', week);
    expect(redWeek.every((t) => t.role === 'red' && t.week === week)).toBe(true);
    expect(redWeek.length).toBeLessThanOrEqual(redAll.length);
  });

  it('getRequiredStepCount excludes optional steps and never exceeds total', () => {
    for (const t of SECURITY_PLUS.tasks) {
      const required = getRequiredStepCount(t);
      expect(required).toBe(getRequiredSteps(t).length);
      expect(required).toBeLessThanOrEqual(t.steps.length);
      expect(getRequiredSteps(t).some((s) => s.optional)).toBe(false);
    }
  });

  it('getWeekNumbers is sorted ascending and unique', () => {
    const weeks = getWeekNumbers(SECURITY_PLUS);
    expect(weeks).toEqual([...weeks].sort((a, b) => a - b));
    expect(new Set(weeks).size).toBe(weeks.length);
  });
});

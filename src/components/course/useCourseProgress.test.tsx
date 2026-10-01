import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCourseProgress } from './useCourseProgress';
import { CYSA_PLUS } from '@/lib/data/seed/cysa';
import { localStorageProgressRepo } from '@/lib/data/localStorageProgressRepo';
import { KEYS } from '@/lib/data/keys';
import { getRequiredSteps } from '@/lib/course-helpers';
import type { Member } from '@/lib/types';

/**
 * R98 — the hook keeps two sets of numbers: the member's own record
 * (`taskStats`) and the team's (`teamTaskStats`, `gateStats`, `nextTask`).
 */
const C = CYSA_PLUS;
const task = (id: string) => C.tasks.find((t) => t.id === id)!;
const join = (memberId: string, role: string) => {
  localStorage.setItem(
    KEYS.roster(C.id),
    JSON.stringify([
      ...(JSON.parse(localStorage.getItem(KEYS.roster(C.id)) ?? '[]') as unknown[]),
      { memberId, teamId: 't1', role, displayName: memberId, cohort: '2026-09', joinedAt: 1 },
    ])
  );
};
const finish = (memberId: string, taskId: string) =>
  getRequiredSteps(task(taskId)).forEach((s) => localStorageProgressRepo.setCompletion({ courseId: C.id, memberId, taskId, stepId: s.id, completedAt: 1 }));
const bob: Member = { memberId: 'bob', courseId: C.id, teamId: 't1', role: 'blue', displayName: 'Bob', cohort: '2026-09' };

beforeEach(() => {
  localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage'));
  join('ada', 'red');
  join('bob', 'blue');
});

describe('useCourseProgress — the personal record and the team view', () => {
  it('a teammate’s finished task is done for the team, not in your own record', () => {
    finish('ada', 'cr-w1');
    const { result } = renderHook(() => useCourseProgress(C, bob));
    expect(result.current.taskStats['cr-w1']).toBe(0);
    expect(result.current.teamTaskStats['cr-w1']).toBe(100);
    expect(result.current.teamSteps['cr-w1']?.[getRequiredSteps(task('cr-w1'))[0].id]).toEqual([{ memberId: 'ada', displayName: 'ada' }]);
  });

  it('next task is your own role’s first, then a teammate’s once yours are done; the gate passes on the team’s work', () => {
    const { result: fresh } = renderHook(() => useCourseProgress(C, bob));
    expect(fresh.current.nextTask?.id).toBe('cb-w1');
    expect(fresh.current.gateStats[C.gates[0].id]).toBe('locked');
    finish('bob', 'cb-w1');
    finish('ada', 'cr-w1');
    const { result } = renderHook(() => useCourseProgress(C, bob));
    // Bob's own Week 1 task is done; the GRC member is absent, so GRC's task is next for Bob.
    expect(result.current.nextTask?.id).toBe('cg-w1');
    expect(result.current.gateStats[C.gates[0].id]).toBe('ready');
    finish('bob', 'cg-w1');
    const { result: after } = renderHook(() => useCourseProgress(C, bob));
    expect(after.current.gateStats[C.gates[0].id]).toBe('passed');
    expect(after.current.teamWeekStats[1]).toBeGreaterThan(0);
    expect(after.current.nextTask?.week).toBe(2);
  });
});

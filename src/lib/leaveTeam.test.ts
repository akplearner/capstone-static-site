import { describe, it, expect, beforeEach } from 'vitest';
import { SERVER_PLUS } from './data/seed/serverPlus';
import { earnedRepo, evidenceRepo, progressRepo, stepNotesRepo } from './data';
import { KEYS } from './data/keys';
import { composeTeamId } from './team';
import { leaveCourseTeam, switchCohortTeam } from './leaveTeam';
import type { Member } from './types';

/**
 * R150 — leaving a team keeps what the account earned and clears what the session's work was.
 * Offline here (the localStorage repositories); the database half is proven in supabase/tests/rls.sql.
 */
const C = SERVER_PLUS;
const task = C.tasks.find((t) => t.id === 'sp-w1-bringup')!;
const member = (cohort: string, team = '1'): Member => ({
  memberId: 'm1',
  courseId: C.id,
  teamId: composeTeamId(cohort, team, 'local'),
  role: task.role,
  displayName: 'Grace',
  cohort,
});

function enrol(m: Member) {
  const res = progressRepo.joinTeam(C, m);
  expect(res).toEqual({ ok: true });
  for (const s of task.steps) progressRepo.setCompletion({ courseId: C.id, memberId: m.memberId, taskId: task.id, stepId: s.id, completedAt: 1 });
  stepNotesRepo.save(m.memberId, { courseId: C.id, taskId: task.id, stepId: task.steps[0].id, note: 'my note', stuck: false, at: 1 });
}

beforeEach(() => localStorage.clear());

describe('localStorageProgressRepo.leaveTeam', () => {
  it('frees the seat, forgets the member context, raises the floor and keeps the id they left under', () => {
    expect(progressRepo.getCohortFloor(C.id)).toBeNull();
    enrol(member('2026-10'));
    expect(progressRepo.getCohortFloor(C.id), 'joining sets the floor, as the database trigger does').toBe('2026-10');
    expect(progressRepo.leaveTeam(C.id, 'm1')).toBe(true);
    expect(progressRepo.getRoster(C.id)).toEqual([]);
    expect(progressRepo.getContext(C.id)).toBeNull();
    expect(progressRepo.getCohortFloor(C.id)).toBe('2026-10');
    expect(localStorage.getItem(KEYS.leftMemberId(C.id))).toBe('m1');
  });

  it('the floor only rises: leaving an earlier session after a later one keeps the later floor', () => {
    enrol(member('2026-11'));
    progressRepo.leaveTeam(C.id, 'm1');
    enrol(member('2026-10'));
    progressRepo.leaveTeam(C.id, 'm1');
    expect(progressRepo.getCohortFloor(C.id)).toBe('2026-11');
  });
});

describe('leaveCourseTeam', () => {
  it('banks the earned rows, then clears the course work, then leaves', async () => {
    enrol(member('2026-10'));
    expect(progressRepo.getCompletionKeySet(C.id, 'm1').size).toBe(task.steps.length);
    expect(earnedRepo.list(C.id), 'banking is lazy: nothing has been banked yet').toEqual([]);
    await expect(leaveCourseTeam(C, member('2026-10'))).resolves.toBe(true);
    expect(earnedRepo.list(C.id).length, 'what the week reached is on the account').toBeGreaterThan(0);
    expect(progressRepo.getCompletionKeySet(C.id, 'm1').size).toBe(0);
    expect(stepNotesRepo.getAll(C.id, 'm1')).toEqual({});
    expect(evidenceRepo.getSteps(C.id, 'm1')).toEqual({});
    expect(progressRepo.getContext(C.id)).toBeNull();
    expect(progressRepo.getCohortFloor(C.id)).toBe('2026-10');
  });
});

describe('switchCohortTeam', () => {
  it('leaves, then joins the later session under the same member id, with the work starting over', async () => {
    enrol(member('2026-10'));
    const before = earnedRepo.list(C.id);
    const res = await switchCohortTeam(C, member('2026-10'), { ...member('2026-11', '2'), memberId: 'ignored' });
    expect(res).toEqual({ ok: true });
    const ctx = progressRepo.getContext(C.id)!;
    expect(ctx.memberId).toBe('m1');
    expect(ctx.teamId).toBe(composeTeamId('2026-11', '2', 'local'));
    expect(ctx.cohort).toBe('2026-11');
    expect(progressRepo.getRoster(C.id).map((e) => e.teamId)).toEqual([composeTeamId('2026-11', '2', 'local')]);
    expect(progressRepo.getCompletionKeySet(C.id, 'm1').size).toBe(0);
    expect(earnedRepo.list(C.id).length).toBeGreaterThanOrEqual(before.length);
    expect(progressRepo.getCohortFloor(C.id)).toBe('2026-11');
  });
});

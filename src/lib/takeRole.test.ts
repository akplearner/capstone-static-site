import { describe, it, expect, beforeEach } from 'vitest';
import { takeRole } from './takeRole';
import { progressRepo } from './data';
import { AZURE_FUNDAMENTALS } from './data/seed/azureCloud';
import { KEYS } from './data/keys';
import { composeTeamId } from './team';
import { getMonthlyCohorts } from './utils';
import type { Course, Member } from './types';

/**
 * R119 — taking an open role is the join panel's own call with only the role
 * replaced: the member stays on their team, in their cohort, under their name,
 * and everything they ticked stays ticked because it is keyed by the member.
 */
const [COHORT] = getMonthlyCohorts(2);
const C = AZURE_FUNDAMENTALS; // arch, infra, dev, secops
const TEAM = composeTeamId(COHORT, '1', 'local');
const grace: Member = { memberId: 'm-grace', courseId: C.id, teamId: TEAM, role: 'secops', displayName: 'Grace', cohort: COHORT };
const entry = (m: Pick<Member, 'memberId' | 'role' | 'displayName'>, teamId = TEAM) => ({ ...m, teamId, cohort: COHORT, joinedAt: 1 });

beforeEach(() => localStorage.clear());

describe('takeRole', () => {
  it('moves the member to the role on the same team, and keeps what they ticked', async () => {
    const task = C.tasks.find((t) => t.id === 'az-w1-secops')!;
    const step = task.steps[0];
    localStorage.setItem(KEYS.roster(C.id), JSON.stringify([entry(grace), entry({ memberId: 'm-ada', role: 'arch', displayName: 'Ada' })]));
    progressRepo.setContext(grace);
    progressRepo.setCompletion({ courseId: C.id, memberId: grace.memberId, taskId: task.id, stepId: step.id, completedAt: 1 });

    const { result, member } = await takeRole(C, grace, 'dev');

    expect(result.ok).toBe(true);
    expect(member).toEqual({ ...grace, role: 'dev' });
    const roster = progressRepo.getRoster(C.id);
    expect(roster.find((r) => r.memberId === 'm-grace')).toMatchObject({ role: 'dev', teamId: TEAM, cohort: COHORT, displayName: 'Grace' });
    expect(roster.find((r) => r.memberId === 'm-ada')).toMatchObject({ role: 'arch', teamId: TEAM });
    expect(roster).toHaveLength(2);
    expect(progressRepo.getContext(C.id)).toMatchObject({ role: 'dev', teamId: TEAM });
    expect(progressRepo.isStepComplete(C.id, grace.memberId, task.id, step.id)).toBe(true);
    expect(progressRepo.getCompletionKeySet(C.id, grace.memberId).size).toBe(1);
  });

  it('a team already over its capacity never refuses a role change, though a newcomer is still refused', async () => {
    const course: Course = { ...C, teamCapacity: 2 };
    const crowd = [grace, { ...grace, memberId: 'm-ada', role: 'arch', displayName: 'Ada' }, { ...grace, memberId: 'm-ben', role: 'infra', displayName: 'Ben' }];
    localStorage.setItem(KEYS.roster(course.id), JSON.stringify(crowd.map((m) => entry(m))));
    expect((await takeRole(course, grace, 'dev')).result.ok).toBe(true);
    const newcomer: Member = { ...grace, memberId: 'm-new', displayName: 'New' };
    expect((await Promise.resolve(progressRepo.joinTeam(course, newcomer))).reason).toBe('team-full');
  });
});

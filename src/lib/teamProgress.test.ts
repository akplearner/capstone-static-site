import { describe, it, expect, beforeEach } from 'vitest';
import { CYSA_PLUS } from './data/seed/cysa';
import { localStorageProgressRepo } from './data/localStorageProgressRepo';
import { KEYS } from './data/keys';
import { getRequiredSteps, getProgressSteps } from './course-helpers';
import { stepKey, teamCompletionKeySet, teamGateStatus, teamStepCompletions, teamTaskPercent, teamWeekCompletion } from './teamProgress';

/**
 * R98 — a task is done for the team once anyone on the team has done it. The
 * union is derived from the per-member keys both backends already hold.
 */
const C = CYSA_PLUS;
const task = (id: string) => C.tasks.find((t) => t.id === id)!;

const join = (memberId: string, teamId: string, role: string) => {
  localStorage.setItem(
    KEYS.roster(C.id),
    JSON.stringify([
      ...(JSON.parse(localStorage.getItem(KEYS.roster(C.id)) ?? '[]') as unknown[]),
      { memberId, teamId, role, displayName: memberId, cohort: '2026-09', joinedAt: 1 },
    ])
  );
};
const tick = (memberId: string, taskId: string, stepId: string) =>
  localStorageProgressRepo.setCompletion({ courseId: C.id, memberId, taskId, stepId, completedAt: 1 });
const finish = (memberId: string, taskId: string) => getRequiredSteps(task(taskId)).forEach((s) => tick(memberId, taskId, s.id));

// The local repo caches each member's key set until a write or a storage event;
// a cleared store between tests needs the same nudge another tab would give it.
const reset = () => {
  localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage'));
};
beforeEach(reset);

describe('teamProgress — the union of a team’s ticks', () => {
  it('unions two members of one team and ignores another team', () => {
    join('ada', 't1', 'red');
    join('bob', 't1', 'blue');
    join('eve', 't2', 'grc');
    tick('ada', 'cr-w1', task('cr-w1').steps[0].id);
    tick('bob', 'cb-w1', task('cb-w1').steps[0].id);
    tick('eve', 'cg-w1', task('cg-w1').steps[0].id);
    const done = teamCompletionKeySet(localStorageProgressRepo, C, 't1');
    expect(done.has(stepKey('cr-w1', task('cr-w1').steps[0].id))).toBe(true);
    expect(done.has(stepKey('cb-w1', task('cb-w1').steps[0].id))).toBe(true);
    expect(done.has(stepKey('cg-w1', task('cg-w1').steps[0].id))).toBe(false);
    // …and says who: a step both ticked lists both, in roster order.
    tick('bob', 'cr-w1', task('cr-w1').steps[0].id);
    expect(teamStepCompletions(localStorageProgressRepo, C, 't1').get(stepKey('cr-w1', task('cr-w1').steps[0].id))).toEqual(['ada', 'bob']);
  });

  it('a week reaches 100% when each role did its own task — or when one member did them all', () => {
    join('ada', 't1', 'red');
    join('bob', 't1', 'blue');
    join('cat', 't1', 'grc');
    const week1 = C.tasks.filter((t) => t.week === 1);
    expect(teamWeekCompletion(C, 1, teamCompletionKeySet(localStorageProgressRepo, C, 't1'))).toBe(0);
    for (const t of week1) getProgressSteps(t).forEach((s) => tick(t.role === 'red' ? 'ada' : t.role === 'blue' ? 'bob' : 'cat', t.id, s.id));
    expect(teamWeekCompletion(C, 1, teamCompletionKeySet(localStorageProgressRepo, C, 't1'))).toBe(100);
    reset();
    join('ada', 't1', 'red');
    for (const t of week1) getProgressSteps(t).forEach((s) => tick('ada', t.id, s.id));
    const done = teamCompletionKeySet(localStorageProgressRepo, C, 't1');
    expect(teamWeekCompletion(C, 1, done)).toBe(100);
    for (const t of week1) expect(teamTaskPercent(t, done), t.id).toBe(100);
    // Ada's personal record counts her ticks on the others' tasks too; Bob's stays empty.
    expect(localStorageProgressRepo.getTaskPercent(C.id, 'ada', task('cb-w1'))).toBe(100);
    expect(localStorageProgressRepo.getTaskPercent(C.id, 'bob', task('cb-w1'))).toBe(0);
  });

  it('a gate is locked, then ready, then passed, across members', () => {
    const gate = C.gates[0];
    expect(gate.requiredTasks).toEqual(['cr-w1', 'cb-w1', 'cg-w1']);
    join('ada', 't1', 'red');
    join('bob', 't1', 'blue');
    const status = () => teamGateStatus(C, gate, teamCompletionKeySet(localStorageProgressRepo, C, 't1'));
    expect(status()).toBe('locked');
    finish('ada', 'cr-w1');
    expect(status()).toBe('ready');
    finish('bob', 'cb-w1');
    finish('bob', 'cg-w1'); // Bob covers for the absent GRC member
    expect(status()).toBe('passed');
    // A gate that requires nothing holds nobody up.
    expect(teamGateStatus(C, { ...gate, requiredTasks: [] }, new Set())).toBe('passed');
  });

  it('probes keys rather than parsing them: an id with the separator in it still resolves', () => {
    const odd = { ...C, id: 'odd', tasks: [{ ...task('cr-w1'), id: 'cr_w1_x', steps: task('cr-w1').steps.map((s) => ({ ...s, id: `${s.id}_a` })) }] };
    localStorage.setItem(KEYS.roster('odd'), JSON.stringify([{ memberId: 'a_b', teamId: 't_1', role: 'red', displayName: 'a', cohort: 'c', joinedAt: 1 }]));
    const s0 = odd.tasks[0].steps[0].id;
    localStorageProgressRepo.setCompletion({ courseId: 'odd', memberId: 'a_b', taskId: 'cr_w1_x', stepId: s0, completedAt: 1 });
    expect(teamCompletionKeySet(localStorageProgressRepo, odd, 't_1').has(stepKey('cr_w1_x', s0))).toBe(true);
  });

  it('an all-optional task uses the progress fallback, like getTaskPercent', () => {
    const t = task('cr-w0');
    expect(getRequiredSteps(t)).toHaveLength(0);
    join('ada', 't1', 'red');
    getProgressSteps(t).forEach((s) => tick('ada', t.id, s.id));
    expect(teamTaskPercent(t, teamCompletionKeySet(localStorageProgressRepo, C, 't1'))).toBe(100);
  });
});

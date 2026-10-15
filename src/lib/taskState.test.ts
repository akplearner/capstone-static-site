import { describe, it, expect } from 'vitest';
import { stateLabel, taskState, verifiedLabel, weekState, yourLabel } from './taskState';
import { AZURE_FUNDAMENTALS } from './data/seed/azureCloud';
import { getProgressSteps } from './course-helpers';
import { calculateProgress } from './utils';
import type { Task } from './types';

/**
 * R118 — one word for "done". The state is the TEAM's (a task is done once
 * anyone did it); the member's own count is shown beside it only when it
 * adds something.
 */
const task = AZURE_FUNDAMENTALS.tasks.find((t) => getProgressSteps(t).length === 3) ?? AZURE_FUNDAMENTALS.tasks[0];
const of = getProgressSteps(task).length;
const pct = (n: number) => calculateProgress(n, of);

describe('taskState', () => {
  it('reads the steps back from the percentages the platform computes, exactly, for every task of every size', () => {
    for (const t of AZURE_FUNDAMENTALS.tasks) {
      const total = getProgressSteps(t).length;
      for (let n = 0; n <= total; n++) {
        const s = taskState(t, calculateProgress(n, total), calculateProgress(n, total));
        expect(s.team, `${t.id} ${n}/${total}`).toEqual({ done: n, of: total });
        expect(s.you).toEqual({ done: n, of: total });
      }
    }
  });

  it('is not started, in progress or done for the team, and done only when every progress step is', () => {
    expect(taskState(task, 0, 0).kind).toBe('not-started');
    expect(taskState(task, pct(1), 0).kind).toBe('in-progress');
    expect(taskState(task, pct(of - 1), 0).kind).toBe('in-progress');
    expect(taskState(task, 100, 0).kind).toBe('done');
    const empty = { ...task, steps: [] } as Task;
    expect(taskState(empty, 0, 0).kind, 'a task with no step is never "done"').toBe('not-started');
  });

  it('keeps the team’s state apart from the member’s own part', () => {
    const doneByAda = taskState(task, 100, 0, ['Ada']);
    expect(doneByAda.kind).toBe('done');
    expect(doneByAda.yourPartDone).toBe(false);
    expect(doneByAda.doneBy).toEqual(['Ada']);
    const mine = taskState(task, 100, 100);
    expect(mine.yourPartDone).toBe(true);
    expect(taskState(task, 0, 0).yourPartDone).toBe(false);
  });
});

describe('the words', () => {
  it('say Not started, In progress with the count, Done, Done by names, or Done for the team', () => {
    expect(stateLabel(taskState(task, 0, 0))).toBe('Not started');
    expect(stateLabel(taskState(task, pct(1), pct(1)))).toBe(`In progress · 1 of ${of} steps`);
    expect(stateLabel(taskState(task, 100, 100))).toBe('Done');
    expect(stateLabel(taskState(task, 100, 0, ['Ada', 'Bo']))).toBe('Done by Ada, Bo');
    expect(stateLabel(taskState(task, 100, 0))).toBe('Done for the team');
  });

  it('shows the member’s own count only where it differs from the team’s', () => {
    expect(yourLabel(taskState(task, 100, 0, ['Ada']))).toBe(`You: 0 of ${of} steps`);
    expect(yourLabel(taskState(task, 100, 100))).toBeNull();
    expect(yourLabel(taskState(task, 0, 0))).toBeNull();
    expect(yourLabel(taskState(task, pct(2), pct(1)))).toBe(`You: 1 of ${of} steps`);
    expect(yourLabel(taskState(task, pct(2), pct(2)))).toBeNull();
    expect(yourLabel(taskState({ ...task, steps: [] } as Task, 0, 0))).toBeNull();
  });

  it('names the verified checks only when the task has some', () => {
    expect(verifiedLabel(taskState(task, 0, 0))).toBeNull();
    expect(verifiedLabel(taskState(task, 0, 0, [], { done: 2, of: 3 }))).toBe('Checks verified 2 of 3');
    expect(verifiedLabel(taskState(task, 0, 0, [], { done: 0, of: 0 }))).toBeNull();
  });

  it('never mention a lock, a score or a rank', () => {
    const all = [taskState(task, 0, 0), taskState(task, 50, 0), taskState(task, 100, 0, ['Ada'])].flatMap((s) => [stateLabel(s), yourLabel(s) ?? '']).join(' ').toLowerCase();
    expect(all).not.toMatch(/lock|score|rank|badge|points|xp/);
  });
});

describe('weekState', () => {
  it('folds the tasks: done when every one is, in progress once any has started', () => {
    const s = (p: number) => taskState(task, p, p);
    expect(weekState([])).toEqual({ kind: 'not-started', done: 0, of: 0 });
    expect(weekState([s(0), s(0)])).toEqual({ kind: 'not-started', done: 0, of: 2 });
    expect(weekState([s(100), s(0)])).toEqual({ kind: 'in-progress', done: 1, of: 2 });
    expect(weekState([s(pct(1)), s(0)])).toEqual({ kind: 'in-progress', done: 0, of: 2 });
    expect(weekState([s(100), s(100)])).toEqual({ kind: 'done', done: 2, of: 2 });
  });
});

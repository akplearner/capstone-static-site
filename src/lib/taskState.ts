// taskState.ts — one word for "done", from one member's point of view (R118).
//
// A task on a role-split course belongs to the TEAM (R98): it is done once
// anyone on the team has done it. The member's own record (the stone, the gems,
// the ledger) stays theirs, so a task has two figures that can differ: the
// team's and the member's. Before this module every surface drew one or the
// other in its own words, and a row could say "Done by Ada" beside a stone that
// read "0% of this task done". This is the one place that says which is which:
// the state is the TEAM's, and "You: n of m" is the member's own, shown when it
// differs. Pure: no clock, no store; percentages in, words out.

import type { Task } from './types';
import { getProgressSteps } from './course-helpers';

export type TaskStateKind = 'not-started' | 'in-progress' | 'done';

export interface TaskState {
  /** The team's state: done once anyone did it. */
  kind: TaskStateKind;
  team: { done: number; of: number };
  you: { done: number; of: number };
  /** Every progress step ticked by this member. */
  yourPartDone: boolean;
  /** Teammates who finished it, when the viewer did not. */
  doneBy: string[];
  /** The member's verified checks over the task's verifiable steps; absent when the task has none. */
  verified?: { done: number; of: number };
}

/** Steps from a percentage the platform computed over `of` steps (exact for any task under a hundred steps). */
const stepsOf = (pct: number, of: number) => Math.max(0, Math.min(of, Math.round((pct * of) / 100)));

/**
 * The state of one task for one member. `teamPct` is the union of the team's
 * ticks, `youPct` the member's own, both over the task's progress steps (its
 * required steps, or all of them when none is required): the same arithmetic
 * the rows, the week and the gate already use.
 */
export function taskState(task: Task, teamPct: number, youPct: number, doneBy: string[] = [], verified?: { done: number; of: number }): TaskState {
  const of = getProgressSteps(task).length;
  const team = { done: stepsOf(teamPct, of), of };
  const you = { done: stepsOf(youPct, of), of };
  const kind: TaskStateKind = of > 0 && team.done === of ? 'done' : team.done > 0 ? 'in-progress' : 'not-started';
  return {
    kind,
    team,
    you,
    yourPartDone: of > 0 && you.done === of,
    doneBy: doneBy.filter(Boolean),
    ...(verified && verified.of > 0 ? { verified } : {}),
  };
}

/**
 * Teammates who finished a task the member has not: their names, "a teammate"
 * for one with no name. Empty once the member finished it too. One rule for the
 * task list and the roles board, so both say "Done by Ada" for the same task.
 */
export function doneByNames(youPct: number, teammates: readonly { memberId: string; displayName: string; pct: number }[], memberId: string): string[] {
  return youPct >= 100 ? [] : teammates.filter((p) => p.pct >= 100 && p.memberId !== memberId).map((p) => p.displayName || 'a teammate');
}

/** The words, written once so a row, a header, a list and a board never drift apart. */
export const TASK_STATE_COPY = {
  notStarted: 'Not started',
  done: 'Done',
  doneBy: 'Done by',
  doneForTeam: 'Done for the team',
  inProgress: 'In progress',
  steps: 'steps',
  you: 'You:',
  verified: 'Checks verified',
} as const;

/** The team's state in words: "Not started", "In progress · 2 of 5 steps", "Done", "Done by Ada" or "Done for the team". */
export function stateLabel(s: TaskState): string {
  if (s.kind === 'done') {
    if (s.doneBy.length > 0) return `${TASK_STATE_COPY.doneBy} ${s.doneBy.join(', ')}`;
    return s.yourPartDone ? TASK_STATE_COPY.done : TASK_STATE_COPY.doneForTeam;
  }
  if (s.kind === 'in-progress') return `${TASK_STATE_COPY.inProgress} · ${s.team.done} of ${s.team.of} ${TASK_STATE_COPY.steps}`;
  return TASK_STATE_COPY.notStarted;
}

/** The member's own figure, shown only where it adds something to the team's: "You: 0 of 5 steps". */
export function yourLabel(s: TaskState): string | null {
  if (s.you.of === 0) return null;
  const adds = s.kind === 'done' ? !s.yourPartDone : s.you.done > 0 && s.you.done !== s.team.done;
  return adds ? `${TASK_STATE_COPY.you} ${s.you.done} of ${s.you.of} ${TASK_STATE_COPY.steps}` : null;
}

/** "Checks verified 2 of 3", or null when the task has no check or none is verified yet and the task is not started. */
export function verifiedLabel(s: TaskState): string | null {
  return s.verified ? `${TASK_STATE_COPY.verified} ${s.verified.done} of ${s.verified.of}` : null;
}

/** A week as the fold of its tasks: how many are done for the team, out of all of them. */
export function weekState(states: TaskState[]): { kind: TaskStateKind; done: number; of: number } {
  const done = states.filter((s) => s.kind === 'done').length;
  const started = states.some((s) => s.kind !== 'not-started');
  return { kind: states.length > 0 && done === states.length ? 'done' : started ? 'in-progress' : 'not-started', done, of: states.length };
}

import type { TaskTimer } from './data/types';

/**
 * R140 — the task timer, as a reducer over `UserCourseState.timers`.
 *
 * A timer runs while its task is open on a visible tab and the member has not
 * paused. It is measured, never rewarded: the minutes feed one unscored KPI
 * (`kpi.validation.time-on-task`) and the instructor's record. Every function
 * is pure over its inputs and the clock it is handed.
 */
export type Timers = Record<string, TaskTimer>;

export function elapsedOf(t: TaskTimer | undefined, now: number): number {
  if (!t) return 0;
  return t.elapsedMs + (t.runningSince !== null ? Math.max(0, now - t.runningSince) : 0);
}

/** Start (or keep running) the task's timer. */
export function startTimer(timers: Timers | undefined, taskId: string, now: number): Timers {
  const t = timers?.[taskId];
  if (t && t.runningSince !== null) return timers!;
  return { ...(timers ?? {}), [taskId]: { elapsedMs: t?.elapsedMs ?? 0, runningSince: now } };
}

/** Stop the task's timer, folding the run into the elapsed time. */
export function stopTimer(timers: Timers | undefined, taskId: string, now: number): Timers {
  const t = timers?.[taskId];
  if (!t || t.runningSince === null) return timers ?? {};
  return { ...timers, [taskId]: { elapsedMs: elapsedOf(t, now), runningSince: null } };
}

/** Stop every running timer (the tab hid, the page is leaving, a pause). */
export function stopAll(timers: Timers | undefined, now: number): Timers {
  let out = timers ?? {};
  for (const id of Object.keys(out)) out = stopTimer(out, id, now);
  return out;
}

/** Whole minutes on the tasks named, or on every task when none are. */
export function totalMinutes(timers: Timers | undefined, now: number, taskIds?: string[]): number {
  const ids = taskIds ?? Object.keys(timers ?? {});
  const ms = ids.reduce((n, id) => n + elapsedOf(timers?.[id], now), 0);
  return Math.floor(ms / 60_000);
}

/** "1 h 05 min" or "12 min" or "0 min". */
export function formatElapsed(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
}

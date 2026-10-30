import { getMonthlyCohorts } from './utils';

/**
 * R150 — which class sessions a student may join, and the one direction they may move.
 *
 * A cohort is a month (`YYYY-MM`). A student may join THIS month's session or NEXT month's, never an
 * earlier one; and once they have been in a session they may only ever move forward — so a student
 * who joined on the 30th of one month can leave and join the next month's team that the newcomers
 * are on, but nobody can slip back into a session that has already run. The floor is the latest
 * cohort the student has belonged to; the database remembers it even after they leave
 * (`membership_cohort_floor`, 0028) and refuses a backward move for anyone but an instructor.
 *
 * Pure: the clock is a parameter, so the window is testable on a fixed date. `YYYY-MM` strings sort
 * as dates, which is why a plain string comparison is the whole rule.
 */

/** This month's and next month's sessions, in order, minus anything below the floor. */
export function joinableCohorts(now: Date = new Date(), floor?: string | null): string[] {
  return getMonthlyCohorts(2, now).filter((c) => !floor || c >= floor);
}

/** May a member move from `from` to `to`? Only forward (or to stay). */
export function isForwardMove(from: string, to: string): boolean {
  return to >= from;
}

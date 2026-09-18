import type { DeliverableData, DeliverableDef } from './types';
import { withoutSeedRows } from './definitions';
import { emptyData } from './types';
import { evaluate } from './predicate';

/**
 * Definition-of-Done, judged by week.
 *
 * A form that spans weeks is graded on the checks that apply BY the week being
 * looked at: a check with `week` is not evaluated before it, one without
 * behaves as it always has. And it is judged on the student's OWN rows — the
 * worked example is subtracted first, so a form left as the example is not
 * "done". This lived as a closure inside the Deliverables page; the cohort
 * dashboard and the rubric need the same rule, so it lives here once.
 */
export function dodChecksBy(def: DeliverableDef, week: number) {
  return (def.dod ?? []).filter((c) => (c.week ?? 0) <= week);
}

export function dodProgress(def: DeliverableDef, data: DeliverableData | undefined, week: number): { met: number; total: number } {
  const own = withoutSeedRows(def, data ?? emptyData());
  const due = dodChecksBy(def, week);
  return { met: due.filter((c) => evaluate(c.when, own)).length, total: due.length };
}

export function isDoneBy(def: DeliverableDef, data: DeliverableData | undefined, week: number): boolean {
  const { met, total } = dodProgress(def, data, week);
  return total > 0 && met === total;
}

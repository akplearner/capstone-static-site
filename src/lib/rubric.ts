/**
 * The Server+ rubric, as code — the single source of truth for the split the
 * grading sheets print: 100 points per student per week, 70 TEAM + 30 FOCUS.
 *
 *   TEAM  — the share of Definition-of-Done checks, due by this week, met on
 *           the forms the student's focus fills this week (every form on a
 *           shared-track course; the role's own forms on a role-split one).
 *           When a week has no checks due, the share of required steps done
 *           on the week's shared tasks stands in.
 *   FOCUS — the share of required steps done on the role's own (non-shared)
 *           tasks this week: the deep-dive. A week with no deep-dive mirrors
 *           the TEAM share, and says so (`focusMirrorsTeam`).
 *
 * Points are what the cohort CSV exports; the instructor still marks quality
 * by hand on the printed sheet. Effort is measured, never rewarded — attempts
 * and time are not here, on purpose (see metrics.ts).
 */
import type { Course } from './types';
import type { DeliverableData } from './docs/types';
import { deliverablesForCourse } from './docs/definitions';
import { dodProgress } from './docs/dod';
import { getRequiredSteps, getTasksByRole } from './course-helpers';

export const TEAM_WEIGHT = 70;
export const FOCUS_WEIGHT = 30;

export interface WeeklyPoints {
  week: number;
  /** 0..1, or null when nothing was due. */
  teamShare: number | null;
  team: number;
  focusShare: number | null;
  focus: number;
  total: number;
  focusMirrorsTeam: boolean;
  /** DoD checks met / due, for the tooltip. */
  checksMet: number;
  checksDue: number;
}

export interface WeeklyPointsInput {
  course: Course;
  role: string;
  week: number;
  teamDocs: Record<string, DeliverableData>;
  isStepDone: (taskId: string, stepId: string) => boolean;
}

function stepShare(tasks: { id: string; steps: unknown[] }[], isStepDone: WeeklyPointsInput['isStepDone']): number | null {
  let done = 0;
  let total = 0;
  for (const t of tasks) {
    for (const s of getRequiredSteps(t as Parameters<typeof getRequiredSteps>[0])) {
      total += 1;
      if (isStepDone(t.id, s.id)) done += 1;
    }
  }
  return total === 0 ? null : done / total;
}

export function weeklyPoints({ course, role, week, teamDocs, isStepDone }: WeeklyPointsInput): WeeklyPoints {
  const defs = deliverablesForCourse(course.id).filter((d) => d.weeks.includes(week) && (d.shared || d.owner === role));
  let met = 0;
  let due = 0;
  for (const d of defs) {
    const p = dodProgress(d, teamDocs[d.id], week);
    met += p.met;
    due += p.total;
  }
  const weekTasks = getTasksByRole(course, role, week);
  let teamShare: number | null = due > 0 ? met / due : null;
  if (teamShare === null) teamShare = stepShare(weekTasks.filter((t) => t.shared), isStepDone);

  const focusTasks = weekTasks.filter((t) => !t.shared);
  let focusShare = stepShare(focusTasks, isStepDone);
  const focusMirrorsTeam = focusShare === null;
  if (focusMirrorsTeam) focusShare = teamShare;

  const team = Math.round((teamShare ?? 0) * TEAM_WEIGHT);
  const focus = Math.round((focusShare ?? 0) * FOCUS_WEIGHT);
  return { week, teamShare, team, focusShare, focus, total: team + focus, focusMirrorsTeam, checksMet: met, checksDue: due };
}

/** The weeks a student is marked on: graded weeks earn the 400; advanced weeks
 *  are marked the same way as a bonus that does not count toward it. */
export function markedWeeks(course: Course): { week: number; bonus: boolean }[] {
  return course.weeks.filter((w) => !w.setup && w.number > 0).map((w) => ({ week: w.number, bonus: !!w.advanced }));
}

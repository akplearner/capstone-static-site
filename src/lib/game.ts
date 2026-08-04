import { Course } from './types';
import { getTasksByRole, isSetupWeek } from './course-helpers';
import { deriveStoneStage, type Milestone, type StoneStage } from './quarry';

/**
 * Crew progress — derived entirely from work actually completed.
 *
 * This deliberately has no XP, no levels and no badges for logging in. Those
 * measure attendance; this measures whether an environment got built. Every
 * value below is computed from the same completion data that drives the progress
 * bars, so it cannot disagree with them, needs no storage, and resets when
 * progress resets — because it was never a separate fact.
 *
 * Milestones are named the way a technical crew would report them at a standup.
 * "Level 3" tells a student nothing. "First operational service" tells them
 * exactly what they proved.
 */

export interface CrewProgress {
  /** The Capstone Stone's current cut. */
  stage: StoneStage;
  /** Weeks finished (setup excluded — it's opt-in and doesn't cut the stone). */
  weeksCleared: number;
  /** Weeks that have work for this role. */
  weeksTotal: number;
  /** Steps completed / steps that count, across the role's whole course. */
  stepsDone: number;
  stepsTotal: number;
  milestones: Milestone[];
}

export function deriveCrewProgress(
  course: Course,
  role: string,
  weekPercent: Record<number, number>,
  taskPercent: Record<string, number>
): CrewProgress {
  const tasks = getTasksByRole(course, role);

  // Steps are reconstructed from the task percentages the page already computed,
  // rather than re-scanning storage — one source of truth, no drift.
  let stepsDone = 0;
  let stepsTotal = 0;
  for (const t of tasks) {
    const counted = t.steps.length;
    stepsTotal += counted;
    stepsDone += Math.round(((taskPercent[t.id] ?? 0) / 100) * counted);
  }

  const gradedWeeks = course.weeks.filter(
    (w) => !isSetupWeek(course, w.number) && getTasksByRole(course, role, w.number).length > 0
  );
  const weeksCleared = gradedWeeks.filter((w) => (weekPercent[w.number] ?? 0) >= 100).length;
  const weeksTotal = gradedWeeks.length;
  const stage = deriveStoneStage(weeksCleared, weeksTotal);

  const anyTaskComplete = tasks.some((t) => (taskPercent[t.id] ?? 0) >= 100);

  const milestones: Milestone[] = [
    {
      id: 'surveyed',
      label: 'Territory surveyed',
      hint: 'Read the brief and completed your first step of real work.',
      earned: stepsDone > 0,
    },
    {
      id: 'first-service',
      label: 'First operational service',
      hint: 'Finished a whole task — something in the environment now runs.',
      earned: anyTaskComplete,
    },
    {
      id: 'week-cleared',
      label: 'Stage cut',
      hint: 'Finished every required step in a week, advancing the capstone stone.',
      earned: weeksCleared >= 1,
    },
    {
      id: 'halfway',
      label: 'Environment operational',
      hint: 'Cleared half the expedition — systems are integrated and running.',
      earned: weeksTotal > 0 && weeksCleared * 2 >= weeksTotal,
    },
    {
      id: 'capstone',
      label: 'Capstone defended',
      hint: 'Cleared every week: built, secured, validated and handed off.',
      earned: weeksTotal > 0 && weeksCleared >= weeksTotal,
    },
  ];

  return { stage, weeksCleared, weeksTotal, stepsDone, stepsTotal, milestones };
}

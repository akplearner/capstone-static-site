import { Course } from './types';
import { getTasksByRole, isSetupWeek } from './course-helpers';
import { deriveStoneStage, stageForWeek, type Milestone, type StoneStage } from './quarry';

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
  taskPercent: Record<string, number>,
  /** The course's capstone deliverable has been filled in. Master is the one
   *  stage a week cannot grant — the work has to be handed over. Defaults to
   *  false so a caller that hasn't wired the docs repo yet under-reports rather
   *  than awarding a stage nobody earned. */
  capstoneFiled = false
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
  const clearedWeeks = gradedWeeks
    .filter((w) => (weekPercent[w.number] ?? 0) >= 100)
    .map((w) => w.number);
  const weeksCleared = clearedWeeks.length;
  const weeksTotal = gradedWeeks.length;
  const stage = deriveStoneStage({
    clearedWeeks,
    totalWeeks: weeksTotal,
    capstoneFiled,
    stageOf: (n) => stageForWeek(course, n),
  });

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
      // "Defended" has to mean handed over, not just finished — so this tracks
      // the stone's Master rule rather than week completion alone.
      hint: 'Cleared every week and filed the capstone document: built, secured, validated and handed off.',
      earned: weeksTotal > 0 && weeksCleared >= weeksTotal && capstoneFiled,
    },
  ];

  return { stage, weeksCleared, weeksTotal, stepsDone, stepsTotal, milestones };
}

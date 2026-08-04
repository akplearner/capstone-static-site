import { Course } from './types';
import { getProgressStepCount, getRequiredStepCount, getTasksByRole, isSetupWeek } from './course-helpers';

/**
 * The game layer.
 *
 * Everything here is *derived* from progress the app already stores — the
 * completion key set — so there is no new persistence, nothing to migrate, and
 * nothing that can disagree with the progress bars. Reset your progress and the
 * XP resets with it, because it was never a separate fact.
 *
 * XP is deliberately simple and legible: a student should be able to work out
 * why a number went up. One completed step is worth XP_PER_STEP; an optional
 * step is worth less, because it doesn't count toward the course either;
 * clearing a whole week pays a bonus so finishing beats half-finishing.
 */

export const XP_PER_STEP = 10;
export const XP_PER_OPTIONAL_STEP = 4;
export const XP_WEEK_CLEARED = 50;

/** Cumulative XP needed to *reach* each level. Index 0 is level 1. */
const LEVEL_THRESHOLDS = [0, 120, 300, 560, 900, 1320, 1840, 2460];

export interface LevelInfo {
  level: number;
  /** XP into the current level. */
  into: number;
  /** XP the current level spans; null at max level. */
  span: number | null;
  /** 0-100 progress through the current level; 100 at max. */
  percent: number;
  atMax: boolean;
}

export function levelForXp(xp: number): LevelInfo {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  const floor = LEVEL_THRESHOLDS[level - 1];
  const next = LEVEL_THRESHOLDS[level];
  if (next == null) {
    return { level, into: xp - floor, span: null, percent: 100, atMax: true };
  }
  const span = next - floor;
  const into = xp - floor;
  return {
    level,
    into,
    span,
    percent: span > 0 ? Math.min(100, Math.round((into / span) * 100)) : 0,
    atMax: false,
  };
}

export interface GameState {
  xp: number;
  level: LevelInfo;
  /** Weeks cleared (100%), excluding setup weeks. */
  weeksCleared: number;
  /** Non-setup weeks that have any tasks for this role. */
  weeksTotal: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  label: string;
  /** Why it was awarded, shown on hover. */
  hint: string;
  earned: boolean;
}

/**
 * Derive the whole game state from the per-week and per-task percentages the
 * course page already computes in one batched scan. Passing those in (rather
 * than re-reading storage) keeps this pure and testable.
 */
export function deriveGameState(
  course: Course,
  role: string,
  weekPercent: Record<number, number>,
  taskPercent: Record<string, number>
): GameState {
  let xp = 0;

  for (const task of getTasksByRole(course, role)) {
    const pct = taskPercent[task.id] ?? 0;
    const counted = getProgressStepCount(task);
    const done = Math.round((pct / 100) * counted);
    // A task made only of optional steps pays the lower rate — it's real work,
    // but it isn't the course's required path.
    const rate = getRequiredStepCount(task) > 0 ? XP_PER_STEP : XP_PER_OPTIONAL_STEP;
    xp += done * rate;
  }

  const gradedWeeks = course.weeks.filter(
    (w) => !isSetupWeek(course, w.number) && getTasksByRole(course, role, w.number).length > 0
  );
  const weeksCleared = gradedWeeks.filter((w) => (weekPercent[w.number] ?? 0) >= 100).length;
  xp += weeksCleared * XP_WEEK_CLEARED;

  const allCleared = gradedWeeks.length > 0 && weeksCleared === gradedWeeks.length;

  const badges: Badge[] = [
    {
      id: 'first-step',
      label: 'First contact',
      hint: 'Completed your first step.',
      earned: xp > 0,
    },
    {
      id: 'week-cleared',
      label: 'Week cleared',
      hint: 'Finished every required step in a week.',
      earned: weeksCleared >= 1,
    },
    {
      id: 'halfway',
      label: 'Halfway',
      hint: 'Cleared half the weeks in the course.',
      earned: gradedWeeks.length > 0 && weeksCleared * 2 >= gradedWeeks.length,
    },
    {
      id: 'capstone',
      label: 'Capstone',
      hint: 'Cleared every week of the course.',
      earned: allCleared,
    },
  ];

  return {
    xp,
    level: levelForXp(xp),
    weeksCleared,
    weeksTotal: gradedWeeks.length,
    badges,
  };
}

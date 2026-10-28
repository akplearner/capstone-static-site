import type { Course } from '../types';
import { isAdvancedWeek, isGradedWeek } from '../course-helpers';

/**
 * R140 — when a course asks the team about what it recorded.
 *
 * The owner's framework names three moments: Week 1 (record the values), Week 4
 * (recall and explain them) and Week 8 (apply them under change, fault and
 * incident). No course has eight graded weeks (most grade four; CISSP six;
 * Server+ and CCNA add optional advanced weeks), so the moments are checkpoints
 * placed by the course's own shape: `recall` in the middle graded week, `apply`
 * in the last graded week, `extend` in every advanced week. A course may set its
 * own weeks in `course.validation`; the defaults are derived here so the course
 * documents stay as they are.
 */
export type CheckpointKind = 'recall' | 'apply' | 'extend';

export interface Checkpoint {
  kind: CheckpointKind;
  week: number;
}

export function gradedWeekNumbers(course: Course): number[] {
  return course.weeks.map((w) => w.number).filter((n) => isGradedWeek(course, n)).sort((a, b) => a - b);
}

export function validationPlanOf(course: Pick<Course, 'weeks' | 'validation'>): Checkpoint[] {
  const c = course as Course;
  const graded = gradedWeekNumbers(c);
  if (graded.length === 0) return [];
  const recall = course.validation?.recall ?? graded[Math.min(graded.length - 1, Math.ceil(graded.length / 2))];
  const apply = course.validation?.apply ?? graded[graded.length - 1];
  const extend = course.validation?.extend ?? c.weeks.map((w) => w.number).filter((n) => isAdvancedWeek(c, n)).sort((a, b) => a - b);
  const out: Checkpoint[] = [{ kind: 'recall', week: recall }];
  if (apply !== recall) out.push({ kind: 'apply', week: apply });
  for (const w of extend) if (w !== recall && w !== apply) out.push({ kind: 'extend', week: w });
  return out.sort((a, b) => a.week - b.week);
}

/** The checkpoints whose week has arrived. */
export function checkpointsReached(course: Pick<Course, 'weeks' | 'validation'>, currentWeek: number): Checkpoint[] {
  return validationPlanOf(course).filter((c) => c.week <= currentWeek);
}

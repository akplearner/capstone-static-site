import { Course } from './types';
import { KEYS } from './data/keys';
import { safeSetItem } from './data/safeStorage';
import { getTasksByRole, getTaskById, isSetupWeek } from './course-helpers';

/**
 * "Pick up where you left off."
 *
 * The course page used to expand the first week that wasn't 100% complete, which
 * had two bad consequences: a setup week that can never reach 100% pinned the
 * page open on Week 0 forever, and a student returning mid-course landed on the
 * top of a week rather than on the checkbox they actually stopped at.
 *
 * So we record the last checkbox ticked. This is a *UI convenience pointer*, not
 * progress data — progress remains the completion key set. It is device-local
 * and safe to lose: with no pointer we fall back to the first incomplete
 * non-setup week, which is the old behaviour.
 */

export interface ResumePoint {
  week: number;
  taskId: string;
  stepId: string;
  /** Epoch ms of the tick, used only to keep the most recent of several writes. */
  at: number;
}

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

/** Record where the student just ticked. Called on completion, never on un-tick
 *  of some older step — we only move the pointer forward in time. */
export function recordResume(
  courseId: string,
  memberId: string,
  point: Omit<ResumePoint, 'at'>
): void {
  if (!hasWindow()) return;
  const value: ResumePoint = { ...point, at: Date.now() };
  safeSetItem(KEYS.resume(courseId, memberId), JSON.stringify(value));
}

/** Read the stored pointer, discarding anything that no longer resolves against
 *  the current course content (steps get renamed and split between rounds). */
export function readResume(course: Course, memberId: string): ResumePoint | null {
  if (!hasWindow()) return null;
  const raw = localStorage.getItem(KEYS.resume(course.id, memberId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ResumePoint>;
    if (!parsed || typeof parsed.taskId !== 'string' || typeof parsed.stepId !== 'string') {
      return null;
    }
    const task = getTaskById(course, parsed.taskId);
    if (!task) return null;
    if (!task.steps.some((s) => s.id === parsed.stepId)) return null;
    return {
      week: task.week,
      taskId: task.id,
      stepId: parsed.stepId,
      at: typeof parsed.at === 'number' ? parsed.at : 0,
    };
  } catch {
    return null;
  }
}

export function clearResume(courseId: string, memberId: string): void {
  if (!hasWindow()) return;
  localStorage.removeItem(KEYS.resume(courseId, memberId));
}

/**
 * The week to open on load.
 *
 * Order of preference:
 *  1. The week containing the last checkbox the student ticked.
 *  2. The first incomplete week that isn't setup — setup weeks are opt-in and
 *     must never present themselves as "the week you're on".
 *  3. The first non-setup week, so a brand-new student starts at Week 1.
 *  4. Whatever the course actually starts with (covers a course that is all
 *     setup, rather than returning a week number that doesn't exist).
 *
 * `weekPercent` is passed in rather than read here so the caller can reuse the
 * single batched completion scan it already performs.
 */
export function resolveActiveWeek(
  course: Course,
  role: string,
  weekPercent: Record<number, number>,
  resume: ResumePoint | null
): number {
  if (resume) return resume.week;

  const weeks = [...course.weeks].sort((a, b) => a.number - b.number);
  const graded = weeks.filter((w) => !isSetupWeek(course, w.number));

  const firstIncomplete = graded.find((w) => {
    // A week with no tasks for this role can't be "where you are".
    if (getTasksByRole(course, role, w.number).length === 0) return false;
    return (weekPercent[w.number] ?? 0) < 100;
  });
  if (firstIncomplete) return firstIncomplete.number;

  return graded[0]?.number ?? weeks[0]?.number ?? 1;
}

/** True when the student has never ticked anything in this course. Used to decide
 *  whether the setup week is worth opening for a genuinely new student. */
export function hasNoProgress(weekPercent: Record<number, number>): boolean {
  return Object.values(weekPercent).every((p) => !p);
}

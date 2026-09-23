import { useMemo } from 'react';
import { progressRepo, stepNotesRepo, cohortRepo } from '@/lib/data';
import { useClientStore, EMPTY_OBJECT } from '@/lib/useClientStore';
import { getTasksByRole, isGradedWeek } from '@/lib/course-helpers';
import { readResume, resolveActiveWeek, type ResumePoint } from '@/lib/resume';
import { parseTeamId } from '@/lib/team';
import type { Course, GateStatus, Member, Task } from '@/lib/types';

type CourseStats = {
  weekStats: Record<number, number>;
  taskStats: Record<string, number>;
  gateStats: Record<number, GateStatus>;
  /** The week to open on load — where the student stopped, else the first
   *  incomplete non-setup week. See src/lib/resume.ts. */
  activeWeek: number;
  /** The exact checkbox the student last ticked, if we still have it. */
  resume: ResumePoint | null;
};
const EMPTY_STATS: CourseStats = {
  weekStats: {},
  taskStats: {},
  gateStats: {},
  activeWeek: 1,
  resume: null,
};

/**
 * Everything the course page derives from progress, in one hook.
 *
 * One batched localStorage scan gives week %, task %, gate status and the
 * "active" week, kept live via the store subscription. From that: the ordered
 * weeks, every incomplete task for the role (so "what comes after me?" is a
 * scan of one array rather than a `weeks × tasks` walk per row), the Continue
 * target, the teammates' stuck flags per task, and the cohort calendar.
 *
 * R78-C1: lifted out of `page.tsx` unchanged. Hooks in here run
 * unconditionally, so the caller must call this above any early return.
 */
export function useCourseProgress(course: Course, member: Member | null) {
  const stats = useClientStore<CourseStats>(() => {
    const weeks: Record<number, number> = {};
    const tasks: Record<string, number> = {};
    const gates: Record<number, GateStatus> = {};
    let resumePoint: ResumePoint | null = null;
    if (member) {
      const keySet = progressRepo.getCompletionKeySet(course.id, member.memberId);
      [...course.weeks]
        .sort((a, b) => a.number - b.number)
        .forEach((w) => {
          weeks[w.number] = progressRepo.getWeekCompletion(
            course, member.memberId, member.role, w.number, keySet
          );
          getTasksByRole(course, member.role, w.number).forEach((t) => {
            tasks[t.id] = progressRepo.getTaskPercent(course.id, member.memberId, t, keySet);
          });
        });
      course.gates.forEach((g) => {
        gates[g.id] = progressRepo.deriveGateStatus(course, member.memberId, member.role, g, keySet);
      });
      resumePoint = readResume(course, member.memberId);
    }
    return {
      weekStats: weeks,
      taskStats: tasks,
      gateStats: gates,
      activeWeek: resolveActiveWeek(course, member?.role ?? '', weeks, resumePoint),
      resume: resumePoint,
    };
  }, EMPTY_STATS);
  const { weekStats, taskStats } = stats;

  // Weeks in order. Memoised because `incompleteTasks` depends on it, and a
  // fresh array every render would make that memo miss every time.
  const sortedWeeks = useMemo(
    () => [...course.weeks].sort((a, b) => a.number - b.number),
    [course.weeks]
  );

  /** Every incomplete task for this role, in week order. */
  const incompleteTasks = useMemo(() => {
    if (!member) return [] as Task[];
    return sortedWeeks.flatMap((w) =>
      getTasksByRole(course, member.role, w.number).filter((t) => (taskStats[t.id] ?? 0) < 100)
    );
  }, [course, member, sortedWeeks, taskStats]);

  const nextIncompleteAfter = (taskId: string): Task | undefined =>
    incompleteTasks.find((t: Task) => t.id !== taskId);

  // "Continue" points at real coursework. Setup weeks and home-lab-only build
  // tasks are opt-in, so an untouched Week 0 must not hold the CTA hostage.
  let nextTask: Task | undefined;
  if (member) {
    for (const w of sortedWeeks) {
      if (!isGradedWeek(course, w.number)) continue;
      const t = getTasksByRole(course, member.role, w.number).find(
        (tk) => !tk.homeLabOnly && (taskStats[tk.id] ?? 0) < 100
      );
      if (t) {
        nextTask = t;
        break;
      }
    }
  }

  // Teammates' stuck flags, folded per task for the chip on the row (R68).
  const stuckByTask = useClientStore<Record<string, number>>(() => {
    if (!member) return EMPTY_OBJECT;
    const out: Record<string, number> = {};
    for (const f of stepNotesRepo.teamStuck(course.id, member.teamId)) out[f.taskId] = (out[f.taskId] ?? 0) + 1;
    return out;
  }, EMPTY_OBJECT);

  // The cohort calendar, when the instructor has set a start date.
  const cohortKey = member ? (parseTeamId(member.teamId).cohort ?? member.cohort) : null;
  const cohortCal = useClientStore(() => (cohortKey ? cohortRepo.get(course.id, cohortKey) : null), null);

  return {
    ...stats,
    weekStats,
    sortedWeeks,
    incompleteTasks,
    nextIncompleteAfter,
    nextTask,
    stuckByTask,
    cohortKey,
    cohortCal,
  };
}

import { useMemo } from 'react';
import { progressRepo, stepNotesRepo, cohortRepo, taskReportsRepo } from '@/lib/data';
import { useClientStore, EMPTY_OBJECT } from '@/lib/useClientStore';
import { isGradedWeek, weekTasksOrdered } from '@/lib/course-helpers';
import { stepKey, teamGateStatus, teamStepCompletions, teamTaskPercent, teamWeekCompletion } from '@/lib/teamProgress';
import { readResume, resolveActiveWeek, type ResumePoint } from '@/lib/resume';
import { parseTeamId } from '@/lib/team';
import type { Course, GateStatus, Member, Task } from '@/lib/types';

type CourseStats = {
  /** The member's own ticks: the personal record (gems, the stone, the ledger). */
  weekStats: Record<number, number>;
  taskStats: Record<string, number>;
  /** R98: the team's ticks, whoever made them — what the Tasks tab, the rail,
   *  the gate lock and the Home banner read. A task is done once anyone did it. */
  teamWeekStats: Record<number, number>;
  teamTaskStats: Record<string, number>;
  /** Gates are team checkpoints: passed by the team's work, not one role's. */
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
  teamWeekStats: {},
  teamTaskStats: {},
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
    const teamWeeks: Record<number, number> = {};
    const teamTasks: Record<string, number> = {};
    const gates: Record<number, GateStatus> = {};
    let resumePoint: ResumePoint | null = null;
    if (member) {
      const keySet = progressRepo.getCompletionKeySet(course.id, member.memberId);
      // R98: every task, not the role's — a member's ticks on a teammate's
      // task are part of their own record too.
      const done = new Set(teamStepCompletions(progressRepo, course, member.teamId).keys());
      [...course.weeks]
        .sort((a, b) => a.number - b.number)
        .forEach((w) => {
          weeks[w.number] = progressRepo.getWeekCompletion(
            course, member.memberId, member.role, w.number, keySet
          );
          teamWeeks[w.number] = teamWeekCompletion(course, w.number, done);
        });
      course.tasks.forEach((t) => {
        tasks[t.id] = progressRepo.getTaskPercent(course.id, member.memberId, t, keySet);
        teamTasks[t.id] = teamTaskPercent(t, done);
      });
      course.gates.forEach((g) => {
        gates[g.id] = teamGateStatus(course, g, done);
      });
      resumePoint = readResume(course, member.memberId);
    }
    return {
      weekStats: weeks,
      taskStats: tasks,
      teamWeekStats: teamWeeks,
      teamTaskStats: teamTasks,
      gateStats: gates,
      activeWeek: resolveActiveWeek(course, member?.role ?? '', teamWeeks, resumePoint),
      resume: resumePoint,
    };
  }, EMPTY_STATS);
  const { weekStats, teamTaskStats } = stats;

  // Weeks in order. Memoised because `incompleteTasks` depends on it, and a
  // fresh array every render would make that memo miss every time.
  const sortedWeeks = useMemo(
    () => [...course.weeks].sort((a, b) => a.number - b.number),
    [course.weeks]
  );

  /** Every task the team has not finished, in week order: this role's first,
   *  then a teammate's — open to anyone (R98). */
  const incompleteTasks = useMemo(() => {
    if (!member) return [] as Task[];
    return sortedWeeks.flatMap((w) =>
      weekTasksOrdered(course, member.role, w.number).filter((t) => (teamTaskStats[t.id] ?? 0) < 100)
    );
  }, [course, member, sortedWeeks, teamTaskStats]);

  const nextIncompleteAfter = (taskId: string): Task | undefined =>
    incompleteTasks.find((t: Task) => t.id !== taskId);

  // "Continue" points at real coursework. Setup weeks and home-lab-only build
  // tasks are opt-in, so an untouched Week 0 must not hold the CTA hostage.
  let nextTask: Task | undefined;
  if (member) {
    for (const w of sortedWeeks) {
      if (!isGradedWeek(course, w.number)) continue;
      const t = weekTasksOrdered(course, member.role, w.number).find(
        (tk) => !tk.homeLabOnly && (teamTaskStats[tk.id] ?? 0) < 100
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

  // Each TEAMMATE's percent on each task (R83): the avatars and the team ring
  // on every task row — and, since R98, who ticked each step, so a rung can
  // say "done by Ada". One roster scan serves both; completions are
  // team-readable, so this is live in cloud mode.
  const team = useClientStore<{ progress: Record<string, TeammateTaskProgress[]>; steps: TeamStepsByTask }>(() => {
    if (!member) return EMPTY_TEAM;
    const teammates = progressRepo.getRoster(course.id).filter((e) => e.teamId === member.teamId);
    if (teammates.length <= 1) return EMPTY_TEAM;
    const progress: Record<string, TeammateTaskProgress[]> = {};
    const steps: TeamStepsByTask = {};
    const byStep = teamStepCompletions(progressRepo, course, member.teamId);
    const names = new Map(teammates.map((m) => [m.memberId, m.displayName]));
    for (const m of teammates) {
      const keySet = progressRepo.getCompletionKeySet(course.id, m.memberId);
      for (const t of course.tasks) {
        (progress[t.id] ??= []).push({
          memberId: m.memberId,
          displayName: m.displayName,
          avatarUrl: m.avatarUrl,
          role: m.role,
          pct: progressRepo.getTaskPercent(course.id, m.memberId, t, keySet),
        });
      }
    }
    for (const t of course.tasks) {
      for (const s of t.steps) {
        const who = byStep.get(stepKey(t.id, s.id));
        if (who?.length) ((steps[t.id] ??= {})[s.id] = who.map((id) => ({ memberId: id, displayName: names.get(id) ?? '' })));
      }
    }
    return { progress, steps };
  }, EMPTY_TEAM);
  const teamTaskProgress = team.progress;
  const teamSteps = team.steps;

  // Open issue reports on each task, for the team's marker (R83).
  const openReportsByTask = useClientStore<Record<string, number>>(() => {
    if (!member) return EMPTY_OBJECT;
    const out: Record<string, number> = {};
    for (const r of taskReportsRepo.list(course.id)) {
      if (r.status === 'open' && r.teamId === member.teamId) out[r.taskId] = (out[r.taskId] ?? 0) + 1;
    }
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
    openReportsByTask,
    teamTaskProgress,
    teamSteps,
    cohortKey,
    cohortCal,
  };
}

/** Who ticked each step of each task (R98): `taskId → stepId → members`. */
export type TeamStepsByTask = Record<string, Record<string, { memberId: string; displayName: string }[]>>;
const EMPTY_TEAM: { progress: Record<string, TeammateTaskProgress[]>; steps: TeamStepsByTask } = { progress: {}, steps: {} };

/** One teammate's standing on one task — for the row's avatar stack (R83). */
export interface TeammateTaskProgress {
  memberId: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
  pct: number;
}

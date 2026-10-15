import type { Course, Gate, GateStatus, Task } from './types';
import { calculateProgress } from './utils';
import { getProgressSteps, getRequiredSteps, getWeekTasks } from './course-helpers';
import { KEYS } from './data/keys';
import type { ProgressRepository } from './data/types';

/**
 * R98 — done for the team.
 *
 * Progress is stored per member (one key per ticked step, under that member's
 * id), and that stays: it is the personal record — gems, the stone, the
 * evidence stamp, a grade. But a task on a role-split course belongs to the
 * TEAM: if the Infrastructure Admin is away, the Security Admin does the
 * resource group, and the week is done when the work is done, whoever did it.
 * So the Tasks tab, the week rail, the gate note and the Home banner read the
 * UNION of every teammate's ticks, derived here.
 *
 * Pure functions over the public repository API, so one implementation serves
 * both backends: the cloud cache already holds every teammate's completion
 * keys (they are team-readable), and the local repo holds everyone who joined
 * on this device. Keys are probed, never parsed — the key separator is `_`,
 * which an id may contain.
 */

/** A step, named without a member: the same `task::step` shape the evidence ledger uses. */
export const stepKey = (taskId: string, stepId: string) => `${taskId}::${stepId}`;

export type TeamRepo = Pick<ProgressRepository, 'getRoster' | 'getCompletionKeySet'>;

/** Who on the team ticked which step: `task::step` → member ids, in roster order. */
export type TeamSteps = Map<string, string[]>;

/** Every step any member of the team has ticked, with who ticked it. */
export function teamStepCompletions(repo: TeamRepo, course: Course, teamId: string): TeamSteps {
  const out: TeamSteps = new Map();
  const members = repo.getRoster(course.id).filter((e) => e.teamId === teamId);
  for (const m of members) {
    const keys = repo.getCompletionKeySet(course.id, m.memberId);
    if (keys.size === 0) continue;
    for (const t of course.tasks) {
      for (const s of t.steps) {
        if (keys.has(KEYS.completion(course.id, m.memberId, t.id, s.id))) {
          const k = stepKey(t.id, s.id);
          out.set(k, [...(out.get(k) ?? []), m.memberId]);
        }
      }
    }
  }
  return out;
}

/** The union of every teammate's ticks, member-agnostic. */
export function teamCompletionKeySet(repo: TeamRepo, course: Course, teamId: string): Set<string> {
  return new Set(teamStepCompletions(repo, course, teamId).keys());
}

/** The task's percent for the team — the same denominator as `getTaskPercent`. */
export function teamTaskPercent(task: Task, done: Set<string>): number {
  const steps = getProgressSteps(task);
  if (steps.length === 0) return 0;
  return calculateProgress(steps.filter((s) => done.has(stepKey(task.id, s.id))).length, steps.length);
}

/** The week's percent for the team, over EVERY role's tasks — the same arithmetic as `getWeekCompletion`. */
export function teamWeekCompletion(course: Course, week: number, done: Set<string>): number {
  const tasks = getWeekTasks(course, week);
  let total = 0;
  let completed = 0;
  for (const t of tasks) {
    const steps = getProgressSteps(t);
    total += steps.length;
    completed += steps.filter((s) => done.has(stepKey(t.id, s.id))).length;
  }
  return calculateProgress(completed, total);
}

/**
 * Where the team stands against one gate — the same ladder as
 * `deriveGateStatus`, over the gate's required tasks whoever owns them. A
 * gate that requires nothing holds nobody up.
 */
export function teamGateStatus(course: Course, gate: Gate, done: Set<string>): GateStatus {
  const tasks = course.tasks.filter((t) => gate.requiredTasks.includes(t.id));
  if (tasks.length === 0) return 'passed';
  let total = 0;
  let completed = 0;
  for (const t of tasks) {
    const steps = getRequiredSteps(t);
    total += steps.length;
    completed += steps.filter((s) => done.has(stepKey(t.id, s.id))).length;
  }
  // A gate whose tasks have no required step asks for nothing: it must not read as shut forever.
  if (total === 0 || completed === total) return 'passed';
  if (completed > 0) return 'ready';
  return 'locked';
}

/** One task a gate still waits on: what it is, whose it is, where it sits and how many required steps are open. */
export interface OpenGateStep {
  taskId: string;
  title: string;
  role: string;
  week: number;
  open: number;
}

/** What an advisory gate note says: the gate, and the tasks still open under it. */
export interface GateNote {
  gate: Gate;
  steps: OpenGateStep[];
}

/**
 * R116 — the exact tasks a gate still waits on, in the gate's own order,
 * whoever owns them and whichever week they sit in (a setup-week task counts).
 * Gates are advisory: nothing is locked, but a team that wants to clear one
 * needs to know precisely what is left, so the note names it.
 */
export function openGateSteps(course: Course, gate: Gate, done: Set<string>): OpenGateStep[] {
  const byId = new Map(course.tasks.map((t) => [t.id, t]));
  return gate.requiredTasks
    .map((id) => byId.get(id))
    .filter((t): t is Task => !!t)
    .map((t) => ({
      taskId: t.id,
      title: t.title,
      role: t.role,
      week: t.week,
      open: getRequiredSteps(t).filter((s) => !done.has(stepKey(t.id, s.id))).length,
    }))
    .filter((s) => s.open > 0);
}

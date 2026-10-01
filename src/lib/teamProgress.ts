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
 * So the Tasks tab, the week rail, the gate lock and the Home banner read the
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
  if (total > 0 && completed === total) return 'passed';
  if (completed > 0) return 'ready';
  return 'locked';
}

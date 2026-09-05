import { Course, Gate, GateStatus, Member, RosterEntry, Task, TaskCompletion } from '../types';
import { calculateProgress } from '../utils';
import {
  getTasksByRole,
  getRequiredSteps,
  getRequiredStepCount,
  getProgressSteps,
  getProgressStepCount,
} from '../course-helpers';
import { JoinResult, ProgressRepository } from './types';
import { KEYS, STORAGE_PREFIX } from './keys';
import { safeSetItem } from './safeStorage';

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

// Completed REQUIRED steps for a task, given a resolved completion key set.
// Optional steps (e.g. the Windows track) are tracked but excluded so they never
// inflate the numerator past the required total.
function completedRequiredCount(
  courseId: string,
  memberId: string,
  task: Task,
  set: Set<string>
): number {
  return getRequiredSteps(task).filter((s) =>
    set.has(KEYS.completion(courseId, memberId, task.id, s.id))
  ).length;
}

// Completed steps counted against the task's *progress* denominator, which falls
// back to all steps for an all-optional task (see getProgressSteps). Gates still
// use completedRequiredCount — an opt-in track must not satisfy a gate.
function completedProgressCount(
  courseId: string,
  memberId: string,
  task: Task,
  set: Set<string>
): number {
  return getProgressSteps(task).filter((s) =>
    set.has(KEYS.completion(courseId, memberId, task.id, s.id))
  ).length;
}

let migrated = false;

/**
 * One-time migration of pre-multi-course (un-scoped) keys into the
 * 'security-plus' scope, so existing students keep their progress.
 * Idempotent: guarded by an in-memory flag and a persisted flag.
 */
function ensureMigrated(): void {
  if (migrated || !hasWindow()) return;
  migrated = true;
  if (localStorage.getItem(KEYS.migratedV2)) return;

  const legacyContextPrefix = `${STORAGE_PREFIX}context`;
  const legacyCompletionPrefix = `${STORAGE_PREFIX}completion_`;
  const legacyGatePrefix = `${STORAGE_PREFIX}gate_`;
  const SEED = 'security-plus';

  const writes: Array<[string, string]> = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key);
    if (value == null) continue;

    if (key === legacyContextPrefix) {
      try {
        const ctx = JSON.parse(value);
        if (ctx && !ctx.courseId) ctx.courseId = SEED;
        writes.push([KEYS.context(SEED), JSON.stringify(ctx)]);
      } catch {
        /* ignore malformed legacy context */
      }
    } else if (key.startsWith(legacyCompletionPrefix)) {
      // capstone_completion_... -> capstone_security-plus_completion_...
      writes.push([`${STORAGE_PREFIX}${SEED}_${key.slice(STORAGE_PREFIX.length)}`, value]);
    } else if (key.startsWith(legacyGatePrefix)) {
      writes.push([`${STORAGE_PREFIX}${SEED}_${key.slice(STORAGE_PREFIX.length)}`, value]);
    }
  }
  writes.forEach(([k, v]) => {
    if (localStorage.getItem(k) == null) safeSetItem(k, v);
  });
  safeSetItem(KEYS.migratedV2, '1');
}

/**
 * The completion key set, cached.
 *
 * `getCompletionKeySet` iterates the WHOLE of localStorage — every key the
 * browser holds for this origin, not just this course's — to collect the ones
 * with a completion prefix. That is a fine way to answer the question once. It
 * is not a fine way to answer it the way callers actually ask it:
 * `TeamBlock` calls it once per roster member, and `explore`, `dashboard` and
 * `portfolio` call it once per course, all inside `useClientStore` selectors
 * that re-run on every render and on every one of the ~34 store broadcasts.
 *
 * So the scan is cached per (course, member) behind a version counter. Every
 * write path that can change a completion key bumps it — set, remove, reset —
 * and a `storage` event from another tab clears the lot, since a cache cannot
 * see a write it did not make.
 *
 * The cached Set is handed back by reference. Callers only ever `.has()` it, and
 * the two that build one (`getCompletedStepIds`, `getTaskPercent`) take it as an
 * argument rather than mutating it.
 */
const keySetCache = new Map<string, { version: number; value: Set<string> }>();
let completionVersion = 0;

function bumpCompletions(): void {
  completionVersion++;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => {
    completionVersion++;
    keySetCache.clear();
  });
}

export const localStorageProgressRepo: ProgressRepository = {
  getContext(courseId: string): Member | null {
    if (!hasWindow()) return null;
    ensureMigrated();
    const raw = localStorage.getItem(KEYS.context(courseId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Member;
    } catch {
      return null;
    }
  },

  setContext(member: Member): void {
    if (!hasWindow()) return;
    safeSetItem(KEYS.context(member.courseId), JSON.stringify(member));
  },

  getRoster(courseId: string): RosterEntry[] {
    if (!hasWindow()) return [];
    const raw = localStorage.getItem(KEYS.roster(courseId));
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as RosterEntry[]) : [];
    } catch {
      return [];
    }
  },

  getTeamCounts(courseId: string): Record<string, number> {
    const counts: Record<string, number> = {};
    this.getRoster(courseId).forEach((e) => {
      counts[e.teamId] = (counts[e.teamId] ?? 0) + 1;
    });
    return counts;
  },

  joinTeam(course: Course, member: Member): JoinResult {
    if (!hasWindow()) return { ok: false };
    const roster = this.getRoster(course.id);
    // A student moving teams shouldn't count against their own current slot.
    const others = roster.filter((e) => e.memberId !== member.memberId);
    const cap = course.teamCapacity ?? 0;
    if (cap > 0) {
      const onTeam = others.filter((e) => e.teamId === member.teamId).length;
      if (onTeam >= cap) return { ok: false, reason: 'team-full' };
    }
    const entry: RosterEntry = {
      memberId: member.memberId,
      teamId: member.teamId,
      role: member.role,
      displayName: member.displayName,
      cohort: member.cohort,
      joinedAt: Date.now(),
    };
    safeSetItem(KEYS.roster(course.id), JSON.stringify([...others, entry]));
    this.setContext(member);
    return { ok: true };
  },

  leaveTeam(courseId: string, memberId: string): void {
    if (!hasWindow()) return;
    const remaining = this.getRoster(courseId).filter((e) => e.memberId !== memberId);
    safeSetItem(KEYS.roster(courseId), JSON.stringify(remaining));
  },

  getCompletionKeySet(courseId: string, memberId: string): Set<string> {
    const set = new Set<string>();
    if (!hasWindow()) return set;
    ensureMigrated();
    const cacheKey = `${courseId}\u0000${memberId}`;
    const hit = keySetCache.get(cacheKey);
    if (hit && hit.version === completionVersion) return hit.value;
    const prefix = KEYS.completionPrefix(courseId, memberId);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) set.add(key);
    }
    keySetCache.set(cacheKey, { version: completionVersion, value: set });
    return set;
  },

  isStepComplete(courseId, memberId, taskId, stepId, keySet): boolean {
    const key = KEYS.completion(courseId, memberId, taskId, stepId);
    if (keySet) return keySet.has(key);
    if (!hasWindow()) return false;
    return localStorage.getItem(key) != null;
  },

  setCompletion(completion: TaskCompletion): void {
    if (!hasWindow()) return;
    const { courseId, memberId, taskId, stepId } = completion;
    safeSetItem(
      KEYS.completion(courseId, memberId, taskId, stepId),
      JSON.stringify(completion)
    );
    bumpCompletions();
  },

  removeCompletion(courseId, memberId, taskId, stepId): void {
    if (!hasWindow()) return;
    localStorage.removeItem(KEYS.completion(courseId, memberId, taskId, stepId));
    bumpCompletions();
  },

  getCompletedStepIds(courseId, memberId, task: Task, keySet): string[] {
    const set = keySet ?? this.getCompletionKeySet(courseId, memberId);
    return task.steps
      .filter((s) => set.has(KEYS.completion(courseId, memberId, task.id, s.id)))
      .map((s) => s.id);
  },

  getTaskPercent(courseId, memberId, task: Task, keySet): number {
    const total = getProgressStepCount(task);
    if (total === 0) return 0;
    const set = keySet ?? this.getCompletionKeySet(courseId, memberId);
    return calculateProgress(completedProgressCount(courseId, memberId, task, set), total);
  },

  getWeekCompletion(course: Course, memberId, role, week, keySet): number {
    const set = keySet ?? this.getCompletionKeySet(course.id, memberId);
    const tasks = getTasksByRole(course, role, week);
    const total = tasks.reduce((sum, t) => sum + getProgressStepCount(t), 0);
    if (total === 0) return 0;
    const completed = tasks.reduce(
      (sum, t) => sum + completedProgressCount(course.id, memberId, t, set),
      0
    );
    return calculateProgress(completed, total);
  },

  /**
   * Where a role stands against one gate.
   *
   * Two things were wrong here, and MSSP hit both at once.
   *
   * The task lookup was scoped to `gate.week`, so a gate that requires work
   * from an earlier week silently required nothing of it — `content-integrity`
   * validates `requiredTasks` ids across the whole course, so the test and the
   * renderer disagreed about what "required" means. The id is the requirement;
   * the week is not part of it.
   *
   * And a gate that asks nothing of your role returned `'locked'`, which reads
   * as "you can never pass this" — and, through `weekLocked`, actually meant it:
   * MSSP's Red role matched zero required tasks on all three gates and was
   * therefore barred from week 2 onward, permanently, with nothing it could do
   * about it. The honest answer for a gate that does not concern you is that it
   * does not hold you up, so it is `'passed'`.
   */
  deriveGateStatus(course: Course, memberId, role, gate: Gate, keySet): GateStatus {
    const set = keySet ?? this.getCompletionKeySet(course.id, memberId);
    const myTasks = getTasksByRole(course, role).filter((t) => gate.requiredTasks.includes(t.id));
    if (myTasks.length === 0) return 'passed';
    const totalSteps = myTasks.reduce((sum, t) => sum + getRequiredStepCount(t), 0);
    const completedSteps = myTasks.reduce(
      (sum, t) => sum + completedRequiredCount(course.id, memberId, t, set),
      0
    );
    if (totalSteps > 0 && completedSteps === totalSteps) return 'passed';
    if (completedSteps > 0) return 'ready';
    return 'locked';
  },

  getGateStatus(courseId, teamId, gateId): GateStatus {
    if (!hasWindow()) return 'locked';
    return (localStorage.getItem(KEYS.gate(courseId, teamId, gateId)) as GateStatus) || 'locked';
  },

  setGateStatus(courseId, teamId, gateId, status): void {
    if (!hasWindow()) return;
    safeSetItem(KEYS.gate(courseId, teamId, gateId), status);
  },

  resetCourse(courseId, memberId): void {
    if (!hasWindow()) return;
    const prefix = KEYS.completionPrefix(courseId, memberId);
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) toRemove.push(key);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
    bumpCompletions();
  },
};

'use client';

import { Course, Gate, GateStatus, Member, RosterEntry, Task, TaskCompletion } from '../types';
import { calculateProgress } from '../utils';
import { getTasksByRole, getRequiredSteps, getRequiredStepCount } from '../course-helpers';
import { getBrowserClient } from '../supabase/client';
import { notifyStore } from '../useClientStore';
import { JoinResult, ProgressRepository } from './types';
import { KEYS } from './keys';
import { cache } from './supabaseCache';

// Supabase-backed ProgressRepository. Reads are synchronous off the in-memory cache
// (hydrated by useSupabaseSync); writes update the cache + notifyStore immediately
// (optimistic) and fire-and-forget the Supabase upsert. The progress MATH is
// identical to the localStorage repo — it only depends on the completion key set,
// whose shape is unchanged (userId occupies the memberId slot).

function completedRequiredCount(courseId: string, memberId: string, task: Task, set: Set<string>): number {
  return getRequiredSteps(task).filter((s) => set.has(KEYS.completion(courseId, memberId, task.id, s.id))).length;
}

function db() {
  return getBrowserClient();
}

export const supabaseProgressRepo: ProgressRepository = {
  getContext(courseId: string): Member | null {
    return cache.context(courseId);
  },

  setContext(member: Member): void {
    cache.setContext(member, member.courseId);
    notifyStore();
  },

  getRoster(courseId: string): RosterEntry[] {
    return cache.roster(courseId);
  },

  getTeamCounts(courseId: string): Record<string, number> {
    const counts: Record<string, number> = {};
    cache.roster(courseId).forEach((e) => {
      counts[e.teamId] = (counts[e.teamId] ?? 0) + 1;
    });
    return counts;
  },

  joinTeam(course: Course, member: Member): JoinResult {
    // Capacity is checked against the cached (cloud-hydrated) roster, mirroring the
    // localStorage repo. The DB's (user_id, course_id) PK additionally prevents a
    // double-join; per-team cap races are an accepted edge case for now.
    const others = cache.roster(course.id).filter((e) => e.memberId !== member.memberId);
    const cap = course.teamCapacity ?? 0;
    if (cap > 0 && others.filter((e) => e.teamId === member.teamId).length >= cap) {
      return { ok: false, reason: 'team-full' };
    }

    const entry: RosterEntry = {
      memberId: member.memberId,
      teamId: member.teamId,
      role: member.role,
      displayName: member.displayName,
      cohort: member.cohort,
      joinedAt: Date.now(),
    };
    // Optimistic local update.
    cache.upsertRosterEntry(course.id, entry);
    cache.setContext(member, course.id);
    notifyStore();

    // Write-through (membership + profile display name).
    const supabase = db();
    if (supabase) {
      void supabase
        .from('memberships')
        .upsert(
          {
            user_id: member.memberId,
            course_id: course.id,
            team_id: member.teamId,
            role: member.role,
            display_name: member.displayName,
            cohort: member.cohort,
          },
          { onConflict: 'user_id,course_id' }
        )
        .then(({ error }) => {
          if (error) console.error('joinTeam upsert failed', error.message);
        });
      void supabase.from('profiles').update({ display_name: member.displayName }).eq('id', member.memberId);
    }
    return { ok: true };
  },

  leaveTeam(courseId: string, memberId: string): void {
    cache.removeRosterEntry(courseId, memberId);
    cache.setContext(null, courseId);
    notifyStore();
    const supabase = db();
    if (supabase) {
      void supabase.from('memberships').delete().eq('user_id', memberId).eq('course_id', courseId);
    }
  },

  getCompletionKeySet(courseId: string, memberId: string): Set<string> {
    const prefix = KEYS.completionPrefix(courseId, memberId);
    const set = new Set<string>();
    cache.completionKeys.forEach((k) => {
      if (k.startsWith(prefix)) set.add(k);
    });
    return set;
  },

  isStepComplete(courseId, memberId, taskId, stepId, keySet): boolean {
    const key = KEYS.completion(courseId, memberId, taskId, stepId);
    if (keySet) return keySet.has(key);
    return cache.completionKeys.has(key);
  },

  setCompletion(completion: TaskCompletion): void {
    const { courseId, memberId, taskId, stepId } = completion;
    cache.completionKeys.add(KEYS.completion(courseId, memberId, taskId, stepId));
    notifyStore();
    const supabase = db();
    if (supabase) {
      void supabase
        .from('step_completions')
        .upsert(
          {
            user_id: memberId,
            course_id: courseId,
            task_id: taskId,
            step_id: stepId,
            completed_at: new Date(completion.completedAt).toISOString(),
          },
          { onConflict: 'user_id,course_id,task_id,step_id' }
        )
        .then(({ error }) => {
          if (error) console.error('setCompletion failed', error.message);
        });
    }
  },

  removeCompletion(courseId, memberId, taskId, stepId): void {
    cache.completionKeys.delete(KEYS.completion(courseId, memberId, taskId, stepId));
    notifyStore();
    const supabase = db();
    if (supabase) {
      void supabase
        .from('step_completions')
        .delete()
        .eq('user_id', memberId)
        .eq('course_id', courseId)
        .eq('task_id', taskId)
        .eq('step_id', stepId);
    }
  },

  getCompletedStepIds(courseId, memberId, task: Task, keySet): string[] {
    const set = keySet ?? this.getCompletionKeySet(courseId, memberId);
    return task.steps
      .filter((s) => set.has(KEYS.completion(courseId, memberId, task.id, s.id)))
      .map((s) => s.id);
  },

  getTaskPercent(courseId, memberId, task: Task, keySet): number {
    const required = getRequiredStepCount(task);
    if (required === 0) return 0;
    const set = keySet ?? this.getCompletionKeySet(courseId, memberId);
    return calculateProgress(completedRequiredCount(courseId, memberId, task, set), required);
  },

  getWeekCompletion(course: Course, memberId, role, week, keySet): number {
    const set = keySet ?? this.getCompletionKeySet(course.id, memberId);
    const tasks = getTasksByRole(course, role, week);
    const total = tasks.reduce((sum, t) => sum + getRequiredStepCount(t), 0);
    if (total === 0) return 0;
    const completed = tasks.reduce((sum, t) => sum + completedRequiredCount(course.id, memberId, t, set), 0);
    return calculateProgress(completed, total);
  },

  deriveGateStatus(course: Course, memberId, role, gate: Gate, keySet): GateStatus {
    const set = keySet ?? this.getCompletionKeySet(course.id, memberId);
    const myTasks = getTasksByRole(course, role, gate.week).filter((t) => gate.requiredTasks.includes(t.id));
    if (myTasks.length === 0) return 'locked';
    const totalSteps = myTasks.reduce((sum, t) => sum + getRequiredStepCount(t), 0);
    const completedSteps = myTasks.reduce((sum, t) => sum + completedRequiredCount(course.id, memberId, t, set), 0);
    if (totalSteps > 0 && completedSteps === totalSteps) return 'passed';
    if (completedSteps > 0) return 'ready';
    return 'locked';
  },

  getGateStatus(courseId, teamId, gateId): GateStatus {
    return (cache.gate(KEYS.gate(courseId, teamId, gateId)) as GateStatus) || 'locked';
  },

  setGateStatus(courseId, teamId, gateId, status): void {
    cache.setGate(KEYS.gate(courseId, teamId, gateId), status);
    notifyStore();
    const supabase = db();
    if (supabase) {
      void supabase
        .from('gate_status')
        .upsert(
          { course_id: courseId, team_id: teamId, gate_id: gateId, status },
          { onConflict: 'course_id,team_id,gate_id' }
        );
    }
  },

  resetCourse(courseId, memberId): void {
    const prefix = KEYS.completionPrefix(courseId, memberId);
    [...cache.completionKeys].forEach((k) => {
      if (k.startsWith(prefix)) cache.completionKeys.delete(k);
    });
    notifyStore();
    const supabase = db();
    if (supabase) {
      void supabase.from('step_completions').delete().eq('user_id', memberId).eq('course_id', courseId);
    }
  },
};

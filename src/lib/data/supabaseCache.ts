'use client';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { Member, RosterEntry } from '../types';
import type { DeliverableData } from '../docs/types';
import { getBrowserClient } from '../supabase/client';
import { notifyStore } from '../useClientStore';
import { KEYS } from './keys';

// In-memory mirror of the user's cloud data so the synchronous repo interfaces
// (ProgressRepository/DocsRepository) keep working unchanged. The cache is hydrated
// from Supabase on sign-in/course mount (useSupabaseSync), served synchronously to
// readers, written through optimistically (update cache + notifyStore immediately,
// fire-and-forget the upsert), and kept live by Realtime — the cloud analog of the
// cross-tab `storage` listener in useClientStore.
//
// Completion keys use the exact KEYS.completion(courseId, userId, taskId, stepId)
// shape, so every progress-math helper is reused verbatim with userId in the
// memberId slot. The cache holds the current user's data AND teammates' (RLS lets
// teammates read each other), which powers team visibility.

let currentUserId: string | null = null;
const completionKeys = new Set<string>(); // KEYS.completion(...) for self + teammates
const rosterByCourse = new Map<string, RosterEntry[]>();
const contextByCourse = new Map<string, Member | null>();
const docsByTeam = new Map<string, Record<string, DeliverableData>>(); // `${courseId}::${teamId}`
const gateByKey = new Map<string, string>(); // KEYS.gate(...) -> status

const hydratedCourses = new Set<string>();
const channels = new Map<string, RealtimeChannel>();

function teamKey(courseId: string, teamId: string) {
  return `${courseId}::${teamId}`;
}

export function setCurrentUserId(id: string | null) {
  if (id === currentUserId) return;
  currentUserId = id;
  if (!id) {
    // Signed out: drop everything so the UI shows the signed-out path.
    completionKeys.clear();
    rosterByCourse.clear();
    contextByCourse.clear();
    docsByTeam.clear();
    gateByKey.clear();
    hydratedCourses.clear();
    channels.forEach((ch) => ch.unsubscribe());
    channels.clear();
    notifyStore();
  }
}

export function getCurrentUserId() {
  return currentUserId;
}

// ---- synchronous reads used by the repos ----------------------------------

export const cache = {
  completionKeys,
  roster(courseId: string): RosterEntry[] {
    return rosterByCourse.get(courseId) ?? [];
  },
  context(courseId: string): Member | null {
    return contextByCourse.get(courseId) ?? null;
  },
  setContext(member: Member | null, courseId: string) {
    contextByCourse.set(courseId, member);
  },
  docs(courseId: string, teamId: string): Record<string, DeliverableData> | null {
    return docsByTeam.get(teamKey(courseId, teamId)) ?? null;
  },
  setDocs(courseId: string, teamId: string, data: Record<string, DeliverableData>) {
    docsByTeam.set(teamKey(courseId, teamId), data);
  },
  gate(key: string): string | null {
    return gateByKey.get(key) ?? null;
  },
  setGate(key: string, status: string) {
    gateByKey.set(key, status);
  },
  upsertRosterEntry(courseId: string, entry: RosterEntry) {
    const list = (rosterByCourse.get(courseId) ?? []).filter((e) => e.memberId !== entry.memberId);
    list.push(entry);
    rosterByCourse.set(courseId, list);
  },
  removeRosterEntry(courseId: string, memberId: string) {
    rosterByCourse.set(courseId, (rosterByCourse.get(courseId) ?? []).filter((e) => e.memberId !== memberId));
  },
};

// ---- hydration -------------------------------------------------------------

function rosterFromRow(r: Record<string, unknown>): RosterEntry {
  return {
    memberId: String(r.user_id),
    teamId: String(r.team_id),
    role: String(r.role),
    displayName: String(r.display_name ?? ''),
    cohort: String(r.cohort ?? ''),
    joinedAt: r.joined_at ? Date.parse(String(r.joined_at)) : 0,
  };
}

/** Load the user's + teammates' data for a course into the cache. Idempotent. */
export async function hydrateCourse(courseId: string): Promise<void> {
  const supabase = getBrowserClient();
  if (!supabase || !currentUserId) return;

  const [memberships, completions, deliverables, gates] = await Promise.all([
    supabase.from('memberships').select('*').eq('course_id', courseId),
    supabase.from('step_completions').select('*').eq('course_id', courseId),
    supabase.from('deliverables').select('*').eq('course_id', courseId),
    supabase.from('gate_status').select('*').eq('course_id', courseId),
  ]);

  if (memberships.data) {
    const list = memberships.data.map(rosterFromRow);
    rosterByCourse.set(courseId, list);
    const mine = memberships.data.find((m) => String(m.user_id) === currentUserId);
    contextByCourse.set(
      courseId,
      mine
        ? {
            memberId: currentUserId,
            courseId,
            teamId: String(mine.team_id),
            role: String(mine.role),
            displayName: String(mine.display_name ?? ''),
            cohort: String(mine.cohort ?? ''),
          }
        : null
    );
  }

  if (completions.data) {
    // Drop this course's keys then re-add (keeps other courses intact).
    for (const k of [...completionKeys]) {
      if (k.includes(`_${courseId}_completion_`)) completionKeys.delete(k);
    }
    completions.data.forEach((c) =>
      completionKeys.add(
        KEYS.completion(courseId, String(c.user_id), String(c.task_id), String(c.step_id))
      )
    );
  }

  if (deliverables.data) {
    deliverables.data.forEach((d) => {
      const tk = teamKey(courseId, String(d.team_id));
      const existing = docsByTeam.get(tk) ?? {};
      existing[String(d.deliverable_id)] = (d.data ?? { fields: {}, groups: {} }) as DeliverableData;
      docsByTeam.set(tk, existing);
    });
  }

  if (gates.data) {
    gates.data.forEach((g) =>
      gateByKey.set(KEYS.gate(courseId, String(g.team_id), Number(g.gate_id)), String(g.status))
    );
  }

  hydratedCourses.add(courseId);
  notifyStore();

  subscribeRealtime(courseId);
}

/** Live updates: any change to this course's tables re-hydrates the cache. */
function subscribeRealtime(courseId: string) {
  const supabase = getBrowserClient();
  if (!supabase || channels.has(courseId)) return;
  const channel = supabase
    .channel(`course:${courseId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'step_completions', filter: `course_id=eq.${courseId}` }, () => {
      void hydrateCourse(courseId);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'deliverables', filter: `course_id=eq.${courseId}` }, () => {
      void hydrateCourse(courseId);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'memberships', filter: `course_id=eq.${courseId}` }, () => {
      void hydrateCourse(courseId);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gate_status', filter: `course_id=eq.${courseId}` }, () => {
      void hydrateCourse(courseId);
    })
    .subscribe();
  channels.set(courseId, channel);
}

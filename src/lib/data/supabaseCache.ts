'use client';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { GrcData, Member, RosterEntry } from '../types';
import type { DeliverableData } from '../docs/types';
import type { EvidenceArtifact, LabAccessData, StepEvidence, UserCourseState } from './types';
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
const grcByTeam = new Map<string, GrcData>(); // `${courseId}::${teamId}`
// The next two are the CURRENT USER's rows only — RLS gives no one else's, and
// for lab_access that is deliberate (it holds credentials). Keyed by courseId
// alone because the user is implicit.
const labAccessByCourse = new Map<string, LabAccessData>();
const userStateByCourse = new Map<string, UserCourseState>();
// The evidence ledger — also current-user-only. Step records are keyed
// `${courseId}::${taskId}::${stepId}` so one flat map serves every course, which
// is what the cross-course dashboard and portfolio need.
const stepEvidenceByKey = new Map<string, StepEvidence>();
const artifactsByHash = new Map<string, EvidenceArtifact>(); // `${courseId}::${sha256}`
let chosenPath: { pathId: string; chosenAt: number } | null = null;

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
    grcByTeam.clear();
    labAccessByCourse.clear();
    userStateByCourse.clear();
    // The ledger holds one student's proof of work. Failing to clear it here
    // would show the next student on a shared classroom machine the previous
    // one's verified steps and evidence hashes.
    stepEvidenceByKey.clear();
    artifactsByHash.clear();
    chosenPath = null;
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
  grc(courseId: string, teamId: string): GrcData | null {
    return grcByTeam.get(teamKey(courseId, teamId)) ?? null;
  },
  setGrc(courseId: string, teamId: string, data: GrcData) {
    grcByTeam.set(teamKey(courseId, teamId), data);
  },
  labAccess(courseId: string): LabAccessData | null {
    return labAccessByCourse.get(courseId) ?? null;
  },
  setLabAccess(courseId: string, data: LabAccessData) {
    labAccessByCourse.set(courseId, data);
  },
  userState(courseId: string): UserCourseState | null {
    return userStateByCourse.get(courseId) ?? null;
  },
  setUserState(courseId: string, data: UserCourseState) {
    userStateByCourse.set(courseId, data);
  },
  stepEvidence(courseId: string): Record<string, StepEvidence> {
    const out: Record<string, StepEvidence> = {};
    stepEvidenceByKey.forEach((v, k) => {
      if (k.startsWith(`${courseId}::`)) out[`${v.taskId}::${v.stepId}`] = v;
    });
    return out;
  },
  setStepEvidence(evidence: StepEvidence) {
    stepEvidenceByKey.set(
      `${evidence.courseId}::${evidence.taskId}::${evidence.stepId}`,
      evidence
    );
  },
  artifacts(courseId: string): EvidenceArtifact[] {
    const out: EvidenceArtifact[] = [];
    artifactsByHash.forEach((v) => {
      if (v.courseId === courseId) out.push(v);
    });
    return out;
  },
  setArtifact(artifact: EvidenceArtifact) {
    artifactsByHash.set(`${artifact.courseId}::${artifact.sha256}`, artifact);
  },
  /** Drop one course's evidence — the optimistic half of `resetCourse`. */
  clearEvidence(courseId: string) {
    [...stepEvidenceByKey.keys()]
      .filter((k) => k.startsWith(`${courseId}::`))
      .forEach((k) => stepEvidenceByKey.delete(k));
    [...artifactsByHash.entries()]
      .filter(([, v]) => v.courseId === courseId)
      .forEach(([k]) => artifactsByHash.delete(k));
  },
  path(): { pathId: string; chosenAt: number } | null {
    return chosenPath;
  },
  setPath(next: { pathId: string; chosenAt: number } | null) {
    chosenPath = next;
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

  const [memberships, completions, deliverables, gates, grc, labAccess, userState, evidence, artifacts] =
    await Promise.all([
      supabase.from('memberships').select('*').eq('course_id', courseId),
      supabase.from('step_completions').select('*').eq('course_id', courseId),
      supabase.from('deliverables').select('*').eq('course_id', courseId),
      supabase.from('gate_status').select('*').eq('course_id', courseId),
      supabase.from('grc_registers').select('*').eq('course_id', courseId),
      // These two are single-row-per-user; RLS already restricts them to the
      // caller, so no user_id filter is needed (or would add anything).
      supabase.from('lab_access').select('*').eq('course_id', courseId).maybeSingle(),
      supabase.from('user_course_state').select('*').eq('course_id', courseId).maybeSingle(),
      // The ledger is owner-only but multi-row, so it takes a plain select — NOT
      // `.maybeSingle()`, which would error on the second row.
      supabase.from('step_evidence').select('*').eq('course_id', courseId),
      supabase.from('evidence_artifacts').select('*').eq('course_id', courseId),
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

  if (grc.data) {
    grc.data.forEach((g) => {
      grcByTeam.set(teamKey(courseId, String(g.team_id)), (g.data ?? {}) as GrcData);
    });
  }

  // `.maybeSingle()` yields null (not an error) when the student has no row yet,
  // which is the normal state before they first fill either panel.
  if (labAccess.data?.data) {
    labAccessByCourse.set(courseId, labAccess.data.data as LabAccessData);
  }
  if (userState.data?.data) {
    userStateByCourse.set(courseId, userState.data.data as UserCourseState);
  }

  if (evidence.data) evidence.data.forEach((r) => cache.setStepEvidence(stepEvidenceFromRow(r)));
  if (artifacts.data) artifacts.data.forEach((r) => cache.setArtifact(artifactFromRow(r)));

  hydratedCourses.add(courseId);
  notifyStore();

  subscribeRealtime(courseId);
}

function stepEvidenceFromRow(r: Record<string, unknown>): StepEvidence {
  return {
    courseId: String(r.course_id),
    taskId: String(r.task_id),
    stepId: String(r.step_id),
    verified: !!r.verified,
    method: (r.method as StepEvidence['method']) ?? 'self-attested',
    matchedTokens: Number(r.matched_tokens ?? 0),
    totalTokens: Number(r.total_tokens ?? 0),
    outputSha256: r.output_sha256 ? String(r.output_sha256) : undefined,
    attempts: Number(r.attempts ?? 0),
    firstAttemptAt: r.first_attempt_at ? Date.parse(String(r.first_attempt_at)) : undefined,
    verifiedAt: r.verified_at ? Date.parse(String(r.verified_at)) : undefined,
  };
}

function artifactFromRow(r: Record<string, unknown>): EvidenceArtifact {
  return {
    courseId: String(r.course_id),
    sha256: String(r.sha256),
    filename: String(r.filename ?? ''),
    sizeBytes: Number(r.size_bytes ?? 0),
    week: r.week == null ? undefined : Number(r.week),
    deliverableId: r.deliverable_id ? String(r.deliverable_id) : undefined,
    nameOk: !!r.name_ok,
    hashedAt: r.hashed_at ? Date.parse(String(r.hashed_at)) : 0,
  };
}

/**
 * Load the user's CROSS-COURSE data: every course they're enrolled in, all their
 * completions, the whole evidence ledger, and their chosen career path.
 *
 * `hydrateCourse` cannot serve the dashboard or the portfolio: every query in it
 * is filtered by one `course_id`, and `user_paths` has no `course_id` at all. The
 * dashboard lists all enrolled capstones at once, so it needs this instead —
 * without it, a signed-in student saw "no capstones yet" until they happened to
 * open a course page, which is the bug this fixes.
 *
 * No course filter is needed anywhere here: RLS already restricts every one of
 * these tables to the authenticated user's own rows.
 */
export async function hydrateUser(): Promise<void> {
  const supabase = getBrowserClient();
  if (!supabase || !currentUserId) return;

  const [memberships, completions, evidence, artifacts, path] = await Promise.all([
    supabase.from('memberships').select('*').eq('user_id', currentUserId),
    supabase.from('step_completions').select('*').eq('user_id', currentUserId),
    supabase.from('step_evidence').select('*'),
    supabase.from('evidence_artifacts').select('*'),
    supabase.from('user_paths').select('*').maybeSingle(),
  ]);

  if (memberships.data) {
    // Group by course so each course's roster entry and context land together.
    const byCourse = new Map<string, Record<string, unknown>[]>();
    memberships.data.forEach((m) => {
      const cid = String(m.course_id);
      byCourse.set(cid, [...(byCourse.get(cid) ?? []), m]);
    });
    byCourse.forEach((rows, cid) => {
      // Only this user's row is visible here (filtered by user_id), so merge into
      // any roster already hydrated by hydrateCourse rather than replacing it —
      // replacing would drop teammates a course page had already loaded.
      rows.forEach((m) => cache.upsertRosterEntry(cid, rosterFromRow(m)));
      const mine = rows.find((m) => String(m.user_id) === currentUserId);
      if (mine) {
        contextByCourse.set(cid, {
          memberId: currentUserId as string,
          courseId: cid,
          teamId: String(mine.team_id),
          role: String(mine.role),
          displayName: String(mine.display_name ?? ''),
          cohort: String(mine.cohort ?? ''),
        });
      }
    });
  }

  if (completions.data) {
    completions.data.forEach((c) =>
      completionKeys.add(
        KEYS.completion(
          String(c.course_id),
          String(c.user_id),
          String(c.task_id),
          String(c.step_id)
        )
      )
    );
  }

  if (evidence.data) evidence.data.forEach((r) => cache.setStepEvidence(stepEvidenceFromRow(r)));
  if (artifacts.data) artifacts.data.forEach((r) => cache.setArtifact(artifactFromRow(r)));

  chosenPath = path.data
    ? {
        pathId: String(path.data.path_id),
        chosenAt: path.data.chosen_at ? Date.parse(String(path.data.chosen_at)) : 0,
      }
    : null;

  notifyStore();
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
    // GRC registers are team-shared, so a teammate's edit must reach this client.
    // lab_access and user_course_state are single-user and deliberately NOT
    // subscribed — there is no second party to notify, and putting credentials on
    // a realtime channel would be a cost with no benefit.
    .on('postgres_changes', { event: '*', schema: 'public', table: 'grc_registers', filter: `course_id=eq.${courseId}` }, () => {
      void hydrateCourse(courseId);
    })
    .subscribe();
  channels.set(courseId, channel);
}

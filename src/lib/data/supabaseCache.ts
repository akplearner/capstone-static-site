'use client';

import { asReportStatus } from '../reportKinds';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Member, RosterEntry } from '../types';
import type { DeliverableData } from '../docs/types';
import type { CourseDto } from '../content/dto';
import { FIX_SCHEMA, NO_FIXES, asFixChange, sortedFixes, type ContentFix, type FixChange, type FixKind } from '../contentFix';
import type {
  DeliverableStatus,
  EvidenceArtifact,
  LabAccessData,
  StepEvidence,
  UserCourseState,
  DeliverableReview,
  Cohort,
  StepNote,
  StuckFlag,
  TaskReport,
  DeliverableSubmission,
  PeerReviewRow,
  SubmissionSnapshot,
  VerificationReceipt,
  RehashCheck,
} from './types';
import { getBrowserClient } from '../supabase/client';
import { notifyStore } from '../useClientStore';
import { asEarnedRow, earnedKey, mergeLedger, type EarnedRow } from '../earnedSkills';
import { KEYS } from './keys';
import { isMissingSchema } from './schemaErrors';
import { PAGE_ROWS } from './selectAll';

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
// The next two are the CURRENT USER's rows only — RLS gives no one else's, and
// for lab_access that is deliberate (it holds credentials). Keyed by courseId
// alone because the user is implicit.
const labAccessByCourse = new Map<string, LabAccessData>();
const userStateByCourse = new Map<string, UserCourseState>();
// The evidence ledger. Step records are keyed
// `${userId}::${courseId}::${taskId}::${stepId}` so one flat map serves every
// course (the cross-course dashboard and portfolio) AND every teammate: since
// 0006 RLS returns the team's rows too, because a task's gem is derived from
// them. The user is part of the key so two students' records never merge —
// an instructor's hydrate sees the whole class.
const stepEvidenceByKey = new Map<string, StepEvidence>();
const artifactsByHash = new Map<string, EvidenceArtifact>(); // `${courseId}::${sha256}`
let chosenPath: { pathId: string; chosenAt: number } | null = null;
// R68. Reviews are team-scoped like docs; a cohort is one row per (course,
// cohort); notes are the caller's own (RLS); flags are everyone's on the course.
const reviewsByTeam = new Map<string, DeliverableReview[]>(); // `${courseId}::${teamId}`
const cohortsByKey = new Map<string, Cohort>(); // `${courseId}::${cohort}`
const stepNotesByKey = new Map<string, StepNote>(); // `${courseId}::${taskId}::${stepId}`
const stuckByCourse = new Map<string, StuckFlag[]>();
// R83: task issue reports — own + team rows (instructor: everyone's).
const taskReportsByCourse = new Map<string, TaskReport[]>();
// R84: the team's frozen submissions, and the anonymous verdict rows on them.
const submissionsByTeam = new Map<string, DeliverableSubmission[]>(); // `${courseId}::${teamId}`
const peerReviewsByCourse = new Map<string, PeerReviewRow[]>();
// R103: the team's document lifecycle transitions, append-only.
const docStatusByTeam = new Map<string, DeliverableStatus[]>(); // `${courseId}::${teamId}`
// R113: the platform's verification receipts (the member's own and, per 0014,
// teammates') and the member's re-hash checks. Keyed with the user, like the
// ledger, so an instructor's hydrate never merges two members. Receipts are
// append-only on the server, so hydrates merge them and never drop one.
// `receiptCourses` (and `receiptsEverywhere`, after the cross-course hydrate)
// record that the receipts table answered at all: a project that has not run
// 0014 yet reads "no receipt possible" (null), never zero.
const receiptsByKey = new Map<string, VerificationReceipt>(); // `${userId}::${courseId}::${taskId}::${stepId}`
const receiptCourses = new Set<string>();
// R125: the signed-in member's earned-skills ledger (lib/earnedSkills.ts). `earnedMissing` is set when
// the database has no table for it yet (0019 not applied): the repo keeps the ledger on this device then.
const earnedByKey = new Map<string, EarnedRow>();
let earnedMissing = false;
let receiptsEverywhere = false;
const rehashesByKey = new Map<string, RehashCheck[]>(); // `${userId}::${courseId}`

// R78-D: the course documents an instructor authored in the cloud — course
// CONTENT, not student state, so it is not the current user's and is not
// cleared on sign-out. `version` lets the course repo memoise its catalogue.
const courseDocumentsById = new Map<string, CourseDto>();
let courseDocumentsVersion = 0;
// R121: the content fix ledger, per course — content too, so it is neither the current user's nor
// cleared on sign-out. Each course's list is replaced, never mutated, so a derived course can be
// cached on the array's identity; `version` lets the course repo memoise its catalogue.
const contentFixesByCourse = new Map<string, readonly ContentFix[]>();
let contentFixesVersion = 0;

const hydratedCourses = new Set<string>();
// R117: courses whose FIRST hydrate failed on the membership query. "Not enrolled"
// would be a lie there (offline, an expired token), so the UI says the load failed.
const failedCourses = new Set<string>();
const channels = new Map<string, RealtimeChannel>();

// R82 — three small pieces of hydrate discipline:
// a hydrate is 13 queries, so realtime events coalesce through a debounce; a
// slow hydrate must not apply over a newer one (generation counter); and a
// hydrate must not put the server's older row back over a form upsert that is
// still in flight (pending doc keys, set by supabaseDocsRepo).
const hydrateGen = new Map<string, number>();
const hydrateTimers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingDocs = new Set<string>();

export function markDocPending(courseId: string, teamId: string, deliverableId: string) {
  pendingDocs.add(`${courseId}::${teamId}::${deliverableId}`);
}
export function clearDocPending(courseId: string, teamId: string, deliverableId: string) {
  pendingDocs.delete(`${courseId}::${teamId}::${deliverableId}`);
}

/** True once `hydrateCourse` has applied at least once for this course. */
export function isCourseHydrated(courseId: string): boolean {
  return hydratedCourses.has(courseId);
}

/** True when the first load of this course failed, so who the member is could not be read. */
export function courseHydrateFailed(courseId: string): boolean {
  return failedCourses.has(courseId);
}

/** Debounced hydrate — what every realtime event goes through. */
export function scheduleHydrate(courseId: string, delayMs = 400): void {
  const t = hydrateTimers.get(courseId);
  if (t) clearTimeout(t);
  hydrateTimers.set(
    courseId,
    setTimeout(() => {
      hydrateTimers.delete(courseId);
      void hydrateCourse(courseId);
    }, delayMs)
  );
}

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
    labAccessByCourse.clear();
    userStateByCourse.clear();
    // The ledger holds one student's proof of work. Failing to clear it here
    // would show the next student on a shared classroom machine the previous
    // one's verified steps and evidence hashes.
    stepEvidenceByKey.clear();
    artifactsByHash.clear();
    chosenPath = null;
    hydratedCourses.clear();
    failedCourses.clear();
    channels.forEach((ch) => ch.unsubscribe());
    channels.clear();
    reviewsByTeam.clear();
    cohortsByKey.clear();
    stepNotesByKey.clear();
    stuckByCourse.clear();
    taskReportsByCourse.clear();
    submissionsByTeam.clear();
    peerReviewsByCourse.clear();
    docStatusByTeam.clear();
    receiptsByKey.clear();
    receiptCourses.clear();
    receiptsEverywhere = false;
    rehashesByKey.clear();
    earnedByKey.clear();
    earnedMissing = false;
    notifyStore();
  }
}

export function getCurrentUserId() {
  return currentUserId;
}

// ---- synchronous reads used by the repos ----------------------------------

export const cache = {
  completionKeys,
  /** R125: the member's earned rows, for one course or all. */
  earned(courseId?: string): EarnedRow[] {
    const all = [...earnedByKey.values()];
    return courseId ? all.filter((e) => e.courseId === courseId) : all;
  },
  /** R125: add and raise, never lower: what the database holds and what this device banked both stand. */
  setEarned(rows: readonly EarnedRow[]) {
    for (const r of mergeLedger([...earnedByKey.values()], rows).changed) earnedByKey.set(earnedKey(r), r);
  },
  earnedMissing: () => earnedMissing,
  markEarnedMissing(missing = true) {
    earnedMissing = missing;
  },
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
  stepEvidence(courseId: string, userId: string): Record<string, StepEvidence> {
    const out: Record<string, StepEvidence> = {};
    const prefix = `${userId}::${courseId}::`;
    stepEvidenceByKey.forEach((v, k) => {
      if (k.startsWith(prefix)) out[`${v.taskId}::${v.stepId}`] = v;
    });
    return out;
  },
  setStepEvidence(evidence: StepEvidence, userId: string) {
    stepEvidenceByKey.set(
      `${userId}::${evidence.courseId}::${evidence.taskId}::${evidence.stepId}`,
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
  /** R113: one member's receipts for a course, keyed `${taskId}::${stepId}`; null until the table has answered. */
  receipts(courseId: string, userId: string): Record<string, VerificationReceipt> | null {
    if (!receiptsEverywhere && !receiptCourses.has(courseId)) return null;
    const out: Record<string, VerificationReceipt> = {};
    const prefix = `${userId}::${courseId}::`;
    receiptsByKey.forEach((v, k) => {
      if (k.startsWith(prefix)) out[`${v.taskId}::${v.stepId}`] = v;
    });
    return out;
  },
  /** Keeps the latest receipt per step; a receipt proves the table exists. */
  setReceipt(receipt: VerificationReceipt, userId: string) {
    const k = `${userId}::${receipt.courseId}::${receipt.taskId}::${receipt.stepId}`;
    const prev = receiptsByKey.get(k);
    if (!prev || prev.receiptedAt <= receipt.receiptedAt) receiptsByKey.set(k, receipt);
    receiptCourses.add(receipt.courseId);
  },
  rehashes(courseId: string, userId: string): RehashCheck[] {
    return rehashesByKey.get(`${userId}::${courseId}`) ?? [];
  },
  addRehash(check: RehashCheck, userId: string) {
    const k = `${userId}::${check.courseId}`;
    rehashesByKey.set(k, [...(rehashesByKey.get(k) ?? []), check].sort((a, b) => a.checkedAt - b.checkedAt));
  },
  /** Drop the current user's evidence for one course — the optimistic half of
   *  `resetCourse`. Teammates' records stay: they are theirs. */
  clearEvidence(courseId: string) {
    [...stepEvidenceByKey.keys()]
      .filter((k) => k.startsWith(`${currentUserId}::${courseId}::`))
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
  reviews(courseId: string, teamId: string): DeliverableReview[] {
    return reviewsByTeam.get(teamKey(courseId, teamId)) ?? [];
  },
  setReview(review: DeliverableReview) {
    const k = teamKey(review.courseId, review.teamId);
    const next = (reviewsByTeam.get(k) ?? []).filter((r) => !(r.deliverableId === review.deliverableId && r.week === review.week));
    next.push(review);
    reviewsByTeam.set(k, next);
  },
  cohort(courseId: string, cohort: string): Cohort | null {
    return cohortsByKey.get(`${courseId}::${cohort}`) ?? null;
  },
  setCohort(c: Cohort) {
    cohortsByKey.set(`${c.courseId}::${c.cohort}`, c);
  },
  stepNotes(courseId: string): Record<string, StepNote> {
    const out: Record<string, StepNote> = {};
    stepNotesByKey.forEach((v, k) => {
      if (k.startsWith(`${courseId}::`)) out[`${v.taskId}::${v.stepId}`] = v;
    });
    return out;
  },
  setStepNote(note: StepNote) {
    stepNotesByKey.set(`${note.courseId}::${note.taskId}::${note.stepId}`, note);
    // The caller's own flag shows in the team view immediately.
    if (currentUserId) {
      const me = currentUserId;
      const flags = (stuckByCourse.get(note.courseId) ?? []).filter(
        (f) => !(f.memberId === me && f.taskId === note.taskId && f.stepId === note.stepId)
      );
      if (note.stuck) flags.push({ memberId: me, taskId: note.taskId, stepId: note.stepId, at: note.at });
      stuckByCourse.set(note.courseId, flags);
    }
  },
  stuckFlags(courseId: string): StuckFlag[] {
    return stuckByCourse.get(courseId) ?? [];
  },
  taskReports(courseId: string): TaskReport[] {
    return taskReportsByCourse.get(courseId) ?? [];
  },
  setTaskReport(report: TaskReport) {
    const list = (taskReportsByCourse.get(report.courseId) ?? []).filter((r) => r.id !== report.id);
    list.push(report);
    taskReportsByCourse.set(report.courseId, list);
  },
  updateTaskReport(courseId: string, id: string, patch: Partial<TaskReport>) {
    taskReportsByCourse.set(
      courseId,
      (taskReportsByCourse.get(courseId) ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  },
  submissions(courseId: string, teamId: string): DeliverableSubmission[] {
    return submissionsByTeam.get(teamKey(courseId, teamId)) ?? [];
  },
  setSubmission(sub: DeliverableSubmission) {
    const tk = teamKey(sub.courseId, sub.teamId);
    const list = (submissionsByTeam.get(tk) ?? []).filter((s) => s.id !== sub.id);
    list.push(sub);
    list.sort((a, b) => a.at - b.at);
    submissionsByTeam.set(tk, list);
  },
  peerReviews(courseId: string): PeerReviewRow[] {
    return peerReviewsByCourse.get(courseId) ?? [];
  },
  docStatus(courseId: string, teamId: string): DeliverableStatus[] {
    return docStatusByTeam.get(teamKey(courseId, teamId)) ?? [];
  },
  setDocStatus(row: DeliverableStatus) {
    const tk = teamKey(row.courseId, row.teamId);
    const list = (docStatusByTeam.get(tk) ?? []).filter((r) => !(r.deliverableId === row.deliverableId && r.at === row.at && r.changedBy === row.changedBy));
    list.push(row);
    list.sort((a, b) => a.at - b.at);
    docStatusByTeam.set(tk, list);
  },
  clearStepNotes(courseId: string) {
    [...stepNotesByKey.keys()].filter((k) => k.startsWith(`${courseId}::`)).forEach((k) => stepNotesByKey.delete(k));
    if (currentUserId) {
      const me = currentUserId;
      stuckByCourse.set(courseId, (stuckByCourse.get(courseId) ?? []).filter((f) => f.memberId !== me));
    }
  },
  upsertRosterEntry(courseId: string, entry: RosterEntry) {
    const list = (rosterByCourse.get(courseId) ?? []).filter((e) => e.memberId !== entry.memberId);
    list.push(entry);
    rosterByCourse.set(courseId, list);
  },
  removeRosterEntry(courseId: string, memberId: string) {
    rosterByCourse.set(courseId, (rosterByCourse.get(courseId) ?? []).filter((e) => e.memberId !== memberId));
  },
  courseDocuments(): CourseDto[] {
    return [...courseDocumentsById.values()];
  },
  courseDocument(courseId: string): CourseDto | undefined {
    return courseDocumentsById.get(courseId);
  },
  courseDocumentsVersion(): number {
    return courseDocumentsVersion;
  },
  setCourseDocument(doc: CourseDto) {
    courseDocumentsById.set(doc.course.id, doc);
    courseDocumentsVersion++;
  },
  deleteCourseDocument(courseId: string) {
    if (courseDocumentsById.delete(courseId)) courseDocumentsVersion++;
  },
  contentFixes(courseId: string): readonly ContentFix[] {
    return contentFixesByCourse.get(courseId) ?? NO_FIXES;
  },
  contentFixesVersion(): number {
    return contentFixesVersion;
  },
  /** Replace one course's ledger with what the server holds. Unchanged lists keep their identity. */
  setContentFixes(courseId: string, list: readonly ContentFix[]) {
    const prev = contentFixesByCourse.get(courseId) ?? NO_FIXES;
    const next = list.length === 0 ? NO_FIXES : sortedFixes(list);
    if (prev.length === next.length && prev.every((f, i) => f.id === next[i].id)) return;
    contentFixesByCourse.set(courseId, next);
    contentFixesVersion++;
  },
  /** An entry the caller just wrote: merged by revision, so a later hydrate that holds it too changes nothing. */
  addContentFix(fix: ContentFix) {
    const prev = contentFixesByCourse.get(fix.courseId) ?? NO_FIXES;
    this.setContentFixes(fix.courseId, [...prev.filter((f) => f.id !== fix.id && f.revision !== fix.revision), fix]);
  },
};

/**
 * The authored course documents. The course repo kicks this once, on the first
 * catalogue read, signed in or not (RLS decides what comes back); it merges,
 * so an optimistic save that landed first is not wiped. A row that is not a
 * document is skipped loudly rather than taking the catalogue down.
 */
export async function hydrateCourseDocuments(): Promise<void> {
  const supabase = getBrowserClient();
  if (!supabase) return;
  const { data, error } = await supabase.from('course_documents').select('course_id, doc');
  if (error) {
    console.error('[content] course_documents load failed:', error.message);
    return;
  }
  (data ?? []).forEach((row) => {
    const doc = row.doc as CourseDto | null;
    if (!doc || typeof doc !== 'object' || !doc.course || doc.course.id !== row.course_id) {
      console.error(`[content] course_documents row '${String(row.course_id)}' is not a document`);
      return;
    }
    courseDocumentsById.set(String(row.course_id), doc);
  });
  courseDocumentsVersion++;
  notifyStore();
}

/**
 * The content fix ledger of every course (R121). The course repo kicks it with the course documents
 * and the issues page asks for it before it offers a fix: students need it to read the corrected
 * text, the admin to read the ledger. A database that has not had migration 0017 has no table, which
 * is `needsUpdate` and an empty ledger, never an error on a page a student is reading.
 */
export async function hydrateContentFixes(): Promise<{ ok: boolean; needsUpdate: boolean }> {
  const supabase = getBrowserClient();
  if (!supabase) return { ok: false, needsUpdate: false };
  try {
    const rows: Record<string, unknown>[] = [];
    for (let from = 0; ; from += PAGE_ROWS) {
      const { data, error } = await supabase
        .from('content_fixes')
        .select('*')
        .order('course_id')
        .order('revision')
        .range(from, from + PAGE_ROWS - 1);
      if (error) {
        const needsUpdate = isMissingSchema(error);
        if (!needsUpdate) console.error('[content] content_fixes load failed:', error.message);
        return { ok: false, needsUpdate };
      }
      rows.push(...(data ?? []));
      if (!data || data.length < PAGE_ROWS) break;
    }
    const byCourse = new Map<string, ContentFix[]>();
    for (const r of rows) {
      const fix = contentFixFromRow(r);
      byCourse.set(fix.courseId, [...(byCourse.get(fix.courseId) ?? []), fix]);
    }
    const before = contentFixesVersion;
    byCourse.forEach((list, courseId) => cache.setContentFixes(courseId, list));
    if (contentFixesVersion !== before) notifyStore();
    return { ok: true, needsUpdate: false };
  } catch (e) {
    // A kick that nobody awaits: it must never become an unhandled rejection on a student's page.
    console.error('[content] content_fixes load failed:', e);
    return { ok: false, needsUpdate: false };
  }
}

/**
 * R125: the member's earned-skills ledger, one course or all of them. Never throws: a kick nobody
 * awaits must not become an unhandled rejection on a page a member is reading, and a database that
 * has not had 0019 yet is `earnedMissing` (the repo keeps the ledger on this device), not an error.
 */
export async function hydrateEarned(courseId?: string): Promise<void> {
  const supabase = getBrowserClient();
  if (!supabase || !currentUserId) return;
  try {
    const rows: Record<string, unknown>[] = [];
    for (let from = 0; ; from += PAGE_ROWS) {
      let q = supabase.from('earned_skills').select('*').eq('user_id', currentUserId);
      if (courseId) q = q.eq('course_id', courseId);
      const { data, error } = await q.range(from, from + PAGE_ROWS - 1);
      if (error) {
        if (isMissingSchema(error)) earnedMissing = true;
        else console.error('[earned] earned_skills load failed:', error.message);
        return;
      }
      rows.push(...(data ?? []));
      if (!data || data.length < PAGE_ROWS) break;
    }
    earnedMissing = false;
    cache.setEarned(rows.map(earnedFromRow).filter((r): r is EarnedRow => r !== null));
  } catch (e) {
    console.error('[earned] earned_skills load failed:', e);
  }
}

/** A database row as a ledger row: the stamps are the database's clock, read as milliseconds. */
export function earnedFromRow(r: Record<string, unknown>): EarnedRow | null {
  const ms = (v: unknown) => (typeof v === 'string' ? Date.parse(v) || 0 : 0);
  return asEarnedRow({ dimension: r.dimension, id: r.skill_id, courseId: r.course_id, level: r.level, firstAt: ms(r.first_at), levelAt: ms(r.level_at), via: r.via });
}

export function contentFixFromRow(r: Record<string, unknown>): ContentFix {
  const kind: FixKind = r.kind === 'revert' || r.kind === 'fold' ? r.kind : 'fix';
  const nums = (v: unknown) => (Array.isArray(v) ? v.map(Number).filter((n) => Number.isInteger(n)) : []);
  const reverts = Number(r.reverts);
  return {
    schema: FIX_SCHEMA,
    id: String(r.id),
    courseId: String(r.course_id),
    revision: Number(r.revision),
    kind,
    summary: String(r.summary ?? ''),
    changes: (Array.isArray(r.changes) ? r.changes : []).map(asFixChange).filter((c): c is FixChange => c !== null),
    issueIds: Array.isArray(r.issue_ids) ? r.issue_ids.map(String) : [],
    reverts: r.reverts == null || !Number.isInteger(reverts) ? null : reverts,
    folds: nums(r.folds),
    foldedIn: String(r.folded_in ?? ''),
    docVersion: Number(r.doc_version) > 0 ? Number(r.doc_version) : 1,
    by: String(r.author_name ?? ''),
    at: r.created_at ? new Date(String(r.created_at)).toISOString() : '',
  };
}

// ---- hydration -------------------------------------------------------------

export function rosterFromRow(r: Record<string, unknown>, avatarUrl?: string): RosterEntry {
  return {
    memberId: String(r.user_id),
    teamId: String(r.team_id),
    role: String(r.role),
    displayName: String(r.display_name ?? ''),
    cohort: String(r.cohort ?? ''),
    joinedAt: r.joined_at ? Date.parse(String(r.joined_at)) : 0,
    ...(avatarUrl ? { avatarUrl } : {}),
  };
}

/** Load the user's + teammates' data for a course into the cache. Idempotent. */
export async function hydrateCourse(courseId: string): Promise<void> {
  const supabase = getBrowserClient();
  if (!supabase || !currentUserId) return;
  const gen = (hydrateGen.get(courseId) ?? 0) + 1;
  hydrateGen.set(courseId, gen);

  const [memberships, completions, deliverables, gates, labAccess, userState, evidence, artifacts, reviews, cohorts, notes, flags, profiles, reports, submissions, peerReviews, docStatus, receipts, rehashes, fixes] =
    await Promise.all([
      supabase.from('memberships').select('*').eq('course_id', courseId),
      supabase.from('step_completions').select('*').eq('course_id', courseId),
      supabase.from('deliverables').select('*').eq('course_id', courseId),
      supabase.from('gate_status').select('*').eq('course_id', courseId),
      // These two are single-row-per-user; RLS already restricts them to the
      // caller, so no user_id filter is needed (or would add anything).
      supabase.from('lab_access').select('*').eq('course_id', courseId).maybeSingle(),
      supabase.from('user_course_state').select('*').eq('course_id', courseId).maybeSingle(),
      // The ledger is owner-only but multi-row, so it takes a plain select — NOT
      // `.maybeSingle()`, which would error on the second row.
      supabase.from('step_evidence').select('*').eq('course_id', courseId),
      supabase.from('evidence_artifacts').select('*').eq('course_id', courseId),
      // R68. Reviews and flags are team-readable (RLS scopes them); notes are
      // owner-only; cohorts are readable by anyone signed in.
      supabase.from('deliverable_reviews').select('*').eq('course_id', courseId),
      supabase.from('cohorts').select('*').eq('course_id', courseId),
      supabase.from('step_notes').select('*').eq('course_id', courseId),
      supabase.from('step_flags').select('*').eq('course_id', courseId).eq('stuck', true),
      // R81: teammates' pictures. RLS returns the caller's own profile and the
      // profiles of people who share a team with them, on any course.
      supabase.from('profiles').select('id, avatar_url'),
      // R83: the team's task reports (instructor: the course's).
      supabase.from('task_reports').select('*').eq('course_id', courseId),
      // R84: the team's frozen submissions (instructor: the course's), and the
      // anonymous verdict rows on them. peer_reviews has no course_id of its
      // own — deliberately, it must never say more than "this submission,
      // confirmed or not" — so the course filter rides the embedded join.
      supabase.from('deliverable_submissions').select('*').eq('course_id', courseId),
      supabase.from('peer_reviews').select('*, deliverable_submissions!inner(course_id)').eq('deliverable_submissions.course_id', courseId),
      // R103: the team's lifecycle transitions (instructor: the course's).
      supabase.from('deliverable_status').select('*').eq('course_id', courseId),
      // R113: receipts (own and teammates'; instructor: the course's) and
      // re-hash checks (own; instructor: the course's). Never the stamps:
      // nobody but the platform reads those.
      supabase.from('verification_receipts').select('course_id, user_id, task_id, step_id, output_sha256, receipted_at').eq('course_id', courseId),
      supabase.from('rehash_checks').select('*').eq('course_id', courseId),
      // R121: the course's content fixes, so the page never paints the old words first. A database
      // without 0017 answers with an error here, which reads as no fixes.
      supabase.from('content_fixes').select('*').eq('course_id', courseId).order('revision'),
    ]);

  // A newer hydrate started while this one was on the wire: its data is
  // fresher, let it apply instead.
  if (hydrateGen.get(courseId) !== gen) return;

  // R117: the membership query says whether this person is enrolled. If it failed
  // before the course was ever loaded, do not mark the course loaded with nobody in
  // it (an enrolled student would see the Join panel, and joining again overwrites
  // their team and role): record the failure so the page offers a retry. A failed
  // refresh of a course already loaded keeps what the cache holds.
  if (memberships.error) {
    if (!hydratedCourses.has(courseId)) {
      failedCourses.add(courseId);
      notifyStore();
    }
    return;
  }
  failedCourses.delete(courseId);

  if (memberships.data) {
    const avatars = new Map<string, string>();
    (profiles.data ?? []).forEach((p) => {
      if (p.avatar_url) avatars.set(String(p.id), String(p.avatar_url));
    });
    const list = memberships.data.map((m) => rosterFromRow(m, avatars.get(String(m.user_id))));
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
      // An upsert for this row is still in flight from this tab: the local
      // copy is newer than whatever the server just returned.
      if (pendingDocs.has(`${courseId}::${String(d.team_id)}::${String(d.deliverable_id)}`)) return;
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

  // `.maybeSingle()` yields null (not an error) when the student has no row yet,
  // which is the normal state before they first fill either panel.
  if (labAccess.data?.data) {
    labAccessByCourse.set(courseId, labAccess.data.data as LabAccessData);
  }
  if (userState.data?.data) {
    userStateByCourse.set(courseId, userState.data.data as UserCourseState);
  }

  if (evidence.data) evidence.data.forEach((r) => cache.setStepEvidence(stepEvidenceFromRow(r), String(r.user_id)));
  if (artifacts.data) artifacts.data.forEach((r) => cache.setArtifact(artifactFromRow(r)));

  if (reviews.data) {
    [...reviewsByTeam.keys()].filter((k) => k.startsWith(`${courseId}::`)).forEach((k) => reviewsByTeam.delete(k));
    reviews.data.forEach((r) => cache.setReview(reviewFromRow(r)));
  }
  if (cohorts.data) cohorts.data.forEach((r) => cache.setCohort({ courseId, cohort: String(r.cohort), startsOn: String(r.starts_on) }));
  if (notes.data) {
    // The text from its own table; the flag is folded in from step_flags below.
    notes.data.forEach((r) => {
      const k = `${courseId}::${String(r.task_id)}::${String(r.step_id)}`;
      const prev = stepNotesByKey.get(k);
      stepNotesByKey.set(k, { courseId, taskId: String(r.task_id), stepId: String(r.step_id), note: String(r.note ?? ''), stuck: prev?.stuck ?? false, at: r.updated_at ? Date.parse(String(r.updated_at)) : 0 });
    });
  }
  if (flags.data) {
    stuckByCourse.set(
      courseId,
      flags.data.map((r) => ({ memberId: String(r.user_id), taskId: String(r.task_id), stepId: String(r.step_id), at: r.updated_at ? Date.parse(String(r.updated_at)) : 0 }))
    );
    flags.data.forEach((r) => {
      if (String(r.user_id) !== currentUserId) return;
      const k = `${courseId}::${String(r.task_id)}::${String(r.step_id)}`;
      const prev = stepNotesByKey.get(k);
      stepNotesByKey.set(k, { courseId, taskId: String(r.task_id), stepId: String(r.step_id), note: prev?.note ?? '', stuck: true, at: prev?.at ?? (r.updated_at ? Date.parse(String(r.updated_at)) : 0) });
    });
  }

  if (reports.data) {
    taskReportsByCourse.set(courseId, reports.data.map(taskReportFromRow));
  }

  if (submissions.data) {
    [...submissionsByTeam.keys()].filter((k) => k.startsWith(`${courseId}::`)).forEach((k) => submissionsByTeam.delete(k));
    submissions.data.forEach((r) => cache.setSubmission(submissionFromRow(r)));
  }
  if (peerReviews.data) {
    peerReviewsByCourse.set(courseId, peerReviews.data.map(peerReviewFromRow));
  }
  if (docStatus.data) {
    [...docStatusByTeam.keys()].filter((k) => k.startsWith(`${courseId}::`)).forEach((k) => docStatusByTeam.delete(k));
    docStatus.data.forEach((r) => cache.setDocStatus(docStatusFromRow(r)));
  }
  if (receipts.data) {
    receipts.data.forEach((r) => cache.setReceipt(receiptFromRow(r), String(r.user_id)));
    receiptCourses.add(courseId);
  }
  if (rehashes.data) {
    [...rehashesByKey.keys()].filter((k) => k.endsWith(`::${courseId}`)).forEach((k) => rehashesByKey.delete(k));
    rehashes.data.forEach((r) => cache.addRehash(rehashFromRow(r), String(r.user_id)));
  }

  if (fixes.data) cache.setContentFixes(courseId, fixes.data.map(contentFixFromRow));
  await hydrateEarned(courseId);

  hydratedCourses.add(courseId);
  notifyStore();

  // Anything the outbox still owes from a failed form save goes now, while we
  // know the backend is reachable (the 13 selects above just succeeded).
  void import('./outbox').then((m) => m.flushDeliverableOutbox());

  subscribeRealtime(courseId);
}

export function reviewFromRow(r: Record<string, unknown>): DeliverableReview {
  return {
    courseId: String(r.course_id),
    teamId: String(r.team_id),
    deliverableId: String(r.deliverable_id),
    week: Number(r.week ?? 0),
    status: (r.status as DeliverableReview['status']) ?? 'pending',
    comment: String(r.comment ?? ''),
    reviewer: String(r.reviewer ?? ''),
    at: r.reviewed_at ? Date.parse(String(r.reviewed_at)) : 0,
  };
}

export function taskReportFromRow(r: Record<string, unknown>): TaskReport {
  const text = (v: unknown) => (v == null || v === '' ? undefined : String(v));
  const num = (v: unknown) => (v == null || v === '' ? undefined : Number(v));
  const when = (v: unknown) => (v ? Date.parse(String(v)) : undefined);
  return {
    id: String(r.id),
    courseId: String(r.course_id),
    taskId: String(r.task_id),
    teamId: String(r.team_id ?? ''),
    memberId: String(r.user_id),
    kind: (r.kind as TaskReport['kind']) ?? 'question',
    note: String(r.note ?? ''),
    status: asReportStatus(r.status),
    at: r.created_at ? Date.parse(String(r.created_at)) : 0,
    // R120: every field below is absent on a report filed before 0016.
    stepId: text(r.step_id),
    week: num(r.week),
    reporterName: text(r.reporter_name),
    reporterRole: text(r.reporter_role),
    contentVersion: text(r.content_version),
    resolutionNote: text(r.resolution_note),
    resolvedAt: when(r.resolved_at),
    resolvedBy: text(r.resolved_by),
    fixRevision: num(r.fix_revision),
  };
}

export function submissionFromRow(r: Record<string, unknown>): DeliverableSubmission {
  return {
    id: String(r.id),
    courseId: String(r.course_id),
    teamId: String(r.team_id),
    deliverableId: String(r.deliverable_id),
    week: Number(r.week ?? 0),
    version: Number(r.version ?? 1),
    submittedBy: String(r.submitted_by ?? ''),
    contentSha256: String(r.content_sha256 ?? ''),
    snapshot: (r.snapshot ?? { deliverableId: String(r.deliverable_id), week: Number(r.week ?? 0), data: { fields: {}, groups: {} }, categories: { completeness: false, correctness: false, authenticity: false, consistency: false }, checks: [] }) as SubmissionSnapshot,
    at: r.created_at ? Date.parse(String(r.created_at)) : 0,
  };
}

export function docStatusFromRow(r: Record<string, unknown>): DeliverableStatus {
  return {
    courseId: String(r.course_id),
    teamId: String(r.team_id),
    deliverableId: String(r.deliverable_id),
    status: (r.status as DeliverableStatus['status']) ?? 'draft',
    changedBy: String(r.changed_by ?? ''),
    role: String(r.role ?? ''),
    at: r.created_at ? Date.parse(String(r.created_at)) : 0,
    note: r.note ? String(r.note) : undefined,
    version: Number(r.version ?? 0),
  };
}

export function peerReviewFromRow(r: Record<string, unknown>): PeerReviewRow {
  return {
    assignmentId: String(r.assignment_id),
    submissionId: String(r.submission_id),
    answers: (r.answers ?? {}) as Record<string, boolean>,
    confirm: !!r.confirm,
    at: r.created_at ? Date.parse(String(r.created_at)) : 0,
  };
}

export function stepEvidenceFromRow(r: Record<string, unknown>): StepEvidence {
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

export function artifactFromRow(r: Record<string, unknown>): EvidenceArtifact {
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

export function receiptFromRow(r: Record<string, unknown>): VerificationReceipt {
  return {
    courseId: String(r.course_id),
    taskId: String(r.task_id),
    stepId: String(r.step_id),
    outputSha256: String(r.output_sha256 ?? ''),
    receiptedAt: r.receipted_at ? Date.parse(String(r.receipted_at)) : 0,
  };
}

export function rehashFromRow(r: Record<string, unknown>): RehashCheck {
  return {
    courseId: String(r.course_id),
    sha256: String(r.sha256),
    filename: String(r.filename ?? ''),
    ok: !!r.ok,
    checkedAt: r.checked_at ? Date.parse(String(r.checked_at)) : 0,
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

  const [memberships, completions, evidence, artifacts, path, docStatus, submissions, reports, notes, reviews, receipts, rehashes] = await Promise.all([
    supabase.from('memberships').select('*').eq('user_id', currentUserId),
    supabase.from('step_completions').select('*').eq('user_id', currentUserId),
    supabase.from('step_evidence').select('*'),
    supabase.from('evidence_artifacts').select('*'),
    supabase.from('user_paths').select('*').maybeSingle(),
    // R107: the member profile on the dashboard and the portfolio reads the
    // team's lifecycle rows and frozen submissions (the rubric verdicts only,
    // not the frozen form), the member's task reports and step notes. RLS
    // scopes every one of them exactly as hydrateCourse's selects are scoped;
    // lab_access and user_course_state stay course-page facts.
    supabase.from('deliverable_status').select('*'),
    supabase.from('deliverable_submissions').select('id, course_id, team_id, deliverable_id, week, version, submitted_by, content_sha256, created_at, categories:snapshot->categories'),
    supabase.from('task_reports').select('*'),
    supabase.from('step_notes').select('*'),
    // R108: the instructor's verdicts, so the board's "instructor approved" tile reads on the dashboard too (0004 scopes it to the member's teams).
    supabase.from('deliverable_reviews').select('*'),
    // R113: the member's own receipts and re-hash checks, every course (an
    // instructor's RLS would return everyone's, so both filter by the user).
    supabase.from('verification_receipts').select('course_id, user_id, task_id, step_id, output_sha256, receipted_at').eq('user_id', currentUserId),
    supabase.from('rehash_checks').select('*').eq('user_id', currentUserId),
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

  if (evidence.data) evidence.data.forEach((r) => cache.setStepEvidence(stepEvidenceFromRow(r), String(r.user_id)));
  if (artifacts.data) artifacts.data.forEach((r) => cache.setArtifact(artifactFromRow(r)));

  chosenPath = path.data
    ? {
        pathId: String(path.data.path_id),
        chosenAt: path.data.chosen_at ? Date.parse(String(path.data.chosen_at)) : 0,
      }
    : null;

  // R107: the same drop-then-re-add discipline as hydrateCourse, per course,
  // so a course page's fuller rows are replaced by the same rows, never doubled.
  const coursesIn = (rows: Record<string, unknown>[] | null | undefined) => new Set((rows ?? []).map((r) => String(r.course_id)));
  if (docStatus.data) {
    for (const cid of coursesIn(docStatus.data)) [...docStatusByTeam.keys()].filter((k) => k.startsWith(`${cid}::`)).forEach((k) => docStatusByTeam.delete(k));
    docStatus.data.forEach((r) => cache.setDocStatus(docStatusFromRow(r)));
  }
  if (submissions.data) {
    for (const cid of coursesIn(submissions.data)) [...submissionsByTeam.keys()].filter((k) => k.startsWith(`${cid}::`)).forEach((k) => submissionsByTeam.delete(k));
    submissions.data.forEach((r) => cache.setSubmission(submissionFromLightRow(r)));
  }
  if (reviews.data) {
    for (const cid of coursesIn(reviews.data)) [...reviewsByTeam.keys()].filter((k) => k.startsWith(`${cid}::`)).forEach((k) => reviewsByTeam.delete(k));
    reviews.data.forEach((r) => cache.setReview(reviewFromRow(r)));
  }
  if (reports.data) {
    const byCourse = new Map<string, TaskReport[]>();
    reports.data.forEach((r) => byCourse.set(String(r.course_id), [...(byCourse.get(String(r.course_id)) ?? []), taskReportFromRow(r)]));
    byCourse.forEach((list, cid) => taskReportsByCourse.set(cid, list));
  }
  if (notes.data) {
    notes.data.forEach((r) => {
      const cid = String(r.course_id);
      const k = `${cid}::${String(r.task_id)}::${String(r.step_id)}`;
      const prev = stepNotesByKey.get(k);
      stepNotesByKey.set(k, { courseId: cid, taskId: String(r.task_id), stepId: String(r.step_id), note: String(r.note ?? ''), stuck: prev?.stuck ?? false, at: r.updated_at ? Date.parse(String(r.updated_at)) : 0 });
    });
  }
  if (receipts.data) {
    receipts.data.forEach((r) => cache.setReceipt(receiptFromRow(r), String(r.user_id)));
    receiptsEverywhere = true;
  }
  if (rehashes.data) {
    const me = currentUserId as string;
    for (const cid of coursesIn(rehashes.data)) rehashesByKey.delete(`${me}::${cid}`);
    rehashes.data.forEach((r) => cache.addRehash(rehashFromRow(r), me));
  }

  await hydrateEarned();
  notifyStore();
}

/** A submission row selected without its frozen form: the verdicts travel, the data does not (R107). */
export function submissionFromLightRow(r: Record<string, unknown>): DeliverableSubmission {
  const categories = (r.categories ?? { completeness: false, correctness: false, authenticity: false, consistency: false }) as SubmissionSnapshot['categories'];
  return submissionFromRow({ ...r, snapshot: { deliverableId: String(r.deliverable_id), week: Number(r.week ?? 0), data: { fields: {}, groups: {} }, categories, checks: [] } });
}

/** Live updates: any change to this course's tables re-hydrates the cache. */
function subscribeRealtime(courseId: string) {
  const supabase = getBrowserClient();
  if (!supabase || channels.has(courseId)) return;
  // Every event goes through the debounced hydrate: one teammate's autosave
  // used to make every open tab issue 13 selects per event (R82).
  const rehydrate = () => scheduleHydrate(courseId);
  const channel = supabase
    .channel(`course:${courseId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'step_completions', filter: `course_id=eq.${courseId}` }, rehydrate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'deliverables', filter: `course_id=eq.${courseId}` }, rehydrate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'memberships', filter: `course_id=eq.${courseId}` }, rehydrate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gate_status', filter: `course_id=eq.${courseId}` }, rehydrate)
    // lab_access and user_course_state are single-user and deliberately NOT
    // subscribed — there is no second party to notify, and putting credentials on
    // a realtime channel would be a cost with no benefit.
    // R68: an instructor's review must reach the team; a teammate's stuck flag
    // must reach the team; a cohort date set in the studio must reach the class.
    // step_notes stays off the channel — it is owner-only, like lab_access.
    .on('postgres_changes', { event: '*', schema: 'public', table: 'deliverable_reviews', filter: `course_id=eq.${courseId}` }, rehydrate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'step_flags', filter: `course_id=eq.${courseId}` }, rehydrate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cohorts', filter: `course_id=eq.${courseId}` }, rehydrate)
    // R82: gems are derived from step_evidence, team-readable since 0006 and
    // published since 0007 — a teammate's new "verified" arrives live.
    .on('postgres_changes', { event: '*', schema: 'public', table: 'step_evidence', filter: `course_id=eq.${courseId}` }, rehydrate)
    // R83: a filed report reaches the team's rows and the instructor live.
    .on('postgres_changes', { event: '*', schema: 'public', table: 'task_reports', filter: `course_id=eq.${courseId}` }, rehydrate)
    // R84: a teammate's submission reaches the team live; a finished review
    // flips the verdict banner. peer_reviews carries no course_id (anonymity),
    // so it listens unfiltered — RLS only delivers rows the caller may read.
    .on('postgres_changes', { event: '*', schema: 'public', table: 'deliverable_submissions', filter: `course_id=eq.${courseId}` }, rehydrate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'peer_reviews' }, rehydrate)
    // R103: a teammate's approval or return reaches the form live.
    .on('postgres_changes', { event: '*', schema: 'public', table: 'deliverable_status', filter: `course_id=eq.${courseId}` }, rehydrate);

  // Supabase does not deliver DELETE events to filtered listeners, so un-ticks,
  // leaves and resets never reached teammates (their % stayed up forever). One
  // unfiltered DELETE listener per table, filtered here by the primary key
  // columns DELETE payloads carry (R82).
  const onDelete = (p: { old: Record<string, unknown> | null }) => {
    if (p.old && String(p.old.course_id ?? '') === courseId) rehydrate();
  };
  for (const table of ['step_completions', 'memberships', 'step_flags', 'step_evidence'] as const) {
    channel.on('postgres_changes', { event: 'DELETE', schema: 'public', table }, onDelete);
  }

  // On every (re)join of the channel after the first, re-hydrate: realtime does
  // not replay what was missed while a phone tab was backgrounded or the socket
  // was down, so the cache silently froze until a full reload (R82).
  let joined = false;
  channel.subscribe((status) => {
    if (status !== 'SUBSCRIBED') return;
    if (joined) scheduleHydrate(courseId, 0);
    joined = true;
    void import('./outbox').then((m) => m.flushDeliverableOutbox());
  });
  channels.set(courseId, channel);
}

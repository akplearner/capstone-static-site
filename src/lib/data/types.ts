import type { EarnedRow } from '../earnedSkills';
import { Course, Gate, GateStatus, Member, RosterEntry, Task, TaskCompletion } from '../types';
import type { ReportStatus } from '../reportKinds';
import type { ContentFix, FixDraft } from '../contentFix';
import type { CourseDto } from '../content/dto';
import type { DeliverableData, DeliverableDef } from '../docs/types';

import type { DeliverableStatus } from '../docs/lifecycle';
export type { DeliverableStatus };

export interface ImportResult {
  ok: boolean;
  course?: Course;
  error?: string;
}

/** Small per-user, per-course UI state that should follow a student between
 *  devices: where they stopped, and whether they acknowledged the home-lab
 *  build. Deliberately one bag rather than a table per flag — these are cheap
 *  preferences, not progress, and progress stays in `step_completions`. */
export interface UserCourseState {
  /** The last checkbox ticked. See src/lib/resume.ts. */
  resume?: { week: number; taskId: string; stepId: string; at: number };
  /** "I'm building the lab at home" — unlocks the Week-0 build task. */
  homeBuildAck?: boolean;
  /** How many of the mine's weeks have already played their strike (R80/R81):
   *  the pointer used to live in localStorage, so a new device replayed
   *  everything. */
  mineSeen?: number;
}

/** `memberId` scopes the LOCAL store only. Two students sharing one classroom
 *  machine in guest mode would otherwise overwrite each other's pointer. The
 *  Supabase implementations ignore it and use the authenticated session instead,
 *  which is the stronger identity — passing it keeps one interface for both. */
export interface UserStateRepository {
  get(courseId: string, memberId: string): UserCourseState | null;
  save(courseId: string, memberId: string, state: UserCourseState): void;
}

/** The student's own lab IPs, credentials and reachability checklist.
 *  Owner-only in the database — see supabase/migrations/0002_student_state.sql. */
export interface LabAccessRepository {
  get(courseId: string, memberId: string): LabAccessData | null;
  save(courseId: string, memberId: string, data: LabAccessData): void;
}

/** Structural type for the lab-access payload. Declared here rather than imported
 *  from `src/lib/labAccess.ts` so the data layer doesn't depend on a 'use client'
 *  UI module; `LabAccess` there is assignable to this. */
export interface LabAccessData {
  values: Record<string, string>;
  checks: Record<string, boolean>;
  notes: string;
}

/** How a step came to be finished. The single most useful fact on the dashboard:
 *  it separates "pasted real output that matched" from "ticked the box".
 *  - `verified-output` — the pasted output contained every `verify` token
 *  - `self-attested`   — marked complete without matching output
 *
 *  There was a third, `file-hash`, for "evidenced by a hashed artifact rather
 *  than console output". Nothing ever emitted it: hashing a file writes an
 *  `EvidenceArtifact`, which is a separate record, not a step method. It was
 *  declared, given a label and tested, and no student could ever have one. */
export type EvidenceMethod = 'verified-output' | 'self-attested';

/** One step's verification record.
 *
 *  Deliberately holds the SHA-256 of the pasted output and never the text: real
 *  terminal output carries internal IPs, hostnames and sometimes credentials. The
 *  hash still makes the record tamper-evident (re-produce the output and it must
 *  hash identically) without the platform storing anything sensitive.
 *
 *  This records honest self-verification, NOT proof a command ran on real
 *  hardware — the check is client-side. UI wording must not overclaim. */
export interface StepEvidence {
  courseId: string;
  taskId: string;
  stepId: string;
  verified: boolean;
  method: EvidenceMethod;
  matchedTokens: number;
  totalTokens: number;
  /** Hex SHA-256 of the pasted output, when there was any. */
  outputSha256?: string;
  /** How many times output was pasted. Effort is measured, never rewarded. */
  attempts: number;
  firstAttemptAt?: number;
  verifiedAt?: number;
}

/** A hashed evidence file. The file itself is never uploaded — the hash, name and
 *  size are the custody record (see docs/adr/0004-content-addressed-evidence.md).
 *  Keyed by hash, so re-hashing the same file can't double-count it. */
export interface EvidenceArtifact {
  courseId: string;
  sha256: string;
  filename: string;
  sizeBytes: number;
  week?: number;
  deliverableId?: string;
  /** Did the filename match the course convention at hashing time? */
  nameOk: boolean;
  hashedAt: number;
}

/** R113: the platform's receipt for a server-issued stamp that came back
 *  matched for one step (cloud mode only). The pasted text never reaches the
 *  server: a receipt holds the step, the output's hash and when. It records
 *  the stamp, not the machine. */
export interface VerificationReceipt {
  courseId: string;
  taskId: string;
  stepId: string;
  outputSha256: string;
  receiptedAt: number;
}

/** R113: the member hashed a file they hashed before, in the browser, and
 *  recorded whether the digest still matched. Append-only; the latest check
 *  per digest is the current answer. The file never leaves the browser. */
export interface RehashCheck {
  courseId: string;
  sha256: string;
  filename: string;
  ok: boolean;
  checkedAt: number;
}

/** The evidence ledger: per-step verification records and hashed artifacts.
 *  Reads are synchronous and whole-course because they're consumed inside render
 *  by the metrics projections, exactly like the other repos here. */
export interface EvidenceRepository {
  /** Every step record for a course, keyed `${taskId}::${stepId}`. */
  getSteps(courseId: string, memberId: string): Record<string, StepEvidence>;
  saveStep(memberId: string, evidence: StepEvidence): void;
  getArtifacts(courseId: string, memberId: string): EvidenceArtifact[];
  saveArtifact(memberId: string, artifact: EvidenceArtifact): void;
  /**
   * Forget everything this student proved on this course — the step ledger and
   * the hashed artifacts both.
   *
   * "Reset my progress" used to clear completions only, so a student who reset
   * read 0% on the course page while `/portfolio` went on printing their whole
   * verified-step record and every file they had hashed. Two answers to one
   * question. Reset now clears both, and the page calls this alongside
   * `progressRepo.resetCourse`.
   */
  resetCourse(courseId: string, memberId: string): void;
  /**
   * R113: the platform's receipts for this member's steps, keyed
   * `${taskId}::${stepId}` (the latest per step). Null where no receipt can
   * exist (offline, or before the receipts table answered), so a surface
   * prints nothing rather than a zero that reads as a failure.
   */
  getReceipts(courseId: string, memberId: string): Record<string, VerificationReceipt> | null;
  /** R113: re-hash checks on this course's files, oldest first. */
  getRehashes(courseId: string, memberId: string): RehashCheck[];
  /** R113: append a re-hash check. Never touches the artifact (its `hashedAt` stays). */
  saveRehash(memberId: string, check: RehashCheck): void;
}

/** The career track a student is working toward — the one per-user row that is
 *  global rather than course-scoped, since a path spans courses. */
export interface PathRepository {
  get(memberId: string): { pathId: string; chosenAt: number } | null;
  save(memberId: string, pathId: string): void;
  clear(memberId: string): void;
}

// Team-scoped deliverable forms (Master Package): map of deliverableId -> data.
export interface DocsRepository {
  get(courseId: string, teamId: string): Record<string, DeliverableData> | null;
  /** Replace the whole team map — imports and hand-offs. The cloud repo only
   *  sends rows that actually changed, so a stale tab can't overwrite a
   *  teammate's newer form with old copies of everything else (R82). */
  save(courseId: string, teamId: string, data: Record<string, DeliverableData>): void;
  /** Save ONE deliverable — what the autosave calls. Resolves false when the
   *  write did not reach the backend (it is queued for retry in cloud mode). */
  saveOne(courseId: string, teamId: string, deliverableId: string, data: DeliverableData): Promise<boolean>;
  /** R139: the versions a form held before its current one, newest first — the
   *  team's history (0025 in the cloud; a per-device list offline). */
  history(courseId: string, teamId: string): Promise<DeliverableVersion[]>;
}

/**
 * R139: one earlier version of a team's form. In the cloud the database appends
 * it when the current row changes (migration 0025, append-only, its own clock);
 * the first save of a sitting is kept, later saves of the same author within
 * five minutes are not, so a version is a sitting, not a keystroke.
 */
export interface DeliverableVersion {
  deliverableId: string;
  /** The data as it stood BEFORE the change that replaced it. */
  data: DeliverableData;
  /** Who had saved that version, and when (the row's own updated_by/updated_at). */
  updatedBy: string | null;
  updatedAt: number;
  /** Who replaced it, and when the database saw the replacement. */
  replacedBy: string | null;
  replacedAt: number;
}

export interface JoinResult {
  ok: boolean;
  reason?: 'team-full' | 'network';
}

// Courses: built-in seeds merged with instructor-authored courses. The only
// implementation today is localStorage; a backend implementation can be swapped
// in without changing any page/component.
/** R85: the parts of a course DOCUMENT the admin studio edits beyond the
 *  course object itself. Only the keys present are replaced. */
export interface CourseContentOverrides {
  deliverables?: DeliverableDef[];
  glossary?: Record<string, string>;
  content?: Record<string, unknown>;
}

/** One saved version of a course in the studio (R122): the number the database gave the save, who saved it and when. */
export interface CourseVersionEntry {
  version: number;
  /** Epoch milliseconds. */
  savedAt: number;
  /** A name, never an account. */
  by: string;
  title: string;
  /** The size of the saved document. */
  bytes: number;
}

/**
 * R125: the earned-skills ledger (see `lib/earnedSkills.ts`). Reads are synchronous. `bank` adds the
 * rows that are new and raises the ones that are higher, never lowers or rewrites one, and returns
 * the rows that changed; "Reset my progress" does not touch it.
 */
export interface EarnedSkillsRepository {
  /** The member's earned rows, for one course or all of them. */
  list(courseId?: string): EarnedRow[];
  bank(candidates: readonly EarnedRow[]): EarnedRow[];
}

/**
 * The history of a course's studio saves (R122), newest first. In the cloud the database numbers and
 * keeps every save (`course_document_versions`, admin read); offline this device keeps the last few.
 * Restoring is an ordinary save of an old document, so it becomes a NEW version and nothing is lost.
 */
export interface CourseHistoryRepository {
  /** `needsUpdate`: the database has not had migration 0018 yet. */
  list(courseId: string): Promise<{ ok: boolean; needsUpdate: boolean; versions: CourseVersionEntry[] }>;
  /** The document of one version, to download. */
  get(courseId: string, version: number): Promise<CourseDto | null>;
  /** Save that version's document again. Resolves the new version number, or null when it was refused. */
  restore(courseId: string, version: number): Promise<number | null>;
}

export interface CourseRepository {
  list(): Course[];
  get(idOrSlug: string): Course | undefined;
  save(course: Course): void;
  /** Save the course AND replace parts of its document (admin studio, R85). */
  saveWithContent(course: Course, content: CourseContentOverrides): void;
  delete(id: string): void;
  exportJSON(id: string): string;
  importJSON(json: string): ImportResult;
  duplicate(id: string, newId: string, newTitle: string): Course | undefined;
}

// Per-student progress. Methods accept an optional precomputed completion key
// set so callers can batch one localStorage scan across many tasks/gates.
export interface ProgressRepository {
  getContext(courseId: string): Member | null;
  setContext(member: Member): void;

  // Roster / team capacity. Backed by localStorage today (per-device); the
  // interface is shaped so a real backend can enforce caps across students.
  getRoster(courseId: string): RosterEntry[];
  getTeamCounts(courseId: string): Record<string, number>;
  /** Join (or move) a team+role, enforcing the course's teamCapacity. On success
   *  writes the roster entry and the member context together. The cloud repo is
   *  async: it confirms the membership row landed (and rolls back the optimistic
   *  cache if it didn't) before anyone writes team-scoped data that RLS would
   *  reject without it (R82). Await through `Promise.resolve(...)`. */
  joinTeam(course: Course, member: Member): JoinResult | Promise<JoinResult>;
  leaveTeam(courseId: string, memberId: string): void;

  getCompletionKeySet(courseId: string, memberId: string): Set<string>;
  isStepComplete(courseId: string, memberId: string, taskId: string, stepId: string, keySet?: Set<string>): boolean;
  setCompletion(completion: TaskCompletion): void;
  removeCompletion(courseId: string, memberId: string, taskId: string, stepId: string): void;

  getCompletedStepIds(courseId: string, memberId: string, task: Task, keySet?: Set<string>): string[];
  getTaskPercent(courseId: string, memberId: string, task: Task, keySet?: Set<string>): number;
  getWeekCompletion(course: Course, memberId: string, role: string, week: number, keySet?: Set<string>): number;
  deriveGateStatus(course: Course, memberId: string, role: string, gate: Gate, keySet?: Set<string>): GateStatus;

  getGateStatus(courseId: string, teamId: string, gateId: number): GateStatus;
  setGateStatus(courseId: string, teamId: string, gateId: number, status: GateStatus): void;

  resetCourse(courseId: string, memberId: string): void;
}

// ── R68: reviews, the cohort calendar, step notes ────────────────────────────

/** An instructor's verdict on one team form for one week. */
export type ReviewStatus = 'approved' | 'revise' | 'pending';

export interface DeliverableReview {
  courseId: string;
  teamId: string;
  deliverableId: string;
  week: number;
  status: ReviewStatus;
  comment: string;
  /** Who reviewed — an email or a display name; never a secret. */
  reviewer: string;
  at: number;
}

/** R132: one instructor mark per rubric category per verdict, kept as history
 *  (append-only, 0021). The verdict row is overwritten; the marks are not. */
export interface DeliverableReviewMark {
  courseId: string;
  teamId: string;
  deliverableId: string;
  week: number;
  category: 'completeness' | 'correctness' | 'authenticity' | 'consistency';
  ok: boolean;
  note: string;
  reviewer: string;
  at: number;
}

/** Team-scoped, like deliverables: every member reads their team's reviews;
 *  only an instructor writes them (RLS in 0004). */
export interface ReviewRepository {
  list(courseId: string, teamId: string): DeliverableReview[];
  save(review: DeliverableReview): void;
  /** R132: the per-category marks of the team's reviews, every verdict kept. */
  marks(courseId: string, teamId: string): DeliverableReviewMark[];
  /** R132: append one mark per category beside a verdict. */
  saveMarks(marks: DeliverableReviewMark[]): void;
}

/** R103: the team's document lifecycle — append-only transitions (draft →
 *  in review → approved → issued); the current state is the latest row per
 *  form. Team-scoped: every member reads and writes their own team's rows;
 *  the rules of who may write which transition live in docs/lifecycle.ts. */
export interface StatusRepository {
  list(courseId: string, teamId: string): DeliverableStatus[];
  save(row: DeliverableStatus): void;
}

/** A cohort's calendar: the one date everything else is derived from. Seeds
 *  carry no dates — a course is reused every term; the cohort is what starts. */
export interface Cohort {
  courseId: string;
  /** `YYYY-MM`, the prefix of every team id in the cohort. */
  cohort: string;
  /** `YYYY-MM-DD`, local. Week N is due 7·N days later. */
  startsOn: string;
}

export interface CohortRepository {
  get(courseId: string, cohort: string): Cohort | null;
  save(cohort: Cohort): void;
}

/** A student's private note on one step, and the one bit of it teammates may
 *  see: that they are stuck. */
export interface StepNote {
  courseId: string;
  taskId: string;
  stepId: string;
  note: string;
  stuck: boolean;
  at: number;
}

/** The shareable half of a note. Never carries the note text. */
export interface StuckFlag {
  memberId: string;
  taskId: string;
  stepId: string;
  at: number;
}

/** R132: the flag's history, append-only (0022): a raise and a clear each leave
 *  a row, so "asked for help and got past it" can be read later. The current
 *  flag (`step_flags`) is still overwritten; this is beside it. */
export interface StepFlagEvent {
  courseId: string;
  memberId: string;
  taskId: string;
  stepId: string;
  kind: 'raised' | 'cleared';
  at: number;
}

/** A structured "something is wrong with this task" from a student (R83). */
export interface TaskReport {
  id: string;
  courseId: string;
  taskId: string;
  teamId: string;
  memberId: string;
  kind: 'unclear' | 'broken' | 'environment' | 'question' | 'outdated';
  note: string;
  status: ReportStatus;
  at: number;
  /** R120: the step the reporter named, when they named one. */
  stepId?: string;
  /** R120: the week of the task when it was reported. */
  week?: number;
  /** R120: who filed it and in what role, as filed: a roster can move later, the record does not. */
  reporterName?: string;
  reporterRole?: string;
  /** R120: the course content version the reporter saw, e.g. "1.7". */
  contentVersion?: string;
  /** R120: what the instructor told the reporter, when it was closed, by whom, and the content fix that resolved it (R121). */
  resolutionNote?: string;
  resolvedAt?: number;
  resolvedBy?: string;
  fixRevision?: number;
}

/** What an instructor may change on a report (RLS-enforced in cloud mode); who, what, when and which version are frozen. */
export interface TaskReportUpdate {
  status: ReportStatus;
  note?: string;
  fixRevision?: number;
}

export interface TaskReportsRepository {
  /** Every report the caller may see for a course (RLS: own + team; instructor: all). */
  list(courseId: string): TaskReport[];
  save(report: TaskReport): void;
  /** Instructor only (RLS-enforced in cloud mode). Closes the report as resolved. */
  resolve(courseId: string, id: string): void;
  /** Instructor only. Resolves true once the change is stored (the cloud write is awaited). */
  update(courseId: string, id: string, patch: TaskReportUpdate): Promise<boolean>;
}

/**
 * The content fix ledger (R121): append-only entries laid over a course, which `content/docs.ts`
 * applies wherever a course or its document is read. Read synchronously off the repo's cache, like
 * every other repo; `load` fills the cache from the cloud.
 */
export interface ContentFixesRepository {
  /** The course's entries, oldest first. The SAME array until the ledger changes, so a derived course can be cached on it. */
  list(courseId: string): readonly ContentFix[];
  /** Changes whenever any course's ledger does, so a catalogue derived from it can be cached on it. */
  version(): number;
  /** Load every course's ledger. `needsUpdate`: the database has not had migration 0017 yet. Offline there is nothing to load. */
  load(): Promise<{ ok: boolean; needsUpdate: boolean }>;
  /** Append one entry. Admin only (RLS in the cloud). Resolves the stored entry, with the revision the database assigned, or null when it was refused. */
  add(courseId: string, draft: FixDraft, by: string): Promise<ContentFix | null>;
}

/** What a submission freezes (R84): the form as submitted, the four category
 *  verdicts of the automatic rubric, and the individual check results — enough
 *  for a reviewer to see WHAT was claimed and for the verdict to be re-derived,
 *  never enough to say WHO (no team or member keys; the DB strips any that
 *  sneak in before a reviewer sees the packet). */
export interface SubmissionSnapshot {
  deliverableId: string;
  week: number;
  data: DeliverableData;
  categories: Record<'completeness' | 'correctness' | 'authenticity' | 'consistency', boolean>;
  checks: { id: string; label: string; ok: boolean }[];
}

/** A frozen, append-only deliverable submission (R84). Resubmitting is a new
 *  row with `version + 1` — history is never rewritten (DB trigger enforces). */
export interface DeliverableSubmission {
  id: string;
  courseId: string;
  teamId: string;
  deliverableId: string;
  week: number;
  version: number;
  submittedBy: string;
  contentSha256: string;
  snapshot: SubmissionSnapshot;
  at: number;
}

/** An anonymous verdict row the submitting team may see: which submission,
 *  confirmed or not — never who reviewed. */
export interface PeerReviewRow {
  assignmentId: string;
  submissionId: string;
  answers: Record<string, boolean>;
  confirm: boolean;
  at: number;
}

/** One entry in the reviewer's blind queue (served by `get_review_queue`). */
export interface ReviewQueueItem {
  assignmentId: string;
  courseId: string;
  deliverableId: string;
  week: number;
  assignedAt: number;
  done: boolean;
}

/** What a reviewer opens (served by `get_review_packet`): the frozen bundle,
 *  stripped of every identifying key. */
export interface ReviewPacket {
  assignmentId: string;
  courseId: string;
  deliverableId: string;
  week: number;
  version: number;
  contentSha256: string;
  snapshot: SubmissionSnapshot;
  submittedAt: number;
}

export interface SubmissionProgress {
  assigned: number;
  reviewed: number;
  confirms: number;
}

export interface SubmissionsRepository {
  /** The team's frozen submissions (cache-backed, newest version last). */
  list(courseId: string, teamId: string): DeliverableSubmission[];
  /** The anonymous verdict rows for one submission (cache-backed). */
  reviewsFor(courseId: string, submissionId: string): PeerReviewRow[];
  /** Freeze a submission and assign reviewers. Resolves to how many reviewers
   *  were ELIGIBLE (cloud) — under 2 means the platform verdict decides — or
   *  null offline, where there are no peers on one device by definition. */
  submit(submission: DeliverableSubmission): Promise<number | null>;
  /** Live counts for the anonymous progress banner (cloud; null offline). */
  progress(submissionId: string): Promise<SubmissionProgress | null>;
  /** The caller's blind review queue (cloud; empty offline). */
  queue(): Promise<ReviewQueueItem[]>;
  /** R136: the queue as counts, read synchronously from what the last hydrate fetched: reviews done over
   *  reviews assigned in this course. Null until the queue has been read (cloud); offline there are no
   *  peers on one device, so both counts are honestly zero. */
  peerReviewCounts(courseId: string): { done: number; assigned: number } | null;
  packet(assignmentId: string): Promise<ReviewPacket | null>;
  /** Answer once; the database makes it final. False = rejected/failed. */
  submitReview(assignmentId: string, answers: Record<string, boolean>, confirm: boolean): Promise<boolean>;
}

export interface StepNotesRepository {
  /** The member's own notes for a course, keyed `${taskId}::${stepId}`. */
  getAll(courseId: string, memberId: string): Record<string, StepNote>;
  save(memberId: string, note: StepNote): void;
  /** Who on the team is stuck where. Flags only — no note text, ever. */
  teamStuck(courseId: string, teamId: string): StuckFlag[];
  /** R132: the member's own flag history for a course (raised and cleared). */
  flagEvents(courseId: string, memberId: string): StepFlagEvent[];
  resetCourse(courseId: string, memberId: string): void;
}

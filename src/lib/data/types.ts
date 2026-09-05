import { Course, Gate, GateStatus, GrcData, Member, RosterEntry, Task, TaskCompletion } from '../types';
import type { DeliverableData } from '../docs/types';

export interface ImportResult {
  ok: boolean;
  course?: Course;
  error?: string;
}

// Team-scoped GRC Workspace registers.
export interface GrcRepository {
  get(courseId: string, teamId: string): GrcData | null;
  save(courseId: string, teamId: string, data: GrcData): void;
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
 *  - `file-hash`       — evidenced by a hashed artifact rather than console output */
export type EvidenceMethod = 'verified-output' | 'self-attested' | 'file-hash';

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
  save(courseId: string, teamId: string, data: Record<string, DeliverableData>): void;
}

export interface JoinResult {
  ok: boolean;
  reason?: 'team-full';
}

// Courses: built-in seeds merged with instructor-authored courses. The only
// implementation today is localStorage; a backend implementation can be swapped
// in without changing any page/component.
export interface CourseRepository {
  list(): Course[];
  get(idOrSlug: string): Course | undefined;
  save(course: Course): void;
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
   *  writes the roster entry and the member context together. */
  joinTeam(course: Course, member: Member): JoinResult;
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

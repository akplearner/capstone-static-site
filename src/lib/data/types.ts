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

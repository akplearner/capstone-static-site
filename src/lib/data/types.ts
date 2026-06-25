import { Course, Gate, GateStatus, GrcData, Member, RosterEntry, Task, TaskCompletion } from '../types';
import type { DeliverableData } from '../docs/types';

export interface ImportResult {
  ok: boolean;
  course?: Course;
  error?: string;
}

// Team-scoped GRC Workspace registers. localStorage today; backend-ready.
export interface GrcRepository {
  get(courseId: string, teamId: string): GrcData | null;
  save(courseId: string, teamId: string, data: GrcData): void;
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

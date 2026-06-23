import { Course, Gate, GateStatus, Member, Task, TaskCompletion } from '../types';

export interface ImportResult {
  ok: boolean;
  course?: Course;
  error?: string;
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

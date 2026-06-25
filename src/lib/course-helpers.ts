import { Course, RoleDef, Step, Task, WeekDef } from './types';

// Pure helpers that operate on a resolved Course object. These replace the old
// module-level helpers in content-data.ts so the app is no longer tied to a
// single hardcoded course.

// Required steps drive completion %, week progress, and gates. Optional steps
// (e.g. the Windows track) are still shown and tracked, but never gate progress.
export function getRequiredSteps(task: Task): Step[] {
  return task.steps.filter((s) => !s.optional);
}

export function getRequiredStepCount(task: Task): number {
  return getRequiredSteps(task).length;
}

export function getTasksByRole(course: Course, role: string, week?: number): Task[] {
  let tasks = course.tasks.filter((t) => t.role === role);
  if (week != null) tasks = tasks.filter((t) => t.week === week);
  return tasks;
}

export function getTaskById(course: Course, id: string): Task | undefined {
  return course.tasks.find((t) => t.id === id);
}

export function getWeekTasks(course: Course, week: number): Task[] {
  return course.tasks.filter((t) => t.week === week);
}

export function getRoleDef(course: Course, roleId: string): RoleDef | undefined {
  return course.roles.find((r) => r.id === roleId);
}

export function getWeekDef(course: Course, week: number): WeekDef | undefined {
  return course.weeks.find((w) => w.number === week);
}

// All deliverable filenames expected from a role for a given week.
export function getDeliverablesForWeek(course: Course, role: string, week: number): string[] {
  const set = new Set<string>();
  getTasksByRole(course, role, week).forEach((t) =>
    t.deliverables.forEach((d) => set.add(d))
  );
  return Array.from(set);
}

export function getWeekNumbers(course: Course): number[] {
  return course.weeks.map((w) => w.number).sort((a, b) => a - b);
}

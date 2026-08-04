import { Course, RoleDef, Step, Task, WeekDef } from './types';

// Pure helpers that operate on a resolved Course object. These replace the old
// module-level helpers in content-data.ts so the app is no longer tied to a
// single hardcoded course.

/** True for courses framed as a real engagement (phases + engagement banner). */
export function isEngagement(course: Course): boolean {
  return course.framing === 'engagement';
}

/** The time-unit word: "Phase" for engagement courses, else "Week". */
export function unitWord(course: Course): string {
  return isEngagement(course) ? 'Phase' : 'Week';
}

/** Short label for a week/phase, e.g. "Phase P1" (engagement, from Week.runs),
 *  "Setup" (course week 0), or "Week 3". Used across the course shell so an
 *  engagement course never reads as "Week N". */
export function phaseTag(course: Course, weekNumber: number): string {
  const w = course.weeks.find((x) => x.number === weekNumber);
  if (isEngagement(course)) return w?.runs?.trim() || `Phase ${weekNumber}`;
  return weekNumber === 0 ? 'Setup' : `Week ${weekNumber}`;
}

/** "Phase P1 · Gap Assessment" (engagement) or "Week 3: Recon" (course). */
export function phaseTitle(course: Course, weekNumber: number): string {
  const w = course.weeks.find((x) => x.number === weekNumber);
  const tag = phaseTag(course, weekNumber);
  if (!w) return tag;
  return isEngagement(course) ? `${tag} · ${w.title}` : `${tag}: ${w.title}`;
}

// Required steps drive completion %, week progress, and gates. Optional steps
// (e.g. the Windows track) are still shown and tracked, but never gate progress.
export function getRequiredSteps(task: Task): Step[] {
  return task.steps.filter((s) => !s.optional);
}

export function getRequiredStepCount(task: Task): number {
  return getRequiredSteps(task).length;
}

/** The steps that actually drive this task's progress bar.
 *
 *  Normally that's the required steps. But a task can legitimately be built
 *  entirely from optional steps — the CySA Week-0 lab build (`cr-w0`) is 11
 *  optional steps, because the whole track is opt-in. Counting only required
 *  steps there gives a 0/0 denominator, so the task reported 0% no matter how
 *  much of it you finished, which pinned "first incomplete week" (and the
 *  Continue button) to Week 0 forever. When there are no required steps, fall
 *  back to all of them so finishing the work actually reads as finished. */
export function getProgressSteps(task: Task): Step[] {
  const required = getRequiredSteps(task);
  return required.length > 0 ? required : task.steps;
}

export function getProgressStepCount(task: Task): number {
  return getProgressSteps(task).length;
}

/** True when a week is lab/course setup rather than graded work. Setup weeks
 *  stay collapsed and are skipped when resolving "where did the student stop".
 *  Prefer the authored `WeekDef.setup` flag; week 0 is the historical default. */
export function isSetupWeek(course: Course, weekNumber: number): boolean {
  const w = getWeekDef(course, weekNumber);
  return w?.setup ?? weekNumber === 0;
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

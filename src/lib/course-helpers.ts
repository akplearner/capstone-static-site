import { Course, Role, RoleDef, Step, Task, WeekDef } from './types';

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

/** Everything the week header needs to state up front: how hard, how long, what
 *  you'll use, and what "done" means. */
export interface WeekSummary {
  tasks: Task[];
  taskCount: number;
  stepCount: number;
  /** Steps that count toward progress (see getProgressSteps). */
  requiredStepCount: number;
  /** Distinct tools across the week's tasks, in first-seen order. */
  tools: string[];
  /** Ordered short labels for the shape of the week. Authored `WeekDef.flow`
   *  wins; otherwise the task titles stand in. */
  flow: string[];
  /** Summed `Task.estimatedTime` in minutes, or null if none are authored. */
  minutes: number | null;
  deliverables: string[];
  difficulty?: 1 | 2 | 3 | 4;
  milestone?: string;
}

/** Parse the free-text `Task.estimatedTime` ("90 min", "2 h", "1.5 hours").
 *  Returns null for prose like "One-time setup (instructor / builder)". */
export function parseEstimatedMinutes(text?: string): number | null {
  if (!text) return null;
  const m = text.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  return /^h/i.test(m[2]) ? Math.round(n * 60) : Math.round(n);
}

export function weekSummary(course: Course, role: string, week: number): WeekSummary {
  const def = getWeekDef(course, week);
  const tasks = getTasksByRole(course, role, week);

  const tools: string[] = [];
  tasks.forEach((t) =>
    (t.tools ?? []).forEach((tool) => {
      if (!tools.includes(tool)) tools.push(tool);
    })
  );

  const mins = tasks.map((t) => parseEstimatedMinutes(t.estimatedTime));
  const known = mins.filter((m): m is number => m != null);

  return {
    tasks,
    taskCount: tasks.length,
    stepCount: tasks.reduce((n, t) => n + t.steps.length, 0),
    requiredStepCount: tasks.reduce((n, t) => n + getProgressStepCount(t), 0),
    tools,
    flow: def?.flow?.length ? def.flow : tasks.map((t) => t.title),
    minutes: known.length ? known.reduce((a, b) => a + b, 0) : null,
    deliverables: getDeliverablesForWeek(course, role, week),
    difficulty: def?.difficulty,
    milestone: def?.milestone,
  };
}

/**
 * Everything a task card states, resolved in one place.
 *
 * The card previously showed a title, an objective and a *count* of
 * deliverables — while the seed data carried the filenames, who the work is
 * handed to and why, what it teaches, and what "done" means. A student could
 * not see what they were producing or who was waiting on it without expanding
 * the task and reading three separate blocks.
 *
 * Every field is optional-by-omission: a course that never authored `learn` or
 * `consumes` simply has fewer rows, so Security+ and MSSP degrade cleanly
 * instead of rendering empty headings. Pure, so the shape is unit-tested rather
 * than eyeballed in a browser.
 */
export interface TaskCard {
  /** 1 */ code: string;
  /** 2 */ title: string;
  /** 3 */ role: RoleDef | undefined;
  /** 4 */ week: number;
  /** 5 */ difficulty?: 1 | 2 | 3 | 4;
  /** 6 */ minutes: number | null;
  /** 7 */ objective: string;
  /** 8 */ inputs: { from?: Role; label: string }[];
  /** 9 */ tools: string[];
  /** 10 */ teaches: string[];
  /** 11 */ steps: { done: number; total: number; optional: number };
  /** 12 */ doneWhen: string[];
  /** 13 */ produces: string[];
  /** 14 */ handoff: { to: Role; artifact?: string; note: string }[];
  /** 15 */ domains: string[];
  /** 16 */ status: 'not-started' | 'in-progress' | 'cleared';
  /** Setup/home-lab-only work, which is opt-in rather than assigned. */
  optional: boolean;
}

export function taskCard(course: Course, task: Task, percent = 0): TaskCard {
  const total = getProgressStepCount(task);
  const week = getWeekDef(course, task.week);

  // Prerequisites are free text with no stated author; `consumes` names one.
  // Both are "what has to exist before you start", so they render as one list.
  const inputs: { from?: Role; label: string }[] = [
    ...(task.consumes ?? []).map((c) => ({
      from: c.from,
      label: c.artifact ? `${c.artifact} — ${c.note}` : c.note,
    })),
    ...(task.prerequisites ?? []).map((p) => ({ label: p })),
  ];

  return {
    code: task.id,
    title: task.title,
    role: getRoleDef(course, task.role),
    week: task.week,
    // Week difficulty is often too coarse — one week can hold a 20-minute check
    // and a 90-minute build — so the task's own value wins when authored.
    difficulty: task.difficulty ?? week?.difficulty,
    minutes: parseEstimatedMinutes(task.estimatedTime),
    objective: task.objective,
    inputs,
    tools: task.tools ?? [],
    teaches: task.learn ?? [],
    steps: {
      done: Math.round((percent / 100) * total),
      total,
      optional: task.steps.length - total,
    },
    doneWhen: task.definitionOfDone ?? [],
    produces: task.deliverables ?? [],
    handoff: task.handoff ?? [],
    domains: task.frameworks ?? [],
    status: percent >= 100 ? 'cleared' : percent > 0 ? 'in-progress' : 'not-started',
    optional: !!task.homeLabOnly || isSetupWeek(course, task.week),
  };
}

/** "1 h 30 min" / "45 min". */
export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

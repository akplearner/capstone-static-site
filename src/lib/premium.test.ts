import { describe, expect, it } from 'vitest';
import type { Course, Step, Task } from './types';
import { TRACK_LABEL, gradedWeeksCleared, isPremiumTask, isRequiredTask, premiumLine, premiumSummary, requiredTasksByRole, taskCard, trackOfWeek, weekTasksOrdered } from './course-helpers';
import { teamWeekCompletion, stepKey } from './teamProgress';
import { resolveActiveWeek } from './resume';
import { deriveCrewProgress } from './game';
import { weeklyPoints } from './rubric';
import { SEED_COURSES, courseIndex } from './content/dto';

/**
 * R142 — the premium tracks. An advanced week says which track it deepens;
 * one graded week's task is the AI extension, shared and optional. The
 * extension is premium content and never required: it does not hold a week
 * open, cut the stone, feed a mark or become "next". These tests build a small
 * course with both and run it through every path that reads completion.
 */
const step = (id: string): Step => ({ id, title: id, description: id, whatItMeans: id, frameworks: [] });
const task = (id: string, role: string, week: number, extra: Partial<Task> = {}): Task => ({ id, role, week, title: id, objective: id, steps: [step('s1'), step('s2')], frameworks: [], deliverables: [], ...extra });

const COURSE: Course = {
  id: 'premium-test',
  title: 'Premium test',
  slug: 'premium-test',
  description: '',
  roles: [
    { id: 'a', name: 'A', mission: '', color: '#000', icon: 'Shield' },
    { id: 'b', name: 'B', mission: '', color: '#000', icon: 'Shield' },
  ],
  weeks: [
    { number: 1, title: 'One', theme: '', objective: '', stage: 1, phase: 'Build' },
    { number: 2, title: 'Two', theme: '', objective: '', stage: 2, phase: 'Build' },
    { number: 3, title: 'AI deep dive', theme: '', objective: '', advanced: true, track: 'ai' },
    { number: 4, title: 'Cyber deep dive', theme: '', objective: '', advanced: true, track: 'cyber' },
    { number: 5, title: 'Operate', theme: '', objective: '', advanced: true },
  ],
  gates: [],
  tasks: [
    task('a1', 'a', 1),
    task('b1', 'b', 1),
    task('ai1', 'a', 1, { shared: true, track: 'ai' }),
    task('a2', 'a', 2),
    task('b2', 'b', 2),
    task('ai2', 'b', 2, { shared: true, track: 'ai' }),
    task('x3', 'a', 3, { shared: true }),
    task('x4', 'b', 4, { shared: true }),
    task('x5', 'a', 5, { shared: true }),
  ],
  modules: ['rag-engineering'],
};

describe('R142 — what a course offers beyond the certification', () => {
  it('counts the weeks by track, the AI tasks and the modules, and prints them as one line', () => {
    const p = premiumSummary(COURSE);
    expect(p).toEqual({ aiWeeks: 1, cyberWeeks: 1, otherWeeks: 1, aiTasks: 2, modules: ['rag-engineering'] });
    expect(premiumLine(p)).toBe('+1 AI week · 1 Cyber week · 1 advanced week · 2 AI tasks · 1 module');
    expect(premiumLine({ aiWeeks: 0, cyberWeeks: 0, otherWeeks: 0, aiTasks: 0, modules: [] })).toBe('');
    expect(premiumLine({ aiWeeks: 2, cyberWeeks: 0, otherWeeks: 0, aiTasks: 4, modules: [] })).toBe('+2 AI weeks · 4 AI tasks');
    expect(premiumLine({ aiWeeks: 0, cyberWeeks: 1, otherWeeks: 0, aiTasks: 0, modules: [] })).toBe('+1 Cyber week');
    expect(TRACK_LABEL).toEqual({ ai: 'AI track', cyber: 'Cyber track' });
  });

  it('reads a week’s track only off an advanced week', () => {
    expect(trackOfWeek(COURSE.weeks[2])).toBe('ai');
    expect(trackOfWeek(COURSE.weeks[3])).toBe('cyber');
    expect(trackOfWeek(COURSE.weeks[4])).toBeUndefined();
    expect(trackOfWeek({ ...COURSE.weeks[0], track: 'ai' })).toBeUndefined();
    expect(trackOfWeek(undefined)).toBeUndefined();
  });

  it('an AI extension task is premium and not required; an advanced week’s task is premium but required within its week', () => {
    const ai = COURSE.tasks.find((t) => t.id === 'ai1')!;
    expect(isRequiredTask(ai)).toBe(false);
    expect(isPremiumTask(COURSE, ai)).toBe(true);
    expect(isRequiredTask(COURSE.tasks[0])).toBe(true);
    expect(isPremiumTask(COURSE, COURSE.tasks[0])).toBe(false);
    expect(isPremiumTask(COURSE, COURSE.tasks.find((t) => t.id === 'x3')!)).toBe(true);
    expect(requiredTasksByRole(COURSE, 'a', 1).map((t) => t.id)).toEqual(['a1']);
    expect(requiredTasksByRole(COURSE, 'b', 2).map((t) => t.id)).toEqual(['b2']);
  });

  it('the card says the extension is optional and names its track; an advanced week’s task carries the week’s', () => {
    expect(taskCard(COURSE, COURSE.tasks.find((t) => t.id === 'ai1')!)).toMatchObject({ optional: true, track: 'ai' });
    expect(taskCard(COURSE, COURSE.tasks[0])).toMatchObject({ optional: false });
    expect(taskCard(COURSE, COURSE.tasks[0]).track).toBeUndefined();
    expect(taskCard(COURSE, COURSE.tasks.find((t) => t.id === 'x4')!)).toMatchObject({ optional: true, track: 'cyber' });
  });

  it('orders the extension last in the week, after the work it extends', () => {
    expect(weekTasksOrdered(COURSE, 'a', 1).map((t) => t.id)).toEqual(['a1', 'b1', 'ai1']);
    expect(weekTasksOrdered(COURSE, 'b', 2).map((t) => t.id)).toEqual(['b2', 'a2', 'ai2']);
  });

  it('never holds a week open: the week, the stone, the active week and the mark all read complete without it', () => {
    const done = new Set(['a1', 'b1', 'a2', 'b2'].flatMap((id) => ['s1', 's2'].map((s) => stepKey(id, s))));
    const isStepDone = (t: string, s: string) => done.has(stepKey(t, s));
    expect(teamWeekCompletion(COURSE, 1, done)).toBe(100);
    expect(teamWeekCompletion(COURSE, 2, done)).toBe(100);
    expect(gradedWeeksCleared(COURSE, 'a', isStepDone)).toEqual({ cleared: 2, total: 2 });
    const weekPercent = { 1: 100, 2: 100 };
    expect(resolveActiveWeek(COURSE, 'a', weekPercent, null)).toBe(1);
    const crew = deriveCrewProgress(COURSE, 'a', weekPercent, { a1: 100, a2: 100, ai1: 0, ai2: 0 }, true);
    // Steps count the role's whole course (the shared advanced-week tasks included); the extensions are not in it.
    expect(crew).toMatchObject({ weeksCleared: 2, weeksTotal: 2, stepsTotal: 10, stepsDone: 4 });
    // The mark reads the role's own task in full and nothing for the team (no form is due, no shared build): the extension is not a bonus either.
    expect(weeklyPoints({ course: COURSE, role: 'a', week: 1, teamDocs: {}, isStepDone })).toMatchObject({ teamShare: null, focusShare: 1, focus: 30 });
    // And a week with only its extension done is not cleared.
    const only = new Set(['s1', 's2'].map((s) => stepKey('ai1', s)));
    expect(teamWeekCompletion(COURSE, 1, only)).toBe(0);
  });

  it('every seed course reports its premium counts in the course index, and each graded week carries one AI extension', () => {
    const rows = courseIndex().courses;
    for (const c of SEED_COURSES) {
      const row = rows.find((r) => r.id === c.id)!;
      expect(row.premium, c.id).toEqual(premiumSummary(c));
      // R143: one AI extension per graded week — CISSP grades six weeks, the rest four.
      const graded = c.weeks.filter((w) => w.number > 0 && !w.setup && !w.advanced).length;
      expect(row.premium.aiTasks, `${c.id} AI tasks`).toBe(graded);
    }
    expect(rows.find((r) => r.id === 'server-plus')!.premium.otherWeeks).toBe(4);
  });
});

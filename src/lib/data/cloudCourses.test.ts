import { describe, it, expect } from 'vitest';
import type { Course, Task } from '../types';
import { AZURE_BLOCKS, AZURE_COURSES } from './seed/azureCloud';
import { AWS_BLOCKS, AWS_COURSES } from './seed/awsCloud';
import { seedDeliverablesForCourse } from '../docs/definitions';
import type { DeliverableDef } from '../docs/types';
import { isGradedWeek } from '../course-helpers';

/**
 * R87/R90 — the cloud capstones' own contract, on top of the platform-wide
 * content guards. The instructor's rules were: three or four tasks a week,
 * under an hour each, one independent task per role, short on the surface,
 * industry documents, and the two platforms the same shape. R90 cut each
 * platform into three four-week courses, one per cert level, so the rules
 * now also say: the three quarters cover the plan exactly, and a course after
 * the first opens with a Week 0 that deploys what the previous one built.
 */

const words = (s: string) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
const minutes = (t: Task) => Number(/^(\d+) min$/.exec(t.estimatedTime ?? '')?.[1] ?? NaN);
const startsMachine = (t: Task) =>
  t.steps.some((s) => (s.commands ?? []).some((c) => /az vm (start|create)|start-instances|run-instances|az deployment group create|cloudformation deploy/.test(c.cmd)));
const stopsMachine = (t: Task) =>
  t.steps.some((s) => (s.commands ?? []).some((c) => /az vm deallocate|stop-instances|az group delete|cloudformation delete-stack/.test(c.cmd)));

/** Every rule, as one function, so it can be proved against a broken task. */
function taskProblems(t: Task): string[] {
  const out: string[] = [];
  if (!(minutes(t) <= 60)) out.push(`${t.id}: ${t.estimatedTime} is over an hour`);
  if (t.steps.length > 5) out.push(`${t.id}: ${t.steps.length} steps`);
  for (const s of t.steps) {
    if (words(s.instruction ?? '') > 12) out.push(`${s.id}: visible line is ${words(s.instruction ?? '')} words`);
  }
  // Week 0 stands the environment up; it records nothing, on purpose.
  if (t.week > 0 && !t.steps.some((s) => s.producesDeliverable)) out.push(`${t.id}: records nothing`);
  if (startsMachine(t) && !stopsMachine(t)) out.push(`${t.id}: starts the VM and never stops it`);
  return out;
}

function documentProblems(d: DeliverableDef): string[] {
  const out: string[] = [];
  const titles = d.sections.map((s) => (s.kind === 'fields' ? s.title : s.group.label) ?? '');
  if (!titles[0]?.startsWith('Document control')) out.push(`${d.id}: does not open with Document control`);
  if (!titles[titles.length - 1]?.startsWith('Evidence')) out.push(`${d.id}: does not close with Evidence`);
  // Every section names who fills it ("Address plan · Infrastructure").
  for (const t of titles) if (!t.includes('·')) out.push(`${d.id}: section "${t}" names no role`);
  if (!d.shared) out.push(`${d.id}: not a team document`);
  return out;
}

const ALL = [...AZURE_COURSES, ...AWS_COURSES];

describe.each(ALL.map((c) => [c.id, c] as const))('R90 cloud capstone — %s', (id, course: Course) => {
  const graded = course.weeks.filter((w) => isGradedWeek(course, w.number));

  it('four graded weeks, none locked; the later courses open with a setup week', () => {
    expect(graded.map((w) => w.number)).toEqual([1, 2, 3, 4]);
    expect(graded.map((w) => w.stage)).toEqual([1, 2, 3, 4]);
    expect(course.noGatekeeping).toBe(true);
    expect(course.gates).toEqual([]);
    // A class is sixteen groups.
    expect(course.teamCount ?? 3, `${id} teamCount`).toBeGreaterThanOrEqual(16);
    const first = id === 'azure-fundamentals' || id === 'aws-cloud-practitioner';
    expect(course.weeks.some((w) => w.setup), `${id} setup week`).toBe(!first);
  });

  it('every graded week is exactly one independent task per role', () => {
    for (const w of graded) {
      const tasks = course.tasks.filter((t) => t.week === w.number);
      expect(tasks.map((t) => t.role).sort(), `week ${w.number}`).toEqual(course.roles.map((r) => r.id).sort());
      expect(tasks.some((t) => t.shared), `week ${w.number}: a shared task makes a role wait`).toBe(false);
      expect(tasks.some((t) => (t.consumes?.length ?? 0) > 0), `week ${w.number}: a task consumes another's output`).toBe(false);
    }
  });

  it('every task is under an hour, five steps at most, one short line each, and records its work', () => {
    expect(course.tasks.flatMap(taskProblems)).toEqual([]);
  });

  it('every task carries this course’s own exam tag, not another quarter’s', () => {
    const tag = course.certification!.includes('AZ-900') ? 'AZ_900' : course.certification!.includes('AZ-104') ? 'AZ_104' : course.certification!.includes('AZ-400') ? 'AZ_400'
      : course.certification!.includes('CLF') ? 'AWS_CLF' : course.certification!.includes('SAA') ? 'AWS_SAA' : 'AWS_DOP';
    for (const t of course.tasks) {
      expect(t.frameworks, t.id).toContain(tag);
      for (const s of t.steps) expect(s.frameworks, s.id).toContain(tag);
    }
  });

  it('four documents, one per graded week, each opening with Document control and closing with Evidence; the last is the capstone', () => {
    const docs = seedDeliverablesForCourse(id);
    expect(docs.map((d) => d.weeks)).toEqual([[1], [2], [3], [4]]);
    expect(docs.map((d) => d.num)).toEqual([1, 2, 3, 4]);
    expect(docs.flatMap(documentProblems)).toEqual([]);
    expect(docs.filter((d) => d.capstone).map((d) => d.num)).toEqual([4]);
    for (const d of docs) for (const f of d.feeds ?? []) expect(docs.some((x) => x.id === f), `${d.id} feeds ${f}`).toBe(true);
  });
});

describe('R90 — three quarters make one plan', () => {
  it.each([
    ['Azure', AZURE_BLOCKS, AZURE_COURSES],
    ['AWS', AWS_BLOCKS, AWS_COURSES],
  ] as const)('%s: the blocks cover weeks 1–12 exactly, in order', (_p, blocks, courses) => {
    const ranges = Object.values(blocks).map((b) => b.weeks);
    expect(ranges).toEqual([[1, 4], [5, 8], [9, 12]]);
    expect(courses.map((c) => c.id)).toEqual(Object.values(blocks).map((b) => b.id));
    // 48 authored tasks, each in exactly one course.
    expect(courses.reduce((n, c) => n + c.tasks.filter((t) => t.week > 0).length, 0)).toBe(48);
  });

  it('a later course’s Week 0 deploys the previous course’s end state from the template', () => {
    for (const [course, through] of [
      [AZURE_COURSES[1], 4], [AZURE_COURSES[2], 8], [AWS_COURSES[1], 4], [AWS_COURSES[2], 8],
    ] as const) {
      const setup = course.tasks.find((t) => t.week === 0)!;
      expect(setup.shared, course.id).toBe(true);
      const cmds = setup.steps.flatMap((s) => (s.commands ?? []).map((c) => c.cmd)).join('\n');
      expect(cmds, course.id).toMatch(new RegExp(`(throughWeek|ThroughWeek)=${through}\\b`));
    }
  });

  it('the two platforms are one course in two vocabularies, quarter by quarter', () => {
    for (let q = 0; q < 3; q++) {
      const az = AZURE_COURSES[q];
      const aws = AWS_COURSES[q];
      const arc = (c: Course) => c.weeks.map((w) => [w.number, w.phase, w.stage, w.difficulty, w.objectives?.length]);
      expect(arc(aws), `quarter ${q + 1}`).toEqual(arc(az));
      const shape = (c: Course) => c.tasks.map((t) => `${t.week}:${t.role}`);
      expect(shape(aws)).toEqual(shape(az));
      const docs = (id: string) => seedDeliverablesForCourse(id).map((d) => [d.num, d.title, d.file, d.sections.length]);
      expect(docs(aws.id)).toEqual(docs(az.id));
    }
  });
});

describe('R90 — the guards catch what they claim to', () => {
  const good = AZURE_COURSES[0].tasks.find((t) => t.id === 'az-w2-infra')!;

  it('a task that starts the VM and never stops it', () => {
    const bad = { ...good, steps: good.steps.filter((s) => !(s.commands ?? []).some((c) => c.cmd.includes('deallocate'))) };
    expect(taskProblems(bad).join()).toContain('never stops it');
  });

  it('an over-long task, too many steps, a long visible line', () => {
    const long = { ...good, estimatedTime: '90 min', steps: [...good.steps, good.steps[0], good.steps[0]].map((s, i) => (i === 0 ? { ...s, instruction: 'one two three four five six seven eight nine ten eleven twelve thirteen' } : s)) };
    const problems = taskProblems(long).join();
    expect(problems).toContain('over an hour');
    expect(problems).toContain('6 steps');
    expect(problems).toContain('13 words');
  });

  it('a document without its control block', () => {
    const doc = seedDeliverablesForCourse('azure-fundamentals')[0];
    expect(documentProblems({ ...doc, sections: doc.sections.slice(1) }).join()).toContain('Document control');
  });
});

import { describe, it, expect } from 'vitest';
import type { Course, Task } from '../types';
import { AZURE_CLOUD } from './seed/azureCloud';
import { AWS_CLOUD } from './seed/awsCloud';
import { seedDeliverablesForCourse } from '../docs/definitions';
import type { DeliverableDef } from '../docs/types';

/**
 * R87 — the cloud capstones' own contract, on top of the platform-wide
 * content guards. The instructor's rules were: three or four tasks a week,
 * under an hour each, one independent task per role, short on the surface,
 * industry documents, and the two courses the same shape. These are numbers
 * here so a later edit cannot quietly drift from them.
 */

const words = (s: string) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
const minutes = (t: Task) => Number(/^(\d+) min$/.exec(t.estimatedTime ?? '')?.[1] ?? NaN);
const startsMachine = (t: Task) =>
  t.steps.some((s) => (s.commands ?? []).some((c) => /az vm (start|create)|start-instances|run-instances/.test(c.cmd)));
const stopsMachine = (t: Task) =>
  t.steps.some((s) => (s.commands ?? []).some((c) => /az vm deallocate|stop-instances/.test(c.cmd)));

/** Every rule, as one function, so it can be proved against a broken task. */
function taskProblems(t: Task): string[] {
  const out: string[] = [];
  if (!(minutes(t) <= 60)) out.push(`${t.id}: ${t.estimatedTime} is over an hour`);
  if (t.steps.length > 4) out.push(`${t.id}: ${t.steps.length} steps`);
  for (const s of t.steps) {
    if (words(s.instruction ?? '') > 12) out.push(`${s.id}: visible line is ${words(s.instruction ?? '')} words`);
  }
  if (!t.steps.some((s) => s.producesDeliverable)) out.push(`${t.id}: records nothing`);
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

describe.each([AZURE_CLOUD, AWS_CLOUD].map((c) => [c.id, c] as const))('R87 cloud capstone — %s', (id, course: Course) => {
  it('twelve weeks, none locked', () => {
    expect(course.weeks.map((w) => w.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(course.noGatekeeping).toBe(true);
    expect(course.gates).toEqual([]);
  });

  it('every week is exactly one independent task per role', () => {
    for (const w of course.weeks) {
      const tasks = course.tasks.filter((t) => t.week === w.number);
      expect(tasks.map((t) => t.role).sort(), `week ${w.number}`).toEqual(course.roles.map((r) => r.id).sort());
      expect(tasks.some((t) => t.shared), `week ${w.number}: a shared task makes a role wait`).toBe(false);
      expect(tasks.some((t) => (t.consumes?.length ?? 0) > 0), `week ${w.number}: a task consumes another's output`).toBe(false);
    }
  });

  it('every task is under an hour, four steps at most, one short line each, and records its work', () => {
    expect(course.tasks.flatMap(taskProblems)).toEqual([]);
  });

  it('twelve documents, one per week, each opening with Document control and closing with Evidence', () => {
    const docs = seedDeliverablesForCourse(id);
    expect(docs.map((d) => d.weeks)).toEqual(course.weeks.map((w) => [w.number]));
    expect(docs.flatMap(documentProblems)).toEqual([]);
    expect(docs.filter((d) => d.capstone).map((d) => d.weeks[0])).toEqual([12]);
  });
});

describe('R87 — the two courses are one course on two platforms', () => {
  it('same weeks, same objectives per role, same documents', () => {
    // Titles may name the platform ("Website and EC2"); the arc may not differ.
    const arc = (c: Course) => c.weeks.map((w) => [w.number, w.phase, w.stage, w.difficulty, w.objectives?.length]);
    expect(arc(AWS_CLOUD)).toEqual(arc(AZURE_CLOUD));
    expect(AWS_CLOUD.roles).toEqual(AZURE_CLOUD.roles);
    const shape = (c: Course) => c.tasks.map((t) => `${t.week}:${t.role}`);
    expect(shape(AWS_CLOUD)).toEqual(shape(AZURE_CLOUD));
    const docs = (id: string) => seedDeliverablesForCourse(id).map((d) => [d.num, d.title, d.file, d.sections.length]);
    expect(docs('aws-cloud')).toEqual(docs('azure-cloud'));
  });
});

describe('R87 — the guards catch what they claim to', () => {
  const good = AZURE_CLOUD.tasks.find((t) => t.id === 'az-w2-infra')!;

  it('a task that starts the VM and never stops it', () => {
    const bad = { ...good, steps: good.steps.filter((s) => !(s.commands ?? []).some((c) => c.cmd.includes('deallocate'))) };
    expect(taskProblems(bad).join()).toContain('never stops it');
  });

  it('an over-long task, too many steps, a long visible line', () => {
    const long = { ...good, estimatedTime: '90 min', steps: [...good.steps, good.steps[0]].map((s, i) => (i === 0 ? { ...s, instruction: 'one two three four five six seven eight nine ten eleven twelve thirteen' } : s)) };
    const problems = taskProblems(long).join();
    expect(problems).toContain('over an hour');
    expect(problems).toContain('5 steps');
    expect(problems).toContain('13 words');
  });

  it('a document without its control block', () => {
    const doc = seedDeliverablesForCourse('azure-cloud')[0];
    expect(documentProblems({ ...doc, sections: doc.sections.slice(1) }).join()).toContain('Document control');
  });
});

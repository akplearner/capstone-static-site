import { describe, it, expect } from 'vitest';
import { SECURITY_PLUS } from './seed/securityPlus';
import { CYSA_PLUS } from './seed/cysa';
import { MSSP } from './seed/mssp';
import { Course, Step, Task } from '../types';
import { deliverableIdByTitle, deliverableIdByFile, deliverablesForCourse } from '../docs/definitions';
import { looksLikeConsoleOutput } from '../stepOutcome';

// Guards the "sometimes a step just doesn't work" class of bug: a step that names
// a form (`usesForm`) or an evidence file (`producesDeliverable`) that no
// deliverable actually provides would render a dead link. These tests fail fast if
// a step ever points at a form/file that isn't registered for its course.

const COURSES: Course[] = [SECURITY_PLUS, CYSA_PLUS, MSSP];

function allSteps(course: Course): { task: Task; step: Step }[] {
  return course.tasks.flatMap((task) => task.steps.map((step) => ({ task, step })));
}

describe.each(COURSES.map((c) => [c.id, c] as const))('content integrity — %s', (courseId, course) => {
  it('has at least one deliverable', () => {
    expect(deliverablesForCourse(courseId).length).toBeGreaterThan(0);
  });

  it('every step `usesForm` resolves to a real form in this course', () => {
    for (const { task, step } of allSteps(course)) {
      if (!step.usesForm) continue;
      const id = deliverableIdByTitle(step.usesForm, courseId);
      expect(id, `${task.id}/${step.id} → usesForm "${step.usesForm}"`).toBeTruthy();
    }
  });

  // `producesDeliverable` is the evidence *artifact* a step saves (e.g. week2.pcap,
  // Nmap_Scan.txt) — sometimes that's a deliverable-form file, sometimes a raw
  // capture. It must at least be a real, extensioned filename so the "save your
  // evidence as X" callout and the hash tool have something concrete to point at.
  it('every step `producesDeliverable` is a concrete filename', () => {
    for (const { task, step } of allSteps(course)) {
      if (!step.producesDeliverable) continue;
      expect(step.producesDeliverable, `${task.id}/${step.id}`).toMatch(/\.\w+$/);
    }
  });

  // Where an evidence artifact IS named after a deliverable form (the CySA style),
  // the step's "open the form →" shortcut must land on a real form.
  it('any `producesDeliverable` that looks like a form file resolves to one', () => {
    for (const { task, step } of allSteps(course)) {
      const file = step.producesDeliverable;
      if (!file || !/^\d/.test(file)) continue; // form files are numbered (01_…, 02_…)
      const id = deliverableIdByFile(file, courseId);
      expect(id, `${task.id}/${step.id} → producesDeliverable "${file}"`).toBeTruthy();
    }
  });

  it('every step `files[]` entry names an artifact and why it is needed', () => {
    for (const { task, step } of allSteps(course)) {
      for (const f of step.files ?? []) {
        expect(f.name?.trim(), `${task.id}/${step.id} file.name`).toBeTruthy();
        expect(f.purpose?.trim(), `${task.id}/${step.id} file.purpose`).toBeTruthy();
      }
    }
  });

  it('every task references a week that exists in the course', () => {
    const weekNums = new Set(course.weeks.map((w) => w.number));
    for (const task of course.tasks) {
      expect(weekNums.has(task.week), `${task.id} week ${task.week}`).toBe(true);
    }
  });

  it('every gate references a week that exists in the course', () => {
    const weekNums = new Set(course.weeks.map((w) => w.number));
    for (const gate of course.gates) {
      expect(weekNums.has(gate.week), `gate ${gate.id} week ${gate.week}`).toBe(true);
    }
  });

  it('every gate `requiredTasks` id resolves to a real task', () => {
    const taskIds = new Set(course.tasks.map((t) => t.id));
    for (const gate of course.gates) {
      for (const id of gate.requiredTasks) {
        expect(taskIds.has(id), `gate ${gate.id} → requiredTasks "${id}"`).toBe(true);
      }
    }
  });

  it('step ids are unique within the course', () => {
    const ids = allSteps(course).map(({ step }) => step.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `duplicate step ids: ${[...new Set(dupes)].join(', ')}`).toHaveLength(0);
  });

  // The visual "what you should see" fields fail silently when mis-authored: a
  // highlight whose text isn't in the output simply never renders a marker, and
  // a duplicate marker number produces two badges that look identical.
  it('every outputHighlights entry is a real substring of that step`s expectedOutput', () => {
    for (const { step } of allSteps(course)) {
      if (!step.outputHighlights?.length) continue;
      const output = (step.expectedOutput ?? '').toLowerCase();
      expect(output, `${step.id} has outputHighlights but no expectedOutput`).not.toBe('');
      for (const h of step.outputHighlights) {
        expect(
          output.includes(h.text.toLowerCase()),
          `${step.id}: highlight "${h.text}" is not in expectedOutput`
        ).toBe(true);
      }
    }
  });

  // A console block with no markers is the exact "unhelpful — code section with a
  // sentence" state this course kept slipping back into. If the outcome renders as
  // an annotated terminal, it must have something to annotate (a verify token or an
  // authored highlight); otherwise it should be authored as prose (outputKind).
  it('every console-style output has at least one target to mark', () => {
    for (const { step } of allSteps(course)) {
      const output = step.expectedOutput ?? '';
      if (!output.trim()) continue;
      const rendersAsConsole =
        step.outputKind === 'console' ||
        (step.outputKind == null && looksLikeConsoleOutput(output));
      if (!rendersAsConsole) continue;
      const targets = (step.verify?.length ?? 0) + (step.outputHighlights?.length ?? 0);
      expect(
        targets,
        `${step.id}: renders as a terminal block but has no verify/outputHighlights to mark`
      ).toBeGreaterThan(0);
    }
  });

  it('every walkthrough has unique, positive marker numbers', () => {
    for (const { step } of allSteps(course)) {
      const markers = step.walkthrough?.markers;
      if (!markers?.length) continue;
      const ns = markers.map((m) => m.n);
      expect(ns.length, `${step.id}: walkthrough has no markers`).toBeGreaterThan(0);
      expect(new Set(ns).size, `${step.id}: duplicate marker numbers`).toBe(ns.length);
      for (const n of ns) {
        expect(Number.isInteger(n) && n > 0, `${step.id}: bad marker number ${n}`).toBe(true);
      }
    }
  });

  it('every screenshot points into public/screenshots/', () => {
    for (const { step } of allSteps(course)) {
      for (const img of step.images ?? []) {
        expect(img.src.startsWith('/screenshots/'), `${step.id}: ${img.src}`).toBe(true);
        expect(img.alt.trim().length, `${step.id}: ${img.src} needs alt text`).toBeGreaterThan(0);
      }
    }
  });

  it('every authored week difficulty is 1-4', () => {
    for (const w of course.weeks) {
      if (w.difficulty == null) continue;
      expect([1, 2, 3, 4], `week ${w.number}`).toContain(w.difficulty);
    }
  });

  it('every authored task difficulty is 1-4', () => {
    for (const t of course.tasks) {
      if (t.difficulty == null) continue;
      expect([1, 2, 3, 4], `task ${t.id}`).toContain(t.difficulty);
    }
  });

  // ── The expedition arc ────────────────────────────────────────────────────
  // The stone's stage is read off these, so a gap or a repeat here is a stage
  // that can never be cut — the exact bug the arc was authored to fix.

  it('the week arc is in range and never goes backwards', () => {
    const staged = course.weeks
      .filter((w) => w.stage != null)
      .sort((a, b) => a.number - b.number);
    let previous = -1;
    for (const w of staged) {
      expect([0, 1, 2, 3, 4], `week ${w.number} stage`).toContain(w.stage);
      expect(w.stage!, `week ${w.number} stage must not go backwards`).toBeGreaterThanOrEqual(
        previous
      );
      previous = w.stage!;
    }
  });

  it('no two graded weeks cut the same stage, so no stage is unreachable', () => {
    const graded = course.weeks.filter((w) => !w.setup && w.stage != null);
    const stages = graded.map((w) => w.stage);
    expect(new Set(stages).size, `duplicate stages: ${stages.join(',')}`).toBe(stages.length);
  });

  it('every graded week carries a stage and a phase', () => {
    for (const w of course.weeks) {
      if (w.setup) continue;
      expect(w.stage, `week ${w.number} has no stage`).not.toBeUndefined();
      expect((w.phase ?? '').trim().length, `week ${w.number} has no phase`).toBeGreaterThan(0);
    }
  });

  // ── The deliverable chain ─────────────────────────────────────────────────

  it('exactly one deliverable is the capstone', () => {
    const capstones = deliverablesForCourse(courseId).filter((d) => d.capstone);
    expect(capstones.map((d) => d.id)).toHaveLength(1);
  });

  it('every `feeds` id resolves to a deliverable in the same course', () => {
    const defs = deliverablesForCourse(courseId);
    const ids = new Set(defs.map((d) => d.id));
    for (const d of defs) {
      for (const target of d.feeds ?? []) {
        expect(ids.has(target), `${d.id} feeds unknown deliverable "${target}"`).toBe(true);
        expect(target, `${d.id} feeds itself`).not.toBe(d.id);
      }
    }
  });

  it('the capstone is the end of the chain — it feeds nothing', () => {
    const capstone = deliverablesForCourse(courseId).find((d) => d.capstone);
    expect(capstone?.feeds ?? []).toHaveLength(0);
  });

  it('every `consumes[].from` names a real role in this course', () => {
    const roles = new Set(course.roles.map((r) => r.id));
    for (const t of course.tasks) {
      for (const c of t.consumes ?? []) {
        expect(roles.has(c.from), `task ${t.id} consumes from unknown role "${c.from}"`).toBe(true);
        expect(c.from, `task ${t.id} consumes from its own role`).not.toBe(t.role);
        expect(c.note.trim().length, `task ${t.id} consumes with no note`).toBeGreaterThan(0);
      }
    }
  });
});

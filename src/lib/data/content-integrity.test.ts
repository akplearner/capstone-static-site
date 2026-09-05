import { describe, it, expect } from 'vitest';
import { SECURITY_PLUS } from './seed/securityPlus';
import { CYSA_PLUS } from './seed/cysa';
import { MSSP } from './seed/mssp';
import { SERVER_PLUS } from './seed/serverPlus';
import { Course, Step, Task } from '../types';
import { deliverableIdByTitle, deliverableIdByFile, deliverablesForCourse } from '../docs/definitions';
import { looksLikeConsoleOutput } from '../stepOutcome';
import { LAB_FIELDS } from '../labAccess';

// Guards the "sometimes a step just doesn't work" class of bug: a step that names
// a form (`usesForm`) or an evidence file (`producesDeliverable`) that no
// deliverable actually provides would render a dead link. These tests fail fast if
// a step ever points at a form/file that isn't registered for its course.

const COURSES: Course[] = [SECURITY_PLUS, CYSA_PLUS, MSSP, SERVER_PLUS];

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

  // A task's `deliverables[]` is rendered as "You produce: <file>" on the task card
  // and cross-checked against the gate. Prose entries ("Baseline analysis", "Risk
  // matrix") make the card and the gate disagree about what was actually handed in.
  it('every task `deliverables[]` entry is a concrete filename', () => {
    for (const task of course.tasks) {
      for (const d of task.deliverables ?? []) {
        expect(d, `${task.id} deliverable "${d}"`).toMatch(/\.\w+$/);
      }
    }
  });

  // `verify` drives the paste-your-output self-check, which lowercases both sides
  // (TaskComponents.tsx). A token that appears nowhere in the step's own sample
  // output can never go green, so the student is asked to match something we never
  // showed them.
  it('every `verify` token appears in that step`s expectedOutput', () => {
    for (const { step } of allSteps(course)) {
      if (!step.verify?.length || !step.expectedOutput) continue;
      const output = step.expectedOutput.toLowerCase();
      for (const token of step.verify) {
        expect(
          output.includes(token.toLowerCase()),
          `${step.id}: verify token "${token}" is not in expectedOutput`
        ).toBe(true);
      }
    }
  });

  // Lowercase <angle-bracket> placeholders are substituted from the Lab access
  // panel at render time. One that isn't a registered token silently ships to the
  // student as literal "<kali_ip>" text — so every such token must be either a real
  // lab-access token or an XML/HTML element the content is legitimately quoting.
  it('every lowercase <placeholder> is a real lab-access token', () => {
    const known = new Set(LAB_FIELDS.flatMap((f) => f.tokens).map((t) => t.toLowerCase()));
    for (const { step } of allSteps(course)) {
      const prose = [step.instruction, ...(step.instructionList ?? []), step.expectedOutput]
        .filter(Boolean)
        .join(' ');
      for (const match of prose.match(/<[a-z][a-z0-9_-]*>/g) ?? []) {
        // `<ossec_config>`, `<localfile>` and friends are XML the student edits.
        if (!match.includes('-')) continue;
        expect(known.has(match), `${step.id}: "${match}" is not a lab-access token`).toBe(true);
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

  /**
   * A gate holds the team, so it has to ask something of everyone on it.
   *
   * `deriveGateStatus` is per-role: it takes the required tasks that belong to
   * you and asks whether you have finished them. A gate that lists no task of
   * yours is therefore silent about you — and the renderer used to read that
   * silence as `'locked'`, which through `weekLocked` meant Red and Blue were
   * barred from MSSP week 2 onward, permanently, with nothing they could do.
   *
   * The repo now reads it as "does not apply to you", so the failure is no
   * longer a lock-out. But a checkpoint that requires nothing of a role does
   * not hold that role at the checkpoint, which is not what a gate is for.
   * `shared` tasks count for everyone, as `getTasksByRole` treats them.
   */
  it('every gate requires work from every role', () => {
    for (const gate of course.gates) {
      for (const role of course.roles) {
        const mine = course.tasks.filter(
          (t) => (t.role === role.id || t.shared) && gate.requiredTasks.includes(t.id)
        );
        expect(
          mine.length,
          `gate ${gate.id} ("${gate.title}") requires nothing of ${role.id} — it cannot hold them`
        ).toBeGreaterThan(0);
      }
    }
  });

  /**
   * Nobody has an empty week.
   *
   * MSSP's Red role had no task at all in weeks 2 and 4 — a student who picked
   * it opened the Tasks tab on those weeks and found their own list empty. The
   * setup week is exempt: it is "do once", and a course may legitimately have
   * nothing for a role to set up.
   */
  it('every graded week has work for every role', () => {
    for (const week of course.weeks) {
      if (week.number === 0) continue;
      for (const role of course.roles) {
        const mine = course.tasks.filter(
          (t) => t.week === week.number && (t.role === role.id || t.shared)
        );
        expect(mine.length, `${courseId} week ${week.number} has nothing for ${role.id}`).toBeGreaterThan(0);
      }
    }
  });

  /**
   * A gate at every week but the last.
   *
   * `priorGateForWeek(n)` looks for a gate at `n - 1`; when there is none the
   * week opens with nothing required. MSSP had no week-3 gate, so week 4 — the
   * audit-readiness week — was ungated for everyone. Courses that opt out of
   * sequencing entirely (`noGatekeeping`) are exempt, as are courses with no
   * gates at all.
   */
  it('gated courses gate every week that has a following week', () => {
    if (course.noGatekeeping || course.gates.length === 0) return;
    const gatedWeeks = new Set(course.gates.map((g) => g.week));
    const graded = course.weeks.map((w) => w.number).filter((n) => n > 0);
    const last = Math.max(...graded);
    for (const n of graded) {
      if (n === last) continue;
      expect(gatedWeeks.has(n), `${courseId} week ${n + 1} opens with no gate behind it`).toBe(true);
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

// ── Reading length ──────────────────────────────────────────────────────────
//
// A step renders in a half-width column, so a 100-word run-on paragraph is the
// single biggest readability problem a step can have — and every one of them was
// really a hidden list. `instructionList` and `fixes` exist to carry that shape.
// This guard keeps the long-paragraph habit from creeping back, in every course.
const WORD_BUDGET = 40;
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

describe.each(COURSES.map((c) => [c.id, c] as const))('reading length — %s', (_id, course) => {
  it('no `instruction` runs long without an `instructionList` to carry the list', () => {
    const over = allSteps(course)
      .filter(({ step }) => !step.instructionList?.length && words(step.instruction ?? '') >= WORD_BUDGET)
      .map(({ step }) => `${step.id} (${words(step.instruction ?? '')}w)`);
    expect(over, `split these into instructionList: ${over.join(', ')}`).toHaveLength(0);
  });

  it('no `troubleshooting` runs long without `fixes` rows to split the symptoms', () => {
    const over = allSteps(course)
      .filter(({ step }) => !step.fixes?.length && words(step.troubleshooting ?? '') >= WORD_BUDGET)
      .map(({ step }) => `${step.id} (${words(step.troubleshooting ?? '')}w)`);
    expect(over, `split these into fixes rows: ${over.join(', ')}`).toHaveLength(0);
  });

  it('no `whatItMeans` runs long', () => {
    const over = allSteps(course)
      .filter(({ step }) => words(step.whatItMeans ?? '') >= WORD_BUDGET)
      .map(({ step }) => `${step.id} (${words(step.whatItMeans ?? '')}w)`);
    expect(over, `tighten these: ${over.join(', ')}`).toHaveLength(0);
  });

  // The Guide is one page of orientation now, and most of what it prints is data
  // rather than copy: the course description, every week title and phase, and
  // every role name and mission. `src/lib/page-shape.test.ts` budgets the page's
  // own prose but cannot see any of this, so the two guards together are what
  // actually bound the read. Without this half, the Guide could quietly triple in
  // length without a single line changing in the page component.
  it('the data the Guide renders stays inside one screen', () => {
    const guideText = [
      course.description,
      ...course.weeks.flatMap((w) => [w.title, w.phase ?? w.theme ?? '']),
      ...course.roles.flatMap((r) => [r.name, r.mission]),
    ].join(' ');
    expect(words(guideText), 'shorten a week title, a phase, or a role mission').toBeLessThan(220);
  });
});

// ── Role-week ownership ─────────────────────────────────────────────────────
//
// The course promises three independent roles. A role whose week produces
// nothing it owns is dependent by construction — its work only becomes visible
// inside a teammate's form, which is exactly the state Week 1 (Responder) and
// Week 3 (Analyst and Hunter) were in before round 24. This asserts the grid.
describe('role-week ownership — cysa-plus', () => {
  const graded = CYSA_PLUS.weeks.filter((w) => !w.setup).map((w) => w.number);

  it('every role owns exactly one deliverable in every graded week', () => {
    const defs = deliverablesForCourse(CYSA_PLUS.id);
    const holes: string[] = [];
    for (const week of graded) {
      for (const role of CYSA_PLUS.roles) {
        const owned = defs.filter((d) => d.owner === role.id && d.weeks.includes(week));
        if (owned.length !== 1) {
          holes.push(`W${week} ${role.name}: ${owned.length === 0 ? 'owns nothing' : `owns ${owned.length}`}`);
        }
      }
    }
    expect(holes, holes.join(' · ')).toHaveLength(0);
  });

  it('every owned deliverable is produced by a step of that role in that week', () => {
    const orphans: string[] = [];
    for (const def of deliverablesForCourse(CYSA_PLUS.id)) {
      const produced = CYSA_PLUS.tasks.some(
        (t) => t.role === def.owner && def.weeks.includes(t.week) && t.steps.some((s) => s.producesDeliverable === def.file)
      );
      if (!produced) orphans.push(`${def.file} (${def.owner})`);
    }
    expect(orphans, `no step files these: ${orphans.join(', ')}`).toHaveLength(0);
  });
});

import { describe, it, expect } from 'vitest';
import { MACHINES } from '../serverTopology';
import { SECURITY_PLUS } from './seed/securityPlus';
import { CYSA_PLUS } from './seed/cysa';
import { MSSP } from './seed/mssp';
import { SERVER_PLUS } from './seed/serverPlus';
import { CCNA } from './seed/ccna';
import { A_PLUS } from './seed/aPlus';
import { AI_FOUNDATIONS } from './seed/aiFoundations';
import { NETWORK_PLUS } from './seed/networkPlus';
import { SECAI_PLUS } from './seed/secaiPlus';
import { CISSP } from './seed/cissp';
import { AZURE_COURSES } from './seed/azureCloud';
import { AWS_COURSES } from './seed/awsCloud';
import { Course, Step, Task } from '../types';
import { deliverableIdByTitle, deliverableIdByFile, seedDeliverablesForCourse as deliverablesForCourse } from '../docs/definitions';
import { looksLikeConsoleOutput } from '../stepOutcome';
import { isGradedWeek, isSetupWeek, requiredTasksByRole } from '../course-helpers';
import { LAB_FIELDS } from '../labAccess';
import { profileOf, roleContentFor } from '../docs/roles';
import { CERTS, TASK_DOMAINS, certFor, coverageOf, domainOf } from '../docs/certs';
import { costsFor } from '../docs/costs';
import { SKILLS, TASK_SKILLS, skillOf } from '../docs/skills';
import { TOOL_STRING_EXCEPTIONS, toolsOfString, toolsOfTask } from '../docs/tools';
import { CONTROL_EXCEPTIONS, STANDARDS, parseStandard, standardOf } from '../docs/standards';
import { DELIVERABLE_SOPS, SOPS, TASK_SOPS, sopOf } from '../docs/sops';
import { PRACTICES, TASK_PRACTICES, TASK_TACTICS, practiceOf, tacticOf } from '../docs/tactics';
import { SKILLS_COPY } from '../docs/skillsCopy';
import { READING_BUDGET, prose, words } from '../readingBudget';

// Guards the "sometimes a step just doesn't work" class of bug: a step that names
// a form (`usesForm`) or an evidence file (`producesDeliverable`) that no
// deliverable actually provides would render a dead link. These tests fail fast if
// a step ever points at a form/file that isn't registered for its course.

const COURSES: Course[] = [SECURITY_PLUS, CYSA_PLUS, MSSP, SERVER_PLUS, CCNA, A_PLUS, NETWORK_PLUS, SECAI_PLUS, CISSP, ...AZURE_COURSES, ...AWS_COURSES, AI_FOUNDATIONS];
/** R106: the associate and professional cloud courses are being rewritten against their exams; coverage is enforced as each lands. */
const PENDING_REWRITE = new Set<string>([]);
/** R107: the courses whose skills, SOP and practice mapping lands in R107a-2; tools are derived for every course already. */
const SKILLS_PENDING = new Set<string>([]);
const SECURITY_FAMILY = new Set<string>(['security-plus', 'cysa-plus', 'mssp', 'secai-plus', 'cissp']);

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
  it('every `verify` token appears in the output the step shows (expectedOutput or a sample)', () => {
    for (const { step } of allSteps(course)) {
      if (!step.verify?.length) continue;
      // R84: per-command `sample` blocks are rendered to the student exactly
      // like expectedOutput, so a token shown there is a token we showed them.
      const shown = [step.expectedOutput ?? '', ...(step.commands ?? []).map((c) => c.sample ?? '')]
        .join('\n')
        .toLowerCase();
      if (!shown.trim()) continue;
      for (const token of step.verify) {
        expect(
          shown.includes(token.toLowerCase()),
          `${step.id}: verify token "${token}" is not in the shown output`
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
   * R117: a gate waits on something a team can actually do.
   *
   * Gates are advisory notes, but a note that names a task with no required
   * step names nothing to finish, and a gate whose tasks have none reads as
   * asking for nothing. Every gate therefore needs at least one required step
   * somewhere in its tasks.
   */
  it('R117: every gate waits on at least one required step', () => {
    const byId = new Map(course.tasks.map((t) => [t.id, t]));
    for (const gate of course.gates) {
      const steps = gate.requiredTasks.flatMap((id) => (byId.get(id)?.steps ?? []).filter((s) => !s.optional));
      expect(steps.length, `gate ${gate.id} ("${gate.title}") has no required step to finish`).toBeGreaterThan(0);
    }
  });

  /**
   * R117: a task belongs to a role the course has, or to everyone.
   *
   * A task whose role id is not one of the course's roles is nobody's: its
   * owner chip names a role that does not exist, and a member could never be
   * the role it is for. (Anyone may still do it, but the label would lie.)
   */
  it('R117: every task is shared or belongs to a role of the course', () => {
    const roles = new Set(course.roles.map((r) => r.id));
    for (const t of course.tasks) {
      if (t.shared) continue;
      expect(roles.has(t.role), `${courseId}: task ${t.id} belongs to "${t.role}", which is not a role of the course`).toBe(true);
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
    // R144: the advanced module weeks are premium add-ons, not part of the gated graded arc.
    const graded = course.weeks.filter((w) => isGradedWeek(course, w.number)).map((w) => w.number);
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

  // The stone shows the HIGHEST stage among cleared weeks (quarry.ts
  // deriveStoneStage), so what makes a stage unreachable is a GAP, or an arc
  // that stops short of 4 — not two weeks sharing one. A four-week course
  // still needs four distinct stages (the pigeonhole does it); a twelve-week
  // course (R87, the cloud capstones) spreads its weeks across the same five.
  it('the graded arc leaves no stage unreachable: no gaps, and it reaches 4', () => {
    const graded = course.weeks.filter((w) => !w.setup && !w.advanced && w.stage != null);
    if (graded.length === 0) return;
    const used = [...new Set(graded.map((w) => w.stage!))].sort((a, b) => a - b);
    for (let i = 1; i < used.length; i++) {
      expect(used[i], `stage gap between ${used[i - 1]} and ${used[i]}: stages ${used.join(',')}`).toBe(used[i - 1] + 1);
    }
    expect(used[used.length - 1], `the arc must reach stage 4: stages ${used.join(',')}`).toBe(4);
  });

  /**
   * An advanced week cuts no stone.
   *
   * The five stages a week can grant (0–4) belong to the graded arc, and a
   * course that has used them all — Server+ has — cannot give a sixth week one
   * without either a duplicate or a backwards step. Nor should it: the stone
   * records the course finished, and an advanced week is what some students
   * do after that. So it carries no stage, and the arc rules above skip it.
   */
  it('advanced weeks carry no stage', () => {
    for (const w of course.weeks.filter((x) => x.advanced)) {
      expect(w.stage, `advanced week ${w.number} must not cut a stage`).toBeUndefined();
      expect(w.setup, `week ${w.number} cannot be both setup and advanced`).toBeFalsy();
    }
  });

  // R79: the week is two to four objectives a student can tick, and every task
  // belongs to exactly one of them. The counts are what students asked for —
  // "no more than three or four things a week" — so they are numbers here.
  it('every week is two to four objectives, and every task belongs to exactly one', () => {
    const words = (s: string) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
    for (const w of course.weeks) {
      const objs = w.objectives ?? [];
      const at = `${course.id} week ${w.number}`;
      expect(objs.length, `${at}: author 2–4 objectives`).toBeGreaterThanOrEqual(w.setup ? 1 : 2);
      expect(objs.length, `${at}: no more than 4 objectives`).toBeLessThanOrEqual(4);
      const ids = objs.map((o) => o.id);
      expect(new Set(ids).size, `${at}: objective ids repeat`).toBe(ids.length);
      const listed = objs.flatMap((o) => o.tasks);
      expect(new Set(listed).size, `${at}: a task is in two objectives`).toBe(listed.length);
      const weekTasks = course.tasks.filter((t) => t.week === w.number).map((t) => t.id);
      expect([...listed].sort(), `${at}: every task of the week in exactly one objective`).toEqual([...weekTasks].sort());
      for (const o of objs) {
        expect(o.tasks.length, `${at} "${o.label}": an objective holds one to three tasks`).toBeGreaterThanOrEqual(1);
        expect(o.tasks.length, `${at} "${o.label}": an objective holds one to three tasks`).toBeLessThanOrEqual(3);
        expect(words(o.label), `${at} "${o.label}": twelve words at most`).toBeLessThanOrEqual(12);
      }
    }
  });

  it('every graded week carries a stage and a phase', () => {
    for (const w of course.weeks) {
      if (w.setup || w.advanced) continue;
      expect(w.stage, `week ${w.number} has no stage`).not.toBeUndefined();
      expect((w.phase ?? '').trim().length, `week ${w.number} has no phase`).toBeGreaterThan(0);
    }
  });

  // ── R142: the premium tracks and the AI extension ─────────────────────────
  it('R142: only an advanced week carries a track; an AI extension task is shared, sits in a graded week, at most one per week', () => {
    for (const w of course.weeks) {
      if (w.track) expect(w.advanced, `${courseId} week ${w.number}: a graded week carries no track`).toBe(true);
      if (w.track) expect(['ai', 'cyber'], `${courseId} week ${w.number} track`).toContain(w.track);
    }
    const byWeek = new Map<number, number>();
    for (const t of course.tasks) {
      if (!t.track) continue;
      expect(t.track, `${t.id}: a task's track is the AI track`).toBe('ai');
      expect(t.shared, `${t.id}: the AI extension is for every role`).toBe(true);
      expect(isGradedWeek(course, t.week), `${t.id}: the AI extension sits in a graded week`).toBe(true);
      byWeek.set(t.week, (byWeek.get(t.week) ?? 0) + 1);
    }
    for (const [week, n] of byWeek) expect(n, `${courseId} week ${week}: one AI extension`).toBe(1);
    // The extension never holds a week: every graded week has required work for every role without it.
    for (const w of course.weeks) {
      if (!isGradedWeek(course, w.number)) continue;
      for (const role of course.roles) expect(requiredTasksByRole(course, role.id, w.number).length, `${courseId} week ${w.number}: ${role.id} has required work`).toBeGreaterThan(0);
    }
  });

  it('R142: exactly one Portfolio — shared, in the last graded week, feeding the capstone', () => {
    const defs = deliverablesForCourse(courseId);
    const mine = defs.filter((d) => d.portfolio);
    expect(mine.map((d) => d.id)).toHaveLength(1);
    const last = Math.max(...course.weeks.filter((w) => isGradedWeek(course, w.number)).map((w) => w.number));
    expect(mine[0].weeks).toEqual([last]);
    expect(mine[0].shared).toBe(true);
    expect(mine[0].feeds).toEqual([defs.find((d) => d.capstone)!.id]);
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
// The numbers live in `readingBudget.ts`: a content fix (R121) is held to the same ones when it is saved.
const WORD_BUDGET = READING_BUDGET.longWords;

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

  // R71: Server+ students said the course was too much to follow. Measured,
  // `commands[].explain` was 34% of every word in the seed and the one large
  // field with no guard; `description` is the card subtitle and reads twice.
  // Weeks 0–4 are the base build every student must finish, so they carry the
  // tighter budgets; the advanced weeks keep the general guard above. Only
  // tokens with a letter or digit count, so a dash is not a word.
  // R76: this was `course.id === 'server-plus' && task.week <= 4`. The budgets are
  // the lesson Server+ learned when students said the course was too much to
  // follow — so a NEW course should inherit the discipline rather than be exempt
  // from it by virtue of not being called server-plus. The rule is now "any
  // course's graded weeks": not setup, not advanced, which is exactly the work
  // every student has to get through.
  const baseBuild = ({ task }: { task: { week: number } }) => isGradedWeek(course, task.week);
  it('graded-week command explanations stay one line each', () => {
    const over = allSteps(course)
      .filter(baseBuild)
      .flatMap(({ step }) => (step.commands ?? []).filter((c) => prose(c.explain ?? '') >= READING_BUDGET.explainProse).map((c) => `${step.id}: ${c.cmd.slice(0, 40)} (${prose(c.explain ?? '')}w)`));
    expect(over, `cut these explains under ${READING_BUDGET.explainProse} words: ${over.join(', ')}`).toHaveLength(0);
  });

  // R79: the reading budget. Students said the platform showed too much at
  // once; these are the words a student meets BEFORE choosing to expand
  // anything — the week's sentence, the task's sentence, a step's one-line
  // instruction and its numbered actions — so they are numbers, for every
  // week of every course. Detail has no budget: it lives in the fields the
  // step shows on request (`whatItMeans`, `commands[].explain`, `fixes`).
  it('R79 — the words a student meets before expanding anything are budgeted', () => {
    const over: string[] = [];
    for (const w of course.weeks) {
      if (prose(w.objective) > READING_BUDGET.weekObjectiveProse) over.push(`week ${w.number} objective (${prose(w.objective)}w > ${READING_BUDGET.weekObjectiveProse})`);
    }
    for (const t of course.tasks) {
      if (prose(t.objective) > READING_BUDGET.taskObjectiveProse) over.push(`${t.id} objective (${prose(t.objective)}w > ${READING_BUDGET.taskObjectiveProse})`);
      for (const s of t.steps) {
        if (prose(s.instruction ?? '') > READING_BUDGET.instructionProse) over.push(`${s.id} instruction (${prose(s.instruction ?? '')}w > ${READING_BUDGET.instructionProse})`);
        (s.instructionList ?? []).forEach((item, i) => {
          if (prose(item) > READING_BUDGET.actionProse) over.push(`${s.id} action ${i + 1} (${prose(item)}w > ${READING_BUDGET.actionProse})`);
        });
      }
    }
    expect(over, `move the detail down a tier: ${over.join('; ')}`).toHaveLength(0);
  });

  it('graded-week step descriptions stay a subtitle', () => {
    const over = allSteps(course)
      .filter(baseBuild)
      .filter(({ step }) => prose(step.description ?? '') >= READING_BUDGET.descriptionProse)
      .map(({ step }) => `${step.id} (${prose(step.description ?? '')}w)`);
    expect(over, `cut these descriptions under ${READING_BUDGET.descriptionProse} words: ${over.join(', ')}`).toHaveLength(0);
  });

  // R72: students could not tell which machine a line belonged to, and a
  // beginner cannot tell a working command from a broken one with nothing to
  // compare against. So every base-build command carries three facts, and all
  // three come from `src/lib/docs/serverCommands.ts` — see that file for why
  // they live in one place rather than two.
  // These two stay scoped to Server+ by design, unlike the budgets above: they
  // check membership of `MACHINES` in `serverTopology.ts`, which is that course's
  // own machine registry. A network course's equivalent is `DEVICES` in
  // `ccnaTopology.ts`, and it gets its own check when its command registry lands.
  const serverBaseBuild = (x: { task: { week: number } }) => course.id === 'server-plus' && baseBuild(x);
  it('every Server+ base-build command says which machine it runs on', () => {
    const missing = allSteps(course)
      // R143: the AI extension runs on the student's own machine, not a server, so it names no MachineId.
      .filter((x) => serverBaseBuild(x) && !x.task.track)
      .flatMap(({ step }) => (step.commands ?? []).filter((c) => !c.on).map((c) => `${step.id}: ${c.cmd.slice(0, 50)}`));
    expect(missing, `add these to serverCommands.ts: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('every Server+ base-build command names a machine that exists', () => {
    const ids = new Set(Object.keys(MACHINES));
    const bad = allSteps(course)
      .filter((x) => serverBaseBuild(x) && !x.task.track)
      .flatMap(({ step }) => (step.commands ?? []).filter((c) => c.on && !ids.has(c.on)).map((c) => `${step.id}: ${c.on}`));
    expect(bad, `not a MachineId: ${bad.join(', ')}`).toHaveLength(0);
  });

  /**
   * Every graded-week command should show what it prints and why it exists.
   *
   * Server+ reached zero by moving its commands into a registry
   * (`docs/serverCommands.ts`) where each one is authored once with its
   * explanation and a real sample; CCNA is authored that way from the start. The
   * three security courses predate the rule and carry a measured backlog, so this
   * is a RATCHET rather than a pass/fail: the number may fall, never rise. That
   * keeps the debt visible and stops it growing, which a skipped test would not.
   */
  const BARE_COMMAND_BACKLOG: Record<string, number> = {
    'security-plus': 68,
    'cysa-plus': 77,
    mssp: 4,
    'server-plus': 0,
    ccna: 0,
  };
  it('every graded-week command shows what it prints and why it exists', () => {
    const bare = allSteps(course)
      .filter(baseBuild)
      .flatMap(({ step }) =>
        (step.commands ?? [])
          .filter((c) => !c.sample || !c.explain)
          .map((c) => `${step.id}: ${c.cmd.slice(0, 50)}${c.sample ? '' : ' [no sample]'}${c.explain ? '' : ' [no explain]'}`)
      );
    const allowed = BARE_COMMAND_BACKLOG[course.id] ?? 0;
    expect(
      bare.length,
      allowed === 0
        ? `fill these in: ${bare.join(', ')}`
        : `this course's backlog is ${allowed}; it may shrink but never grow. Now ${bare.length}: ${bare.slice(0, 5).join(', ')}`
    ).toBeLessThanOrEqual(allowed);
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

  // ── R104/R105: the overview standard (docs/ARCHITECTURE.md §6) ────────────
  // The overview is a table and a picture; every string it prints has a word
  // budget, so a sentence pasted into a description or a profile trips here.
  it('R105: every role has a profile in the seed’s order, and the description, missions and profiles keep to the budgets', () => {
    expect(words(course.description), 'description ≤ 40 words').toBeLessThanOrEqual(40);
    const { PROFILES } = roleContentFor(course.id);
    expect(PROFILES.map((x) => x.id), 'a profile per role, in order').toEqual(course.roles.map((r) => r.id));
    for (const r of course.roles) {
      // The register: `Function (Role)`, no emoji label, one third-person sentence.
      expect(r.name, `${r.id}: name reads Function (Role)`).toMatch(/^[A-Z][A-Za-z&,\- ]+ \([A-Za-z][A-Za-z&\/\- ]+\)$/);
      expect((r as { label?: string }).label, `${r.id}: no decorated label`).toBeUndefined();
      expect(words(r.mission), `${r.id} mission ≤ 15 words`).toBeLessThanOrEqual(15);
      expect(r.mission, `${r.id} mission: second person`).not.toMatch(/\b(you|your|yours|we|our)\b/i);
      expect(r.mission, `${r.id} mission: em dash or emoji`).not.toMatch(/—|\p{Extended_Pictographic}/u);
      expect(r.mission, `${r.id} mission: contraction`).not.toMatch(/\b\w+n[’']t\b|\b\w+[’'](re|ll|ve|m)\b|\b(it|that|what|there|here)[’']s\b/i);
      const x = profileOf(PROFILES, r.id)!;
      expect(words(x.summary), `${r.id} summary ≤ 20 words`).toBeLessThanOrEqual(20);
      expect(words(x.arc), `${r.id} arc ≤ 25 words`).toBeLessThanOrEqual(25);
      expect(x.responsibilities.length, `${r.id} three or four responsibilities`).toBeGreaterThanOrEqual(3);
      expect(x.responsibilities.length, `${r.id} three or four responsibilities`).toBeLessThanOrEqual(4);
      for (const line of x.responsibilities) expect(words(line), `${r.id}: "${line}" ≤ 6 words`).toBeLessThanOrEqual(6);
    }
    for (const w of course.weeks) expect(words(w.title), `week ${w.number} title ≤ 10 words`).toBeLessThanOrEqual(10);
  });
});

// ── Role-week ownership ─────────────────────────────────────────────────────
//
// The course promises three independent roles. A role whose week produces
// nothing it owns is dependent by construction — its work only becomes visible
// inside a teammate's form, which is exactly the state Week 1 (Responder) and
// Week 3 (Analyst and Hunter) were in before round 24. This asserts the grid.
describe('role-week ownership — cysa-plus', () => {
  // R144: only the graded weeks own role deliverables; the advanced module weeks carry shared premium tasks, no forms.
  const graded = CYSA_PLUS.weeks.filter((w) => isGradedWeek(CYSA_PLUS, w.number)).map((w) => w.number);

  it('every role owns exactly one deliverable in every graded week', () => {
    const defs = deliverablesForCourse(CYSA_PLUS.id);
    const holes: string[] = [];
    for (const week of graded) {
      for (const role of CYSA_PLUS.roles) {
        // R142: the Portfolio is the team's, not one role's deliverable for the week.
        const owned = defs.filter((d) => d.owner === role.id && d.weeks.includes(week) && !d.portfolio);
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

/**
 * R84 — one standard, every course (the instructor's standardization rule).
 *
 * The parity the R79/R80 rounds established is now a CONTRACT: same structure,
 * same depth, same expectations in every course. A new course, week, task or
 * step that ships below the bar fails here, not in a student's browser.
 */

/** Command steps whose outcome genuinely is not terminal text. Every entry
 *  needs a reason; an entry without a real reason is a standard violation. */
const VERIFY_EXEMPT: Record<string, Record<string, string>> = {
  'cysa-plus': {
    'cr-w0-s6': 'outcome is the DVWA login page rendering, not terminal text',
    'cr-w0-s8': 'outcome appears in the Wazuh dashboard, not the terminal',
    'cr-w0-s10': 'multi-clone outcome is read in the Wazuh dashboard',
    'cg-w2-s2': 'a Wazuh dashboard query, read on screen',
    'cg-w2-s4': 'Wireshark GUI analysis',
    'cb-w3-s3': 'a Wazuh dashboard query, read on screen',
    'cb-w4-s2': 'a Wazuh dashboard query, read on screen',
    'cg-w4-s1': 'a Wazuh dashboard query, read on screen',
  },
  'security-plus': {
    'blue-w1-s1': 'an interactive SSH login; the prompt varies per student',
    'blue-w2-s2': 'Wireshark GUI analysis',
  },
  'server-plus': {
    'sp-w1-install-s1': 'a physical action — the proof is the server booting the stick',
    'sp-w3-connect-s3b': 'silent file authoring; sp-w3-connect-s5 verifies the served site',
    'sp-w5-secmon-s3': 'the outcome is an alert firing in Grafana',
    'sp-w6-observe-s1': 'the outcome is an alert firing in Alertmanager',
    'sp-w4-net-s1': 'silent copies; the Baselines form records the hashes',
    'sp-w2-lnx-s1': 'silent captures; sp-w4-secure-s2d verifies the SHA256SUMS check',
  },
};

describe.each(COURSES.map((c) => [c.id, c] as const))('R84 — the standard — %s', (courseId, course) => {
  const tasks = course.tasks;
  const graded = course.weeks.filter((w) => isGradedWeek(course, w.number));

  it('every graded week states 1-4 objectives, each backed by tasks', () => {
    for (const w of graded) {
      expect(w.objectives?.length, `week ${w.number} objectives`).toBeGreaterThanOrEqual(1);
      expect(w.objectives!.length, `week ${w.number} objectives`).toBeLessThanOrEqual(4);
      for (const o of w.objectives!) {
        expect(o.tasks.length, `week ${w.number} objective '${o.label}'`).toBeGreaterThan(0);
      }
    }
  });

  it('every task states its objective and carries at least one step', () => {
    for (const t of tasks) {
      expect((t.objective ?? '').trim().length, `${t.id} objective`).toBeGreaterThan(0);
      expect(t.steps.length, `${t.id} steps`).toBeGreaterThan(0);
    }
  });

  it('every command step is verifiable, or its exemption states why', () => {
    const exempt = VERIFY_EXEMPT[courseId] ?? {};
    for (const t of tasks) {
      for (const s of t.steps) {
        const hasCmd = (s.commands ?? []).some((c) => (c.cmd ?? '').trim() !== '');
        if (!hasCmd) continue;
        if (s.verify?.length) continue;
        const reason = exempt[s.id];
        expect(reason, `${t.id}/${s.id}: a command step needs verify tokens or a documented exemption`).toBeTruthy();
        expect((reason ?? '').length).toBeGreaterThan(10);
      }
    }
  });

  it('every deliverable has definition-of-done checks', () => {
    for (const d of deliverablesForCourse(course.id)) {
      expect(d.dod?.length, `${d.id} dod`).toBeGreaterThanOrEqual(1);
    }
  });

  it('the course declares gates or noGatekeeping, and its topology picture', () => {
    expect(course.gates.length > 0 || course.noGatekeeping === true, 'gates or noGatekeeping').toBe(true);
    expect(course.topologyPicture, 'topologyPicture').toBeTruthy();
  });

  // ── R103: RACI and the chain ───────────────────────────────────────────────
  it('R103: every document says who drafts, reviews and approves it, and the owner is the drafter', () => {
    const roles = new Set(course.roles.map((r) => r.id));
    for (const d of deliverablesForCourse(course.id)) {
      expect(d.raci, `${d.id} raci`).toBeTruthy();
      const { drafts, reviews, approves, informed = [] } = d.raci!;
      for (const r of [drafts, reviews, approves, ...informed]) expect(roles.has(r), `${d.id}: ${r} is not a role of ${course.id}`).toBe(true);
      expect(d.owner, `${d.id}: owner is the drafting role`).toBe(drafts);
      expect(reviews, `${d.id}: the drafter never reviews their own work`).not.toBe(drafts);
      if (roles.size >= 3) expect(approves, `${d.id}: reviewer and approver differ`).not.toBe(reviews);
      if (d.handoff) {
        expect(roles.has(d.handoff.to), `${d.id} handoff role`).toBe(true);
        expect(d.handoff.to, `${d.id}: a hand-off goes to another role`).not.toBe(drafts);
      }
    }
  });

  it('R103: the chain runs forward in time, has no dead ends, and every document reaches the capstone', () => {
    const defs = deliverablesForCourse(course.id);
    const byId = new Map(defs.map((d) => [d.id, d]));
    const minWeek = (d: (typeof defs)[number]) => Math.min(...d.weeks);
    for (const d of defs) {
      for (const f of d.feeds ?? []) expect(minWeek(byId.get(f)!), `${d.id} → ${f} points back in time`).toBeGreaterThanOrEqual(minWeek(d));
      // R142/R144: a module's appendix form may end its module; it never has to reach a capstone filed before the module began.
      if (d.appendix) {
        for (const f of d.feeds ?? []) expect(byId.get(f)?.appendix, `${d.id} → ${f}: an appendix feeds its own module`).toBe(true);
        continue;
      }
      if (!d.capstone) expect(d.feeds?.length ?? 0, `${d.id} is a dead end`).toBeGreaterThan(0);
      const seen = new Set<string>();
      const stack = [d.id];
      let reached = false;
      while (stack.length && !reached) {
        const id = stack.pop()!;
        if (seen.has(id)) continue;
        seen.add(id);
        const x = byId.get(id)!;
        if (x.capstone) reached = true;
        else stack.push(...(x.feeds ?? []));
      }
      expect(reached, `${d.id} never reaches the capstone`).toBe(true);
    }
  });

  it('R103: a task hand-off that names a form names one of this course’s forms, and every form is written by a step', () => {
    const defs = deliverablesForCourse(course.id);
    const ids = new Set(defs.map((d) => d.id));
    for (const t of course.tasks) for (const h of [...(t.handoff ?? []), ...(t.consumes ?? [])]) if (h.deliverable) expect(ids.has(h.deliverable), `${t.id}: ${h.deliverable}`).toBe(true);
    const used = new Set<string>();
    for (const { step } of allSteps(course)) {
      if (step.usesForm) used.add(`t:${step.usesForm}`);
      if (step.producesDeliverable) used.add(`f:${step.producesDeliverable}`);
    }
    const unwritten = defs.filter((d) => !used.has(`t:${d.title}`) && !used.has(`f:${d.file}`)).map((d) => d.id);
    expect(unwritten, `no step writes: ${unwritten.join(', ')}`).toEqual([]);
  });

  // ── R106: the certification ladder and the cost ───────────────────────────
  // Every course prepares for one registered credential; every graded task
  // names a domain of that exam (the cloud courses in `learn[0]`, the rest in
  // the registry's map); a domain the course does not practise says why; the
  // weighted coverage is honest; and every course has a cost sheet.
  it('R106: the course is on the ladder, every graded task practises a domain of its own exam, and the gaps are explained', () => {
    const cert = certFor(course.id)!;
    expect(cert, `${course.id} is in the certification registry`).toBeTruthy();
    expect(cert.level, 'the registry and the seed agree on the level').toBe(course.level);
    expect(cert.domains.reduce((n, x) => n + x.weight, 0), 'weights add up').toBeGreaterThanOrEqual(95);
    expect(cert.domains.reduce((n, x) => n + x.weight, 0)).toBeLessThanOrEqual(105);
    if (cert.prerequisite) expect(CERTS[cert.prerequisite], `${cert.prerequisite} exists`).toBeTruthy();
    if (cert.next) expect(CERTS[cert.next]?.prerequisite, 'the next rung points back').toBe(course.id);
    const map = TASK_DOMAINS[course.id] ?? {};
    for (const id of Object.keys(map)) expect(course.tasks.some((t) => t.id === id), `${id} in the domain map is a task`).toBe(true);
    const cov = coverageOf(course, cert, map);
    if (!PENDING_REWRITE.has(course.id)) {
      expect(cov.unmapped, 'graded tasks that name no domain of this exam').toEqual([]);
      expect(cov.coveredWeight, 'most of the exam weight is practised').toBeGreaterThanOrEqual(70);
      for (const r of cov.rows) if (!r.tasks.length) expect(r.domain.gapNote, `${r.domain.name}: a gap says why`).toBeTruthy();
    }
    for (const t of course.tasks) {
      const dom = domainOf(cert, map, t);
      if (dom) expect(cert.domains).toContain(dom);
    }
    expect(costsFor(course.id).length, 'a cost sheet').toBeGreaterThan(0);
    for (const t of course.tasks) if (t.cost) expect(t.cost.usd, `${t.id} cost`).toBeGreaterThanOrEqual(0);
  });

  // ── R107: skills, tools, procedures, standards, tactics and practices ─────
  // Every graded task teaches one to three competency nodes, uses at least one
  // tool (derived from its strings, commands and where lines) and asks for at
  // least one practice; every form's standard cites a catalogue control or is
  // an explained practice; every map names things that exist; every framework
  // a task or a step carries is in the standards register.
  it('R107: every graded task maps to skills, tools and practices, every form cites a control or a practice, and every framework tag is registered', () => {
    // Graded and advanced weeks both teach; setup weeks do not.
    const graded = course.tasks.filter((t) => !isSetupWeek(course, t.week));
    const skillMap = TASK_SKILLS[course.id] ?? {};
    const practiceMap = TASK_PRACTICES[course.id] ?? {};
    const tacticMap = TASK_TACTICS[course.id] ?? {};
    const sopTaskMap = TASK_SOPS[course.id] ?? {};
    const sopFormMap = DELIVERABLE_SOPS[course.id] ?? {};
    const forms = deliverablesForCourse(course.id);
    for (const t of course.tasks) {
      for (const s of t.tools ?? []) expect(toolsOfString(s).length > 0 || !!TOOL_STRING_EXCEPTIONS[s], `${t.id}: tool "${s}" resolves or is an explained exception`).toBe(true);
      for (const fw of [...t.frameworks, ...t.steps.flatMap((st) => st.frameworks ?? [])]) expect(standardOf(fw), `${t.id}: framework ${fw} is registered`).toBeTruthy();
    }
    for (const t of graded) {
      expect(toolsOfTask(course, t).length, `${t.id} uses at least one tool`).toBeGreaterThan(0);
      if (SKILLS_PENDING.has(course.id)) continue;
      const skills = skillMap[t.id] ?? [];
      expect(skills.length, `${t.id} teaches one to three skills`).toBeGreaterThanOrEqual(1);
      expect(skills.length, `${t.id} teaches one to three skills`).toBeLessThanOrEqual(3);
      for (const id of skills) expect(skillOf(id), `${t.id} → ${id}`).toBeTruthy();
      const practices = practiceMap[t.id] ?? [];
      expect(practices.length, `${t.id} asks for a practice`).toBeGreaterThanOrEqual(1);
      for (const id of practices) expect(practiceOf(id), `${t.id} → ${id}`).toBeTruthy();
      for (const id of tacticMap[t.id] ?? []) expect(tacticOf(id), `${t.id} → ${id}`).toBeTruthy();
      for (const id of sopTaskMap[t.id] ?? []) expect(sopOf(id), `${t.id} → ${id}`).toBeTruthy();
    }
    for (const [taskId] of Object.entries({ ...skillMap, ...practiceMap, ...tacticMap, ...sopTaskMap })) {
      const t = course.tasks.find((x) => x.id === taskId);
      expect(t, `${taskId} in a map is a task`).toBeTruthy();
      expect(isSetupWeek(course, t!.week), `${taskId} in a map is not setup work`).toBe(false);
    }
    if (SECURITY_FAMILY.has(course.id)) expect(Object.keys(tacticMap).length, 'a security course practises adversary tactics').toBeGreaterThanOrEqual(2);
    for (const f of forms) {
      expect(parseStandard(f.standard).length > 0 || !!CONTROL_EXCEPTIONS[f.standard], `${f.id}: standard "${f.standard}" cites a control or is an explained practice`).toBe(true);
      const sops = sopFormMap[f.id] ?? [];
      expect(sops.length, `${f.id} maps to at most three SOP kinds`).toBeLessThanOrEqual(3);
      for (const id of sops) expect(sopOf(id), `${f.id} → ${id}`).toBeTruthy();
      if (!SKILLS_PENDING.has(course.id)) expect(sops.length, `${f.id} is an instance of a procedure`).toBeGreaterThanOrEqual(1);
    }
    for (const formId of Object.keys(sopFormMap)) expect(forms.some((f) => f.id === formId), `${formId} in the SOP map is a form`).toBe(true);
  });

  it('the only locks are the deliberate ones', () => {
    // `locked` hides a whole course; since R84 every shipped course is open.
    // The deliberate locks that remain are sign-in (accounts), enrolment
    // (join before material), gate sequencing (bypassable, off under
    // noGatekeeping) and the Scope & RoE ethics lock — all elsewhere.
    expect(course.locked ?? false, 'course.locked').toBe(false);
  });
});

// ── R107: the registries, across every course ───────────────────────────────
// A node, a SOP kind or a practice nobody maps to does not exist; a standard
// nothing tags, cites, anchors to or references is dead weight; every sentence
// the skills surfaces print keeps the register and the budget.
describe('R107 — the registries are used and in the register', () => {
  const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
  const usedIn = (maps: Record<string, Record<string, string[]>>) => new Set(Object.values(maps).flatMap((m) => Object.values(m).flat()));

  it('every competency node is taught by some course', () => {
    const used = usedIn(TASK_SKILLS);
    expect(SKILLS.filter((n) => !used.has(n.id) && !n.deprecated).map((n) => n.id)).toEqual([]);
  });

  it('every SOP kind and every practice is used once the mapping is complete', () => {
    const sops = new Set([...usedIn(DELIVERABLE_SOPS), ...usedIn(TASK_SOPS)]);
    const practices = new Set([...usedIn(TASK_PRACTICES), ...Object.values(CONTROL_EXCEPTIONS).flat()]);
    const unusedSops = SOPS.filter((s) => !sops.has(s.id)).map((s) => s.id);
    const unusedPractices = PRACTICES.filter((p) => !practices.has(p.id)).map((p) => p.id);
    if (SKILLS_PENDING.size === 0) {
      expect(unusedSops).toEqual([]);
      expect(unusedPractices).toEqual([]);
    } else {
      // Until a-2 lands, the infrastructure and cloud kinds wait for their courses.
      expect(unusedSops.length, `unused SOP kinds: ${unusedSops.join(', ')}`).toBeLessThanOrEqual(8);
      expect(unusedPractices.length, `unused practices: ${unusedPractices.join(', ')}`).toBeLessThanOrEqual(30);
    }
  });

  it('every standard is tagged on a task, cited by a form, anchored to or referenced by something', () => {
    const used = new Set<string>();
    for (const c of COURSES) for (const t of c.tasks) [...t.frameworks, ...t.steps.flatMap((st) => st.frameworks ?? [])].forEach((fw) => used.add(fw));
    for (const c of COURSES) for (const f of deliverablesForCourse(c.id)) for (const r of parseStandard(f.standard)) used.add(r.standard);
    const refs = [...SOPS.flatMap((s) => s.standardRefs), ...PRACTICES.map((p) => p.anchor), ...SKILLS.flatMap((n) => n.objectiveRefs)];
    for (const r of refs) {
      if (standardOf(r)) used.add(r);
      const c = parseStandard(r)[0];
      if (c) used.add(c.standard);
    }
    expect(STANDARDS.filter((s) => !used.has(s.id)).map((s) => s.id), 'a standard nothing uses').toEqual([]);
  });

  it('every sentence the skills surfaces print is short and in the register', () => {
    const texts: [string, string][] = [];
    const walk = (v: unknown, path: string) => {
      if (typeof v === 'string') texts.push([path, v]);
      else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
      else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, `${path}.${k}`));
    };
    walk(SKILLS_COPY, 'SKILLS_COPY');
    expect(texts.length).toBeGreaterThan(20);
    for (const [path, text] of texts) {
      expect(words(text), `${path} ≤ 25 words`).toBeLessThanOrEqual(25);
      expect(text, `${path}: second person`).not.toMatch(/\b(you|your|yours|we|our)\b/i);
      expect(text, `${path}: em dash or emoji`).not.toMatch(/—|\p{Extended_Pictographic}/u);
      expect(text, `${path}: contraction`).not.toMatch(/\b\w+n[’']t\b|\b\w+[’'](re|ll|ve|m)\b|\b(it|that|what|there|here)[’']s\b/i);
    }
  });
});

import { describe, it, expect } from 'vitest';
import { DENOMINATOR, levelOf, levelRank, skillPortfolio, skillProfile, type SkillProfileInput } from './skillProfile';
import type { Course, Task } from './types';
import type { EvidenceArtifact, StepEvidence } from './data/types';
import type { DeliverableDef } from './docs/types';
import type { DeliverableStatus } from './docs/lifecycle';
import type { CertContent, SkillsContent } from './content/read';
import { DIMENSION_LABEL, LEVEL_LABEL, SKILLS_COPY } from './docs/skillsCopy';

/**
 * R107 — the member profile is a projection with the same honesty rules as
 * `metrics.ts`: own ticks, required steps, verified means verified, a team
 * fact can only raise a row that was earned, nothing reads a duration.
 */

const step = (id: string, over: Partial<Task['steps'][number]> = {}) => ({ id, title: id, description: '', whatItMeans: '', frameworks: [], ...over });
const task = (over: Partial<Task> & { id: string }): Task => ({ role: 'blue', week: 1, title: over.id, objective: '', frameworks: [], deliverables: [], steps: [], ...over });

const COURSE: Course = {
  id: 'c',
  title: 'Course',
  slug: 'c',
  description: '',
  roles: [
    { id: 'blue', name: 'Blue', mission: '', color: '#000', icon: 'Shield' },
    { id: 'red', name: 'Red', mission: '', color: '#000', icon: 'Shield' },
  ],
  weeks: [
    { number: 0, title: 'Setup', theme: '', objective: '', setup: true },
    { number: 1, title: 'Week 1', theme: '', objective: '' },
    { number: 2, title: 'Week 2', theme: '', objective: '' },
  ],
  gates: [],
  tasks: [
    task({ id: 't0', week: 0, steps: [step('s', { verify: ['x'] })] }),
    task({ id: 't1', frameworks: ['NIST_CSF'], deliverables: ['01_Form.md'], steps: [step('a', { verify: ['a'], frameworks: ['CIS'], command: 'echo a' }), step('b', { verify: ['b'] }), step('c'), step('d', { verify: ['d'], optional: true })], handoff: [{ to: 'red', note: '', deliverable: 'form' }] }),
    task({ id: 't2', week: 2, steps: [step('a'), step('b')] }),
    task({ id: 'r1', role: 'red', steps: [step('a', { verify: ['a'] }), step('b')] }),
  ],
};

const FORM: DeliverableDef = {
  id: 'form',
  num: 1,
  file: '01_Form.md',
  title: 'The Form',
  courseId: 'c',
  owner: 'blue',
  folder: 'w1',
  standard: 'NIST CSF (DE.CM-1)',
  weeks: [1],
  kind: 'form',
  exportFormat: 'md',
  purpose: '',
  howTo: '',
  sections: [
    { kind: 'fields', fields: [{ field: 'doc_id', label: 'Id', type: 'text' }, { field: 'version', label: 'V', type: 'text' }, { field: 'doc_owner', label: 'O', type: 'text' }, { field: 'doc_date', label: 'D', type: 'date' }, { field: 'doc_status', label: 'S', type: 'text' }, { field: 'summary', label: 'Summary', type: 'area' }] },
    { kind: 'group', group: { group: 'rows', label: 'Rows', columns: [{ field: 'what', label: 'What', type: 'text' }], seed: [{ what: 'example' }] } },
  ],
  dod: [{ label: 'a summary', when: { fields: ['summary'] } }, { label: 'a row', when: { group: 'rows', atLeast: 1 } }],
};

const REGISTRY: SkillsContent = {
  // R108: the board rows and the work roles travel with the registry; the fixture carries none.
  KPI_FAMILIES: [],
  KPIS: [],
  WORK_ROLES: [],
  WORK_ROLE_OF: {},
  SKILLS: [
    { id: 'comp.a.one', version: '1.0.0', label: 'Do one', area: 'a', objectiveRefs: ['X.d1'] },
    { id: 'comp.a.two', version: '1.0.0', label: 'Do two', area: 'a', objectiveRefs: ['X.d2'] },
    { id: 'comp.a.three', version: '1.0.0', label: 'Do three', area: 'a', objectiveRefs: ['X.d2'] },
  ],
  SKILL_OF: { t1: ['comp.a.one'], t2: ['comp.a.two'], r1: ['comp.a.three'] },
  AREAS: { a: 'A' },
  TOOLS: [{ id: 'tool.x', label: 'X', kind: 'cli', aliases: ['x'] }],
  TOOL_OF: { t1: ['tool.x'], t2: [], r1: ['tool.x'] },
  STANDARDS: [
    { id: 'NIST_CSF', label: 'NIST CSF', description: '', why: '', kind: 'framework', tone: 'info', publisher: 'NIST' },
    { id: 'CIS', label: 'CIS', description: '', why: '', kind: 'framework', tone: 'accent', publisher: 'CIS' },
  ],
  CONTROLS: [{ code: 'NIST.CSF.DE.CM-01', standard: 'NIST_CSF', label: 'Monitored', cites: ['DE.CM-1'] }],
  CONTROL_OF: { form: ['NIST.CSF.DE.CM-01'] },
  SOPS: [{ id: 'sop.runbook', label: 'Runbook', kind: 'runbook', definition: '', standardRefs: ['NIST.CSF.DE.CM-01'] }],
  SOP_OF: { form: ['sop.runbook'] },
  SOP_OF_TASK: {},
  TACTICS: [{ id: 'TA0001', matrix: 'attack-enterprise', label: 'Initial Access', url: 'u', checkedYear: 2025 }],
  TACTIC_OF: { r1: ['TA0001'] },
  PRACTICES: [{ id: 'practice.p', label: 'P', anchor: 'NIST_CSF', definition: '' }],
  PRACTICE_OF: { t1: ['practice.p'], t2: ['practice.p'] },
  METRICS: [],
  COPY: SKILLS_COPY,
  LEVEL_LABEL,
  DIMENSION_LABEL,
};

const CERT: CertContent = {
  CERT: { courseId: 'c', vendorId: 'comptia', vendor: 'CompTIA', code: 'X', name: 'X', level: 'associate', exam: true, examFeeUsd: 0, feeCheckedYear: 2026, domains: [{ id: 'd1', name: 'One', weight: 50 }, { id: 'd2', name: 'Two', weight: 50 }] },
  DOMAIN_OF: { t1: 'd1', t2: 'd2', r1: 'd2' },
  COSTS: [],
  LADDER: [],
};

const rec = (taskId: string, stepId: string, over: Partial<StepEvidence> = {}): StepEvidence => ({ courseId: 'c', taskId, stepId, verified: false, method: 'self-attested', matchedTokens: 0, totalTokens: 1, attempts: 1, ...over });
const verified = (taskId: string, stepId: string, at: number, attempts = 1): StepEvidence => rec(taskId, stepId, { verified: true, method: 'verified-output', matchedTokens: 1, attempts, firstAttemptAt: at - 10, verifiedAt: at });

function input(over: Partial<SkillProfileInput> & { done?: string[] } = {}): SkillProfileInput {
  const done = new Set(over.done ?? []);
  return {
    course: COURSE,
    role: 'blue',
    memberId: 'me',
    isStepDone: (t, s) => done.has(`${t}::${s}`),
    evidence: {},
    artifacts: [],
    registry: REGISTRY,
    cert: CERT,
    deliverables: [FORM],
    ...over,
  };
}

const row = (p: ReturnType<typeof skillProfile>, dim: 'skills' | 'tools' | 'procedures' | 'tactics' | 'practices' | 'standards' | 'domains', id: string) => p.rows[dim].find((r) => r.id === id)!;

describe('skillProfile — rows and levels', () => {
  it('counts the role’s own tasks of graded weeks, required steps only, and names the denominator', () => {
    const p = skillProfile(input());
    expect(p.denominator).toBe(DENOMINATOR);
    expect(p.rows.skills.map((r) => r.id)).toEqual(['comp.a.one', 'comp.a.two']);
    const one = row(p, 'skills', 'comp.a.one');
    expect(one.requiredSteps).toBe(3);
    expect(one.verifiableSteps).toBe(2);
    expect(one.level).toBe('not-started');
    expect(one.next).toEqual({ taskId: 't1', title: 't1', week: 1 });
    expect(p.rows.tactics, 'the other role’s tactic is not mine').toEqual([]);
    expect(p.loaded).toEqual({ team: false, own: false });
    expect(p.abilities.drafted.loaded).toBe(false);
    expect(p.abilities.dodMet.loaded).toBe(false);
  });

  it('a tick practises, a verification verifies, and an approved team document reviews', () => {
    const practised = skillProfile(input({ done: ['t1::a'] }));
    expect(row(practised, 'skills', 'comp.a.one').level).toBe('practised');
    expect(row(practised, 'skills', 'comp.a.one').selfAttestedSteps).toBe(1);
    const proven = skillProfile(input({ done: ['t1::a'], evidence: { 't1::a': verified('t1', 'a', 100) } }));
    expect(row(proven, 'skills', 'comp.a.one').level).toBe('verified');
    expect(row(proven, 'skills', 'comp.a.one').selfAttestedSteps).toBe(0);
    expect(row(proven, 'tools', 'tool.x').level).toBe('verified');
    expect(row(proven, 'standards', 'CIS').level).toBe('verified');
    expect(row(proven, 'domains', 'd1').level).toBe('verified');
    const status: DeliverableStatus[] = [{ courseId: 'c', teamId: 't', deliverableId: 'form', status: 'approved', changedBy: 'other', role: 'red', at: 5, version: 1 }];
    const reviewed = skillProfile(input({ done: ['t1::a'], evidence: { 't1::a': verified('t1', 'a', 100) }, team: { docs: {}, status, submissions: [], reviews: [], currentWeek: 1 } }));
    expect(row(reviewed, 'skills', 'comp.a.one').level).toBe('reviewed');
    expect(row(reviewed, 'skills', 'comp.a.one').deliverablesApproved).toBe(1);
    expect(row(reviewed, 'standards', 'NIST_CSF').standardRefs).toEqual(['NIST.CSF.DE.CM-01']);
    // An approval never lifts a row nobody practised.
    expect(row(reviewed, 'skills', 'comp.a.two').level).toBe('not-started');
  });

  it('a documentation-only task reaches reviewed through practised', () => {
    const status: DeliverableStatus[] = [{ courseId: 'c', teamId: 't', deliverableId: 'form', status: 'issued', changedBy: 'x', role: 'red', at: 5, version: 1 }];
    const docOnly: Course = { ...COURSE, tasks: COURSE.tasks.map((t) => (t.id === 't2' ? { ...t, deliverables: ['01_Form.md'] } : t)) };
    const p = skillProfile(input({ course: docOnly, done: ['t2::a'], team: { docs: {}, status, submissions: [], reviews: [], currentWeek: 2 } }));
    expect(row(p, 'skills', 'comp.a.two').verifiableSteps).toBe(0);
    expect(row(p, 'skills', 'comp.a.two').level).toBe('reviewed');
  });

  it('procedures: started by form data, followed when every check due is met and control is complete, approved by the team', () => {
    const base = { fields: { doc_id: 'D1', version: '1', doc_owner: 'me', doc_date: '2026-01-01', doc_status: 'draft', summary: '' }, groups: { rows: [{ what: 'example' }] } };
    const started = skillProfile(input({ team: { docs: { form: { ...base, fields: { ...base.fields, summary: 'x' } } }, status: [], submissions: [], reviews: [], currentWeek: 1 } }));
    const sop = row(started, 'procedures', 'sop.runbook');
    expect(sop.deliverables).toEqual(['form']);
    expect(sop.level).toBe('practised');
    expect(sop.deliverablesFilled).toBe(0);
    const followed = skillProfile(input({ team: { docs: { form: { fields: { ...base.fields, summary: 'x' }, groups: { rows: [{ what: 'example' }, { what: 'mine' }] } } }, status: [], submissions: [], reviews: [], currentWeek: 1 } }));
    expect(row(followed, 'procedures', 'sop.runbook').level).toBe('verified');
    expect(row(followed, 'procedures', 'sop.runbook').deliverablesControlled).toBe(1);
    const uncontrolled = skillProfile(input({ team: { docs: { form: { fields: { ...base.fields, doc_status: '', summary: 'x' }, groups: { rows: [{ what: 'mine' }] } } }, status: [], submissions: [], reviews: [], currentWeek: 1 } }));
    expect(row(uncontrolled, 'procedures', 'sop.runbook').level).toBe('practised');
    const status: DeliverableStatus[] = [{ courseId: 'c', teamId: 't', deliverableId: 'form', status: 'approved', changedBy: 'me', role: 'blue', at: 5, version: 1 }];
    const approved = skillProfile(input({ team: { docs: { form: { fields: { ...base.fields, summary: 'x' }, groups: { rows: [{ what: 'mine' }] } } }, status: [...status, { ...status[0], status: 'in_review', at: 4 }], submissions: [], reviews: [], currentWeek: 1 } }));
    expect(row(approved, 'procedures', 'sop.runbook').level).toBe('reviewed');
    expect(row(approved, 'procedures', 'sop.runbook').draftedByMember).toBe(1);
    expect(approved.abilities.drafted).toEqual({ value: 1, loaded: true });
    expect(approved.abilities.handoffsCompleted).toEqual({ value: 1, of: 1, loaded: true });
    expect(approved.abilities.dodMet).toEqual({ value: 2, of: 2, loaded: true, own: { value: 2, of: 2 } });
  });

  it('step order is a sequence fact: only tasks with two or more verification records count, and no duration is read', () => {
    const inOrder = skillProfile(input({ done: ['t1::a', 't1::b'], evidence: { 't1::a': verified('t1', 'a', 100), 't1::b': verified('t1', 'b', 200) } }));
    expect(row(inOrder, 'skills', 'comp.a.one').orderedTasks).toBe(1);
    expect(row(inOrder, 'skills', 'comp.a.one').inOrderTasks).toBe(1);
    const reversed = skillProfile(input({ done: ['t1::a', 't1::b'], evidence: { 't1::a': verified('t1', 'a', 300), 't1::b': verified('t1', 'b', 200) } }));
    expect(row(reversed, 'skills', 'comp.a.one').inOrderTasks).toBe(0);
    const one = skillProfile(input({ done: ['t1::a'], evidence: { 't1::a': verified('t1', 'a', 100) } }));
    expect(row(one, 'skills', 'comp.a.one').orderedTasks).toBe(0);
  });

  it('abilities: first try beside persistence, partial progress, naming, active days and weeks, teammate steps', () => {
    const artifacts: EvidenceArtifact[] = [
      { courseId: 'c', sha256: '1', filename: 'ok', sizeBytes: 1, nameOk: true, hashedAt: 1_000_000, week: 1 },
      { courseId: 'c', sha256: '2', filename: 'bad', sizeBytes: 1, nameOk: false, hashedAt: 90_000_000_000, week: 1 },
      { courseId: 'other', sha256: '3', filename: 'x', sizeBytes: 1, nameOk: true, hashedAt: 1 },
    ];
    const p = skillProfile(input({
      done: ['t1::a', 't1::b', 'r1::a', 'r1::b'],
      evidence: { 't1::a': verified('t1', 'a', 100, 1), 't1::b': verified('t1', 'b', 200, 3), 'r1::a': rec('r1', 'a', { matchedTokens: 1, totalTokens: 2 }) },
      artifacts,
    }));
    expect(p.abilities.firstTry).toEqual({ value: 1, of: 2, loaded: true });
    expect(p.abilities.persistence).toEqual({ value: 1, of: 2, loaded: true });
    expect(p.abilities.evidenceNaming).toEqual({ value: 1, of: 2, loaded: true });
    expect(p.abilities.activeDays.value).toBe(2);
    expect(p.abilities.activeWeeks).toEqual({ value: 1, of: 2, loaded: true });
    expect(p.abilities.teammateStepsTicked).toEqual({ value: 2, loaded: true });
    expect(p.abilities.peerReviewsGiven.loaded).toBe(false);
    expect(row(p, 'skills', 'comp.a.one').artifacts).toBe(2);
  });

  // R108: the board's own and team indicators, and the per-row task count behind "proved twice".
  it('R108: steps in order and command steps are own facts; controls cited, document control and instructor approval are team facts', () => {
    const ordered = skillProfile(input({ done: ['t1::a', 't1::b'], evidence: { 't1::a': verified('t1', 'a', 100), 't1::b': verified('t1', 'b', 200) } }));
    expect(ordered.abilities.inOrder).toEqual({ value: 1, of: 1, loaded: true });
    expect(ordered.abilities.commandSteps).toEqual({ value: 1, of: 1, loaded: true });
    expect(row(ordered, 'skills', 'comp.a.one').verifiedTasks).toBe(1);
    const reversed = skillProfile(input({ done: ['t1::a', 't1::b'], evidence: { 't1::a': verified('t1', 'a', 300), 't1::b': verified('t1', 'b', 200) } }));
    expect(reversed.abilities.inOrder).toEqual({ value: 0, of: 1, loaded: true });
    const none = skillProfile(input());
    expect(none.abilities.inOrder).toEqual({ value: 0, of: 0, loaded: true });
    expect(none.abilities.commandSteps).toEqual({ value: 0, of: 1, loaded: true });
    expect(row(none, 'skills', 'comp.a.one').verifiedTasks).toBe(0);
    for (const k of ['controlsCited', 'docControl', 'instructorApproved'] as const) expect(none.abilities[k].loaded, k).toBe(false);

    const controlled = { fields: { doc_id: 'D-1', version: '1', doc_owner: 'me', doc_date: '2026-01-01', doc_status: 'draft', summary: 'done' }, groups: { rows: [{ what: 'a row' }] } };
    const approved: DeliverableStatus = { courseId: 'c', teamId: 't', deliverableId: 'form', status: 'approved', changedBy: 'x', role: 'red', at: 1, version: 1 };
    const drafted = skillProfile(input({ team: { docs: { form: controlled }, status: [], submissions: [], reviews: [], currentWeek: 1 } }));
    expect(drafted.abilities.controlsCited).toEqual({ value: 0, of: 1, loaded: true });
    expect(drafted.abilities.docControl).toEqual({ value: 1, of: 1, loaded: true, own: { value: 1, of: 1 } });
    expect(drafted.abilities.instructorApproved).toEqual({ value: 0, of: 1, loaded: true, own: { value: 0, of: 1 } });
    const uncontrolled = { fields: { summary: 'done' }, groups: {} };
    const loose = skillProfile(input({ team: { docs: { form: uncontrolled }, status: [approved], submissions: [], reviews: [{ courseId: 'c', teamId: 't', deliverableId: 'form', week: 1, status: 'revise', comment: '', reviewer: 'i', at: 1 }, { courseId: 'c', teamId: 't', deliverableId: 'form', week: 1, status: 'approved', comment: '', reviewer: 'i', at: 2 }], currentWeek: 1 } }));
    expect(loose.abilities.controlsCited).toEqual({ value: 1, of: 1, loaded: true });
    expect(loose.abilities.docControl).toEqual({ value: 0, of: 1, loaded: true, own: { value: 0, of: 1 } });
    expect(loose.abilities.instructorApproved, 'the latest review counts').toEqual({ value: 1, of: 1, loaded: true, own: { value: 1, of: 1 } });
    const revised = skillProfile(input({ team: { docs: {}, status: [], submissions: [], reviews: [{ courseId: 'c', teamId: 't', deliverableId: 'form', week: 1, status: 'approved', comment: '', reviewer: 'i', at: 1 }, { courseId: 'c', teamId: 't', deliverableId: 'form', week: 1, status: 'revise', comment: '', reviewer: 'i', at: 2 }], currentWeek: 1 } }));
    expect(revised.abilities.instructorApproved).toEqual({ value: 0, of: 1, loaded: true, own: { value: 0, of: 1 } });
    expect(revised.abilities.docControl, 'no data, no denominator').toEqual({ value: 0, of: 0, loaded: true, own: { value: 0, of: 0 } });
  });

  it('R111: a row knows its last verification and, given the page clock, whether it is current; no clock is read without one', () => {
    const DAY = 24 * 60 * 60 * 1000;
    const at = 1_700_000_000_000;
    const evidence = { 't1::a': verified('t1', 'a', at), 't1::b': verified('t1', 'b', at + DAY) };
    const fresh = skillProfile(input({ done: ['t1::a', 't1::b'], evidence, asOf: at + 10 * DAY }));
    expect(row(fresh, 'skills', 'comp.a.one').lastVerifiedAt, 'the latest verification on the row').toBe(at + DAY);
    expect(row(fresh, 'skills', 'comp.a.one').current).toBe(true);
    const stale = skillProfile(input({ done: ['t1::a', 't1::b'], evidence, asOf: at + 200 * DAY }));
    expect(row(stale, 'skills', 'comp.a.one').current).toBe(false);
    const noClock = skillProfile(input({ done: ['t1::a', 't1::b'], evidence }));
    expect(row(noClock, 'skills', 'comp.a.one').lastVerifiedAt).toBe(at + DAY);
    expect('current' in row(noClock, 'skills', 'comp.a.one'), 'no asOf, no flag').toBe(false);
    const unverified = skillProfile(input({ done: ['t2::a'], asOf: at }));
    expect('lastVerifiedAt' in row(unverified, 'skills', 'comp.a.two')).toBe(false);
    expect('current' in row(unverified, 'skills', 'comp.a.two')).toBe(false);
  });

  it('R111: the role’s own share of a team fold, the drafted forms, and RACI respected over the member’s own moves', () => {
    const RACI_FORM: DeliverableDef = { ...FORM, raci: { drafts: 'blue', reviews: 'red', approves: 'red' } };
    const SHARED: DeliverableDef = { ...FORM, id: 'shared', file: '02_Shared.md', owner: 'red', shared: true, raci: { drafts: 'red', reviews: 'blue', approves: 'blue' } };
    const filled = { fields: { doc_id: 'D-1', version: '1', doc_owner: 'me', doc_date: '2026-01-01', doc_status: 'draft', summary: 'done' }, groups: { rows: [{ what: 'a row' }] } };
    const move = (deliverableId: string, status: DeliverableStatus['status'], role: string, changedBy = 'me'): DeliverableStatus => ({ courseId: 'c', teamId: 't', deliverableId, status, changedBy, role, at: 1, version: 1 });
    const status = [
      move('form', 'in_review', 'blue'), // the drafter submits: respected
      move('form', 'approved', 'blue'), // the drafter approves: not the approver's move
      move('form', 'draft', 'blue'), // the drafter reopens: respected
      move('shared', 'approved', 'blue'), // blue approves the shared form: respected
      move('form', 'approved', 'red', 'other'), // someone else's move: not counted
    ];
    const p = skillProfile(input({ deliverables: [RACI_FORM, SHARED], team: { docs: { form: filled, shared: filled }, status, submissions: [], reviews: [], currentWeek: 1 } }));
    expect(p.draftedForms).toEqual(['form']);
    expect(p.abilities.dodMet).toEqual({ value: 4, of: 4, loaded: true, own: { value: 2, of: 2 } });
    expect(p.abilities.docControl.own).toEqual({ value: 1, of: 1 });
    expect(p.abilities.docControl.of).toBe(2);
    expect(p.abilities.raciRespected).toEqual({ value: 3, of: 4, loaded: true });
    const alone = skillProfile(input({ deliverables: [RACI_FORM, SHARED] }));
    expect(alone.abilities.raciRespected.loaded, 'a team fact').toBe(false);
    expect(alone.abilities.dodMet.own, 'nothing attributed when the team was not handed in').toBeUndefined();
    expect(alone.draftedForms).toEqual(['form']);
  });

  it('gaps list the rows not started, with the task that closes each', () => {
    const p = skillProfile(input({ done: ['t1::a'] }));
    expect(p.gaps.skills.map((r) => r.id)).toEqual(['comp.a.two']);
    expect(p.gaps.domains.map((r) => r.id)).toEqual(['d2']);
    expect(p.gaps.domains[0].next?.taskId).toBe('t2');
  });
});

describe('skillProfile — invariants over random facts', () => {
  // A small deterministic generator, so a failure is reproducible.
  let seed = 7;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];

  it('ticked ≤ required, verified ≤ verifiable ≤ required, verified + self-attested ≤ verifiable, levels imply each other, and a verification never lowers a level', () => {
    const steps = ['t1::a', 't1::b', 't1::c', 't1::d', 't2::a', 't2::b', 'r1::a', 'r1::b', 't0::s'];
    for (let i = 0; i < 200; i++) {
      const done = steps.filter(() => rand() < 0.5);
      const evidence: Record<string, StepEvidence> = {};
      for (const k of steps) {
        if (rand() < 0.5) continue;
        const [t, s] = k.split('::');
        evidence[k] = rand() < 0.5 ? verified(t, s, Math.floor(rand() * 1000), pick([1, 2, 3])) : rec(t, s, { matchedTokens: pick([0, 1]) });
      }
      const status: DeliverableStatus[] = rand() < 0.5 ? [{ courseId: 'c', teamId: 't', deliverableId: 'form', status: pick(['draft', 'in_review', 'approved', 'issued'] as const), changedBy: 'x', role: 'red', at: 1, version: 1 }] : [];
      const team = rand() < 0.5 ? { docs: {}, status, submissions: [], reviews: [], currentWeek: 1 } : undefined;
      const p = skillProfile(input({ done, evidence, team }));
      expect(p.abilities.inOrder.value).toBeLessThanOrEqual(p.abilities.inOrder.of ?? 0);
      expect(p.abilities.commandSteps.value).toBeLessThanOrEqual(p.abilities.commandSteps.of ?? 0);
      for (const dim of ['skills', 'tools', 'procedures', 'tactics', 'practices', 'standards', 'domains'] as const) {
        for (const r of p.rows[dim]) {
          expect(r.tickedSteps).toBeLessThanOrEqual(r.requiredSteps);
          expect(r.verifiableSteps).toBeLessThanOrEqual(r.requiredSteps);
          expect(r.verifiedSteps).toBeLessThanOrEqual(r.verifiableSteps);
          expect(r.verifiedSteps + r.selfAttestedSteps).toBeLessThanOrEqual(r.verifiableSteps);
          expect(r.inOrderTasks ?? 0).toBeLessThanOrEqual(r.orderedTasks ?? 0);
          expect(r.verifiedTasks).toBeLessThanOrEqual(r.tasks.length);
          if (r.verifiedSteps > 0) expect(r.verifiedTasks).toBeGreaterThan(0);
          if (r.level === 'reviewed') expect(r.deliverablesApproved).toBeGreaterThan(0);
          if (levelRank(r.level) >= 1 && dim !== 'procedures') expect(r.tickedSteps).toBeGreaterThan(0);
          if (r.level === 'verified' && dim !== 'procedures') expect(r.verifiedSteps).toBeGreaterThan(0);
        }
      }
      // Adding a verified record for a ticked verifiable step never lowers any level.
      const extra = pick(['t1::a', 't1::b']);
      if (done.includes(extra) && !evidence[extra]?.verified) {
        const [t, s] = extra.split('::');
        const more = skillProfile(input({ done, evidence: { ...evidence, [extra]: verified(t, s, 50) }, team }));
        for (const dim of ['skills', 'tools', 'standards', 'domains'] as const) {
          for (const r of p.rows[dim]) expect(levelRank(more.rows[dim].find((x) => x.id === r.id)!.level), `${dim}/${r.id}`).toBeGreaterThanOrEqual(levelRank(r.level));
        }
      }
    }
  });

  it('levelOf is monotone in its inputs', () => {
    const base = { dimension: 'skills' as const, tickedSteps: 0, verifiableSteps: 2, verifiedSteps: 0, deliverablesApproved: 0, deliverables: [] as string[], deliverablesFilled: 0, deliverablesControlled: 0 };
    expect(levelOf(base)).toBe('not-started');
    expect(levelOf({ ...base, tickedSteps: 1 })).toBe('practised');
    expect(levelOf({ ...base, tickedSteps: 1, deliverablesApproved: 1 })).toBe('practised');
    expect(levelOf({ ...base, tickedSteps: 1, verifiedSteps: 1 })).toBe('verified');
    expect(levelOf({ ...base, tickedSteps: 1, verifiedSteps: 1, deliverablesApproved: 1 })).toBe('reviewed');
    expect(levelOf({ ...base, verifiableSteps: 0, tickedSteps: 1, deliverablesApproved: 1 })).toBe('reviewed');
  });
});

describe('skillPortfolio', () => {
  it('de-duplicates ids across courses at the best level reached', () => {
    const a = skillProfile(input({ done: ['t1::a'], evidence: { 't1::a': verified('t1', 'a', 1) } }));
    const b = skillProfile(input({ done: ['t1::a'] }));
    const pf = skillPortfolio([a, b]);
    expect(pf.skillsVerified).toEqual(['comp.a.one']);
    expect(pf.skillsPractised).toEqual(['comp.a.one']);
    expect(pf.toolsUsed).toEqual(['tool.x']);
    expect(pf.standardsPractised).toEqual(['CIS', 'NIST_CSF']);
    expect(pf.domainsVerified).toBe(1);
    expect(pf.domainsTotal).toBe(4);
    expect(pf.sopsFollowed).toEqual([]);
  });
});

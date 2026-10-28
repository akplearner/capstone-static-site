import { describe, it, expect } from 'vitest';
import { RETENTION_DAYS, VELOCITY_DAYS, skillProfile, type SkillProfileInput } from './skillProfile';
import { SEED_COURSES, courseDto } from './content/dto';
import { certOf, deliverablesOf, skillsOf } from './content/read';
import { getTasksByRole, isSetupWeek } from './course-helpers';
import { verifiableSteps } from './evidenceLedger';
import { decisionBlocksOf, decisionKey } from './docs/types';
import type { DeliverableData, DeliverableDef } from './docs/types';
import type { DeliverableStatus } from './docs/lifecycle';
import type { StepEvidence } from './data/types';

/**
 * R132 — the four fact dimensions and the new indicators, over a real course
 * (Server+): a fault table with its outcome column, a change table with its
 * rollback, a decision block chosen and justified by this member, retention
 * from two stamps a week apart, the flag history, the cohort calendar and
 * the learning velocity against the page clock. Every number reads a fact
 * the fixture hands in; nothing reads a clock.
 */
const course = SEED_COURSES.find((c) => c.id === 'server-plus')!;
const doc = courseDto(course.id);
const registry = skillsOf(doc);
const cert = certOf(doc);
const deliverables = deliverablesOf(doc);
const role = course.roles[0].id;
const own = getTasksByRole(course, role).filter((t) => !isSetupWeek(course, t.week));
const checkable = own.flatMap((t) => verifiableSteps(t.steps.filter((s) => !s.optional)).map((s) => `${t.id}::${s.id}`));
const DAY = 24 * 60 * 60 * 1000;
const T0 = 1_700_000_000_000;

const verified = (k: string, at: number, attempts = 1, first = at - 10): StepEvidence => {
  const [taskId, stepId] = k.split('::');
  return { courseId: course.id, taskId, stepId, verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts, firstAttemptAt: first, verifiedAt: at };
};
const bringup = deliverables.find((d) => d.id === 'srv_bringup')!;
const operations = deliverables.find((d) => d.id === 'srv_operations')!;
const raid = decisionBlocksOf(bringup)[0];
const empty = (): DeliverableData => ({ fields: {}, groups: {} });

function profileOf(over: Partial<SkillProfileInput> & { done?: string[] } = {}) {
  const done = new Set(over.done ?? []);
  return skillProfile({ course, role, memberId: 'me', isStepDone: (t, s) => done.has(`${t}::${s}`), evidence: {}, artifacts: [], registry, cert, deliverables, ...over });
}
const team = (docs: Record<string, DeliverableData>, status: DeliverableStatus[] = []) => ({ docs, status, submissions: [], reviews: [], currentWeek: 4 });

describe('R132 — troubleshooting, decisions and change rows read off the team’s forms', () => {
  it('the fault table counts rows logged and rows resolved by its outcome column; nothing without the team', () => {
    expect(raid, 'the bring-up form carries the RAID decision').toBeDefined();
    const alone = profileOf();
    expect(alone.abilities.faultsResolved.loaded).toBe(false);
    expect(alone.rows.troubleshooting.map((r) => r.id)).toEqual(['trouble.retries']);
    const data = { ...empty(), groups: { post: [{ symptom: 'No boot', code: 'E1', theory: 'RAID', action: 'Rebuilt', result: 'Fixed it' }, { symptom: 'Fan', code: '', theory: '', action: 'Reseated', result: 'Still loud' }, { symptom: '', code: '', theory: '', action: '', result: '' }] } };
    const p = profileOf({ team: team({ srv_bringup: data }) });
    expect(p.abilities.faultsResolved).toMatchObject({ value: 1, of: 2, loaded: true });
    const row = p.rows.troubleshooting.find((r) => r.id === 'trouble.srv_bringup.post')!;
    expect(row).toMatchObject({ dimension: 'troubleshooting', uses: 2, successes: 1, level: 'verified', deliverables: ['srv_bringup'] });
    expect(row.label).toBe((bringup.sections.find((s) => s.kind === 'group' && s.group.group === 'post') as { group: { label: string } }).group.label);
  });

  it('a change row counts as justified when its rollback is written', () => {
    const data = { ...empty(), groups: { changes: [{ date: '1', change: 'x', why: 'y', approved_by: 'z', window: 'w', rollback: 'undo', result: 'ok' }, { date: '2', change: 'x', why: '', approved_by: '', window: '', rollback: '', result: '' }] } };
    const p = profileOf({ team: team({ srv_operations: data }) });
    expect(operations).toBeDefined();
    expect(p.abilities.changeRollback).toMatchObject({ value: 1, of: 2, loaded: true });
    expect(p.abilities.rationaleWritten.of).toBeGreaterThan(0);
  });

  it('a decision counts for the member who chose it: recorded, then justified, then approved by the team', () => {
    const k = decisionKey(raid.id);
    // R137: a decision belongs to the role that drafts the decision form; every other role reads not measured.
    const drafter = bringup.raci?.drafts ?? bringup.owner;
    const asDrafter = (over: Parameters<typeof profileOf>[0]) => profileOf({ role: drafter, ...over });
    const otherRole = course.roles.find((r) => r.id !== drafter)!.id;
    expect(profileOf({ role: otherRole, team: team({}) }).abilities.decisionsRecorded).toMatchObject({ value: 0, of: 0, offered: 0, loaded: true });
    const offered = asDrafter({ team: team({}) });
    expect(offered.abilities.decisionsRecorded).toMatchObject({ value: 0, loaded: true });
    expect(offered.abilities.decisionsRecorded.of).toBeGreaterThanOrEqual(1);
    const someoneElse = asDrafter({ team: team({ srv_bringup: { ...empty(), fields: { [k]: 'raid10', [`${k}:by`]: 'them', [`${k}:at`]: String(T0) } } }) });
    expect(someoneElse.abilities.decisionsRecorded.value, 'a teammate’s choice is not this member’s').toBe(0);
    const chosen = asDrafter({ team: team({ srv_bringup: { ...empty(), fields: { [k]: 'raid10', [`${k}:by`]: 'me', [`${k}:at`]: String(T0) } } }) });
    expect(chosen.abilities.decisionsRecorded.value).toBe(1);
    expect(chosen.abilities.decisionsJustified).toMatchObject({ value: 0, of: 1 });
    const row = chosen.rows.decisions.find((r) => r.id === `decision.srv_bringup.${raid.id}`)!;
    expect(row).toMatchObject({ uses: 1, successes: 0, level: 'practised', lastVerifiedAt: T0 });
    const answers = Object.fromEntries(raid.questions.filter((q) => q.required).map((q) => [q.field, 'Because the rebuild has to be fast and cannot slow the VMs.']));
    const justified = asDrafter({ team: team({ srv_bringup: { ...empty(), fields: { [k]: 'raid10', [`${k}:by`]: 'me', [`${k}:at`]: String(T0), ...answers } } }) });
    expect(justified.abilities.decisionsJustified).toMatchObject({ value: 1, of: 1 });
    expect(justified.abilities.decisionsApproved).toMatchObject({ value: 0, of: 1 });
    const rowId = `decision.srv_bringup.${raid.id}`;
    expect(justified.rows.decisions.find((r) => r.id === rowId)!.level).toBe('verified');
    const approved = asDrafter({ team: team({ srv_bringup: { ...empty(), fields: { [k]: 'raid10', [`${k}:by`]: 'me', [`${k}:at`]: String(T0), ...answers } } }, [{ courseId: course.id, teamId: 't', deliverableId: 'srv_bringup', status: 'approved', changedBy: 'them', role: role, at: T0, version: 1 }]) });
    expect(approved.abilities.decisionsApproved).toMatchObject({ value: 1, of: 1 });
    expect(approved.rows.decisions.find((r) => r.id === rowId)!.level).toBe('reviewed');
  });
});

describe('R132 — retention, velocity, on time and the flag history read off stamps the page hands in', () => {
  // Two tasks that share a skill, each with a verifiable step.
  const tally = new Map<string, string[]>();
  for (const t of own) if (verifiableSteps(t.steps.filter((s) => !s.optional)).length > 0) for (const id of registry.SKILL_OF[t.id] ?? []) tally.set(id, [...(tally.get(id) ?? []), t.id]);
  const [skillId, tasks] = [...tally.entries()].find(([, ts]) => ts.length >= 2)!;
  const keys = tasks.slice(0, 2).map((taskId) => checkable.find((k) => k.startsWith(`${taskId}::`))!);

  it('a skill verified again seven or more days after its first verification is retained; the gap, never the clock', () => {
    const close = profileOf({ done: keys, evidence: { [keys[0]]: verified(keys[0], T0), [keys[1]]: verified(keys[1], T0 + 2 * DAY) } });
    const skill = close.rows.skills.find((r) => r.id === skillId)!;
    expect(skill).toMatchObject({ firstVerifiedAt: T0, lastVerifiedAt: T0 + 2 * DAY, retained: false });
    expect(close.abilities.retention).toMatchObject({ value: 0, loaded: true });
    expect(close.abilities.retention.of).toBeGreaterThanOrEqual(1);
    const apart = profileOf({ done: keys, evidence: { [keys[0]]: verified(keys[0], T0), [keys[1]]: verified(keys[1], T0 + RETENTION_DAYS * DAY) } });
    expect(apart.rows.skills.find((r) => r.id === skillId)!.retained).toBe(true);
    expect(apart.abilities.retention.value).toBeGreaterThanOrEqual(1);
    const row = apart.rows.retention.find((r) => r.id === skillId)!;
    expect(row).toMatchObject({ dimension: 'retention', label: skill.label, successes: 1, level: 'verified', firstVerifiedAt: T0 });
    expect(close.rows.retention.find((r) => r.id === skillId)!.level).toBe('practised');
  });

  it('the learning velocity is this window’s verified steps over the previous window’s, against the page clock only', () => {
    const evidence = { [keys[0]]: verified(keys[0], T0 - 3 * DAY), [keys[1]]: verified(keys[1], T0 - (VELOCITY_DAYS + 3) * DAY) };
    expect(profileOf({ done: keys, evidence }).abilities.learningVelocity.loaded, 'no clock, no velocity').toBe(false);
    expect(profileOf({ done: keys, evidence, asOf: T0 }).abilities.learningVelocity).toMatchObject({ value: 1, of: 1, loaded: true });
    expect(profileOf({ done: keys, evidence, asOf: T0 + (VELOCITY_DAYS + 1) * DAY }).abilities.learningVelocity, 'a month on: the recent step is now the prior window').toMatchObject({ value: 0, of: 1, loaded: true });
    expect(profileOf({ done: keys, evidence, asOf: T0 + 3 * VELOCITY_DAYS * DAY }).abilities.learningVelocity, 'both windows empty').toMatchObject({ value: 0, of: 0, loaded: true });
    expect(profileOf({ done: keys, evidence, asOf: T0 }).abilities.skillsCurrent.loaded).toBe(true);
  });

  it('on time reads the task’s last verification against the due date the page derives; without a calendar it is not loaded', () => {
    const evidence = { [keys[0]]: verified(keys[0], T0), [keys[1]]: verified(keys[1], T0 + 10 * DAY) };
    expect(profileOf({ done: keys, evidence }).abilities.onTime.loaded).toBe(false);
    const due = () => T0 + 5 * DAY;
    expect(profileOf({ done: keys, evidence, weekDue: due }).abilities.onTime).toMatchObject({ value: 1, of: 2, loaded: true });
    expect(profileOf({ done: keys, evidence, weekDue: () => undefined }).abilities.onTime).toMatchObject({ value: 0, of: 0, loaded: true });
    expect(profileOf({ done: keys, evidence, weekDue: due }).rows.execution.find((r) => r.id === 'exec.on-time')).toMatchObject({ uses: 2, successes: 1 });
  });

  it('the minutes between the first paste and the verification fold into the timing block; a step without both stamps is not timed', () => {
    const evidence = { [keys[0]]: verified(keys[0], T0 + 5 * 60_000, 1, T0), [keys[1]]: { ...verified(keys[1], T0 + 90 * 60_000, 2, T0), firstAttemptAt: undefined } };
    expect(profileOf({ done: keys, evidence }).timing).toEqual({ timedSteps: 1, medianMinutes: 5, withinHour: 1, over24h: 0 });
    expect(profileOf().timing).toEqual({ timedSteps: 0, medianMinutes: null, withinHour: 0, over24h: 0 });
  });

  it('stuck flags cleared over raised, from the member’s own history; the peer review queue when the page hands it in', () => {
    const [taskId, stepId] = keys[0].split('::');
    const flags = [
      { courseId: course.id, memberId: 'me', taskId, stepId, kind: 'raised' as const, at: T0 },
      { courseId: course.id, memberId: 'me', taskId, stepId, kind: 'cleared' as const, at: T0 + 1 },
      { courseId: course.id, memberId: 'me', taskId, stepId: 'other', kind: 'raised' as const, at: T0 + 2 },
      { courseId: course.id, memberId: 'them', taskId, stepId, kind: 'raised' as const, at: T0 },
    ];
    expect(profileOf({ own: { notes: [], reports: [] } }).abilities.flagsCleared.loaded).toBe(false);
    const p = profileOf({ own: { notes: [], reports: [], flagEvents: flags, peerReviews: { done: 2, assigned: 3 } } });
    expect(p.abilities.flagsCleared).toMatchObject({ value: 1, of: 2, loaded: true });
    expect(p.abilities.peerReviewsGiven).toMatchObject({ value: 2, of: 3, loaded: true });
    expect(p.rows.troubleshooting.find((r) => r.id === 'trouble.flags')).toMatchObject({ uses: 2, successes: 1 });
  });

  it('review marks are read per category on the role’s forms when handed in', () => {
    const marks = [
      { courseId: course.id, teamId: 't', deliverableId: 'srv_bringup', week: 1, category: 'completeness' as const, ok: true, note: '', reviewer: 'Ivy', at: T0 },
      { courseId: course.id, teamId: 't', deliverableId: 'srv_bringup', week: 1, category: 'correctness' as const, ok: false, note: 'x', reviewer: 'Ivy', at: T0 },
    ];
    expect(profileOf({ team: team({}) }).abilities.reviewMarks.loaded).toBe(false);
    expect(profileOf({ team: { ...team({}), marks } }).abilities.reviewMarks).toMatchObject({ value: 1, of: 2, loaded: true });
  });
});

describe('R132 — every fact row keeps its invariants', () => {
  it('uses ≥ successes, a level that follows them, and the forms of a row exist', () => {
    const ids = new Set(deliverables.map((d: DeliverableDef) => d.id));
    const p = profileOf({ team: team({}), own: { notes: [], reports: [], flagEvents: [] }, asOf: T0, weekDue: () => T0 });
    for (const dim of ['troubleshooting', 'decisions', 'retention', 'execution'] as const) {
      for (const r of p.rows[dim]) {
        expect(r.dimension).toBe(dim);
        expect(r.uses, `${r.id} uses`).toBeGreaterThanOrEqual(r.successes ?? 0);
        expect(r.level).toBe((r.uses ?? 0) <= 0 ? 'not-started' : (r.successes ?? 0) <= 0 ? 'practised' : r.deliverablesApproved > 0 ? 'reviewed' : 'verified');
        for (const id of r.deliverables) expect(ids.has(id), `${r.id} form ${id}`).toBe(true);
      }
    }
  });
});

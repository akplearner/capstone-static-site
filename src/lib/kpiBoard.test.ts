import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { KPI_BOARD_SCHEMA, defaultMeasure, kpiBoard, profileCoverage, profileMeasure, sumKpi, workRoleMeasure, type KpiBoardInput } from './kpiBoard';
import { skillProfile, type SkillProfileInput } from './skillProfile';
import { courseDto } from './content/dto';
import { certOf, deliverablesOf, skillsOf } from './content/read';
import { sampleProfiles } from './content/profiles';
import { ONTOLOGY_VERSION } from './docs/ontology';
import { KPIS } from './docs/kpis';
import { verifiableSteps } from './evidenceLedger';
import { getTasksByRole, isSetupWeek } from './course-helpers';
import { validate, type JsonSchema } from './schema/validate';
import type { StepEvidence } from './data/types';
import type { DeliverableStatus } from './docs/lifecycle';

/**
 * R108 — the board is sixteen honest ratios: value never exceeds the
 * denominator, a percentage stays in 0..100, a team fact says when it was
 * not loaded, a verification never lowers an own-fact value, and the DTO
 * validates against its published schema.
 */
const doc = courseDto('security-plus');
const course = doc.course;
const role = 'blue';
const registry = skillsOf(doc);
const cert = certOf(doc);
const deliverables = deliverablesOf(doc);
const schema = JSON.parse(readFileSync(resolve(process.cwd(), 'content', 'schemas', 'kpi-board.schema.json'), 'utf8')) as JsonSchema;
const own = getTasksByRole(course, role).filter((t) => !isSetupWeek(course, t.week));
const checkable = own.flatMap((t) => verifiableSteps(t.steps.filter((s) => !s.optional)).map((s) => `${t.id}::${s.id}`));

const verified = (k: string, at: number, attempts = 1): StepEvidence => {
  const [taskId, stepId] = k.split('::');
  return { courseId: course.id, taskId, stepId, verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts, firstAttemptAt: at - 10, verifiedAt: at };
};

function profileOf(over: Partial<SkillProfileInput> & { done?: string[] } = {}) {
  const done = new Set(over.done ?? []);
  return skillProfile({ course, role, memberId: 'me', isStepDone: (t, s) => done.has(`${t}::${s}`), evidence: {}, artifacts: [], registry, cert, deliverables, ...over });
}

const measure = workRoleMeasure(registry.WORK_ROLES.find((w) => w.id === registry.WORK_ROLE_OF[role][0])!);
const boardOf = (profile: ReturnType<typeof profileOf>, over: Partial<KpiBoardInput> = {}) =>
  kpiBoard({ profile, registry, cert, measure, outcome: { capstoneFiled: false, weeksCleared: 0, weeksTotal: 4 }, ontologyVersion: ONTOLOGY_VERSION, ...over });

describe('kpiBoard', () => {
  it('is twenty-eight values in registry order, validates against the schema, and names the work roles and the measure', () => {
    const board = boardOf(profileOf());
    expect(board.schema).toBe(KPI_BOARD_SCHEMA);
    expect(board.kpis.map((k) => k.id)).toEqual(KPIS.map((k) => k.id));
    expect(board.kpis.map((k) => k.metricId)).toEqual(KPIS.map((k) => k.metricId));
    expect(validate(board, schema)).toEqual([]);
    expect(board.workRoles).toEqual(registry.WORK_ROLE_OF[role]);
    expect(board.measuredAgainst.kind).toBe('work-role');
    expect(board.measuredAgainst.required).toBe(measure.requiredCompetencies.length);
    expect(board.measuredAgainst.untaught).toBeGreaterThan(0);
    expect(board.measuredAgainst.untaught).toBeLessThan(board.measuredAgainst.required);
    for (const k of board.kpis) {
      expect(k.value, k.id).toBeLessThanOrEqual(k.of);
      expect(k.pct, k.id).toBeGreaterThanOrEqual(0);
      expect(k.pct, k.id).toBeLessThanOrEqual(100);
      expect(k.pct).toBe(k.of > 0 ? Math.round((100 * k.value) / k.of) : 0);
    }
    expect(board.kpis.find((k) => k.id === 'kpi.execution.first-try')?.beside).toEqual({ value: 0, of: 0 });
    expect(board.kpis.filter((k) => k.beside).length).toBe(1);
  });

  // R132: four own facts need something beyond the ticks and pastes: the flag history, the review queue, the cohort calendar and the page clock.
  const NEEDS_MORE = ['kpi.problem-solving.flags-cleared', 'kpi.teamwork.peer-reviews-given', 'kpi.professionalism.on-time', 'kpi.growth.learning-velocity'];
  const EVERYTHING = { team: { docs: {}, status: [] as DeliverableStatus[], submissions: [], reviews: [], currentWeek: 1 }, own: { notes: [], reports: [], flagEvents: [], peerReviews: { done: 0, assigned: 0 } }, asOf: 10_000_000, weekDue: () => 9_000_000 };

  it('team facts read as not loaded without the team, own facts that need more say so, and everything loads once it is handed in', () => {
    const alone = boardOf(profileOf());
    for (const k of alone.kpis) expect(k.loaded, k.id).toBe(k.fact !== 'team' && !NEEDS_MORE.includes(k.id));
    const withTeam = boardOf(profileOf({ team: EVERYTHING.team }));
    for (const k of withTeam.kpis) expect(k.loaded, k.id).toBe(!NEEDS_MORE.includes(k.id));
    const all = boardOf(profileOf(EVERYTHING));
    for (const k of all.kpis) expect(k.loaded, k.id).toBe(true);
    expect(all.scores.map((s) => s.id)).toEqual(registry.SCORING.map((s) => s.id));
    for (const s of all.scores) {
      expect(s.value).toBeGreaterThanOrEqual(0);
      expect(s.value).toBeLessThanOrEqual(100);
      expect(s.components.map((c) => c.kpi)).toEqual(registry.SCORING.find((d) => d.id === s.id)!.components.map((c) => c.kpi));
    }
    expect(all.timing).toEqual({ timedSteps: 0, medianMinutes: null, withinHour: 0, over24h: 0 });
  });

  it('R132: the minutes between two stamps ride on the board as the median, and the scores stand only on components with a denominator', () => {
    const keys = checkable.slice(0, 3);
    const evidence = Object.fromEntries(keys.map((k, i) => [k, { ...verified(k, 1_000_000 + 60_000 * [5, 30, 3000][i]), firstAttemptAt: 1_000_000 }]));
    const board = boardOf(profileOf({ done: keys, evidence }));
    expect(board.timing).toEqual({ timedSteps: 3, medianMinutes: 18, withinHour: 2, over24h: 1 });
    const ttr = board.kpis.find((k) => k.id === 'kpi.problem-solving.time-to-resolution')!;
    expect(ttr).toMatchObject({ unit: 'minutes', value: 18, of: 3, pct: 67, loaded: true });
    const judgment = board.scores.find((s) => s.id === 'score.judgment')!;
    expect(judgment, 'team facts not handed in: the score stands on nothing').toMatchObject({ loaded: false, counted: 0, value: 0 });
    const tool = board.scores.find((s) => s.id === 'score.tool-proficiency')!;
    expect(tool.loaded).toBe(true);
    expect(tool.counted).toBeGreaterThan(0);
    for (const c of tool.components) if (c.counted) expect(c.pct).toBe(board.kpis.find((k) => k.id === c.kpi)!.pct);
  });

  it('verifying a step raises skills verified, exam weight, coverage and commands, and proving a skill on two tasks counts it once', () => {
    const find = (board: ReturnType<typeof boardOf>, id: string) => board.kpis.find((k) => k.id === id)!;
    const empty = boardOf(profileOf());
    expect(find(empty, 'kpi.technical.skills-verified').value).toBe(0);
    expect(find(empty, 'kpi.technical.skills-verified').of).toBeGreaterThan(0);
    expect(find(empty, 'kpi.technical.exam-weight-verified').of).toBeGreaterThan(0);
    // A skill two tasks of the role practise, each with a verifiable step.
    const tally = new Map<string, string[]>();
    for (const t of own) if (verifiableSteps(t.steps.filter((s) => !s.optional)).length > 0) for (const id of registry.SKILL_OF[t.id] ?? []) tally.set(id, [...(tally.get(id) ?? []), t.id]);
    const twice = [...tally.entries()].find(([, tasks]) => tasks.length >= 2);
    expect(twice, 'a skill the role proves on two tasks').toBeDefined();
    const [skillId, tasks] = twice!;
    const keys = tasks.slice(0, 2).map((taskId) => checkable.find((k) => k.startsWith(`${taskId}::`))!);
    const one = boardOf(profileOf({ done: [keys[0]], evidence: { [keys[0]]: verified(keys[0], 100) } }));
    expect(find(one, 'kpi.technical.skills-verified').value).toBeGreaterThanOrEqual(1);
    expect(find(one, 'kpi.technical.exam-weight-verified').value).toBeGreaterThan(0);
    expect(find(one, 'kpi.growth.skills-transferred')).toMatchObject({ value: 0 });
    expect(find(one, 'kpi.execution.first-try')).toMatchObject({ value: 1, of: 1 });
    const both = boardOf(profileOf({ done: keys, evidence: { [keys[0]]: verified(keys[0], 100), [keys[1]]: verified(keys[1], 200, 2) } }));
    expect(find(both, 'kpi.growth.skills-transferred').value).toBe(1);
    expect(find(both, 'kpi.execution.first-try')).toMatchObject({ value: 1, of: 2, beside: { value: 1, of: 2 } });
    expect(both.measuredAgainst.required).toBe(empty.measuredAgainst.required);
    if (measure.requiredCompetencies.includes(skillId)) expect(find(both, 'kpi.growth.profile-coverage').value).toBeGreaterThanOrEqual(1);
  });

  it('profileCoverage counts verified required ids and names the untaught ones; profileMeasure picks the matching work roles', () => {
    const p = profileOf();
    const ids = p.rows.skills.map((r) => r.id);
    expect(profileCoverage([ids[0], 'comp.nowhere.x', ids[0]], p.rows.skills)).toEqual({ value: 0, of: 2, untaught: 1 });
    const [sample] = sampleProfiles();
    const m = profileMeasure(sample, [sample.workRoles[0].workRole]);
    expect(m.kind).toBe('profile');
    expect(m.requiredCompetencies).toEqual([...sample.workRoles[0].requiredCompetencies].sort());
    const all = profileMeasure(sample, ['role.nobody']);
    expect(all.requiredCompetencies.length).toBeGreaterThanOrEqual(m.requiredCompetencies.length);
    const board = boardOf(p, { measure: m });
    expect(board.measuredAgainst).toMatchObject({ kind: 'profile', id: sample.id, required: m.requiredCompetencies.length });
  });

  it('invariants over random facts: value ≤ of, pct in range, and a verification never lowers an own-fact value', () => {
    let seed = 11;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    const OWN = ['kpi.technical.skills-verified', 'kpi.technical.exam-weight-verified', 'kpi.growth.profile-coverage', 'kpi.growth.skills-transferred', 'kpi.technical.commands-verified', 'kpi.execution.evidence-named'];
    for (let i = 0; i < 200; i++) {
      const done = checkable.filter(() => rand() < 0.5);
      const evidence: Record<string, StepEvidence> = {};
      for (const k of done) if (rand() < 0.6) evidence[k] = verified(k, Math.floor(rand() * 1000), rand() < 0.5 ? 1 : 2);
      const team = rand() < 0.5 ? { docs: {}, status: [] as DeliverableStatus[], submissions: [], reviews: [], currentWeek: 1 + Math.floor(rand() * 4) } : undefined;
      const board = boardOf(profileOf({ done, evidence, team }));
      expect(validate(board, schema)).toEqual([]);
      for (const k of board.kpis) {
        expect(k.value, k.id).toBeLessThanOrEqual(k.of);
        expect(k.pct).toBeGreaterThanOrEqual(0);
        expect(k.pct).toBeLessThanOrEqual(100);
        if (k.fact === 'team') expect(k.loaded).toBe(!!team);
      }
      const extra = done.find((k) => !evidence[k]);
      if (!extra) continue;
      const more = boardOf(profileOf({ done, evidence: { ...evidence, [extra]: verified(extra, 50) }, team }));
      for (const id of OWN) expect(more.kpis.find((k) => k.id === id)!.value, id).toBeGreaterThanOrEqual(board.kpis.find((k) => k.id === id)!.value);
      for (const id of ['kpi.execution.steps-in-order', 'kpi.execution.first-try']) {
        const k = more.kpis.find((x) => x.id === id)!;
        expect(k.value, id).toBeLessThanOrEqual(k.of);
      }
    }
  });

  // R109: the default measure every surface starts from, and the cross-course sum the dashboard prints.
  it('defaultMeasure is the role’s first work role, and a sentinel with no requirements when none is mapped', () => {
    expect(defaultMeasure(registry, role)).toEqual(measure);
    const none = defaultMeasure(registry, 'nobody');
    expect(none).toEqual({ kind: 'work-role', id: 'role.none', label: '—', requiredCompetencies: [] });
    expect(boardOf(profileOf(), { measure: none }).measuredAgainst).toEqual({ kind: 'work-role', id: 'role.none', label: '—', required: 0, untaught: 0 });
  });

  it('sumKpi adds value and denominator across boards, leaves a board whose row was not loaded out, and says so', () => {
    const a = boardOf(profileOf({ done: [checkable[0]], evidence: { [checkable[0]]: verified(checkable[0], 1_000) } }));
    const b = boardOf(profileOf({ done: checkable.slice(0, 3), evidence: Object.fromEntries(checkable.slice(0, 3).map((k, i) => [k, verified(k, 1_000 + i)])) }));
    const id = 'kpi.technical.commands-verified';
    const ka = a.kpis.find((k) => k.id === id)!;
    const kb = b.kpis.find((k) => k.id === id)!;
    expect(sumKpi([a, b], id)).toEqual({ value: ka.value + kb.value, of: ka.of + kb.of, loaded: true });
    expect(sumKpi([], id)).toEqual({ value: 0, of: 0, loaded: true });
    const alone = boardOf(profileOf());
    const withTeam = boardOf(profileOf({ team: { docs: {}, status: [], submissions: [], reviews: [], currentWeek: 1 } }));
    const teamFact = 'kpi.execution.dod-met';
    expect(alone.kpis.find((k) => k.id === teamFact)!.loaded).toBe(false);
    const kt = withTeam.kpis.find((k) => k.id === teamFact)!;
    expect(sumKpi([alone, withTeam], teamFact)).toEqual({ value: kt.value, of: kt.of, loaded: false });
    expect(sumKpi([withTeam], 'kpi.nobody')).toEqual({ value: 0, of: 0, loaded: false });
  });

  // R111: the role's own share of each attributable team fact.
  it('contribution sits on exactly the six attributable team KPIs once the team is handed in, bounded by the value, and equals it where the count is already the role’s own', () => {
    const SEVEN = ['kpi.technical.procedures-to-standard', 'kpi.execution.dod-met', 'kpi.teamwork.handoffs', 'kpi.professionalism.document-control', 'kpi.professionalism.controls-cited', 'kpi.professionalism.instructor-approved'];
    const alone = boardOf(profileOf());
    expect(alone.kpis.filter((k) => k.contribution), 'nothing attributed without the team').toEqual([]);
    const withTeam = boardOf(profileOf({ done: checkable.slice(0, 2), evidence: Object.fromEntries(checkable.slice(0, 2).map((k, i) => [k, verified(k, 1_000 + i)])), team: { docs: {}, status: [], submissions: [], reviews: [], currentWeek: 1 } }));
    expect(withTeam.kpis.filter((k) => k.contribution).map((k) => k.id)).toEqual(SEVEN);
    for (const k of withTeam.kpis.filter((x) => x.contribution)) {
      expect(k.contribution!.value, k.id).toBeLessThanOrEqual(k.value);
      expect(k.contribution!.of, k.id).toBeLessThanOrEqual(k.of);
    }
    for (const id of ['kpi.professionalism.controls-cited', 'kpi.teamwork.handoffs']) {
      const k = withTeam.kpis.find((x) => x.id === id)!;
      expect(k.contribution, id).toEqual({ value: k.value, of: k.of });
    }
    expect(withTeam.kpis.find((k) => k.id === 'kpi.decision-making.decisions-recorded')?.contribution, 'a decision is already the member’s own').toBeUndefined();
    expect(validate(withTeam, schema)).toEqual([]);
  });
});

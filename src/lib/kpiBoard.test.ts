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
  it('is sixteen values in registry order, validates against the schema, and names the work roles and the measure', () => {
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

  it('team facts read as not loaded without the team, and as loaded with it; own facts always load', () => {
    const alone = boardOf(profileOf());
    for (const k of alone.kpis) expect(k.loaded, k.id).toBe(k.fact !== 'team');
    const status: DeliverableStatus[] = [];
    const withTeam = boardOf(profileOf({ team: { docs: {}, status, submissions: [], reviews: [], currentWeek: 1 } }));
    for (const k of withTeam.kpis) expect(k.loaded, k.id).toBe(true);
    const filed = boardOf(profileOf({ team: { docs: {}, status, submissions: [], reviews: [], currentWeek: 1 } }), { outcome: { capstoneFiled: true, weeksCleared: 4, weeksTotal: 4 } });
    expect(filed.kpis.find((k) => k.id === 'kpi.outcome.capstone-filed')).toMatchObject({ value: 1, of: 1, pct: 100, loaded: true });
  });

  it('verifying a step raises skills verified, exam weight, coverage and commands, and proving a skill on two tasks counts it once', () => {
    const find = (board: ReturnType<typeof boardOf>, id: string) => board.kpis.find((k) => k.id === id)!;
    const empty = boardOf(profileOf());
    expect(find(empty, 'kpi.ability.skills-verified').value).toBe(0);
    expect(find(empty, 'kpi.ability.skills-verified').of).toBeGreaterThan(0);
    expect(find(empty, 'kpi.ability.exam-weight-verified').of).toBeGreaterThan(0);
    // A skill two tasks of the role practise, each with a verifiable step.
    const tally = new Map<string, string[]>();
    for (const t of own) if (verifiableSteps(t.steps.filter((s) => !s.optional)).length > 0) for (const id of registry.SKILL_OF[t.id] ?? []) tally.set(id, [...(tally.get(id) ?? []), t.id]);
    const twice = [...tally.entries()].find(([, tasks]) => tasks.length >= 2);
    expect(twice, 'a skill the role proves on two tasks').toBeDefined();
    const [skillId, tasks] = twice!;
    const keys = tasks.slice(0, 2).map((taskId) => checkable.find((k) => k.startsWith(`${taskId}::`))!);
    const one = boardOf(profileOf({ done: [keys[0]], evidence: { [keys[0]]: verified(keys[0], 100) } }));
    expect(find(one, 'kpi.ability.skills-verified').value).toBeGreaterThanOrEqual(1);
    expect(find(one, 'kpi.ability.exam-weight-verified').value).toBeGreaterThan(0);
    expect(find(one, 'kpi.ability.skills-transferred')).toMatchObject({ value: 0 });
    expect(find(one, 'kpi.execution.first-try')).toMatchObject({ value: 1, of: 1 });
    const both = boardOf(profileOf({ done: keys, evidence: { [keys[0]]: verified(keys[0], 100), [keys[1]]: verified(keys[1], 200, 2) } }));
    expect(find(both, 'kpi.ability.skills-transferred').value).toBe(1);
    expect(find(both, 'kpi.execution.first-try')).toMatchObject({ value: 1, of: 2, beside: { value: 1, of: 2 } });
    expect(both.measuredAgainst.required).toBe(empty.measuredAgainst.required);
    if (measure.requiredCompetencies.includes(skillId)) expect(find(both, 'kpi.ability.profile-coverage').value).toBeGreaterThanOrEqual(1);
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
    const OWN = ['kpi.ability.skills-verified', 'kpi.ability.exam-weight-verified', 'kpi.ability.profile-coverage', 'kpi.ability.skills-transferred', 'kpi.execution.commands-verified', 'kpi.execution.evidence-named'];
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
    const id = 'kpi.execution.commands-verified';
    const ka = a.kpis.find((k) => k.id === id)!;
    const kb = b.kpis.find((k) => k.id === id)!;
    expect(sumKpi([a, b], id)).toEqual({ value: ka.value + kb.value, of: ka.of + kb.of, loaded: true });
    expect(sumKpi([], id)).toEqual({ value: 0, of: 0, loaded: true });
    const alone = boardOf(profileOf());
    const withTeam = boardOf(profileOf({ team: { docs: {}, status: [], submissions: [], reviews: [], currentWeek: 1 } }), { outcome: { capstoneFiled: true, weeksCleared: 1, weeksTotal: 4 } });
    const filed = 'kpi.outcome.capstone-filed';
    expect(alone.kpis.find((k) => k.id === filed)!.loaded).toBe(false);
    expect(sumKpi([alone, withTeam], filed)).toEqual({ value: 1, of: 1, loaded: false });
    expect(sumKpi([withTeam], 'kpi.nobody')).toEqual({ value: 0, of: 0, loaded: false });
  });
});

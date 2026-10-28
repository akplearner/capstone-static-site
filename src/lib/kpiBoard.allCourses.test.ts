import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SEED_COURSES } from './content/dto';
import { defaultMeasure, kpiBoard, type KpiValue } from './kpiBoard';
import { skillProfile } from './skillProfile';
import { decisionBlocksOf } from './docs/types';
import { fullMemberInput as inputFor } from './kpiBoard.allCourses.fixture';
import { ONTOLOGY_VERSION } from './docs/ontology';
import { validate, type JsonSchema } from './schema/validate';

/**
 * R137 — every course × every role through the whole pipeline, with a member who did EVERYTHING the
 * course offers: every checkable step verified, every form filled past its seed rows, every decision
 * chosen by the drafter, every form approved, a calendar, a review queue, a flag raised and cleared.
 *
 * What it proves: no NaN, every ratio bounded, every score loaded or honestly not, and — the point —
 * every KPI either measured or `notMeasured: 'role'` with the course named below. The allow-list is
 * the content debt R138 pays off; the only entries meant to stay are the decision KPIs of the roles
 * that do not draft the decision form (the owner's decision: decisions are the drafter's).
 */
const schema = JSON.parse(readFileSync(resolve(process.cwd(), 'content', 'schemas', 'kpi-board.schema.json'), 'utf8')) as JsonSchema;
/**
 * The content debt, per course and role: KPIs the course gives the role nothing to measure. R138 authors
 * what empties this list, except the decision KPIs of the roles that do not draft the decision form.
 */
const DECISIONS = ['kpi.decision-making.decisions-recorded', 'kpi.decision-making.decisions-justified', 'kpi.decision-making.decisions-approved'];
const ALLOW: Record<string, Record<string, string[]>> = JSON.parse(readFileSync(resolve(process.cwd(), 'src', 'lib', 'kpiBoard.allCourses.allow.json'), 'utf8'));

describe('R137 — every course, every role, through skillProfile → kpiBoard → scores', () => {
  const cases = SEED_COURSES.flatMap((c) => c.roles.map((r) => [c.id, r.id] as const));
  it.each(cases)('%s / %s: every KPI bounded and either measured or named as not measured for the role', (courseId, role) => {
    const input = inputFor(courseId, role);
    const profile = skillProfile(input);
    const board = kpiBoard({ profile, registry: input.registry, cert: input.cert, measure: defaultMeasure(input.registry, role), outcome: { capstoneFiled: true, weeksCleared: 4, weeksTotal: 4 }, ontologyVersion: ONTOLOGY_VERSION });
    expect(validate(board, schema)).toEqual([]);
    const notMeasured: string[] = [];
    for (const k of board.kpis) {
      expect(Number.isFinite(k.value) && Number.isFinite(k.of) && Number.isFinite(k.pct), k.id).toBe(true);
      expect(k.loaded, `${k.id} loaded`).toBe(true);
      if (k.unit === 'ratio') expect(k.value, k.id).toBeLessThanOrEqual(k.of);
      expect(k.pct, k.id).toBeLessThanOrEqual(100);
      if (k.applies) expect(k.unit === 'count' || k.of > 0, `${k.id} applies but has no denominator`).toBe(true);
      else {
        expect(k.notMeasured, `${k.id} not measured without a reason`).toBeDefined();
        expect(k.of, `${k.id} not measured yet has a denominator`).toBe(0);
        notMeasured.push(k.id);
      }
    }
    // A decision belongs to the drafter of the decision form; everyone else reads not measured, by design.
    const drafts = input.deliverables.some((d) => decisionBlocksOf(d).length > 0 && (d.raci?.drafts === role || d.owner === role));
    for (const id of DECISIONS) expect(notMeasured.includes(id), `${id} for ${role}`).toBe(!drafts);
    const debt = notMeasured.filter((id) => !DECISIONS.includes(id)).sort();
    expect(debt, `content debt for ${courseId}/${role} (update kpiBoard.allCourses.allow.json only when R138 pays it off)`).toEqual([...(ALLOW[courseId]?.[role] ?? [])].sort());
    // Every score stands on something, except Judgment for a role with nothing to decide and no change table.
    for (const s of board.scores) {
      const components = s.components.filter((c) => !notMeasured.includes(c.kpi));
      expect(s.loaded, `${s.id} loaded`).toBe(components.length > 0);
      expect(s.counted, `${s.id} counted`).toBe(components.length);
    }
  });

  it('names a reason on a member who did nothing: yet, not role, wherever the course offers something', () => {
    const input = inputFor('server-plus', 'net');
    const profile = skillProfile({ ...input, evidence: {}, isStepDone: () => false, team: { ...input.team!, docs: {}, status: [], reviews: [] }, own: { notes: [], reports: [], flagEvents: [], peerReviews: { done: 0, assigned: 0 } } });
    const board = kpiBoard({ profile, registry: input.registry, cert: input.cert, measure: defaultMeasure(input.registry, 'net'), outcome: { capstoneFiled: false, weeksCleared: 0, weeksTotal: 4 }, ontologyVersion: ONTOLOGY_VERSION });
    const by = (id: string) => board.kpis.find((k) => k.id === id) as KpiValue;
    expect(by('kpi.technical.skills-verified')).toMatchObject({ applies: true, value: 0 });
    for (const id of ['kpi.execution.first-try', 'kpi.problem-solving.time-to-resolution', 'kpi.teamwork.peer-reviews-given', 'kpi.growth.learning-velocity', 'kpi.problem-solving.faults-resolved']) expect(by(id), id).toMatchObject({ applies: false, notMeasured: 'yet' });
    expect(by('kpi.teamwork.teammate-steps')).toMatchObject({ applies: true, unit: 'count' });
    // A score may stand on a measured zero (forms exist, none approved); it never stands on a row not measured.
    for (const s of board.scores) expect(s.value, s.id).toBe(0);
    for (const s of board.scores) for (const c of s.components) if (c.counted) expect(by(c.kpi).applies, c.kpi).toBe(true);
  });
});

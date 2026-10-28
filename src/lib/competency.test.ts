import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { COMPETENCY_FACETS } from './docs/competencyFacets';
import { KPIS, kpiOf } from './docs/kpis';
import { SCORES } from './docs/scoring';
import { competencyOf } from './competency';
import { validate, type JsonSchema } from './schema/validate';
import { fullMemberInput } from './kpiBoard.allCourses.fixture';
import { skillProfile } from './skillProfile';
import { defaultMeasure, kpiBoard } from './kpiBoard';
import { ONTOLOGY_VERSION } from './docs/ontology';

const schema = JSON.parse(readFileSync(resolve(process.cwd(), 'content', 'schemas', 'competency.schema.json'), 'utf8')) as JsonSchema;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const register = (text: string, at: string) => {
  expect(text, `${at}: second person`).not.toMatch(/\b(you|your|yours|we|our)\b/i);
  expect(text, `${at}: em dash or emoji`).not.toMatch(/—|\p{Extended_Pictographic}/u);
};

/** R141 — eight facets, each a lens over real KPIs with weights summing to one; the document validates. */
describe('R141 — the competency facets', () => {
  it('are eight, in the register, each reading real ratio KPIs with weights that sum to one, and the facets are not the scores', () => {
    expect(COMPETENCY_FACETS).toHaveLength(8);
    expect(new Set(COMPETENCY_FACETS.map((f) => f.id)).size).toBe(8);
    for (const f of COMPETENCY_FACETS) {
      expect(words(f.label), `${f.id} label ≤ 4 words`).toBeLessThanOrEqual(4);
      expect(words(f.definition), `${f.id} definition ≤ 25 words`).toBeLessThanOrEqual(25);
      expect(words(f.caveat), `${f.id} caveat ≤ 25 words`).toBeLessThanOrEqual(25);
      register(`${f.definition} ${f.caveat}`, f.id);
      expect(Math.round(f.components.reduce((n, c) => n + c.weight, 0) * 1000)).toBe(1000);
      for (const c of f.components) {
        const k = kpiOf(c.kpi);
        expect(k, `${f.id} reads ${c.kpi}`).toBeDefined();
        expect(k!.unit, `${c.kpi} has a denominator`).not.toBe('count');
      }
      // A facet is a lens, not a score: no facet reads exactly a score's components.
      for (const s of SCORES) expect(f.components.map((c) => c.kpi).sort().join(), `${f.id} is not ${s.id}`).not.toBe(s.components.map((c) => c.kpi).sort().join());
    }
    // Every family but the count-only rows is read by some facet.
    const read = new Set(COMPETENCY_FACETS.flatMap((f) => f.components.map((c) => c.kpi)));
    expect(new Set(KPIS.filter((k) => read.has(k.id)).map((k) => k.family)).size).toBeGreaterThanOrEqual(6);
  });

  it('computes a document that validates, counting only loaded components with a denominator', () => {
    const input = fullMemberInput('server-plus', 'net');
    const board = kpiBoard({ profile: skillProfile(input), registry: input.registry, cert: input.cert, measure: defaultMeasure(input.registry, 'net'), outcome: { capstoneFiled: true, weeksCleared: 4, weeksTotal: 4 }, ontologyVersion: ONTOLOGY_VERSION });
    const dto = competencyOf(board);
    expect(validate(dto, schema)).toEqual([]);
    expect(dto.facets.map((f) => f.id)).toEqual(COMPETENCY_FACETS.map((f) => f.id));
    for (const f of dto.facets) {
      expect(f.value).toBeGreaterThanOrEqual(0);
      expect(f.value).toBeLessThanOrEqual(100);
      expect(f.counted).toBeLessThanOrEqual(f.of);
      for (const c of f.components) expect(c.pct === null).toBe(!c.counted);
    }
    // A board with nothing loaded gives facets that stand on nothing.
    const empty = competencyOf({ courseId: 'x', role: 'r', kpis: board.kpis.map((k) => ({ ...k, loaded: false })) });
    expect(empty.facets.every((f) => !f.loaded && f.value === 0 && f.counted === 0)).toBe(true);
    // A single counted component carries the value.
    const one = competencyOf({ courseId: 'x', role: 'r', kpis: board.kpis.map((k) => (k.id === 'kpi.professionalism.on-time' ? { ...k, loaded: true, applies: true, of: 4, value: 3, pct: 75 } : { ...k, loaded: false })) });
    expect(one.facets.find((f) => f.id === 'reliability')).toMatchObject({ value: 75, counted: 1, of: 3, loaded: true });
  });
});

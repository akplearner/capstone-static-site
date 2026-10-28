import { describe, it, expect } from 'vitest';
import { DEPRECATED_KPIS, KPIS, KPI_FAMILIES, kpiOf, kpisOf } from './kpis';
import { metricOf } from './metricCatalogue';
import { SCORES } from './scoring';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const FAMILIES = ['technical', 'problem-solving', 'execution', 'decision-making', 'teamwork', 'professionalism', 'growth', 'validation'];

/**
 * R108/R132/R140 — the KPI board is exactly thirty-two, eight families of four,
 * every row a catalogue metric with a numerator and a denominator in words,
 * in the register; a scored row is read by a published score and a minutes
 * row is the one timing row; the sixteen R108 ids are deprecated, never gone.
 */
describe('R132 — the KPI board registry', () => {
  it('is eight families of four, in board order, with unique ids that resolve', () => {
    expect(KPI_FAMILIES.map((f) => f.id)).toEqual(FAMILIES);
    expect(KPIS.length).toBe(32);
    expect(new Set(KPIS.map((k) => k.id)).size).toBe(32);
    for (const f of FAMILIES) expect(kpisOf(f as never).length, f).toBe(4);
    expect(KPIS.map((k) => k.family)).toEqual(FAMILIES.flatMap((f) => [f, f, f, f]));
    KPIS.forEach((k, i) => {
      expect(k.id).toMatch(/^kpi\.(technical|problem-solving|execution|decision-making|teamwork|professionalism|growth|validation)\.[a-z][a-z0-9-]*$/);
      expect(k.id.startsWith(`kpi.${k.family}.`)).toBe(true);
      expect(k.agentField).toBe(`/kpis/${i}`);
      expect(kpiOf(k.id)).toBe(k);
    });
  });

  it('every KPI reads a catalogue row that is computed today; a scored KPI is read by a published score and the catalogue row says so', () => {
    const read = new Set(SCORES.flatMap((s) => s.components.map((c) => c.kpi)));
    for (const k of KPIS) {
      const m = metricOf(k.metricId);
      expect(m, `${k.id} reads ${k.metricId}`).toBeDefined();
      expect(m!.status, `${k.id}: ${k.metricId} is readable today`).toBe('computed');
      expect(['own', 'team', 'content']).toContain(k.fact);
      expect(['ratio', 'count', 'minutes']).toContain(k.unit);
      expect(k.valueTo.length).toBeGreaterThan(0);
      expect(k.scored, `${k.id} scored iff a score reads it`).toBe(read.has(k.id));
      if (k.scored) expect(m!.scored, `${k.id}: ${k.metricId} is marked scored in the catalogue`).toBe(true);
      if (k.unit === 'minutes') expect(m!.timing, `${k.id}: a minutes row is a timing row`).toBe(true);
    }
    expect(KPIS.filter((k) => k.beside).map((k) => k.id)).toEqual(['kpi.execution.first-try']);
    expect(KPIS.filter((k) => k.unit === 'minutes').map((k) => k.id)).toEqual(['kpi.problem-solving.time-to-resolution']);
    expect(KPIS.filter((k) => k.unit === 'count').map((k) => k.id)).toEqual(['kpi.teamwork.teammate-steps', 'kpi.validation.time-on-task']);
    for (const c of SCORES.flatMap((s) => s.components)) expect(kpiOf(c.kpi)?.unit, `${c.kpi} feeds a score`).not.toBe('count');
  });

  it('keeps the sixteen R108 ids as deprecated, each pointing at the row that carries its count now', () => {
    expect(DEPRECATED_KPIS.length).toBe(16);
    expect(new Set(DEPRECATED_KPIS.map((d) => d.id)).size).toBe(16);
    for (const d of DEPRECATED_KPIS) {
      expect(d.id).toMatch(/^kpi\.(ability|execution|procedure|outcome)\./);
      expect(d.deprecatedIn).toBe('2.0.0');
      if (d.replacedBy) expect(kpiOf(d.replacedBy), `${d.id} → ${d.replacedBy}`).toBeDefined();
    }
    expect(DEPRECATED_KPIS.filter((d) => d.replacedBy === null).map((d) => d.id)).toEqual(['kpi.outcome.rubric-green', 'kpi.outcome.capstone-filed']);
  });

  it('keeps the budgets and the register, and never ranks a member or hands out a badge', () => {
    for (const f of KPI_FAMILIES) {
      expect(words(f.label), `${f.id} label ≤ 5 words`).toBeLessThanOrEqual(5);
      expect(words(f.definition), `${f.id} definition ≤ 25 words`).toBeLessThanOrEqual(25);
      expect(words(f.asks), `${f.id} asks ≤ 25 words`).toBeLessThanOrEqual(25);
    }
    for (const k of KPIS) {
      expect(words(k.label), `${k.id} label ≤ 5 words`).toBeLessThanOrEqual(5);
      for (const [name, text] of [['numerator', k.numerator], ['denominator', k.denominator], ['whyMember', k.whyMember], ['whyCompany', k.whyCompany]] as const) {
        expect(words(text), `${k.id} ${name} ≤ 25 words`).toBeLessThanOrEqual(25);
        expect(text, `${k.id} ${name}: second person`).not.toMatch(/\b(you|your|yours|we|our)\b/i);
        expect(text, `${k.id} ${name}: em dash or emoji`).not.toMatch(/—|\p{Extended_Pictographic}/u);
        expect(text, `${k.id} ${name}: contraction`).not.toMatch(/\b\w+n[’']t\b|\b\w+[’'](re|ll|ve|m)\b|\b(it|that|what|there|here)[’']s\b/i);
        expect(text, `${k.id} ${name}: rank or badge`).not.toMatch(/\b(rank|ranking|leaderboard|badge|badges|points|XP)\b/i);
      }
    }
  });
});

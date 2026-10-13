import { describe, it, expect } from 'vitest';
import { KPIS, KPI_FAMILIES, kpiOf, kpisOf } from './kpis';
import { metricOf } from './metricCatalogue';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const FAMILIES = ['ability', 'execution', 'procedure', 'outcome'];

/**
 * R108 — the KPI board is exactly sixteen, four families of four, every row
 * a catalogue metric with a numerator and a denominator in words, never a
 * Time row, never scored, and in the register.
 */
describe('R108 — the KPI board registry', () => {
  it('is four families of four, in board order, with unique ids that resolve', () => {
    expect(KPI_FAMILIES.map((f) => f.id)).toEqual(FAMILIES);
    expect(KPIS.length).toBe(16);
    expect(new Set(KPIS.map((k) => k.id)).size).toBe(16);
    for (const f of FAMILIES) expect(kpisOf(f as never).length, f).toBe(4);
    expect(KPIS.map((k) => k.family)).toEqual(FAMILIES.flatMap((f) => [f, f, f, f]));
    KPIS.forEach((k, i) => {
      expect(k.id).toMatch(/^kpi\.(ability|execution|procedure|outcome)\.[a-z][a-z0-9-]*$/);
      expect(k.id.startsWith(`kpi.${k.family}.`)).toBe(true);
      expect(k.agentField).toBe(`/kpis/${i}`);
      expect(kpiOf(k.id)).toBe(k);
    });
  });

  it('every KPI reads a catalogue row that is computed today and never a Time row', () => {
    for (const k of KPIS) {
      const m = metricOf(k.metricId);
      expect(m, `${k.id} reads ${k.metricId}`).toBeDefined();
      expect(m!.status, `${k.id}: ${k.metricId} is readable today`).toBe('computed');
      expect(k.metricId.startsWith('metric.time-'), `${k.id} names a Time row`).toBe(false);
      expect(k.scored).toBe(false);
      expect(['own', 'team', 'content']).toContain(k.fact);
      expect(k.valueTo.length).toBeGreaterThan(0);
    }
    expect(KPIS.filter((k) => k.beside).map((k) => k.id)).toEqual(['kpi.execution.first-try']);
  });

  it('keeps the budgets and the register, and never names speed, rank or score', () => {
    for (const f of KPI_FAMILIES) {
      expect(words(f.label), `${f.id} label ≤ 5 words`).toBeLessThanOrEqual(5);
      expect(words(f.definition), `${f.id} definition ≤ 25 words`).toBeLessThanOrEqual(25);
    }
    for (const k of KPIS) {
      expect(words(k.label), `${k.id} label ≤ 5 words`).toBeLessThanOrEqual(5);
      for (const [name, text] of [['numerator', k.numerator], ['denominator', k.denominator], ['whyMember', k.whyMember], ['whyCompany', k.whyCompany]] as const) {
        expect(words(text), `${k.id} ${name} ≤ 25 words`).toBeLessThanOrEqual(25);
        expect(text, `${k.id} ${name}: second person`).not.toMatch(/\b(you|your|yours|we|our)\b/i);
        expect(text, `${k.id} ${name}: em dash or emoji`).not.toMatch(/—|\p{Extended_Pictographic}/u);
        expect(text, `${k.id} ${name}: contraction`).not.toMatch(/\b\w+n[’']t\b|\b\w+[’'](re|ll|ve|m)\b|\b(it|that|what|there|here)[’']s\b/i);
        expect(text, `${k.id} ${name}: speed, rank or score`).not.toMatch(/\b(time|speed|minutes|faster|slower|rank|ranking|leaderboard|badge|badges|points|score|scored|XP)\b/i);
      }
    }
  });
});

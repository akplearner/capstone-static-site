import { describe, it, expect } from 'vitest';
import { METRICS, METRIC_INPUTS, metricOf, metricsOf } from './metricCatalogue';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const DIMENSIONS = ['skills', 'tools', 'procedures', 'tactics', 'practices', 'standards', 'domains', 'evidence', 'documentation', 'collaboration', 'ability'];
const STATUSES = ['computed', 'deferred', 'needs-events', 'needs-validators', 'needs-consent', 'excluded'];

describe('R107 — the metric catalogue', () => {
  it('every metric is defined with a numerator and a denominator, reads allow-listed facts, is never scored, and keeps the register', () => {
    expect(new Set(METRICS.map((m) => m.id)).size).toBe(METRICS.length);
    for (const m of METRICS) {
      expect(m.id).toMatch(/^metric\.[a-z][a-z0-9-]*$/);
      expect(words(m.label), `${m.id} label ≤ 5 words`).toBeLessThanOrEqual(5);
      expect(words(m.definition), `${m.id} definition ≤ 30 words`).toBeLessThanOrEqual(30);
      if (m.note) expect(words(m.note), `${m.id} note ≤ 25 words`).toBeLessThanOrEqual(25);
      expect(DIMENSIONS).toContain(m.dimension);
      expect(STATUSES).toContain(m.status);
      expect(m.scored).toBe(false);
      for (const input of m.inputs) expect(METRIC_INPUTS as readonly string[], `${m.id} reads ${input}`).toContain(input);
      if (m.status === 'computed' || m.status === 'deferred') expect(m.inputs.length, `${m.id} names what it reads`).toBeGreaterThan(0);
      if (m.status === 'excluded') expect(m.valueTo, `${m.id} is worth nothing to anyone`).toEqual([]);
      else expect(m.valueTo.length, `${m.id} is worth something to someone`).toBeGreaterThan(0);
      for (const text of [m.label, m.definition, m.note ?? '']) {
        expect(text, `${m.id}: second person`).not.toMatch(/\b(you|your|yours|we|our)\b/i);
        expect(text, `${m.id}: em dash or emoji`).not.toMatch(/—|\p{Extended_Pictographic}/u);
        expect(text, `${m.id}: contraction`).not.toMatch(/\b\w+n[’']t\b|\b\w+[’'](re|ll|ve|m)\b|\b(it|that|what|there|here)[’']s\b/i);
      }
    }
  });

  it('nothing measures speed or ranks a member, except the rows that say they are excluded', () => {
    for (const m of METRICS) {
      if (m.status === 'excluded') continue;
      expect(`${m.label} ${m.definition} ${m.note ?? ''}`, m.id).not.toMatch(/\b(time|speed|minutes|faster|slower|rank|ranking|leaderboard|badge|badges|points|score|scored)\b/i);
    }
    expect(METRICS.filter((m) => m.status === 'excluded').map((m) => m.id)).toEqual(['metric.time-on-task', 'metric.time-to-verify', 'metric.time-vs-estimate', 'metric.rank-any', 'metric.time-to-competency', 'metric.time-task-vs-benchmark', 'metric.time-learning-velocity']);
  });

  it('the catalogue is extensive and honest about what is computed today', () => {
    expect(METRICS.length).toBeGreaterThanOrEqual(75);
    expect(METRICS.filter((m) => m.status === 'computed').length).toBeGreaterThanOrEqual(50);
    for (const d of DIMENSIONS) expect(metricsOf(d as never).length, `${d} has metrics`).toBeGreaterThan(0);
    expect(metricOf('metric.ability-first-try')?.note ?? metricOf('metric.ability-first-try')?.definition).toContain('persistence');
    expect(metricOf('metric.evidence-self-attested')?.definition).toContain('without matching output');
  });
});

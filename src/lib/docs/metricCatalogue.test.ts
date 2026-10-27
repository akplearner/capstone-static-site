import { describe, it, expect } from 'vitest';
import { DIMENSIONS, METRICS, METRIC_INPUTS, metricOf, metricsOf, scoredMetrics, timingMetrics } from './metricCatalogue';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const STATUSES = ['computed', 'deferred', 'needs-events', 'needs-validators', 'needs-consent', 'excluded'];

describe('R107 — the metric catalogue', () => {
  it('every metric is defined with a numerator and a denominator, reads allow-listed facts, carries its scored and timing flags, and keeps the register', () => {
    expect(new Set(METRICS.map((m) => m.id)).size).toBe(METRICS.length);
    for (const m of METRICS) {
      expect(m.id).toMatch(/^metric\.[a-z][a-z0-9-]*$/);
      expect(words(m.label), `${m.id} label ≤ 5 words`).toBeLessThanOrEqual(5);
      expect(words(m.definition), `${m.id} definition ≤ 30 words`).toBeLessThanOrEqual(30);
      if (m.note) expect(words(m.note), `${m.id} note ≤ 25 words`).toBeLessThanOrEqual(25);
      expect(DIMENSIONS).toContain(m.dimension);
      expect(STATUSES).toContain(m.status);
      expect(typeof m.scored).toBe('boolean');
      // R132: a scored row is computed today; a timing row is computed between two recorded stamps.
      if (m.scored) expect(m.status, `${m.id} is scored, so it is computed`).toBe('computed');
      if (m.timing) expect(m.definition + (m.note ?? ''), `${m.id} names the stamps it reads`).toMatch(/stamp|minutes|days|due date|clock/i);
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

  it('nothing ranks a member: the one excluded row is the ranking, and no row names a leaderboard or a badge', () => {
    for (const m of METRICS) {
      if (m.status === 'excluded') continue;
      expect(`${m.label} ${m.definition} ${m.note ?? ''}`, m.id).not.toMatch(/\b(rank|ranking|leaderboard|badge|badges|points)\b/i);
    }
    expect(METRICS.filter((m) => m.status === 'excluded').map((m) => m.id)).toEqual(['metric.rank-any']);
    // R132: the Time rows are no longer excluded; the ones computed read two recorded stamps.
    const timing = timingMetrics();
    expect(timing.map((m) => m.id)).toContain('metric.time-to-verify');
    expect(timing.map((m) => m.id)).toContain('metric.ability-deadline-adherence');
    expect(timing.map((m) => m.id)).toContain('metric.time-learning-velocity');
    for (const m of timing) expect(m.status, m.id).not.toBe('excluded');
    expect(scoredMetrics().length).toBeGreaterThanOrEqual(12);
  });

  it('the catalogue is extensive and honest about what is computed today', () => {
    expect(METRICS.length).toBeGreaterThanOrEqual(75);
    expect(METRICS.filter((m) => m.status === 'computed').length).toBeGreaterThanOrEqual(50);
    for (const d of DIMENSIONS) expect(metricsOf(d).length, `${d} has metrics`).toBeGreaterThan(0);
    expect(metricOf('metric.ability-first-try')?.note ?? metricOf('metric.ability-first-try')?.definition).toContain('persistence');
    expect(metricOf('metric.evidence-self-attested')?.definition).toContain('without matching output');
    expect(metricOf('metric.ability-recall')?.dimension).toBe('retention');
    expect(metricOf('metric.trouble-resolved')?.dimension).toBe('troubleshooting');
    expect(metricOf('metric.decision-recorded')?.dimension).toBe('decisions');
  });
});

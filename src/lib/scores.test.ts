import { describe, it, expect } from 'vitest';
import { scoreValue, scoreValues, tierOf } from './scores';
import { SCORES } from './docs/scoring';
import { timingOf } from './skillProfile';

const kpi = (id: string, pct: number, of = 1, loaded = true) => ({ id, pct, of, loaded });

/**
 * R132 — a score is the weighted mean of its components' percentages over the
 * components that counted (loaded, with a denominator), renormalised; it is
 * 0..100 and says what it stands on. The tier is ten verified uses.
 */
describe('scores', () => {
  const judgment = SCORES.find((s) => s.id === 'score.judgment')!;

  it('is the weighted mean over every component when all count', () => {
    const v = scoreValue(judgment, judgment.components.map((c, i) => kpi(c.kpi, [100, 50, 0, 100][i])));
    expect(v).toMatchObject({ id: 'score.judgment', value: 63, counted: 4, of: 4, loaded: true });
    expect(v.components.map((c) => c.counted)).toEqual([true, true, true, true]);
  });

  it('leaves out a component that was not loaded or has no denominator, renormalises, and says how many it stands on', () => {
    const v = scoreValue(judgment, [kpi(judgment.components[0].kpi, 100), kpi(judgment.components[1].kpi, 0, 0), kpi(judgment.components[2].kpi, 50, 1, false)]);
    expect(v).toMatchObject({ value: 100, counted: 1, of: 4, loaded: true });
    expect(v.components.map((c) => c.counted)).toEqual([true, false, false, false]);
    expect(v.components[1].pct).toBeNull();
  });

  it('stands on nothing when nothing counted: zero, and not loaded', () => {
    expect(scoreValue(judgment, [])).toMatchObject({ value: 0, counted: 0, of: 4, loaded: false });
    expect(scoreValues(SCORES, []).map((s) => s.loaded)).toEqual(SCORES.map(() => false));
  });

  it('is bounded to 0..100 whatever the percentages', () => {
    const v = scoreValue(judgment, judgment.components.map((c) => kpi(c.kpi, 100)));
    expect(v.value).toBe(100);
    expect(scoreValue(judgment, judgment.components.map((c) => kpi(c.kpi, 0))).value).toBe(0);
  });

  it('the tier is professional at ten verified uses and building below it', () => {
    expect(tierOf(9, 10)).toBe('building');
    expect(tierOf(10, 10)).toBe('professional');
    expect(tierOf(11, 10)).toBe('professional');
  });

  it('timing: the median over steps resolved within a day, the share within the hour, and the ones left over a day counted apart', () => {
    expect(timingOf([])).toEqual({ timedSteps: 0, medianMinutes: null, withinHour: 0, over24h: 0 });
    expect(timingOf([5])).toEqual({ timedSteps: 1, medianMinutes: 5, withinHour: 1, over24h: 0 });
    expect(timingOf([5, 30, 3000])).toEqual({ timedSteps: 3, medianMinutes: 18, withinHour: 2, over24h: 1 });
    expect(timingOf([3000, 4000])).toEqual({ timedSteps: 2, medianMinutes: null, withinHour: 0, over24h: 2 });
    expect(timingOf([10, 20, 30, 90])).toEqual({ timedSteps: 4, medianMinutes: 25, withinHour: 3, over24h: 0 });
  });
});

import { describe, expect, it } from 'vitest';
import { elapsedOf, formatElapsed, startTimer, stopAll, stopTimer, totalMinutes } from './taskTimer';

/** R140 — the timer is a reducer: start, stop, hide, pause, and the minutes read from it. */
describe('R140 — the task timer', () => {
  it('starts, runs, stops and folds the run into the elapsed time', () => {
    let t = startTimer(undefined, 'a', 1000);
    expect(t.a).toEqual({ elapsedMs: 0, runningSince: 1000 });
    expect(elapsedOf(t.a, 61_000)).toBe(60_000);
    expect(startTimer(t, 'a', 5000)).toBe(t); // already running
    t = stopTimer(t, 'a', 61_000);
    expect(t.a).toEqual({ elapsedMs: 60_000, runningSince: null });
    expect(stopTimer(t, 'a', 99_000)).toEqual(t);
    t = startTimer(t, 'a', 100_000);
    expect(elapsedOf(t.a, 130_000)).toBe(90_000);
  });

  it('stopAll stops every task, totalMinutes reads whole minutes over the tasks named, a clock in the past counts nothing extra', () => {
    let t = startTimer(startTimer({}, 'a', 0), 'b', 0);
    t = stopAll(t, 120_000);
    expect(Object.values(t).every((x) => x.runningSince === null)).toBe(true);
    expect(totalMinutes(t, 120_000)).toBe(4);
    expect(totalMinutes(t, 120_000, ['a'])).toBe(2);
    expect(totalMinutes(t, 120_000, ['zz'])).toBe(0);
    expect(totalMinutes(startTimer({}, 'c', 5_000_000), 0)).toBe(0);
    expect(totalMinutes(undefined, 0)).toBe(0);
  });

  it('formats minutes and hours', () => {
    expect(formatElapsed(0)).toBe('0 min');
    expect(formatElapsed(12 * 60_000 + 500)).toBe('12 min');
    expect(formatElapsed(65 * 60_000)).toBe('1 h 05 min');
  });
});

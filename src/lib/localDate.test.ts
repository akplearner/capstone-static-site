import { describe, expect, it } from 'vitest';
import { localDay, localStamp } from './localDate';

/**
 * These assert the property the bug violated — "the date a student reads is the
 * date on the student's wall" — rather than a literal string, because the
 * literal depends on the runner's timezone and the point is that it should.
 */
describe('local dates', () => {
  it('reads the local calendar day, not the UTC one', () => {
    const d = new Date(2026, 8, 5, 22, 30); // 5 Sept 2026, 22:30 local
    expect(localDay(d.getTime())).toBe('2026-09-05');
  });

  it('differs from toISOString whenever the two calendars disagree', () => {
    // 23:30 local on the last day of a month is the far side of UTC midnight for
    // every negative offset — the case that dated an evening's evidence tomorrow.
    const d = new Date(2026, 8, 30, 23, 30);
    const utcDay = new Date(d.getTime()).toISOString().slice(0, 10);
    if (d.getTimezoneOffset() > 0) expect(localDay(d.getTime())).not.toBe(utcDay);
    expect(localDay(d.getTime())).toBe('2026-09-30');
  });

  it('stamps to the minute, zero-padded', () => {
    const d = new Date(2026, 0, 2, 3, 4);
    expect(localStamp(d.getTime())).toBe('2026-01-02 03:04');
  });

  it('defaults to now', () => {
    expect(localDay()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(localStamp()).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });
});

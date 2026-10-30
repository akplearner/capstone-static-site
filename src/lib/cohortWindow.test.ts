import { describe, it, expect } from 'vitest';
import { isForwardMove, joinableCohorts } from './cohortWindow';

/** R150 — the join window is this month and next, never earlier, and never below the floor. */
describe('joinableCohorts', () => {
  const oct30 = new Date(2026, 9, 30, 22, 15); // local time: 30 Oct 2026

  it('offers this month and the next', () => {
    expect(joinableCohorts(oct30)).toEqual(['2026-10', '2026-11']);
  });

  it('a floor at this month changes nothing; a floor at next month leaves only next; a floor beyond leaves nothing', () => {
    expect(joinableCohorts(oct30, '2026-10')).toEqual(['2026-10', '2026-11']);
    expect(joinableCohorts(oct30, '2026-11')).toEqual(['2026-11']);
    expect(joinableCohorts(oct30, '2026-12')).toEqual([]);
    expect(joinableCohorts(oct30, null)).toEqual(['2026-10', '2026-11']);
  });

  it('crosses the year end', () => {
    expect(joinableCohorts(new Date(2026, 11, 31, 23, 59))).toEqual(['2026-12', '2027-01']);
  });
});

describe('isForwardMove', () => {
  it('allows staying and moving later, refuses earlier', () => {
    expect(isForwardMove('2026-10', '2026-10')).toBe(true);
    expect(isForwardMove('2026-10', '2026-11')).toBe(true);
    expect(isForwardMove('2026-10', '2027-01')).toBe(true);
    expect(isForwardMove('2026-11', '2026-10')).toBe(false);
    expect(isForwardMove('2027-01', '2026-12')).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { OUTCOME_K, OUTCOME_STATUSES, latestOutcome, outcomeBands, type LearnerOutcome } from './outcomes';

/** R110 — the latest answer counts, and nothing is counted below five members. */
const row = (status: LearnerOutcome['status'], recordedAt: number): LearnerOutcome => ({ recordedAt, status, roleTitle: '', employer: '', startedOn: '', usedAtWork: {} });

describe('outcomes', () => {
  it('latestOutcome picks the newest row', () => {
    expect(latestOutcome([])).toBeNull();
    expect(latestOutcome([row('studying', 1), row('placed', 3), row('searching', 2)])?.status).toBe('placed');
  });

  it('outcomeBands is empty below the floor and counts per status above it, in status order', () => {
    expect(OUTCOME_K).toBe(5);
    const four = [row('placed', 1), row('placed', 2), row('searching', 3), row('studying', 4)];
    expect(outcomeBands(four)).toEqual([]);
    const five = [...four, row('placed', 5)];
    expect(outcomeBands(five)).toEqual([
      { status: 'studying', members: 1 },
      { status: 'searching', members: 1 },
      { status: 'placed', members: 3 },
    ]);
    expect(OUTCOME_STATUSES).toEqual(['studying', 'searching', 'placed', 'promoted', 'not-seeking']);
    expect(JSON.stringify(outcomeBands(five))).not.toMatch(/employer|roleTitle/);
  });
});

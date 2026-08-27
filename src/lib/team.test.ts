import { describe, expect, it } from 'vitest';
import { composeTeamId, parseTeamId, teamLabel } from './team';

describe('cohort-scoped team ids', () => {
  it('round-trips cohort and number', () => {
    const id = composeTeamId('2026-01', '3');
    expect(id).toBe('2026-01-t3');
    expect(parseTeamId(id)).toEqual({ cohort: '2026-01', num: '3' });
  });

  it('two cohorts picking the same team number get distinct ids', () => {
    expect(composeTeamId('2026-01', '1')).not.toBe(composeTeamId('2026-02', '1'));
  });

  it('labels scoped ids by their number only', () => {
    expect(teamLabel('2026-01-t1')).toBe('Team 1');
  });

  it('accepts legacy bare ids', () => {
    expect(parseTeamId('2')).toEqual({ cohort: null, num: '2' });
    expect(teamLabel('2')).toBe('Team 2');
  });

  it('is URL-safe for the team route', () => {
    const id = composeTeamId('2026-11', '12');
    expect(encodeURIComponent(id)).toBe(id);
  });
});

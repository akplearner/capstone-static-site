import { describe, expect, it } from 'vitest';
import { composeTeamId, parseTeamId, teamLabel } from './team';

// The team id is the ONE string every store keys on, so its grammar is locked
// here: cohort inside, mode inside (R83), legacy ids still land somewhere sane.
describe('team ids', () => {
  it('round-trips a local team', () => {
    const id = composeTeamId('2026-09', '3');
    expect(id).toBe('2026-09-t3');
    expect(parseTeamId(id)).toEqual({ cohort: '2026-09', num: '3', mode: 'local' });
    expect(teamLabel(id)).toBe('Team 3');
  });

  it('round-trips an online lobby', () => {
    const id = composeTeamId('2026-09', '2', 'online');
    expect(id).toBe('2026-09-o2');
    expect(parseTeamId(id)).toEqual({ cohort: '2026-09', num: '2', mode: 'online' });
    expect(teamLabel(id)).toBe('Lobby 2');
  });

  it('every existing membership is a local team — nothing migrates', () => {
    expect(parseTeamId('2026-01-t1')).toEqual({ cohort: '2026-01', num: '1', mode: 'local' });
    expect(teamLabel('2026-01-t1')).toBe('Team 1');
  });

  it('pre-cohort bare ids still render', () => {
    expect(parseTeamId('1')).toEqual({ cohort: null, num: '1', mode: 'local' });
    expect(teamLabel('1')).toBe('Team 1');
  });

  it('a local team and a lobby with the same number never collide', () => {
    expect(composeTeamId('2026-09', '1', 'local')).not.toBe(composeTeamId('2026-09', '1', 'online'));
  });
});

/**
 * Cohort-scoped team identity.
 *
 * A team is a team *within a class session*: Team 1 of the 2026-01 cohort and
 * Team 1 of the 2026-03 cohort are different teams that must never share
 * deliverables, gate status, registers, or rosters. Every store — localStorage
 * keys, Supabase rows, and the RLS policies that compare `memberships.team_id`
 * — keys on the teamId string and nothing else, so the cohort has to live
 * INSIDE the id. The join panel is the single place ids are composed;
 * everything downstream treats them as opaque (and the format is URL-safe).
 *
 * R83 adds the attendance MODE to the id the same way, because a local
 * classroom team and an online lobby must never mix either:
 *   `<cohort>-t<number>` — a local (in-class) team, e.g. `2026-01-t1`
 *   `<cohort>-o<number>` — an online lobby,          e.g. `2026-01-o1`
 * The `t` prefix stays what every existing membership already uses, so a
 * legacy id IS a local team — nothing migrates.
 *
 * Ids from before the cohort scheme are bare numbers ("1"). parse/label
 * accept them so an old locally-saved membership still renders.
 */

export type TeamMode = 'local' | 'online';

const SCOPED = /^(\d{4}-\d{2})-([to])(.+)$/;

export function composeTeamId(cohort: string, teamNumber: string, mode: TeamMode = 'local'): string {
  return `${cohort}-${mode === 'online' ? 'o' : 't'}${teamNumber}`;
}

export function parseTeamId(teamId: string): { cohort: string | null; num: string; mode: TeamMode } {
  const m = SCOPED.exec(teamId);
  if (!m) return { cohort: null, num: teamId, mode: 'local' };
  return { cohort: m[1], num: m[3], mode: m[2] === 'o' ? 'online' : 'local' };
}

/** "Team 1" / "Lobby 1" — for display; the cohort is shown separately where it matters. */
export function teamLabel(teamId: string): string {
  const { num, mode } = parseTeamId(teamId);
  return `${mode === 'online' ? 'Lobby' : 'Team'} ${num}`;
}

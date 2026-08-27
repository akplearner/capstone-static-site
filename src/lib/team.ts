/**
 * Cohort-scoped team identity.
 *
 * A team is a team *within a class session*: Team 1 of the 2026-01 cohort and
 * Team 1 of the 2026-03 cohort are different teams that must never share
 * deliverables, gate status, registers, or rosters. Every store — localStorage
 * keys, Supabase rows, and the RLS policies that compare `memberships.team_id`
 * — keys on the teamId string and nothing else, so the cohort has to live
 * INSIDE the id: `<cohort>-t<number>`, e.g. `2026-01-t1`. The join panel is
 * the single place ids are composed; everything downstream treats them as
 * opaque (and the format is URL-safe for /courses/<id>/team/<teamId>).
 *
 * Ids from before this scheme are bare numbers ("1"). parse/label accept them
 * so an old locally-saved membership still renders instead of crashing.
 */

const SCOPED = /^(\d{4}-\d{2})-t(.+)$/;

export function composeTeamId(cohort: string, teamNumber: string): string {
  return `${cohort}-t${teamNumber}`;
}

export function parseTeamId(teamId: string): { cohort: string | null; num: string } {
  const m = SCOPED.exec(teamId);
  return m ? { cohort: m[1], num: m[2] } : { cohort: null, num: teamId };
}

/** "Team 1" — for display; the cohort is shown separately where it matters. */
export function teamLabel(teamId: string): string {
  return `Team ${parseTeamId(teamId).num}`;
}

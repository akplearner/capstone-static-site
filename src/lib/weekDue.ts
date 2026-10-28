import { weekDue } from '@/lib/calendar';
import { parseTeamId } from '@/lib/team';
import type { Cohort } from '@/lib/data/types';
import type { Member } from '@/lib/types';

/**
 * R136 — the cohort calendar as the projection reads it: the due STAMP of a week.
 *
 * `skillProfile` counts "on time" from two recorded facts: a step's verification
 * stamp and the week's due date. The calendar (`lib/calendar.ts`) knows the date
 * (`YYYY-MM-DD`, local); the projection needs milliseconds. This is the one
 * place that turns the one into the other, so every page agrees on when a week
 * ends: the last millisecond of the due day, in the browser's local time, which
 * is the time the student read on the calendar.
 */
export function weekDueFrom(cohort: Cohort | null | undefined): ((week: number) => number | undefined) | undefined {
  if (!cohort?.startsOn) return undefined;
  const startsOn = cohort.startsOn;
  return (week: number) => {
    const day = weekDue(startsOn, week);
    const at = new Date(`${day}T23:59:59.999`).getTime();
    return Number.isFinite(at) ? at : undefined;
  };
}

/** The cohort a member belongs to: the team id's prefix, or the membership's own column. */
export function cohortKeyOf(member: Pick<Member, 'teamId' | 'cohort'>): string | null {
  return parseTeamId(member.teamId).cohort ?? (member.cohort || null);
}

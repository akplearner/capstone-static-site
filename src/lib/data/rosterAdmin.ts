'use client';

import { getBrowserClient } from '../supabase/client';
import { isSupabaseConfigured } from '../supabase/config';
import { KEYS } from './keys';
import { safeSetItem } from './safeStorage';
import { notifyStore } from '../useClientStore';
import type { RosterEntry } from '../types';

/**
 * The instructor's roster fixes (R85): move a student to another team or
 * lobby, change their role, remove someone who dropped the course. These are
 * corrections to OTHER PEOPLE's memberships, so they live here — deliberately
 * outside the student repo interfaces — and in cloud mode they only work for
 * accounts the 0010 policies let through (`memberships instructor manage` /
 * `remove`). Enrolling someone is still, always, the student's own act.
 *
 * Both verbs resolve to whether the change landed, and the caller re-loads —
 * the cohort page's data comes from `loadCohort`, not the shared cache, so an
 * optimistic cache write would change nothing it renders.
 */

function localRoster(courseId: string): RosterEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.roster(courseId));
    return raw ? (JSON.parse(raw) as RosterEntry[]) : [];
  } catch {
    return [];
  }
}

export async function moveMember(
  courseId: string,
  memberId: string,
  to: { teamId: string; role: string; cohort: string }
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const roster = localRoster(courseId).map((e) =>
      e.memberId === memberId ? { ...e, teamId: to.teamId, role: to.role, cohort: to.cohort } : e
    );
    safeSetItem(KEYS.roster(courseId), JSON.stringify(roster));
    // The student's own device context is theirs; on a shared offline machine
    // the context key is per course, so update it if it names this member.
    try {
      const ctx = localStorage.getItem(KEYS.context(courseId));
      if (ctx) {
        const m = JSON.parse(ctx);
        if (m.memberId === memberId) {
          safeSetItem(KEYS.context(courseId), JSON.stringify({ ...m, teamId: to.teamId, role: to.role, cohort: to.cohort }));
        }
      }
    } catch {
      /* malformed context: leave it */
    }
    notifyStore();
    return true;
  }
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const { error, count } = await supabase
    .from('memberships')
    .update({ team_id: to.teamId, role: to.role, cohort: to.cohort }, { count: 'exact' })
    .eq('user_id', memberId)
    .eq('course_id', courseId);
  if (error) {
    console.error('roster move failed', error.message);
    return false;
  }
  return (count ?? 0) > 0;
}

export async function removeMember(courseId: string, memberId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const roster = localRoster(courseId).filter((e) => e.memberId !== memberId);
    safeSetItem(KEYS.roster(courseId), JSON.stringify(roster));
    notifyStore();
    return true;
  }
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const { error, count } = await supabase
    .from('memberships')
    .delete({ count: 'exact' })
    .eq('user_id', memberId)
    .eq('course_id', courseId);
  if (error) {
    console.error('roster remove failed', error.message);
    return false;
  }
  return (count ?? 0) > 0;
}

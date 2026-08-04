'use client';

import { getBrowserClient } from '../supabase/client';
import { notifyStore } from '../useClientStore';
import { LabAccessData, LabAccessRepository, UserCourseState, UserStateRepository } from './types';
import { cache, getCurrentUserId } from './supabaseCache';
import { toast } from '@/lib/toastBus';

// The two single-user tables: `user_course_state` (resume pointer + the Week-0
// acknowledgement) and `lab_access` (the student's own IPs, credentials and
// reachability checklist).
//
// Both follow the house pattern — synchronous read off the cache, optimistic
// write, fire-and-forget upsert — because both are read *during render*
// (`readResume` inside the course page's store selector, `useLabAccess` in the
// panel) and cannot become async without restructuring those call sites.
//
// `user_id` is not passed in the upsert: it defaults from the authenticated
// session via RLS `with check (auth.uid() = user_id)`... except Postgres has no
// default for it, so we set it explicitly from the cached session id. If there is
// no session there is nothing to write, and we bail.

function upsert(
  table: 'user_course_state' | 'lab_access',
  courseId: string,
  data: unknown,
  failureMessage: string
): void {
  const supabase = getBrowserClient();
  if (!supabase) return;
  const user_id = getCurrentUserId();
  // Signed out: the caller has already updated the local cache, and the write
  // would be rejected by RLS anyway. Staying silent here is correct — the guard
  // in Part 4 is what stops a signed-out student getting this far.
  if (!user_id) return;

  void supabase
    .from(table)
    .upsert(
      { user_id, course_id: courseId, data, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,course_id' }
    )
    .then(({ error }) => {
      if (error) {
        console.error(`${table} save failed`, error.message);
        toast({ message: failureMessage, variant: 'warning', duration: 6000 });
      }
    });
}

// `memberId` is accepted to satisfy the shared interface and deliberately unused:
// the row is keyed by the authenticated session, which is a stronger identity than
// anything the client could pass in.
export const supabaseUserStateRepo: UserStateRepository = {
  get(courseId: string): UserCourseState | null {
    return cache.userState(courseId);
  },

  save(courseId: string, _memberId: string, state: UserCourseState): void {
    cache.setUserState(courseId, state);
    notifyStore();
    // Deliberately quiet on failure beyond the toast: this is a UI convenience
    // pointer, and losing it costs the student one extra click, not any work.
    upsert('user_course_state', courseId, state, 'Couldn’t save your place — you may reopen at the top of the week.');
  },
};

export const supabaseLabAccessRepo: LabAccessRepository = {
  get(courseId: string): LabAccessData | null {
    return cache.labAccess(courseId);
  },

  save(courseId: string, _memberId: string, data: LabAccessData): void {
    cache.setLabAccess(courseId, data);
    notifyStore();
    upsert('lab_access', courseId, data, 'Couldn’t save your lab details — they’re held locally and will retry on reload.');
  },
};

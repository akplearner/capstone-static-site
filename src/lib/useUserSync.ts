'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { isSupabaseConfigured } from './supabase/config';
import { hydrateUser, setCurrentUserId } from './data/supabaseCache';
import { notifyStore } from './useClientStore';

/** A record read from another tab or device is refreshed when this one is looked at, at most this often. */
export const REFRESH_MS = 10_000;

/**
 * Cross-course hydration, for pages that aren't scoped to one course.
 *
 * `useSupabaseSync(courseId)` loads a single course. The dashboard and the
 * portfolio show every capstone a student has started plus their chosen path,
 * so they need this instead — it loads memberships, completions and the whole
 * evidence ledger across courses in one round trip.
 *
 * Without it those pages read an unhydrated cache and render "nothing here yet"
 * for a signed-in student until they happen to open a course page first.
 *
 * R126 — two things the record needed. `ready` says the first load of this account has landed: before
 * it the cache is empty, and an empty dashboard is not an answer (a signed-in member saw "No capstones
 * yet" for the moment it took). And a page left open is current again when it is looked at: on focus,
 * when the tab becomes visible and when it is restored from the back-forward cache, the account is
 * loaded again (at most every `REFRESH_MS`) and every reader re-reads, so work done in another tab
 * or on another device shows without a reload.
 */
export function useUserSync(): { ready: boolean } {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const cloud = isSupabaseConfigured();
  const [syncedFor, setSyncedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!cloud) return;
    setCurrentUserId(userId);
    if (!userId) return;
    let on = true;
    void hydrateUser()
      .catch(() => {})
      .finally(() => {
        if (on) setSyncedFor(userId);
      });
    return () => {
      on = false;
    };
  }, [cloud, userId]);

  useEffect(() => {
    let last = 0;
    const refresh = () => {
      if (document.visibilityState === 'hidden') return;
      notifyStore();
      if (!cloud || !userId) return;
      const now = Date.now();
      if (now - last < REFRESH_MS) return;
      last = now;
      void hydrateUser().catch(() => {});
    };
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [cloud, userId]);

  return { ready: !cloud || !userId || syncedFor === userId };
}

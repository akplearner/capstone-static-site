'use client';

import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { isSupabaseConfigured } from './supabase/config';
import { hydrateUser, setCurrentUserId } from './data/supabaseCache';

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
 */
export function useUserSync() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    setCurrentUserId(userId);
    if (userId) void hydrateUser();
  }, [userId]);
}

'use client';

import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { isSupabaseConfigured } from './supabase/config';
import { hydrateCourse, scheduleHydrate, setCurrentUserId } from './data/supabaseCache';
import { flushDeliverableOutbox } from './data/outbox';

// Mounts the cloud cache for a course: tracks the signed-in user and hydrates the
// user's + teammates' data (and opens Realtime). A no-op when Supabase isn't
// configured, so localStorage mode is unaffected. Safe to mount on multiple course
// pages — hydrate/subscribe are idempotent.
//
// R82: a backgrounded phone tab misses realtime events and Supabase does not
// replay them, so waking up (visibilitychange) and coming back online each
// re-hydrate — and re-send anything the deliverables outbox still owes.
export function useSupabaseSync(courseId: string) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    setCurrentUserId(userId);
    if (userId) void hydrateCourse(courseId);
  }, [userId, courseId]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !userId) return;
    const wake = () => {
      if (document.visibilityState !== 'visible') return;
      scheduleHydrate(courseId, 0);
      void flushDeliverableOutbox();
    };
    const online = () => {
      scheduleHydrate(courseId, 0);
      void flushDeliverableOutbox();
    };
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('online', online);
    return () => {
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('online', online);
    };
  }, [userId, courseId]);
}

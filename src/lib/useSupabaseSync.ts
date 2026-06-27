'use client';

import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { isSupabaseConfigured } from './supabase/config';
import { hydrateCourse, setCurrentUserId } from './data/supabaseCache';

// Mounts the cloud cache for a course: tracks the signed-in user and hydrates the
// user's + teammates' data (and opens Realtime). A no-op when Supabase isn't
// configured, so localStorage mode is unaffected. Safe to mount on multiple course
// pages — hydrate/subscribe are idempotent.
export function useSupabaseSync(courseId: string) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    setCurrentUserId(userId);
    if (userId) void hydrateCourse(courseId);
  }, [userId, courseId]);
}

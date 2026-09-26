'use client';

import { Member } from './types';
import { progressRepo } from './data';
import { isCourseHydrated } from './data/supabaseCache';
import { isSupabaseConfigured } from './supabase/config';
import { useAuth } from './useAuth';
import { useClientStore, useHydrated, notifyStore } from './useClientStore';

// Course-scoped student enrollment (replaces the old global useStudentContext).
//
// R82: in cloud mode, `loading` stays true until this course's cloud rows have
// hydrated. Before that, a signed-in enrolled student deep-linking to the guide
// read `member: null, loading: false` for the whole request and was shown the
// enrol gate instead of their own course.
export function useMember(courseId: string) {
  const member = useClientStore<Member | null>(() => progressRepo.getContext(courseId), null);
  const hydrated = useHydrated();
  const { user, loading: authLoading } = useAuth();
  const cloud = isSupabaseConfigured();
  const cloudReady = useClientStore<boolean>(
    () => !cloud || !user || isCourseHydrated(courseId),
    false
  );

  return {
    member,
    loading: !hydrated || authLoading || !cloudReady,
    setMember: (m: Member) => {
      progressRepo.setContext(m);
      notifyStore();
    },
  };
}

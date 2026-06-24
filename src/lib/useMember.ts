'use client';

import { Member } from './types';
import { progressRepo } from './data';
import { useClientStore, useHydrated, notifyStore } from './useClientStore';

// Course-scoped student enrollment (replaces the old global useStudentContext).
export function useMember(courseId: string) {
  const member = useClientStore<Member | null>(() => progressRepo.getContext(courseId), null);
  const hydrated = useHydrated();

  return {
    member,
    loading: !hydrated,
    setMember: (m: Member) => {
      progressRepo.setContext(m);
      notifyStore();
    },
  };
}

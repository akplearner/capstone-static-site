'use client';

import { useEffect, useState } from 'react';
import { Member } from './types';
import { progressRepo } from './data';

// Course-scoped student enrollment (replaces the old global useStudentContext).
export function useMember(courseId: string) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMember(progressRepo.getContext(courseId));
    setLoading(false);
  }, [courseId]);

  return {
    member,
    loading,
    setMember: (m: Member) => {
      progressRepo.setContext(m);
      setMember(m);
    },
  };
}

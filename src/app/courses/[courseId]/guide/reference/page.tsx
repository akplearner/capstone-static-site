'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GuideSkeleton } from '@/components/ui/Skeletons';
import { useCourse } from '@/lib/useCourse';

/**
 * The Reference manual folded into the Guide (`GuideManual`), so this route
 * only forwards. Ten in-repo links and any bookmark still arrive with a section
 * anchor — `#forms`, `#config-guide`, `#command-help` — and every one of those
 * ids renders on the Guide now.
 *
 * Client-side on purpose: a server `redirect()` never receives the fragment,
 * so `/guide/reference#forms` would have landed at the top of the Guide.
 */
export default function CourseReferenceRedirect() {
  const course = useCourse();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/courses/${course.id}/guide${window.location.hash || '#lab'}`);
  }, [course.id, router]);
  // Same as the team stub: this forwards to the Guide, preserving the hash, so
  // it draws the Guide.
  return <GuideSkeleton />;
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CoursePageSkeleton } from '@/components/ui/Skeletons';
import { useCourse } from '@/lib/useCourse';

/**
 * The Team page folded into the Home tab (`TeamBlock`), keyed on the member's
 * own team — the only one a student could ever view here, so the route carried
 * an id it then had to deny. It forwards to `#team` on Home; client-side so the
 * fragment survives (a server redirect drops it).
 */
export default function TeamSpaceRedirect() {
  const course = useCourse();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/courses/${course.id}#team`);
  }, [course.id, router]);
  // A redirect stub has no loaded state of its own — it forwards to the course
  // page's Home tab. So the honest skeleton is that page's, which is also the
  // one about to render.
  return <CoursePageSkeleton />;
}

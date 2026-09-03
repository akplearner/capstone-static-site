'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingBlock } from '@/components/ui/Spinner';
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
  return <LoadingBlock />;
}

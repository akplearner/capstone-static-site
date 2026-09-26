'use client';

import { useParams } from 'next/navigation';
import { CourseProvider } from '@/components/CourseProvider';
import { useSupabaseSync } from '@/lib/useSupabaseSync';

// The cloud cache mounts HERE, once for every page of the course — the guide
// page used to be the one surface without it, so a signed-in student
// deep-linking there never hydrated and saw the enrol gate (R82).
function CourseCloudSync({ courseId }: { courseId: string }) {
  useSupabaseSync(courseId);
  return null;
}

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const courseId = params.courseId as string;
  return (
    <CourseProvider courseId={courseId}>
      <CourseCloudSync courseId={courseId} />
      {children}
    </CourseProvider>
  );
}

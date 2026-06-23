'use client';

import { useParams } from 'next/navigation';
import { CourseProvider } from '@/components/CourseProvider';

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const courseId = params.courseId as string;
  return <CourseProvider courseId={courseId}>{children}</CourseProvider>;
}

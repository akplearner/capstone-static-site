'use client';

import Link from 'next/link';
import { Course } from '@/lib/types';
import { CourseContext } from '@/lib/useCourse';
import { courseRepo } from '@/lib/data';
import { courseTheme } from '@/lib/courseTheme';
import { useClientStore, useHydrated } from '@/lib/useClientStore';
import { Button } from './ui/Button';
import { LoadingBlock } from './ui/Spinner';

// Resolves the course for /courses/[courseId]/* routes. Seeds resolve on first
// render; instructor-authored (localStorage) courses resolve after mount.
export function CourseProvider({
  courseId,
  children,
}: {
  courseId: string;
  children: React.ReactNode;
}) {
  // Resolve only after mount so server and client first render match (authored
  // courses live in localStorage and aren't visible during SSR).
  const course = useClientStore<Course | null>(() => courseRepo.get(courseId) ?? null, null);
  const ready = useHydrated();

  if (!course) {
    if (!ready) {
      return <LoadingBlock label="Loading course…" />;
    }
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course not found</h1>
        <p className="text-gray-600 dark:text-gray-400">
          The course “{courseId}” doesn’t exist or hasn’t been published on this device.
        </p>
        <Link href="/">
          <Button>Browse courses</Button>
        </Link>
      </div>
    );
  }

  // `data-course` is what re-themes the whole subtree: globals.css re-declares
  // the accent tokens under this selector, so every bg-accent / .eyebrow / .ip /
  // progress bar / diagram picks up the course's colours without a single
  // component knowing about it. See src/lib/courseTheme.ts.
  return (
    <CourseContext.Provider value={course}>
      <div data-course={courseTheme(course).key}>{children}</div>
    </CourseContext.Provider>
  );
}

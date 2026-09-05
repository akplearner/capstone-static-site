'use client';

import Link from 'next/link';
import { Course } from '@/lib/types';
import { CourseContext } from '@/lib/useCourse';
import { courseRepo } from '@/lib/data';
import { regionFor, seamFor } from '@/lib/quarry';
import { useClientStore, useHydrated } from '@/lib/useClientStore';
import { Button } from './ui/Button';
import { EmptyState } from './EmptyState';
import { CoursePageSkeleton } from '@/components/ui/Skeletons';

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
  //
  // This one really does need the whole `Course` — it is the provider for the
  // entire in-course subtree. What it does not need is to SERIALISE it on every
  // store broadcast to find out whether it changed. A course changes only when
  // it is authored, and `save()` stamps `updatedAt`, so id + that timestamp is a
  // sufficient identity; seeds have no `updatedAt` and never change at all.
  const course = useClientStore<Course | null>(
    () => courseRepo.get(courseId) ?? null,
    null,
    (c) => (c ? `${c.id}:${c.updatedAt ?? 'seed'}` : 'none')
  );
  const ready = useHydrated();

  if (!course) {
    if (!ready) {
      return <CoursePageSkeleton />;
    }
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-ink">Course not found</h1>
        <p className="text-muted">
          The course “{courseId}” doesn’t exist or hasn’t been published on this device.
        </p>
        <Link href="/">
          <Button>Browse courses</Button>
        </Link>
      </div>
    );
  }

  /**
   * A locked course is locked everywhere.
   *
   * The check used to live in `courses/[courseId]/page.tsx` and nowhere else,
   * so `/guide`, `/guide/reference`, `/docs` and `/team/<id>` served a locked
   * course's full content to anyone who typed the URL — and the course page
   * itself links to all four. This provider is the one place every in-course
   * route passes through, which makes it the only place the check belongs.
   *
   * Deliberately not exempting the instructor override: that is the behaviour
   * the single check already had, and course preview belongs on the instructor
   * route, not on a student page with a bypass.
   */
  if (course.locked) {
    return (
      <EmptyState
        title="Course locked"
        message="This course is locked by the instructor and isn’t open yet. Check back later."
        href="/"
        cta="Browse courses"
      />
    );
  }

  // `data-region` (the rock) and `data-seam` (the vein within it) re-theme the
  // whole subtree: globals.css re-declares the accent and mineral tokens under
  // these selectors, so every bg-accent / .eyebrow / .ip / progress bar / stone
  // picks up the region's mineral without a single component knowing about it.
  // Two courses from one vendor share a region and differ only by seam.
  // See src/lib/quarry.ts.
  return (
    <CourseContext.Provider value={course}>
      <div data-region={regionFor(course).key} data-seam={seamFor(course)}>
        {children}
      </div>
    </CourseContext.Provider>
  );
}

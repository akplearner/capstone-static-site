'use client';

import type { Course } from '@/lib/types';
import { Crumbs } from '@/components/SiteNav';
import { PixelBadge } from '@/components/ui/Pixel';
import { courseIdentityLabel } from '@/lib/courseTheme';

/**
 * The course's identity — title, credential, one sentence. On Home it is the
 * page's head; on the Tasks tab (R100, `compact`) it is one line, because a
 * student working a task has already chosen the course, and the hero was the
 * first of several things pushing the first task below the fold.
 */
export function CourseHero({ course, compact = false }: { course: Course; compact?: boolean }) {
  const label = courseIdentityLabel(course);
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1" data-hero="compact">
        <Crumbs items={[{ label: 'Home', href: '/' }]} />
        <span aria-hidden className="text-sm text-muted">
          /
        </span>
        <h1 className="text-base font-semibold text-ink">{course.title}</h1>
        {label && <PixelBadge tone="accent">{label}</PixelBadge>}
      </div>
    );
  }
  return (
    <div className="space-y-2" data-hero="full">
      <Crumbs items={[{ label: 'Home', href: '/' }, { label: course.title }]} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{course.title}</h1>
        {label && <PixelBadge tone="accent">{label}</PixelBadge>}
      </div>
      <p className="line-clamp-2 text-base text-muted sm:line-clamp-none sm:text-lg">{course.description}</p>
    </div>
  );
}

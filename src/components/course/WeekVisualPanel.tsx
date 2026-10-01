'use client';

import { WeekBuildDiagram, type WeekBuildCourse } from '@/components/diagrams/WeekBuildDiagram';

/**
 * R99: the week's picture on the Tasks tab — the build as it stands at the
 * end of this week, with this week's additions glowing and the week's
 * process drawn over it. Open, not behind a bar: the week keeps its one
 * disclosure ("More for this week"), and the picture is what the objectives
 * under it are about. One per week, pinned to the week on screen.
 */
export function WeekVisualPanel({ course, week }: { course: WeekBuildCourse; week: number }) {
  return (
    <section className="space-y-2" data-week-visual-panel={week} aria-label="What you build this week">
      <h3 className="text-sm font-semibold text-ink">What you build this week</h3>
      <WeekBuildDiagram course={course} week={week} />
    </section>
  );
}

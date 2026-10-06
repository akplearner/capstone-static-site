'use client';

import { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { WeekBuildDiagram, type WeekBuildCourse } from '@/components/diagrams/WeekBuildDiagram';
import { Chip } from '@/components/ui/Chip';
import { WeekAddsList } from './WeekAddsList';

/**
 * R99: the week's picture on the Tasks tab — the build as it stands at the
 * end of this week, with this week's additions glowing and the week's
 * process drawn over it. Open, not behind a bar: the week keeps its one
 * disclosure ("More for this week"), and the picture is what the objectives
 * under it are about. One per week, pinned to the week on screen.
 *
 * R100: a thumbnail by default. A 420px picture above the task list was the
 * main reason the first task sat a screen and a half down; the short band
 * still shows what glows and what the process does, with its caption, and
 * Expand opens it at full size. `fill` (the split view's empty pane) draws it
 * full-size with no toggle.
 */
export function WeekVisualPanel({ course, week, fill = false }: { course: WeekBuildCourse; week: number; fill?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const open = fill || expanded;
  return (
    <section className="space-y-2" data-week-visual-panel={week} data-expanded={open ? 'true' : 'false'} aria-label="What you build this week">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">What you build this week</h3>
        {!fill && (
          <Chip as="button" tone="link" aria-expanded={expanded} onClick={() => setExpanded((e) => !e)} icon={expanded ? <Minimize2 /> : <Maximize2 />}>
            {expanded ? 'Shrink' : 'Expand'}
          </Chip>
        )}
      </div>
      <WeekBuildDiagram course={course} week={week} compact={!open} />
      {/* R103: the weekly breakdown — what arrives, what it is for, where it is recorded. */}
      <WeekAddsList courseId={course.id} week={week} limit={open ? undefined : 3} />
    </section>
  );
}

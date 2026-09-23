'use client';

import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Course } from '@/lib/types';
import { formatMinutes, getWeekDef, phaseTag, weekSummary } from '@/lib/course-helpers';
import { meter } from '@/lib/motion';

/**
 * The week, stated once: what it is for, and how far along you are.
 *
 * R78-B made `WeekDef.objective` the lede. R79 takes the rest away: the
 * milestone paragraph and the "built when" line stacked two more sentences
 * under it, and the meta row repeated the role and the task count the rail
 * and the objectives already say. What "done" means is the objectives' ticks
 * now, with the milestone as the caption under the last one.
 *
 * `id="tasks-head"` + `tabIndex={-1}` is where a tab or week change moves
 * focus (page-shape.test.ts asserts it), so it lives on this element.
 */
export function WeekHeader({
  course,
  role,
  week,
  percent,
  unit,
  id,
  className = '',
}: {
  course: Course;
  role: string;
  week: number;
  /** This student's completion for the week, 0-100. */
  percent: number;
  unit: string;
  id?: string;
  className?: string;
}) {
  const def = getWeekDef(course, week);
  const s = weekSummary(course, role, week);

  return (
    <header id={id} tabIndex={-1} className={`scroll-under-chrome outline-none ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0 space-y-1">
          <div className="font-mono text-2xs font-semibold uppercase tracking-wider text-muted">
            {phaseTag(course, week)}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">{def?.title ?? `Week ${week}`}</h2>
          {def?.objective && <p className="max-w-2xl text-base text-body">{def.objective}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {s.minutes != null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden /> ~{formatMinutes(s.minutes)}
            </span>
          )}
          <span className="flex items-center gap-1.5" title={`${percent}% of this ${unit}'s steps done`}>
            <span className="relative block h-2 w-20 overflow-hidden rounded-full bg-panel-2">
              <motion.span
                className="absolute inset-0 origin-left rounded-full bg-accent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: percent / 100 }}
                transition={meter}
              />
            </span>
            <span className="font-medium">{percent}%</span>
          </span>
        </div>
      </div>
    </header>
  );
}

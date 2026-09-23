'use client';

import { Clock, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Course } from '@/lib/types';
import { formatMinutes, getWeekDef, phaseTag, weekSummary } from '@/lib/course-helpers';
import { meter } from '@/lib/motion';
import { GlossaryText } from '@/components/GlossaryText';

/**
 * The week, stated once: what it is for, what "done" means, how big it is.
 *
 * R78-B. Three blocks used to say this between them — the tab header (title,
 * count, %), the build map (a chip per week and "built when …"), and the
 * milestone row ("Done when: …", time, the machines strip) — and none of them
 * showed the one line the seed authors for every week, `WeekDef.objective`.
 * Students said they lost sight of the week's objective. It is the lede now.
 *
 * `id="tasks-head"` + `tabIndex={-1}` is where a tab or week change moves
 * focus (page-shape.test.ts asserts it), so it lives on this element.
 */
export function WeekHeader({
  course,
  role,
  roleName,
  week,
  percent,
  taskCount,
  unit,
  id,
  className = '',
}: {
  course: Course;
  role: string;
  roleName: string;
  week: number;
  /** This student's completion for the week, 0-100. */
  percent: number;
  taskCount: number;
  unit: string;
  id?: string;
  className?: string;
}) {
  const def = getWeekDef(course, week);
  const s = weekSummary(course, role, week);
  // The build map's "built when" line survives as part of the finish line
  // where a course authored one (Server+, CCNA) — the chip strip did not.
  const built = course.buildMap?.find((m) => m.week === week);
  const cleared = percent >= 100;

  return (
    <header id={id} tabIndex={-1} className={`scroll-under-chrome space-y-2 outline-none ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0 space-y-1">
          <div className="font-mono text-2xs font-semibold uppercase tracking-wider text-muted">
            {phaseTag(course, week)}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">{def?.title ?? `Week ${week}`}</h2>
          {def?.objective && <p className="max-w-2xl text-base text-body">{def.objective}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span>
            {roleName} · {taskCount} task{taskCount === 1 ? '' : 's'} this {unit}
          </span>
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

      {(s.milestone || built) && (
        <p className={`flex items-start gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm ${cleared ? 'bg-ok-soft' : 'bg-panel-2'}`}>
          <Flag className={`mt-0.5 h-4 w-4 shrink-0 ${cleared ? 'text-ok' : 'text-muted'}`} aria-hidden />
          <span className="min-w-0 text-ink">
            <span className="font-semibold">{cleared ? `You've completed ${phaseTag(course, week)} — ` : 'Done when: '}</span>
            {s.milestone && <GlossaryText text={s.milestone} />}
            {s.milestone && built && ' '}
            {built && <span className="text-muted">Built when {built.check}.</span>}
          </span>
        </p>
      )}
    </header>
  );
}

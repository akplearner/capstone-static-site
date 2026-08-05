'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Clock, Flag, ListChecks, Wrench } from 'lucide-react';
import { Course } from '@/lib/types';
import { formatMinutes, weekSummary } from '@/lib/course-helpers';
import { GlossaryText } from './GlossaryText';
import { Difficulty } from './ui/Difficulty';

/**
 * The "what am I in for this week" banner.
 *
 * Weeks previously stated only a title, a theme chip and an objective — a
 * student couldn't tell how hard a week was, what they'd be using, what shape
 * the work took, or what counted as finishing it. Difficulty is authored on the
 * week; everything else is aggregated from data the tasks already carry
 * (`tools`, `estimatedTime`, step counts), so this adds a view, not a second
 * copy of the content.
 */

export function WeekMilestoneHeader({
  course,
  role,
  week,
  percent,
}: {
  course: Course;
  role: string;
  week: number;
  /** This student's completion for the week, 0-100. */
  percent: number;
}) {
  const s = weekSummary(course, role, week);
  if (s.taskCount === 0) return null;

  const cleared = percent >= 100;

  return (
    <div className="rounded-lg border border-line bg-panel-2 px-4 py-3">
      {/* Facts row: difficulty · time · size */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {s.difficulty && <Difficulty level={s.difficulty} />}
        {s.minutes != null && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" /> ~{formatMinutes(s.minutes)}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <ListChecks className="h-3.5 w-3.5" />
          {s.taskCount} {s.taskCount === 1 ? 'task' : 'tasks'} · {s.requiredStepCount} steps
        </span>
      </div>

      {/* Tools you'll use */}
      {s.tools.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <Wrench className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
          <span className="sr-only">Tools this week:</span>
          {s.tools.map((tool, i) => (
            <motion.span
              key={tool}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[11px] text-ink"
            >
              {tool}
            </motion.span>
          ))}
        </div>
      )}

      {/* The shape of the week */}
      {s.flow.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1">
          <span className="sr-only">Flow of tasks:</span>
          {s.flow.map((label, i) => (
            <motion.span
              key={`${label}-${i}`}
              initial={{ opacity: 0, x: -3 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              className="inline-flex items-center gap-1"
            >
              <span className="rounded bg-panel px-1.5 py-0.5 text-[11px] font-medium text-ink ring-1 ring-line">
                {label}
              </span>
              {i < s.flow.length - 1 && (
                <ChevronRight className="h-3 w-3 text-muted" aria-hidden />
              )}
            </motion.span>
          ))}
        </div>
      )}

      {/* The milestone: one sentence saying when the week is actually done. */}
      {s.milestone && (
        <div
          className={`mt-3 flex gap-2 rounded-md border px-3 py-2 ${
            cleared
              ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-900/20'
              : 'border-line bg-panel'
          }`}
        >
          <Flag
            className={`mt-0.5 h-4 w-4 shrink-0 ${
              cleared ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'
            }`}
            aria-hidden
          />
          <p className="text-sm text-ink">
            <span className="font-semibold">
              {cleared ? 'Week cleared — ' : 'Done when: '}
            </span>
            <GlossaryText text={s.milestone} />
          </p>
        </div>
      )}
    </div>
  );
}

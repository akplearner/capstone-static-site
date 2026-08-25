'use client';

import { Clock, Flag, ListChecks, Wrench } from 'lucide-react';
import { Course } from '@/lib/types';
import { formatMinutes, weekSummary } from '@/lib/course-helpers';
import { GlossaryText } from './GlossaryText';
import { Difficulty } from './ui/Difficulty';

/**
 * The "what am I in for this week" facts — difficulty · time · size, the tools,
 * and the one-sentence milestone. Everything is aggregated from data the tasks
 * already carry (`tools`, `estimatedTime`, step counts), so this adds a view,
 * not a second copy of the content.
 *
 * Two rows this used to render are gone, deliberately:
 *   - the task-flow chip strip — it drew the same sequence WeekTaskFlow draws
 *     as clickable cards directly below; the diagram is the single home now.
 *   - the per-chip stagger animations — a dozen chips fading in one by one on
 *     every week open read as busyness, not polish. The card the caller wraps
 *     this in animates once; chips never stagger individually (see ui/Card.tsx).
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
    // No border of its own: the caller's glance card provides the one frame.
    <div>
      {/* Facts row: difficulty · time · size */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
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
          {s.tools.map((tool) => (
            <span
              key={tool}
              className="rounded border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-[11px] text-ink"
            >
              {tool}
            </span>
          ))}
        </div>
      )}

      {/* The milestone: one sentence saying when the week is actually done. */}
      {s.milestone && (
        <div
          className={`mt-3 flex gap-2 rounded-md border px-3 py-2 ${
            cleared ? 'border-ok-line bg-ok-soft' : 'border-line bg-panel-2'
          }`}
        >
          <Flag className={`mt-0.5 h-4 w-4 shrink-0 ${cleared ? 'text-ok' : 'text-muted'}`} aria-hidden />
          <p className="text-sm text-ink">
            <span className="font-semibold">
              {cleared ? `You've completed Week ${week} — ` : 'Done when: '}
            </span>
            <GlossaryText text={s.milestone} />
          </p>
        </div>
      )}
    </div>
  );
}

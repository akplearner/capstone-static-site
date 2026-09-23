'use client';

import { Clock, Flag } from 'lucide-react';
import { Course } from '@/lib/types';
import { formatMinutes, weekSummary } from '@/lib/course-helpers';
import { GlossaryText } from '@/components/GlossaryText';
import { TopologyFocus, focusOf } from '@/components/diagrams/TopologyFocus';
import { getTasksByRole } from '@/lib/course-helpers';

/**
 * The week's finish line, and nothing else: "Done when: <milestone>" plus a
 * small time estimate. One row.
 *
 * This component has been losing rows for three rounds, on the instructor's
 * consistent instruction, and each cut has the same shape — the row restated
 * something the checklist below already carries:
 *   - the task-flow chip strip duplicated a since-removed task-flow diagram;
 *   - the aggregated tool strip restated every open task's own tools;
 *   - the facts row (difficulty · "N tasks · M steps") restated what the task
 *     rows themselves show, and difficulty answered a question no student was
 *     asking at this point — they are already committed to the week.
 * The milestone is the one line that earns the space: it is the only place the
 * week states, in a sentence, what "done" means. The time chip rides along
 * because "how long is this" is the second thing everyone asks.
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
  // Every machine this week's tasks type into — the week's half of the same
  // question the per-task strip answers: which boxes am I working on.
  const weekFocus = focusOf(getTasksByRole(course, role, week).flatMap((t) => t.steps));
  if (s.taskCount === 0 || !s.milestone) return null;

  const cleared = percent >= 100;

  return (
    <div
      className={`rounded-md border px-3 py-2 ${
        cleared ? 'border-ok-line bg-ok-soft' : 'border-line bg-panel-2'
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Flag className={`h-4 w-4 shrink-0 ${cleared ? 'text-ok' : 'text-muted'}`} aria-hidden />
        <p className="min-w-0 flex-1 text-sm text-ink">
          <span className="font-semibold">
            {cleared ? `You've completed Week ${week} — ` : 'Done when: '}
          </span>
          <GlossaryText text={s.milestone} />
        </p>
        {s.minutes != null && (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" /> ~{formatMinutes(s.minutes)}
          </span>
        )}
      </div>
      {weekFocus.length > 0 && (
        <div className="mt-2 border-t border-dashed border-line pt-2">
          <TopologyFocus focus={weekFocus} caption="the machines this week touches" />
        </div>
      )}
    </div>
  );
}

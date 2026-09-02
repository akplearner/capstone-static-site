'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Circle, FileText } from 'lucide-react';
import { ProgressRing } from '@/components/ui/ProgressRing';
import type { Course, Task } from '@/lib/types';

/**
 * The four questions a student opens the course with: where am I, how far
 * through, what have I filed, and what do I do next.
 *
 * The Overview could answer none of them. It described the course — the roles,
 * the topology, the phases — all of which a student needs once, on day one, and
 * never again. The state they actually come back for was spread across the
 * Weekly Tasks, Deliverables and Team tabs.
 *
 * Nothing here computes new state. Week completion, task percentages, the
 * resume pointer and the filed-document set are all already derived on the
 * course page; this is a presentation of them in one row.
 */
export function EngagementStatus({
  course,
  weekNumber,
  phase,
  percent,
  weeks,
  weekPercent,
  docsFiled,
  docsTotal,
  nextTask,
  onGoToWeek,
  onContinue,
}: {
  course: Course;
  /** The week the student is standing in. */
  weekNumber: number;
  phase?: string;
  /** Overall completion across this student's own tasks, 0-100. */
  percent: number;
  /** Every week number in order, setup week included. */
  weeks: number[];
  /** Completion per week number, 0-100. */
  weekPercent: (w: number) => number;
  docsFiled: number;
  docsTotal: number;
  nextTask?: Task;
  onGoToWeek: (w: number) => void;
  onContinue: () => void;
}) {
  return (
    <section
      aria-label="Where you are"
      className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-panel"
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-b border-line px-4 py-3.5">
        <div className="flex items-center gap-3">
          <ProgressRing value={percent} max={100} size={52} label="Overall completion" />
          <div className="min-w-0">
            <div className="eyebrow-muted">You are on</div>
            <div className="text-lg font-bold leading-tight text-ink">
              Week {weekNumber}
              {phase && <span className="ml-2 text-sm font-medium text-muted">{phase}</span>}
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="eyebrow-muted">Documents filed</div>
          <div className="flex items-baseline gap-1.5 text-lg font-bold leading-tight text-ink">
            <FileText className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            {docsFiled}
            <span className="text-sm font-medium text-muted">of {docsTotal}</span>
          </div>
        </div>

        {nextTask && (
          <button
            type="button"
            onClick={onContinue}
            className="ml-auto inline-flex max-w-full items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="truncate">Next: {nextTask.title}</span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        )}
      </div>

      {/* The arc, as a rail rather than a sentence. Each week is a target you can
          jump to, and its state is readable without opening it. */}
      <ol className="flex flex-wrap gap-2 px-4 py-3">
        {weeks.map((w) => {
          const pct = weekPercent(w);
          const done = pct >= 100;
          const here = w === weekNumber;
          return (
            <li key={w}>
              <button
                type="button"
                onClick={() => onGoToWeek(w)}
                aria-current={here ? 'step' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  here
                    ? 'border-accent bg-accent-soft text-accent-ink'
                    : done
                      ? 'border-ok-line bg-ok-soft text-ink'
                      : 'border-line bg-panel-2 text-body hover:border-accent hover:text-accent'
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-ok" aria-hidden />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted" aria-hidden />
                )}
                {w === 0 ? 'Setup' : `Week ${w}`}
              </button>
            </li>
          );
        })}
        <li className="ml-auto self-center">
          <Link
            href={`/courses/${course.id}/docs`}
            className="text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Open Deliverables →
          </Link>
        </li>
      </ol>
    </section>
  );
}

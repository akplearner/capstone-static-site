'use client';

import { CheckCircle2, ChevronDown, ChevronRight, Lock } from 'lucide-react';
import type { Course, Task } from '@/lib/types';

/**
 * A single collapsible task: number, title, status, and the one-line
 * objective. That is the whole closed row.
 *
 * R78-B took four things off it — the machines strip, the progress bar, the
 * step count and the time — because a closed row is a line in a list, and a
 * list of seven-element rows is the wall students described. All four still
 * exist: they are the open task's header, where the student who chose this
 * task can use them. The week's flow diagram above the list carries the step
 * counts for the glance.
 */
export function TaskRow({
  task,
  isOwn,
  joined,
  open,
  percent,
  onToggle,
  isNext,
  number,
  stuckCount,
  focus,
  lead,
  renderBody,
}: {
  course: Course;
  task: Task;
  isOwn: boolean;
  joined: boolean;
  open: boolean;
  percent: number;
  onToggle: () => void;
  isNext?: boolean;
  /** Shared-track courses: the one task of the week that is yours alone. */
  focus?: boolean;
  /** 1-based position in the week's checklist. Reference tasks: unnumbered. */
  number?: number;
  /** Teammates who have flagged a step of this task as stuck (R68). */
  stuckCount?: number;
  /** In front of the title: the task's stone (R80). */
  lead?: React.ReactNode;
  /** The body, as a thunk: called only where the result is used, so a closed
   *  row never builds a `GuidedTaskRunner` tree it then throws away. */
  renderBody: () => React.ReactNode;
}) {
  const canOpen = joined;
  const showProgress = isOwn && joined;

  return (
    <div
      id={`task-${task.id}`}
      // Stratum 2: a task is cut *into* the week, so it sits inset and a shade
      // darker rather than repeating the week's card treatment.
      className="stratum-task scroll-under-chrome overflow-hidden"
    >
      <button
        type="button"
        disabled={!canOpen}
        onClick={() => canOpen && onToggle()}
        aria-expanded={open}
        aria-controls={`task-${task.id}-body`}
        className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors ${
          canOpen ? 'hover:bg-panel-2' : 'cursor-not-allowed opacity-70'
        }`}
      >
        {lead}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {number != null && (
              <span className="font-mono text-sm font-semibold text-muted">{number}.</span>
            )}
            <span className="font-medium text-ink">{task.title}</span>
            {!!stuckCount && (
              <span className="shrink-0 rounded-full bg-warn-soft px-2 py-0.5 text-2xs font-semibold text-warn" title="Teammates stuck on a step here">
                {stuckCount} stuck
              </span>
            )}
            {focus && (
              <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-2xs font-semibold text-accent-ink">
                Your focus
              </span>
            )}
            {showProgress && percent === 100 && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" aria-label="Done" />
            )}
            {isNext && percent < 100 && (
              <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-2xs font-semibold text-accent-ink">
                Next
              </span>
            )}
          </span>
          {/* The open task states its objective in full in its header, so the
              row's one-liner steps aside rather than saying it twice. */}
          {!open && <span className="mt-0.5 block truncate text-sm text-muted">{task.objective}</span>}
        </span>

        <span className="flex shrink-0 items-center gap-3 pt-0.5">
          {!canOpen ? (
            <Lock className="h-4 w-4 text-muted" />
          ) : open ? (
            <ChevronDown className="h-5 w-5 text-muted" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted" />
          )}
        </span>
      </button>

      {/* Mounted while collapsed so the toggle's `aria-controls` resolves. */}
      <div id={`task-${task.id}-body`} className={open && canOpen ? 'border-t border-line p-4' : 'hidden'}>
        {open && canOpen && renderBody()}
      </div>
    </div>
  );
}

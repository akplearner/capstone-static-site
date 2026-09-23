'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, ChevronRight, Clock, Lock } from 'lucide-react';
import type { Course, Task } from '@/lib/types';
import { taskCard } from '@/lib/course-helpers';
import { meter } from '@/lib/motion';
import { TopologyFocus, focusOf } from '@/components/diagrams/TopologyFocus';

/**
 * A single collapsible task, stating everything it is.
 *
 * The header stays scannable — title, status, size, time — and the body is the
 * caller's (the guided runner for your own tasks, the read-only reference for a
 * teammate's).
 */
export function TaskRow({
  course,
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
  /** Shared-track courses: this is the one task of the week that is yours
   *  alone — the deep-dive your documentation focus adds to the shared build.
   *  It sits last in the week's one list, so the chip is what marks it. */
  focus?: boolean;
  /** 1-based position in the week's checklist, mono "1." before the title.
   *  Continuous across the shared lane then the focus lane. Reference tasks:
   *  unnumbered. */
  number?: number;
  /** Teammates who have flagged a step of this task as stuck (R68). */
  stuckCount?: number;
  /**
   * The body, as a thunk rather than an element.
   *
   * As `children`, every call site evaluated the body for EVERY row — including
   * the collapsed ones, whose body is then thrown away by the `open &&` below.
   * That is a whole `GuidedTaskRunner` element tree per row. A function is
   * called only where the result is used.
   */
  renderBody: () => React.ReactNode;
}) {
  const canOpen = joined;
  // The machines this task touches. Derived, so it cannot drift from the steps.
  const taskFocus = useMemo(() => focusOf(task.steps), [task.steps]);
  const card = taskCard(course, task, percent);
  const steps = card.steps.total;
  const doneSteps = card.steps.done;
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
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
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
              <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" />
            )}
            {isNext && percent < 100 && (
              <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-2xs font-semibold text-accent-ink">
                Next
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted">
            {task.objective}
          </span>

          {/* Which machines this task actually types into, derived from its
              commands, in one row before they open anything. */}
          {taskFocus.length > 0 && (
            <span className="mt-1.5 block">
              <TopologyFocus focus={taskFocus} />
            </span>
          )}

          {/* Scannable meta row — only what's specific to this closed task:
              progress and time. */}
          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            {showProgress ? (
              <span className="flex items-center gap-1.5" title={`${percent}% done`}>
                <span className="relative block h-1.5 w-20 overflow-hidden rounded-full bg-line">
                  {/* scaleX, not width: a width transition re-lays-out its row
                      on every frame, and `MotionConfig reducedMotion` stills
                      transforms for free. */}
                  <motion.span
                    className="absolute inset-0 origin-left rounded-full bg-accent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: percent / 100 }}
                    transition={meter}
                  />
                </span>
                <span className="text-muted">
                  {doneSteps}/{steps} steps
                </span>
              </span>
            ) : (
              <span className="text-muted">{steps} steps</span>
            )}
            {task.estimatedTime && (
              <span className="flex items-center gap-1 text-muted">
                <Clock className="h-3.5 w-3.5" /> {task.estimatedTime}
              </span>
            )}
          </span>
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

      {/* Mounted while collapsed so the toggle's `aria-controls` resolves —
          the same rule `Collapsible` and the setup strip follow. */}
      <div id={`task-${task.id}-body`} className={open && canOpen ? 'border-t border-line p-4' : 'hidden'}>
        {open && canOpen && renderBody()}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Surface } from '@/components/ui/Surface';
import type { Course, Task } from '@/lib/types';
import type { DueTone } from '@/lib/calendar';

const TONE: Record<DueTone, string> = {
  muted: 'text-muted',
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
};

/**
 * The four questions a student opens the course with: where am I, how far
 * through, what have I filed, and what do I do next.
 *
 * R68 removed the row of week pills it used to carry underneath — a second
 * week selector in a second visual language, directly above the WeekRail that
 * is the week selector. In its place: the actions a student reaches for from
 * here (Deliverables, the evidence ledger), the cohort's due line when the
 * instructor has set a start date, and the course-complete state rendered
 * INSIDE this surface rather than as a fifth box below it.
 *
 * Nothing here computes new state. Week completion, task percentages, the
 * resume pointer and the filed-document set are all derived on the course
 * page; this is a presentation of them in one row.
 */
export function EngagementStatus({
  course,
  weekNumber,
  phase,
  percent,
  docsFiled,
  docsTotal,
  nextTask,
  onContinue,
  due,
  onCalendar,
  subtitle,
  complete,
}: {
  course: Course;
  /** The week the student is standing in. */
  weekNumber: number;
  phase?: string;
  /** Overall completion across this student's own tasks, 0-100. */
  percent: number;
  docsFiled: number;
  docsTotal: number;
  nextTask?: Task;
  onContinue: () => void;
  /** The cohort calendar's line for this week, when a start date is set. */
  due?: { text: string; tone: DueTone };
  /** Downloads the cohort's .ics — shown only when a calendar exists. */
  onCalendar?: () => void;
  /** An engagement-framed course's client and scope line. */
  subtitle?: ReactNode;
  /** The finished state, rendered in place of "next". */
  complete?: ReactNode;
}) {
  return (
    <Surface as="section" aria-label="Where you are" id="home-head" tabIndex={-1} padding="none" className="overflow-hidden outline-none">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <ProgressRing value={percent} max={100} size={52} label="Overall completion" />
          <div className="min-w-0">
            <div className="text-sm text-muted">You are on</div>
            <div className="text-lg font-semibold leading-tight text-ink">
              Week {weekNumber}
              {phase && <span className="ml-2 text-sm font-medium text-muted">{phase}</span>}
            </div>
            {due && <div className={`mt-0.5 text-sm ${TONE[due.tone]}`}>{due.text}</div>}
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-sm text-muted">Documents filed</div>
          <div className="flex items-baseline gap-1.5 text-lg font-semibold leading-tight text-ink">
            <FileText className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            {docsFiled}
            <span className="text-sm font-medium text-muted">of {docsTotal}</span>
          </div>
        </div>

        {nextTask && !complete && (
          <button
            type="button"
            onClick={onContinue}
            className="ml-auto inline-flex max-w-full items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-strong"
          >
            <span className="truncate">Next: {nextTask.title}</span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        )}
      </div>

      {subtitle && <div className="border-t border-line px-5 py-2.5 text-sm text-body">{subtitle}</div>}

      {complete && <div className="border-t border-line px-5 py-4">{complete}</div>}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line bg-panel-2/60 px-5 py-2.5 text-sm">
        <Link href={`/courses/${course.id}/docs`} className="font-medium text-accent hover:underline">
          Open Deliverables →
        </Link>
        <Link href={`/courses/${course.id}/ledger`} className="font-medium text-accent hover:underline">
          Evidence ledger →
        </Link>
        <Link href={`/courses/${course.id}/guide`} className="font-medium text-muted hover:text-ink hover:underline">
          Guide
        </Link>
        {onCalendar && (
          <button type="button" onClick={onCalendar} className="ml-auto font-medium text-muted hover:text-ink hover:underline">
            Add the weeks to your calendar (.ics)
          </button>
        )}
      </div>
    </Surface>
  );
}

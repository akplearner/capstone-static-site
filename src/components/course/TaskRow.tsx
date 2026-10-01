'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import type { Course, Task } from '@/lib/types';
import { RoleIcon } from '@/components/team/RoleIcon';
import type { TeammateTaskProgress } from './useCourseProgress';

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
 *
 * R98: every task of the week is a row for every member, so the row says
 * whose it is — a role chip, or "Yours" — and who finished it when that was a
 * teammate. The role is a label, never a lock: the only closed row is one the
 * student has not joined the course for.
 */
export function TaskRow({
  task,
  joined,
  open,
  percent,
  onToggle,
  isNext,
  number,
  stuckCount,
  owner,
  doneBy,
  lead,
  teammates,
  reportCount,
  renderBody,
}: {
  course: Course;
  task: Task;
  joined: boolean;
  open: boolean;
  /** The TEAM's percent on this task (R98) — done once anyone has done it. */
  percent: number;
  onToggle: () => void;
  isNext?: boolean;
  /** Whose task this is: the role, and whether that is the viewer. A shared task has none. */
  owner?: { name: string; icon: string; color: string; isYou: boolean };
  /** Teammates who finished it, when the viewer did not — "Done by Ada". */
  doneBy?: string[];
  /** 1-based position in the week's checklist. Reference tasks: unnumbered. */
  number?: number;
  /** Teammates who have flagged a step of this task as stuck (R68). */
  stuckCount?: number;
  /** In front of the title: the task's stone (R80). */
  lead?: React.ReactNode;
  /** Teammates' standing on this task, for the avatar stack + team ring (R83). */
  teammates?: TeammateTaskProgress[];
  /** Open issue reports the team has filed on this task (R83). */
  reportCount?: number;
  /** The body, as a thunk: called only where the result is used, so a closed
   *  row never builds a `GuidedTaskRunner` tree it then throws away. */
  renderBody: () => React.ReactNode;
}) {
  const canOpen = joined;
  const showProgress = joined;
  const by = doneBy?.filter(Boolean) ?? [];

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
            {!!reportCount && (
              <span className="shrink-0 rounded-full bg-warn-soft px-2 py-0.5 text-2xs font-semibold text-warn" title="Issues your team reported here — no need to file a duplicate">
                {reportCount} {reportCount === 1 ? 'issue' : 'issues'}
              </span>
            )}
            {owner &&
              (owner.isYou ? (
                <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-2xs font-semibold text-accent-ink">Yours</span>
              ) : (
                <span
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-panel-2 px-2 py-0.5 text-2xs font-semibold text-muted"
                  title={`${owner.name}'s task — anyone on the team can do it`}
                >
                  <RoleIcon iconName={owner.icon} className="h-3 w-3" color={owner.color} />
                  {owner.name}
                </span>
              ))}
            {showProgress && percent === 100 && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" aria-label={by.length ? `Done by ${by.join(', ')}` : 'Done'} />
            )}
            {showProgress && percent === 100 && by.length > 0 && (
              <span className="shrink-0 rounded-full bg-ok-soft px-2 py-0.5 text-2xs font-medium text-ok">Done by {by.join(', ')}</span>
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
          {teammates && teammates.length > 1 && <TeamMarks teammates={teammates} />}
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

/**
 * The team on this task (R83): who has finished it (avatars pop in with a
 * one-shot pulse the moment a teammate's tick arrives over realtime), and a
 * dot ring for everyone still on the way. The whole mark carries a tooltip
 * naming each member and their percent — shared progress at a glance.
 */
function TeamMarks({ teammates }: { teammates: TeammateTaskProgress[] }) {
  const reduce = useReducedMotionSafe();
  const done = teammates.filter((t) => t.pct >= 100);
  const avg = Math.round(teammates.reduce((s, t) => s + t.pct, 0) / teammates.length);
  const tooltip = teammates.map((t) => `${t.displayName || 'Unnamed'} — ${t.pct}%`).join('\n');

  // Adjusted during render (the TaskStone pattern): pulse once when the DONE
  // count grows — a page load is not an event.
  const [seen, setSeen] = useState(done.length);
  const [pulse, setPulse] = useState(0);
  if (seen !== done.length) {
    setSeen(done.length);
    if (done.length > seen && !reduce) setPulse((p: number) => p + 1);
  }

  const ringColor = avg >= 100 ? 'var(--color-ok)' : avg > 0 ? 'var(--color-accent)' : 'var(--color-line)';
  return (
    <span className="hidden items-center gap-1.5 sm:flex" title={tooltip} aria-label={`Team progress on this task: ${avg}%`}>
      <span className="flex -space-x-1.5">
        {done.slice(0, 4).map((t) => (
          <span key={`${t.memberId}${pulse && '.'}`} className={pulse ? 'qa-pop inline-flex' : 'inline-flex'}>
            {t.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- provider-hosted picture; next/image would need every host allow-listed.
              <img
                src={t.avatarUrl}
                alt=""
                width={20}
                height={20}
                referrerPolicy="no-referrer"
                className="h-5 w-5 rounded-full border border-panel bg-panel-2 object-cover"
              />
            ) : (
              <span className="grid h-5 w-5 place-items-center rounded-full border border-panel bg-ok-soft text-3xs font-bold text-ok">
                {(t.displayName || '?').slice(0, 1).toUpperCase()}
              </span>
            )}
          </span>
        ))}
        {done.length > 4 && (
          <span className="grid h-5 w-5 place-items-center rounded-full border border-panel bg-panel-2 text-3xs font-semibold text-muted">
            +{done.length - 4}
          </span>
        )}
      </span>
      <span
        className="grid h-5 w-5 place-items-center rounded-full text-3xs font-semibold tabular-nums"
        style={{
          color: avg > 0 ? ringColor : 'var(--color-muted)',
          background: `conic-gradient(${ringColor} ${Math.min(avg, 100) * 3.6}deg, var(--color-line) 0)`,
        }}
      >
        <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-panel">{done.length}</span>
      </span>
    </span>
  );
}

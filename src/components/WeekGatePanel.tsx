'use client';

import { ArrowRight, CheckCircle2, Circle, Flag, Users } from 'lucide-react';
import { Course, GateStatus } from '@/lib/types';
import { getRoleDef, getTaskById } from '@/lib/course-helpers';

const STATUS_PILL: Record<GateStatus, string> = {
  locked: 'bg-panel-2 text-muted',
  ready: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  passed: 'bg-ok-soft text-ok',
};

const STATUS_LABEL: Record<GateStatus, string> = {
  locked: 'Locked',
  ready: 'In progress',
  passed: 'Passed',
};

interface WeekGatePanelProps {
  course: Course;
  week: number;
  status?: GateStatus;
  /** The viewer's role — their required tasks show live done/not-done state. */
  ownRole?: string;
  taskStats: Record<string, number>;
}

/**
 * Compact "how this week's tasks feed the gate" panel. Lists the gate's required
 * tasks: the viewer's own ones are ticked from their progress; teammates' tasks
 * are shown as informational "team" items (matches the single-user gate model).
 */
export function WeekGatePanel({ course, week, status = 'locked', ownRole, taskStats }: WeekGatePanelProps) {
  const gate = course.gates.find((g) => g.week === week);
  if (!gate) return null;

  const items = gate.requiredTasks.map((id) => {
    const task = getTaskById(course, id);
    const role = task ? getRoleDef(course, task.role) : undefined;
    const mine = !!task && !!ownRole && task.role === ownRole;
    const done = mine ? (taskStats[id] ?? 0) === 100 : false;
    return { id, task, role, mine, done };
  });

  return (
    <div className="rounded-lg border border-line bg-panel-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-muted" />
          <span className="font-semibold text-ink">
            Gate {gate.id}: {gate.description}
          </span>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_PILL[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">Required to clear this week:</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-2 text-sm">
            {it.mine ? (
              it.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted" />
              )
            ) : (
              <Users className="h-4 w-4 shrink-0 text-muted" />
            )}
            <span
              className={
                it.done
                  ? 'text-muted line-through'
                  : 'text-body'
              }
            >
              {it.task ? it.task.title : it.id}
            </span>
            {it.role && (
              <span className="text-xs font-medium" style={{ color: it.role.color }}>
                {shortRole(it.role.name)}
              </span>
            )}
            {!it.mine && <span className="text-[11px] text-muted">team</span>}
          </li>
        ))}
      </ul>

      {gate.handoffs && gate.handoffs.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="eyebrow-muted">
            End-of-week company sync
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            Confirm these hand-offs together before moving on (shared tracking arrives with the backend).
          </p>
          <ul className="mt-2 space-y-1.5">
            {gate.handoffs.map((h, i) => {
              const from = getRoleDef(course, h.from);
              const to = getRoleDef(course, h.to);
              return (
                <li key={`${h.from}-${h.to}-${i}`} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                  <span className="text-body">
                    <span className="font-medium" style={{ color: from?.color }}>
                      {shortRole(from?.name ?? h.from)}
                    </span>{' '}
                    →{' '}
                    <span className="font-medium" style={{ color: to?.color }}>
                      {shortRole(to?.name ?? h.to)}
                    </span>
                    {h.artifact && <span className="font-mono text-xs"> · {h.artifact}</span>} — {h.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function shortRole(name: string): string {
  return name.split('(')[0].trim();
}

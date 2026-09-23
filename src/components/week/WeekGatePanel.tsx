'use client';

import { ArrowRight, Flag } from 'lucide-react';
import { Course, GateStatus } from '@/lib/types';
import { getRoleDef, getTaskById } from '@/lib/course-helpers';
import { GateReadinessStrip, type ReadinessCheck } from './GateReadinessStrip';

const STATUS_PILL: Record<GateStatus, string> = {
  locked: 'bg-panel-2 text-muted',
  ready: 'bg-panel-2 text-warn',
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

  // The viewer's own required tasks are ticked from their progress; a
  // teammate's is a `team` item — informational, never ticked here (the
  // single-user gate model).
  const checks: ReadinessCheck[] = gate.requiredTasks.map((id) => {
    const task = getTaskById(course, id);
    const role = task ? getRoleDef(course, task.role) : undefined;
    const mine = !!task && !!ownRole && task.role === ownRole;
    return {
      key: id,
      label: task ? task.title : id,
      pass: mine && (taskStats[id] ?? 0) === 100,
      kind: mine ? 'mine' : 'team',
      note: (
        <>
          {role && (
            <span className="text-xs font-medium" style={{ color: role.color }}>
              {shortRole(role.name)}
            </span>
          )}
          {!mine && <span className="ml-1">team</span>}
        </>
      ),
    };
  });

  return (
    <GateReadinessStrip
      title={
        <span className="inline-flex items-center gap-2">
          <Flag className="h-4 w-4 text-muted" />
          Gate {gate.id}: {gate.description}
        </span>
      }
      meta={
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_PILL[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      }
      checks={checks}
    >
      {gate.handoffs && gate.handoffs.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="eyebrow-muted">
            End-of-week company sync
          </p>
          <p className="mt-0.5 text-2xs text-muted">
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
    </GateReadinessStrip>
  );
}

function shortRole(name: string): string {
  return name.split('(')[0].trim();
}

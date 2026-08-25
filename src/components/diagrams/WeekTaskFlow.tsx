'use client';

import { motion } from 'framer-motion';
import { ChevronRight, FileText, Send } from 'lucide-react';
import { Course } from '@/lib/types';
import { getTasksByRole, getRequiredStepCount, getRoleDef } from '@/lib/course-helpers';
import { RoleIcon } from '../RoleIcon';
import { DiagramFrame } from './DiagramFrame';

interface WeekTaskFlowProps {
  course: Course;
  role: string;
  week: number;
  /** task id -> percent, to show done state. */
  taskStats?: Record<string, number>;
  onTaskClick?: (taskId: string) => void;
  className?: string;
}

/**
 * The flow of one role's tasks for a single week, left to right, with the
 * step/document counts on each card and the cross-role hand-offs the week
 * produces. Cards are clickable to jump to the task.
 */
export function WeekTaskFlow({ course, role, week, taskStats, onTaskClick }: WeekTaskFlowProps) {
  const tasks = getTasksByRole(course, role, week);
  if (tasks.length === 0) return null;
  const roleDef = getRoleDef(course, role);
  const accent = roleDef?.color;

  const handoffs = tasks.flatMap((t) =>
    (t.handoff ?? []).map((h) => ({ ...h, from: t.title }))
  );

  return (
    <DiagramFrame
      title={`This week's task flow — ${roleDef?.name ?? role}`}
      howToRead="Work the tasks left to right — each card shows its required steps and the documents it produces, and you can finish them all on your own. The optional shares below are where your work can enrich a teammate's."
    >
      <div className="flex items-stretch gap-2 pb-1">
        {tasks.map((task, i) => {
          const pct = taskStats?.[task.id] ?? 0;
          const steps = getRequiredStepCount(task);
          const Card = onTaskClick ? motion.button : motion.div;
          return (
            <div key={task.id} className="flex items-stretch gap-2">
              <Card
                {...(onTaskClick ? { onClick: () => onTaskClick(task.id), type: 'button' as const } : {})}
                whileHover={onTaskClick ? { y: -2 } : undefined}
                className={`flex w-44 shrink-0 flex-col rounded-lg border bg-panel p-3 text-left transition-colors ${
                  onTaskClick ? 'cursor-pointer hover:border-accent hover:shadow-md' : ''
                } border-line`}
                style={accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : undefined}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="eyebrow-muted">
                    Task {i + 1}
                  </span>
                  {taskStats && (
                    <span
                      className={`text-[11px] font-bold ${
                        pct === 100 ? 'text-ok' : 'text-accent'
                      }`}
                    >
                      {pct}%
                    </span>
                  )}
                </div>
                <span className="mt-1 line-clamp-2 text-sm font-medium text-ink">
                  {task.title}
                </span>
                <span className="mt-2 flex items-center gap-2 text-[11px] text-muted">
                  <span>{steps} steps</span>
                  {task.deliverables.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3 w-3" /> {task.deliverables.length}
                    </span>
                  )}
                </span>
              </Card>
              {i < tasks.length - 1 && (
                <div className="flex items-center">
                  <ChevronRight className="h-5 w-5 text-line" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {handoffs.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <div className="mb-1.5 eyebrow-muted">
            Optional — share to enrich a teammate&apos;s work
          </div>
        <ul className="space-y-1.5">
          {handoffs.map((h, i) => {
            const to = getRoleDef(course, h.to);
            return (
              <li key={`${h.to}-${i}`} className="flex items-start gap-2 text-xs text-muted">
                <Send className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                <span className="inline-flex items-center gap-1">
                  <RoleIcon iconName={to?.icon} className="h-3.5 w-3.5" color={to?.color} />
                  <span className="font-medium" style={{ color: to?.color }}>
                    {to?.name ?? h.to}
                  </span>
                </span>
                {h.artifact && <span className="font-mono">· {h.artifact}</span>}
                <span>— {h.note}</span>
              </li>
            );
          })}
        </ul>
        </div>
      )}
    </DiagramFrame>
  );
}

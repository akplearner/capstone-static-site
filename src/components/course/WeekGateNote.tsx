'use client';

import { ArrowRight, Flag } from 'lucide-react';
import type { Course } from '@/lib/types';
import { phaseTag } from '@/lib/course-helpers';
import type { GateNote } from '@/lib/teamProgress';
import { splitRoleName } from '@/lib/docs/roles';
import { Surface } from '@/components/ui/Surface';

/**
 * A week behind a gate the team has not cleared (R116): a note, never a lock.
 *
 * Gates are checkpoints the team clears together, not doors. The week is open
 * and every task in it can be done now; this says which gate is still open and
 * names the exact tasks it waits on (setup tasks included), each a link, so a
 * team that wants to clear it knows precisely what is left. Anyone on the team
 * can finish them, whatever their role.
 */
export function WeekGateNote({
  course,
  unit,
  note,
  onGo,
  onGoTask,
}: {
  course: Course;
  unit: string;
  note: GateNote;
  onGo: (week: number) => void;
  onGoTask: (taskId: string) => void;
}) {
  const { gate, steps } = note;
  const roleName = (id: string) => splitRoleName(course.roles.find((r) => r.id === id)?.name ?? id).fn;
  return (
    <Surface as="aside" variant="inset" padding="sm" role="note" data-gate-note={gate.id}>
      <div className="flex items-start gap-3">
        <Flag className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">Gate {gate.id} is not cleared yet. This {unit} is open.</p>
          <p className="mt-1 text-sm text-muted">
            The gate waits on the required steps of {phaseTag(course, gate.week)}. Anyone on the team can finish them, whatever their role.
          </p>
          {steps.length > 0 && (
            <ul className="mt-2 space-y-1" aria-label={`Still open for Gate ${gate.id}`}>
              {steps.map((s) => (
                <li key={s.taskId} className="text-sm">
                  <button type="button" onClick={() => onGoTask(s.taskId)} className="focusable text-left font-medium text-accent hover:underline">
                    {s.title}
                  </button>
                  <span className="ml-2 text-2xs text-muted">
                    {roleName(s.role)} · {s.open} step{s.open === 1 ? '' : 's'} left · {phaseTag(course, s.week)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => onGo(gate.week)} className="focusable mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
            Go to {phaseTag(course, gate.week)} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </Surface>
  );
}

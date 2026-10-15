'use client';

import { CheckCircle2, CircleDashed, CircleDot } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import { stateLabel, verifiedLabel, yourLabel, type TaskState } from '@/lib/taskState';

/**
 * The state of a task in one chip, wherever a task is drawn (R118): an icon and
 * the words, never colour alone. It speaks for the TEAM (a task is done once
 * anyone did it) and, beside it, the member's own count when that differs, so
 * "Done by Ada" and "You: 0 of 5 steps" are never mistaken for each other.
 */
export function TaskStateChip({ state, withVerified = false }: { state: TaskState; withVerified?: boolean }) {
  const icon = state.kind === 'done' ? <CheckCircle2 /> : state.kind === 'in-progress' ? <CircleDot /> : <CircleDashed />;
  const tone = state.kind === 'done' ? 'ok' : state.kind === 'in-progress' ? 'info' : 'muted';
  const you = yourLabel(state);
  const checks = withVerified ? verifiedLabel(state) : null;
  return (
    <>
      <Chip tone={tone} icon={icon} data-task-state={state.kind}>
        {stateLabel(state)}
      </Chip>
      {you && (
        <Chip tone="muted" title="Your own steps on this task, as against the team’s" data-task-you>
          {you}
        </Chip>
      )}
      {checks && (
        <Chip tone="muted" title="Steps whose pasted output matched, out of the steps that can be checked" data-task-verified>
          {checks}
        </Chip>
      )}
    </>
  );
}

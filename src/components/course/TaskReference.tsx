import type { Task } from '@/lib/types';
import { StepDetail } from '@/components/step/StepDetail';

/** Read-only view of a task's steps (used for other roles' reference content). */
export function TaskReference({ task }: { task: Task }) {
  return (
    <div className="space-y-3">
      {task.steps.map((s, i) => (
        <div key={s.id} className="rounded-lg depth-edge bg-panel-2 p-4">
          <div className="text-xs font-semibold text-muted">
            Step {i + 1}
          </div>
          <h4 className="mt-0.5 font-semibold text-ink">{s.title}</h4>
          <div className="mt-3">
            {/* No `ledger`: another role's task is read, never recorded against. */}
            <StepDetail step={s} />
          </div>
        </div>
      ))}
    </div>
  );
}

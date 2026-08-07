import { CheckCircle2, ListChecks } from 'lucide-react';
import type { Task } from '@/lib/types';
import { getRequiredSteps } from '@/lib/course-helpers';

/**
 * The "so what do I actually do this week" panel — always visible at the top of
 * an open task, so a student never has to hunt for the plan or dig the
 * done-criteria out of a collapsed brief.
 *
 * Two plain lists: the ordered step titles (the 1/2/3 of the week) and the
 * task's definition-of-done (what "finished" looks like). The produced
 * deliverable is shown once, in the identity strip just above this, so it isn't
 * repeated here.
 */
export function TaskThisWeek({ task }: { task: Task }) {
  const steps = getRequiredSteps(task);
  const done = task.definitionOfDone ?? [];
  if (steps.length === 0 && done.length === 0) return null;

  return (
    <div className="mb-4 grid gap-4 rounded-lg border border-line bg-panel-2 p-4 sm:grid-cols-2">
      {steps.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 eyebrow-muted">
            <ListChecks className="h-3.5 w-3.5" /> This week you will
          </div>
          <ol className="mt-1.5 space-y-1 text-sm text-ink">
            {steps.map((s, i) => (
              <li key={s.id} className="flex gap-2">
                <span className="font-mono text-xs text-muted">{i + 1}.</span>
                <span>{s.title}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {done.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 eyebrow-muted">
            <CheckCircle2 className="h-3.5 w-3.5" /> Done when
          </div>
          <ul className="mt-1.5 space-y-1 text-sm text-ink">
            {done.map((d) => (
              <li key={d} className="flex gap-1.5">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

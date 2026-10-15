'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import { Surface } from '@/components/ui/Surface';

export interface YourTask {
  id: string;
  title: string;
  /** 1-based position in the week's list, as the rows number it. */
  number?: number;
  /** Done for the team (R98): once anyone did it. */
  done: boolean;
}

/**
 * Which tasks are mine this week, at a glance (R116).
 *
 * The list below it holds every role's tasks, grouped by objective, each row
 * saying whose it is. This is the short answer to "what is mine": the shared
 * build and the member's own task, as links that open them, with how many are
 * done, and a plain line that the other roles' tasks are open to them too. It
 * wears the role's seam so it reads as the member's own. Props only.
 */
export function YourTasksStrip({
  unit,
  color,
  tasks,
  onGo,
}: {
  unit: string;
  color: string;
  tasks: YourTask[];
  onGo: (taskId: string) => void;
}) {
  const done = tasks.filter((t) => t.done).length;
  return (
    <Surface as="section" variant="inset" padding="sm" accent="role" seamColor={color} aria-label={`Your tasks this ${unit}`} data-your-tasks>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-sm font-semibold text-ink">
          Your tasks this {unit}
          {tasks.length > 0 && (
            <span className="ml-2 font-normal text-muted">
              {done} of {tasks.length} done
            </span>
          )}
        </h3>
        <p className="text-xs text-muted">The other roles’ tasks below are open to you too.</p>
      </div>
      {tasks.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No task of yours this {unit}. Pick any task below: it counts for the team.</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {tasks.map((t) => (
            <li key={t.id} className="max-w-full">
              <Chip
                as="button"
                type="button"
                tone={t.done ? 'ok' : 'link'}
                icon={t.done ? <CheckCircle2 /> : <Circle />}
                onClick={() => onGo(t.id)}
                title={t.title}
                aria-label={`${t.title}, ${t.done ? 'done' : 'not done yet'}`}
                data-your-task={t.id}
              >
                {t.number != null ? `${t.number}. ` : ''}
                {t.title}
              </Chip>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}

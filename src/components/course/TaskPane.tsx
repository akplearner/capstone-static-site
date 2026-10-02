'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { Task } from '@/lib/types';
import { focusById } from '@/lib/focus';

/**
 * R100 — the open task, beside the list (the split view, ≥1100px).
 *
 * One task at a time lives here: its heading takes focus when the task
 * changes, so a keyboard or screen-reader user lands on the task they just
 * picked, and the page's task scrolls resolve to this pane rather than to
 * the row in the list. Below the breakpoint there is no pane: the row opens
 * under itself as it always did.
 */
export function TaskPane({ task, number, onClose, children }: { task: Task; number?: number; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    focusById('task-pane-head');
  }, [task.id]);
  return (
    <section id="task-pane" aria-labelledby="task-pane-head" data-open="true" className="stratum-task scroll-under-chrome">
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <h3 id="task-pane-head" tabIndex={-1} className="min-w-0 text-base font-semibold text-ink outline-none">
          {number != null && <span className="mr-1.5 font-mono text-sm text-muted">{number}.</span>}
          {task.title}
        </h3>
        <button type="button" onClick={onClose} aria-label="Close task" title="Close (Esc closes the open step first)" className="focusable -mr-1 rounded-md p-1 text-muted hover:bg-panel-2 hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

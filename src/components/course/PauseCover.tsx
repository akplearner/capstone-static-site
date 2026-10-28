'use client';

import { useEffect } from 'react';
import { PauseCircle, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { focusById } from '@/lib/focus';
import { formatElapsed } from '@/lib/taskTimer';

/**
 * R140 — the pause cover. While a task is paused the course content is hidden
 * behind this: the elapsed time, the task's name, and Resume. The same shape as
 * the agreements gate (`LegalGateOverlay`): fixed, over everything, one action.
 * Ticks and pastes cannot happen underneath it.
 */
export function PauseCover({ taskTitle, elapsedMs, onResume }: { taskTitle: string; elapsedMs: number; onResume: () => void }) {
  useEffect(() => {
    focusById('pause-resume');
  }, []);
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-surface" role="dialog" aria-modal="true" aria-labelledby="pause-head" data-pause-cover>
      <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <div className="inline-flex rounded-full bg-panel-2 p-3 text-accent">
          <PauseCircle className="h-6 w-6" aria-hidden />
        </div>
        <h1 id="pause-head" className="text-2xl font-bold text-ink">Paused</h1>
        <p className="text-sm text-body">
          <span className="font-semibold text-ink">{taskTitle}</span> is paused at{' '}
          <span className="font-mono tabular-nums" data-pause-elapsed>{formatElapsed(elapsedMs)}</span>. The content stays hidden and the timer stays
          stopped until you resume.
        </p>
        <Button id="pause-resume" onClick={onResume} className="flex items-center gap-1.5">
          <Play className="h-4 w-4" aria-hidden /> Resume
        </Button>
        <p className="text-xs text-muted">Time on task is measured, never scored.</p>
      </div>
    </div>
  );
}

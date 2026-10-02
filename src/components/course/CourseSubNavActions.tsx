'use client';

import { ArrowRight, Focus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StepTally } from '@/components/ui/Pixel';

/**
 * The right end of the course sub-nav: the step tally, the phase, the Focus
 * switch (R100 — Tasks tab only) and the one next action.
 *
 * Focus mode hides everything around the open task — rail, header, tray,
 * picture, objectives — and is remembered per device. It is a toggle, with
 * `aria-pressed`, never a second page.
 */
export function CourseSubNavActions({
  stepsDone,
  stepsTotal,
  phase,
  hasNext,
  onContinue,
  onReview,
  focus,
}: {
  stepsDone: number;
  stepsTotal: number;
  phase: string;
  hasNext: boolean;
  onContinue: () => void;
  onReview: () => void;
  /** Present on the Tasks tab only. */
  focus?: { on: boolean; onToggle: () => void };
}) {
  return (
    <>
      <StepTally done={stepsDone} total={stepsTotal} className="hidden md:flex" />
      <span className="hidden text-sm text-muted sm:inline">{phase}</span>
      {focus && (
        <button
          type="button"
          aria-pressed={focus.on}
          onClick={focus.onToggle}
          title={focus.on ? 'Focus mode is on — show the whole week again' : 'Focus mode — hide everything around the task'}
          className={`focusable inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            focus.on ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:bg-panel-2 hover:text-ink'
          }`}
        >
          <Focus className="h-3.5 w-3.5" aria-hidden /> Focus
        </button>
      )}
      {hasNext ? (
        <Button onClick={onContinue} size="sm" className="flex items-center gap-1.5">
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      ) : (
        <button type="button" onClick={onReview} className="inline-flex items-center gap-1.5 rounded-lg bg-ok-soft px-3 py-1.5 text-sm font-medium text-ok hover:opacity-80">
          <Sparkles className="h-4 w-4" /> All done — review
        </button>
      )}
    </>
  );
}

'use client';

import React, { type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { Step } from '@/lib/types';
import { StepDetail, type LedgerRef } from '@/components/step/StepDetail';
import { Chip } from '@/components/ui/Chip';
import { DUR, EASE } from '@/lib/motion';

/**
 * One rung of a task's step ladder (R79): a checkbox, the number, the title,
 * and — when the rung is open — the step's body and, in guided mode, the
 * Previous / Mark complete / Next row. Closed, a rung is one line; the
 * ladder of closed rungs IS the task's workflow, read top to bottom.
 *
 * Guided mode opens one rung (the current step) and a click on another rung
 * moves there. Show-all opens every rung, with each step's "Show me how" tier
 * open too. R78-C1: takes the `Step` rather than its 28 fields.
 */
export function ChecklistItem({
  step,
  isComplete,
  onToggle,
  ledger,
  number,
  open,
  onOpen,
  current = false,
  howOpen = false,
  footer,
  doneBy,
}: {
  step: Step;
  isComplete: boolean;
  onToggle: (complete: boolean) => void;
  /** Set to record the verification result. Omitted in read-only views. */
  ledger?: LedgerRef;
  /** 1-based position rendered as a mono "1." before the title. */
  number?: number;
  /** Whether the body is showing. The ladder decides; a rung has no state of its own. */
  open: boolean;
  /** The title row was clicked: the ladder makes this the current rung. */
  onOpen: () => void;
  /** The step the student is on — highlighted, `aria-current`. */
  current?: boolean;
  /** Open the step's "Show me how" tier on mount (show-all mode). */
  howOpen?: boolean;
  /** Under the body when open — the guided navigation row. */
  footer?: ReactNode;
  /** R98: teammates who ticked this step when the viewer did not — "done by Ada". */
  doneBy?: string[];
}) {
  const panelId = React.useId();
  const { id: stepId, title, optional } = step;

  return (
    <li
      id={`step-${stepId}`}
      data-done={isComplete ? 'true' : 'false'}
      aria-current={current ? 'step' : undefined}
      // R100: focusable by script (the ←/→ keys land the open rung), never by Tab.
      tabIndex={-1}
      className={`scroll-under-chrome rounded-[var(--radius-control)] px-2 py-1.5 outline-none sm:px-3 sm:py-2 ${current ? 'depth-current bg-panel-2' : ''}`}
    >
      <div className="flex items-start gap-3">
        <motion.input
          type="checkbox"
          checked={isComplete}
          onChange={(e) => onToggle(e.target.checked)}
          aria-label={`Step ${number ?? ''} done`}
          title={doneBy?.length ? `Ticked by ${doneBy.join(', ')} — only they can untick it` : undefined}
          whileHover={{ scale: 1.1 }}
          className="mt-1 h-5 w-5 cursor-pointer accent-[var(--color-accent)]"
        />
        <button
          type="button"
          onClick={onOpen}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
        >
          <span className={`flex items-center gap-2 font-medium ${isComplete ? 'text-muted line-through' : 'text-ink'}`}>
            {number != null && <span className="font-mono text-xs font-semibold text-muted no-underline">{number}.</span>}
            {title}
            {!!doneBy?.length && (
              <Chip tone="ok" className="no-underline">
                done by {doneBy.join(', ')}
              </Chip>
            )}
            {optional && (
              <Chip tone="info" className="no-underline">
                Optional
              </Chip>
            )}
            {isComplete && <Check className="h-4 w-4 text-ok" aria-label="done" />}
          </span>
          {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted" />}
        </button>
      </div>

      {/* AnimatePresence owns the lifetime: the panel really unmounts once it
          has finished closing, so a closed rung is not tabbable and not found
          by Ctrl-F. The id stays on the wrapper so `aria-controls` resolves. */}
      <div id={panelId}>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="detail"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: DUR.disclosure, ease: EASE.out }}
              className="overflow-hidden"
            >
              <div className="mt-2.5 space-y-3 border-t border-line pl-0 pt-3 sm:pl-8">
                <StepDetail step={step} ledger={ledger} howOpen={howOpen} />
                {footer}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}

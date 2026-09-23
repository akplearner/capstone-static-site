'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { Step } from '@/lib/types';
import { StepDetail, type LedgerRef } from '@/components/step/StepDetail';
import { DUR, EASE } from '@/lib/motion';

/**
 * One row of the "show all" checklist: a checkbox, the title, and the step body
 * behind a Details toggle. R78-C1: takes the `Step` rather than its 28 fields.
 */
export function ChecklistItem({
  step,
  isComplete,
  onToggle,
  ledger,
  defaultOpen,
  number,
}: {
  step: Step;
  isComplete: boolean;
  onToggle: (complete: boolean) => void;
  /** Set to record the verification result. Omitted in read-only views. */
  ledger?: LedgerRef;
  /** Force the detail panel open/closed. Defaults to closed — a checklist is
   *  rows, not bodies; the caller opens the first incomplete step. */
  defaultOpen?: boolean;
  /** 1-based position rendered as a mono "1." before the title. */
  number?: number;
}) {
  // Closed is the default: a checklist is rows you can scan and tick, and the
  // old default (every incomplete step open) meant opening a task dumped every
  // step body at once — the opposite. The caller opens exactly one row, the
  // first incomplete step at mount, so "resume where you were" still works.
  const [showDetails, setShowDetails] = React.useState(defaultOpen ?? false);
  const panelId = React.useId();
  const { id: stepId, title, description, optional } = step;

  return (
    // Stratum 3: a step gets a seam line, not a third nested box. Stacking a
    // third border inside week -> task -> step is what made a week read as an
    // undifferentiated wall.
    <div
      // `layout` used to sit here. Without a LayoutGroup coordinating them it
      // animated nothing, and it made every one of a task's steps re-measure on
      // every global store event — which fires on each keystroke and each tick.
      id={`step-${stepId}`}
      data-done={isComplete ? 'true' : 'false'}
      className="stratum-step scroll-under-chrome py-3"
    >
      <div className="flex items-start gap-4">
        <motion.input
          type="checkbox"
          checked={isComplete}
          onChange={(e) => onToggle(e.target.checked)}
          whileHover={{ scale: 1.1 }}
          className="mt-1 h-6 w-6 cursor-pointer accent-[var(--color-accent)]"
        />
        <div className="flex-1">
          <motion.div className="flex items-center justify-between gap-2">
            <h4 className={`flex items-center gap-2 font-medium ${isComplete ? 'line-through text-muted' : 'text-ink'}`}>
              {number != null && (
                <span className="font-mono text-xs font-semibold text-muted no-underline">{number}.</span>
              )}
              {title}
              {optional && (
                <span className="rounded-full bg-info-soft px-2 py-0.5 text-2xs font-medium text-info no-underline">
                  Optional
                </span>
              )}
            </h4>
            <motion.button
              onClick={() => setShowDetails(!showDetails)}
              aria-expanded={showDetails}
              aria-controls={panelId}
              className="-my-1 flex shrink-0 items-center gap-1 px-1 py-2 text-sm text-accent hover:text-accent-strong"
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showDetails ? 'Hide' : 'Details'}
            </motion.button>
          </motion.div>

          {/* The step's authored one-liner, as the collapsed row's subtitle: it
              says what the step is without opening it. */}
          {description && !showDetails && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted">{description}</p>
          )}

          {isComplete && (
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="mt-1 flex items-center gap-1 text-sm text-ok">
              <Check className="h-4 w-4" /> Completed
            </motion.div>
          )}

          {/* AnimatePresence owns the lifetime: the panel really unmounts once it
              has finished closing, so a collapsed step is not tabbable and not
              found by Ctrl-F. The id stays on the wrapper so `aria-controls`
              always resolves. */}
          <div id={panelId}>
            <AnimatePresence initial={false}>
              {showDetails && (
                <motion.div
                  key="detail"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: DUR.disclosure, ease: EASE.out }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 border-t border-line pt-3">
                    <StepDetail step={step} ledger={ledger} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

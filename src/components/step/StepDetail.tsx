'use client';

import { useParams } from 'next/navigation';
import { AlertTriangle, Sparkles } from 'lucide-react';
import type { Step } from '@/lib/types';
import { GlossaryText } from '@/components/GlossaryText';
import { Collapsible } from '@/components/ui/Button';
import { StepHow, hasHow, howHint } from './StepHow';
import { StepWhy, hasWhy, whyHint } from './StepWhy';
import type { LedgerRef } from './OutputVerify';

export type { LedgerRef } from './OutputVerify';

/**
 * The body of one step, in three tiers (R79).
 *
 * Students said the platform showed too much at once. A step used to render
 * eight things open — the where, the instruction, the numbered actions, the
 * command text and its explanation, the expected output, the verify box, the
 * record-in line — with five more behind "Details". The instructor's ask was
 * plain: the command hidden unless the student wants it. So:
 *
 *   Tier 0, always: the WHERE chip and ONE sentence (`instruction`, else
 *     `description`). `danger` is the one exception — a warning a student
 *     meets after the keystrokes has already failed, so it always shows.
 *   Tier 1, "Show me how": the actions, the commands, what you should see,
 *     verify, where to record it (`StepHow`).
 *   Tier 2, "Why, and if it breaks": the reasoning, the path, the files, the
 *     fixes (`StepWhy`).
 *
 * Rendered by the guided step card, the show-all checklist row (which opens
 * tier 1 for every row) and the read-only reference view of a teammate's
 * task. R78-C1: it takes the `Step` itself, never a field list.
 */
export function StepDetail({
  step,
  ledger,
  howOpen = false,
}: {
  step: Step;
  /** Set to record the verification result. Omitted in read-only views. */
  ledger?: LedgerRef;
  /** Open tier 1 on mount — the show-all checklist does, the guided card does not. */
  howOpen?: boolean;
}) {
  const params = useParams();
  const courseId = typeof params?.courseId === 'string' ? params.courseId : Array.isArray(params?.courseId) ? params.courseId[0] : '';
  const { instruction, description, danger, optional, where } = step;
  const line = instruction || description;

  return (
    <div className="space-y-3">
      {optional && (
        <p className="flex items-center gap-1.5 text-xs text-info">
          <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Optional — good practice, not counted.
        </p>
      )}

      {/* Read before anything else in the step: this one is destructive. */}
      {danger && (
        <div className="flex items-start gap-2 rounded-lg border-2 border-warn-line bg-warn-soft px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-2xs font-semibold uppercase tracking-wide text-warn">Stop and read this first</p>
            <p className="mt-0.5 text-sm font-medium text-ink">
              <GlossaryText text={danger} keys />
            </p>
          </div>
        </div>
      )}

      {/* Tier 0: where, and one sentence. */}
      {(line || where) && (
        <div className="space-y-1">
          {where && (
            <div className="inline-flex items-center gap-1.5 rounded-md depth-edge bg-panel-2 px-2 py-1 font-mono text-3xs text-muted">
              <span className="font-semibold text-accent">WHERE</span> {where}
            </div>
          )}
          {line && (
            <p className="text-sm text-body">
              <GlossaryText text={line} keys />
            </p>
          )}
        </div>
      )}

      {/* Tier 1. */}
      {hasHow(step) && (
        <div className="rounded-md depth-edge bg-panel-2/50 px-3">
          <Collapsible title="Show me how" hint={howHint(step)} defaultOpen={howOpen}>
            <StepHow step={step} ledger={ledger} courseId={courseId} />
          </Collapsible>
        </div>
      )}

      {/* Tier 2. */}
      {hasWhy(step) && (
        <div className="rounded-md depth-edge bg-panel-2/50 px-3">
          <Collapsible title="Why, and if it breaks" hint={whyHint(step)}>
            <StepWhy step={step} />
          </Collapsible>
        </div>
      )}
    </div>
  );
}

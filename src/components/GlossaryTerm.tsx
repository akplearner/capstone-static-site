'use client';

import { InfoTip } from './InfoTip';

/** A single glossary term: the word shown with a subtle dotted underline, plus the
 *  accessible InfoTip carrying its plain-language definition. Reuses InfoTip so the
 *  hover/focus/keyboard behaviour is identical to the rest of the app. */
export function GlossaryTerm({ term, definition }: { term: string; definition: string }) {
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span className="underline decoration-dotted decoration-muted underline-offset-2">
        {term}
      </span>
      <InfoTip label={`${term}: ${definition}`} />
    </span>
  );
}

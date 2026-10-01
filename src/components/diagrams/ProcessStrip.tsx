'use client';

import { ChevronRight } from 'lucide-react';
import type { WeekProcess } from '@/lib/weekVisual';

/**
 * R99 — the week's process under a picture that is laid out by the DOM (the
 * rack, the campus sites, a kit topology), where arrows across the boxes
 * would cross the text and could not be measured in a test.
 *
 * One chip chain per step — `from › label › to` — in the same look as the
 * `TopologyFocus` strip, each end coloured by the picture's own `tone(id)`
 * and named by its `name(id)`, so a chip here is recognisably the box there.
 */
export function ProcessStrip({
  process,
  name,
  tone,
}: {
  process: WeekProcess;
  /** The printed name of a part; defaults to the id. */
  name?: (id: string) => string;
  /** The colour a part is drawn in; defaults to the accent. */
  tone?: (id: string) => string | undefined;
}) {
  const label = (id: string) => name?.(id) ?? id;
  const color = (id: string) => tone?.(id) ?? 'var(--color-accent)';
  return (
    <div className="mt-3 rounded-lg depth-edge bg-panel-2 px-3 py-2" data-process={process.title}>
      <div className="eyebrow-muted">This week: {process.title}</div>
      <ol className="mt-1.5 space-y-1">
        {process.steps.map((s, i) => (
          <li key={`${s.from}-${s.to}-${i}`} className="flex flex-wrap items-center gap-x-1.5 gap-y-1" data-step={`${s.from}>${s.to}`}>
            <span className="rounded-md border px-1.5 py-0.5 font-mono text-3xs font-bold" style={{ borderColor: color(s.from), color: color(s.from) }}>
              {label(s.from)}
            </span>
            <ChevronRight className="h-3 w-3 shrink-0 text-muted/60" aria-hidden />
            <span className="text-2xs font-medium text-accent-ink">{s.label}</span>
            <ChevronRight className="h-3 w-3 shrink-0 text-muted/60" aria-hidden />
            <span className="rounded-md border px-1.5 py-0.5 font-mono text-3xs font-bold" style={{ borderColor: color(s.to), color: color(s.to) }}>
              {label(s.to)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

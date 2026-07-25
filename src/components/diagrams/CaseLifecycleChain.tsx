'use client';

import { motion } from 'framer-motion';

/**
 * The "every case follows the same path" chain — a single row of mono stage
 * pills joined by accent arrows (Detect → Triage → … → Report). Fed by a
 * course's `lifecyclePath`. Purely presentational; wraps on narrow screens.
 */
export function CaseLifecycleChain({
  stages,
  caption = 'Every case follows the same path',
}: {
  stages: string[];
  caption?: string;
}) {
  if (!stages.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-[var(--radius-card)] border border-line bg-panel p-3.5 shadow-[var(--shadow-card)]">
      <span className="w-full font-mono text-xs uppercase tracking-wider text-muted">{caption}</span>
      {stages.map((stage, i) => (
        <span key={stage} className="flex items-center gap-1.5">
          {i > 0 && <span className="font-bold text-accent" aria-hidden>→</span>}
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="whitespace-nowrap rounded-md border border-line bg-panel-2 px-2.5 py-1.5 font-mono text-[11.5px] font-semibold text-ink"
          >
            {stage}
          </motion.span>
        </span>
      ))}
    </div>
  );
}

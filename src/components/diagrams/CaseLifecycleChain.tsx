'use client';

import { motion } from 'framer-motion';

export type LifecycleStage = string | { label: string; detail?: string };

/**
 * The "every case follows the same path" chain — the real SOC flow
 * (Detect → Triage → … → Report). Each stage shows its label and, when provided,
 * a one-line plain-English detail beneath it. Fed by a course's `lifecyclePath`.
 * Purely presentational; wraps on narrow screens.
 */
export function CaseLifecycleChain({
  stages,
  caption = 'Every case follows the same path — this is the real SOC flow',
}: {
  stages: LifecycleStage[];
  caption?: string;
}) {
  if (!stages.length) return null;
  const norm = stages.map((s) => (typeof s === 'string' ? { label: s } : s));
  const hasDetail = norm.some((s) => s.detail);
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-panel p-3.5 shadow-[var(--shadow-card)]">
      <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted">{caption}</span>
      <div className={`flex flex-wrap ${hasDetail ? 'items-stretch gap-2' : 'items-center gap-1.5'}`}>
        {norm.map((stage, i) => (
          <span key={stage.label} className={`flex ${hasDetail ? 'items-stretch' : 'items-center'} gap-1.5`}>
            {i > 0 && (
              <span className={`font-bold text-accent ${hasDetail ? 'self-center' : ''}`} aria-hidden>
                →
              </span>
            )}
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-md border border-line bg-panel-2 px-2.5 py-1.5 ${
                stage.detail ? 'flex w-40 flex-col gap-1' : 'whitespace-nowrap font-mono text-[11px] font-semibold text-ink'
              }`}
            >
              <span className="font-mono text-[11px] font-semibold text-ink">{stage.label}</span>
              {stage.detail && <span className="text-[11px] leading-snug text-muted">{stage.detail}</span>}
            </motion.span>
          </span>
        ))}
      </div>
    </div>
  );
}

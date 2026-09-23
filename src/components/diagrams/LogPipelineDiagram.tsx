'use client';

import { motion } from 'framer-motion';
import { DiagramFrame } from './DiagramFrame';
import { DUR } from '@/lib/motion';
import { LOG_PIPELINE, type PipelineStage } from '@/lib/docs/cysaContent';

/**
 * How a log actually reaches the dashboard — the mental model behind almost
 * every "why is there no data?" question in the course.
 *
 * The content teaches this pipeline in pieces across Weeks 0-2 (a sensor writes
 * a file, the agent ships it on 1514/1515, a rule fires, a row appears) but
 * never draws it, so a student with an empty table has no way to reason about
 * WHERE it broke. Each stage names the one thing that proves it is working, so
 * the diagram doubles as a fault-isolation checklist.
 */

const TONE: Record<PipelineStage['where'], string> = {
  machine: 'var(--color-w1)',
  transit: 'var(--color-accent)',
  soc: 'var(--color-w3)',
};

const { copy: COPY, stages: STAGES } = LOG_PIPELINE;

export function LogPipelineDiagram() {
  return (
    <DiagramFrame
      title={COPY.title}
      subtitle={COPY.subtitle}
      howToRead={COPY.howToRead}
      legend={COPY.legend?.map((l) => ({ label: l.label, color: TONE[l.kind as PipelineStage['where']] }))}
    >
      <ol className="flex min-w-[680px] items-stretch gap-1.5">
        {STAGES.map((s, i) => {
          const tone = TONE[s.where];
          return (
            <li key={s.n} className="flex items-stretch gap-1.5">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: DUR.reveal }}
                className="flex w-[104px] flex-col rounded-md depth-edge bg-panel p-2"
                style={{ borderTopColor: tone, borderTopWidth: 2 }}
              >
                <span className="font-mono text-3xs text-muted">{s.n}</span>
                <span className="mt-0.5 text-xs font-semibold leading-tight text-ink">{s.label}</span>
                <span className="mt-0.5 text-2xs leading-tight text-muted">{s.sub}</span>
                <span className="mt-1.5 border-t border-line pt-1 text-2xs leading-tight text-muted">
                  <span className="font-medium text-ink">Proof: </span>
                  {s.proof}
                </span>
              </motion.div>
              {i < STAGES.length - 1 && (
                <span className="self-center font-bold text-accent" aria-hidden>
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <ul className="sr-only">
        {STAGES.map((s) => (
          <li key={s.n}>
            Stage {s.n}: {s.label} ({s.sub}). You know it works when {s.proof}.
          </li>
        ))}
      </ul>
    </DiagramFrame>
  );
}

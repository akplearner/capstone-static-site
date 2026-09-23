'use client';

import { motion } from 'framer-motion';
import { DiagramFrame } from './DiagramFrame';
import { DUR } from '@/lib/motion';
import { TRIAGE, type TriageBranch } from '@/lib/docs/cysaContent';

/**
 * The Week-2 triage decision, drawn.
 *
 * Deciding true positive / false positive / escalate is a three-branch test
 * against the Week-1 baseline, and the course explained it in a single 77-word
 * paragraph. Every branch here names the verdict AND what to write down, because
 * the graded artefact is the reason, not the verdict.
 */

const TONE: Record<TriageBranch['kind'], string> = {
  'false-positive': 'var(--color-w3)',
  'true-positive': 'var(--color-w4)',
  escalate: 'var(--color-accent)',
};

const { copy: COPY, question: QUESTION, branches: BRANCHES } = TRIAGE;

export function TriageDecisionTree() {
  return (
    <DiagramFrame
      title={COPY.title}
      subtitle={COPY.subtitle}
      howToRead={COPY.howToRead}
      legend={COPY.legend?.map((l) => ({ label: l.label, color: TONE[l.kind as TriageBranch['kind']] }))}
    >
      <div className="min-w-[520px] space-y-2">
        <div className="rounded-md depth-edge bg-panel-2 px-3 py-2 text-sm font-medium text-ink">
          {QUESTION}
        </div>
        {BRANCHES.map((b, i) => (
          <motion.div
            key={b.verdict}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: DUR.reveal }}
            className="grid grid-cols-[1fr_auto_1.2fr] items-center gap-2"
          >
            <div className="rounded-md depth-edge bg-panel px-3 py-2 text-sm text-muted">{b.q}</div>
            <div
              className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold"
              style={{ background: TONE[b.kind], color: 'var(--color-surface)' }}
            >
              {b.verdict}
            </div>
            <div className="rounded-md depth-edge bg-panel px-3 py-2 text-sm text-muted">
              <span className="font-medium text-ink">Write: </span>
              {b.write}
            </div>
          </motion.div>
        ))}
      </div>
      <ul className="sr-only">
        {BRANCHES.map((b) => (
          <li key={b.verdict}>
            If {b.q.toLowerCase()}, the verdict is {b.verdict}. Write: {b.write}
          </li>
        ))}
      </ul>
    </DiagramFrame>
  );
}

'use client';

import { motion } from 'framer-motion';
import { DiagramFrame } from './DiagramFrame';

/**
 * The Week-2 triage decision, drawn.
 *
 * Deciding true positive / false positive / escalate is a three-branch test
 * against the Week-1 baseline, and the course explained it in a single 77-word
 * paragraph. Every branch here names the verdict AND what to write down, because
 * the graded artefact is the reason, not the verdict.
 */

const BRANCHES: { q: string; verdict: string; write: string; tone: string }[] = [
  {
    q: 'It matches something in your baseline, at about the usual rate',
    verdict: 'False positive',
    write: 'Name the baseline row it matches. "Expected — matches sshd auth success, ~20/hr."',
    tone: 'var(--color-w3)',
  },
  {
    q: 'It is a type you never baselined, or a burst well above the usual rate',
    verdict: 'True positive',
    write: 'Give the count and the source. "412 auth failures from 10.10.30.7 in 2 min."',
    tone: 'var(--color-w4)',
  },
  {
    q: 'It looks real but you cannot prove what it did from the alert alone',
    verdict: 'Escalate',
    write: 'Say what you want checked. "SQLi attempt — needs the packet capture to confirm it succeeded."',
    tone: 'var(--color-accent)',
  },
];

export function TriageDecisionTree() {
  return (
    <DiagramFrame
      title="Deciding an alert: real, noise, or escalate"
      subtitle="Every verdict is a comparison against the baseline you wrote in Week 1"
      howToRead="Start with the alert in front of you and read the three tests top to bottom — the first one that fits is your verdict. The right-hand column is what actually gets marked: the reason, not the label."
      legend={[
        { label: 'False positive', color: 'var(--color-w3)' },
        { label: 'True positive', color: 'var(--color-w4)' },
        { label: 'Escalate', color: 'var(--color-accent)' },
      ]}
    >
      <div className="min-w-[520px] space-y-2">
        <div className="rounded-md border border-line bg-panel-2 px-3 py-2 text-sm font-medium text-ink">
          One alert · compare it against your Week-1 baseline
        </div>
        {BRANCHES.map((b, i) => (
          <motion.div
            key={b.verdict}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.25 }}
            className="grid grid-cols-[1fr_auto_1.2fr] items-center gap-2"
          >
            <div className="rounded-md border border-line bg-panel px-3 py-2 text-[13px] text-muted">{b.q}</div>
            <div
              className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold"
              style={{ background: b.tone, color: 'var(--color-surface)' }}
            >
              {b.verdict}
            </div>
            <div className="rounded-md border border-line bg-panel px-3 py-2 text-[13px] text-muted">
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

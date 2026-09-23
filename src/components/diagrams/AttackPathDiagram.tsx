'use client';

import { motion } from 'framer-motion';
import { DiagramFrame } from './DiagramFrame';
import { DUR } from '@/lib/motion';
import { ATTACK_PATH } from '@/lib/docs/cysaContent';

/**
 * The attack the course actually runs, end to end.
 *
 * Weeks 2-4 describe this chain repeatedly — recon, then SQL injection, then a
 * brute force, then the alert, the pivot, and containment — and map steps to
 * ATT&CK ids, but nothing draws it. Seeing the whole path is what lets a student
 * place the alert in front of them inside a story rather than treating it as an
 * isolated row.
 */

/** Whose move a hop is, in colour. The words are content; this is not. */
const TONE = {
  attacker: 'var(--color-w4)',
  response: 'var(--color-accent)',
} as const;

const { copy: COPY, hops: HOPS } = ATTACK_PATH;

export function AttackPathDiagram() {
  return (
    <DiagramFrame
      title={COPY.title}
      subtitle={COPY.subtitle}
      howToRead={COPY.howToRead}
      legend={COPY.legend?.map((l) => ({ label: l.label, color: TONE[l.kind as keyof typeof TONE] }))}
    >
      <ol className="flex min-w-[720px] items-stretch gap-1.5">
        {HOPS.map((h, i) => {
          const tone = TONE[h.side];
          return (
            <li key={h.stage} className="flex items-stretch gap-1.5">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: DUR.reveal }}
                className="flex w-[118px] flex-col rounded-md depth-edge bg-panel p-2"
                style={{ borderTopColor: tone, borderTopWidth: 2 }}
              >
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-xs font-semibold text-ink">{h.stage}</span>
                  <span className="font-mono text-3xs text-muted">W{h.week}</span>
                </div>
                <span className="mt-0.5 text-2xs leading-tight text-muted">{h.what}</span>
                {h.attck && (
                  <span className="mt-1 self-start rounded depth-edge px-1 font-mono text-3xs text-muted">
                    {h.attck}
                  </span>
                )}
                <span className="mt-1.5 border-t border-line pt-1 text-2xs leading-tight text-muted">
                  <span className="font-medium text-ink">Leaves: </span>
                  {h.sees}
                </span>
              </motion.div>
              {i < HOPS.length - 1 && (
                <span className="self-center font-bold text-accent" aria-hidden>
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <ul className="sr-only">
        {HOPS.map((h) => (
          <li key={h.stage}>
            {h.stage} (Week {h.week}): {h.what}
            {h.attck ? `, ATT&CK ${h.attck}` : ''}. Evidence left behind: {h.sees}.
          </li>
        ))}
      </ul>
    </DiagramFrame>
  );
}

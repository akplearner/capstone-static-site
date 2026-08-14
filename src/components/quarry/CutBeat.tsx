'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { MinerMascot } from './MinerMascot';

/**
 * The step-completion feedback: the miner mascot striking a stone that breaks
 * open into a crystal.
 *
 * This is deliberately the SAME mascot as the landing hero (see MinerMascot), so
 * a student sees one character across the whole product — the thing on the front
 * page is the thing that celebrates their work. It replaces R29's abstract cut
 * mark, at the product owner's request to put the miner in the beat too.
 *
 * The exported `CutMark` / `CutBeat` signatures are unchanged, so the only caller
 * (GuidedTaskRunner) needs no edits.
 */

/**
 * A single miner-strike mark. Static by default (the inline "task complete" icon),
 * or `loop` for an idle "still working" state.
 */
export function CutMark({
  size = 34,
  className,
  loop = false,
}: {
  size?: number;
  className?: string;
  loop?: boolean;
}) {
  return <MinerMascot size={size} className={className} loop={loop} />;
}

/**
 * Fires one quick strike whenever `trigger` changes, then fades out. Always
 * mounted so it never shifts layout; invisible at rest. Keyed by `trigger` so each
 * new value remounts and replays a single swing.
 */
export function CutBeat({ trigger, size = 40 }: { trigger: number; size?: number }) {
  return (
    <span
      className="pointer-events-none inline-flex items-center justify-center align-middle"
      style={{ width: size, height: size }}
    >
      <AnimatePresence mode="wait">
        {trigger > 0 && (
          <motion.span
            key={trigger}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1, 1, 0.98] }}
            transition={{ duration: 1.5, times: [0, 0.12, 0.72, 1], ease: 'easeOut' }}
            className="inline-flex"
          >
            {/* A snappier cycle than the hero's slow idle, so a checkbox tick gets
                a crisp strike rather than a languid one. */}
            <MinerMascot size={size} swing={trigger} cycleSeconds={1.4} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

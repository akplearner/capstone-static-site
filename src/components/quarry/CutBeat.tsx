'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BEAT_ASPECT, PixelMiner } from './PixelMiner';

/**
 * The step-completion feedback: the little pixel miner lands a strike and the
 * stone bursts into gems.
 *
 * Same character as the landing hero (PixelMiner), cropped to its `beat`
 * variant — miner + rock only, transparent background. The beat's rock spawns
 * two hits in, so the single swing that plays during this component's ~1.5s
 * lifetime shatters it: one ticked step, one full payoff.
 *
 * The exported `CutMark` / `CutBeat` signatures are unchanged from R29/R30, so
 * the only caller (GuidedTaskRunner) needs no edits.
 */

/**
 * A single miner mark. Static by default (the "task complete" banner glyph),
 * `loop` for a working animation.
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
  return <PixelMiner variant="beat" size={size} animate={loop} className={className} />;
}

/**
 * Fires one strike whenever `trigger` changes, then fades out. Always mounted so
 * it never shifts layout; invisible at rest. Keyed by `trigger` so each new value
 * remounts the canvas and replays the swing from the top.
 */
export function CutBeat({ trigger, size = 36 }: { trigger: number; size?: number }) {
  return (
    <span
      className="pointer-events-none inline-flex items-center justify-center align-middle"
      style={{ width: size * BEAT_ASPECT, height: size }}
    >
      <AnimatePresence mode="wait">
        {trigger > 0 && (
          <motion.span
            key={trigger}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.98] }}
            transition={{ duration: 1.6, times: [0, 0.1, 0.75, 1], ease: 'easeOut' }}
            className="inline-flex"
          >
            <PixelMiner variant="beat" size={size} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

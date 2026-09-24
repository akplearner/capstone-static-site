'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { MinerStrike } from './art/MinerStrike';

/**
 * The step-completion feedback: the miner lands a strike on a stone and chips
 * fly (R80: the vector miner from `./art`, replacing the pixel one).
 *
 * The exported `CutMark` / `CutBeat` signatures are unchanged from R29/R30.
 */
const ASPECT = 130 / 90;

/** A single miner mark. Static by default (the "task complete" banner glyph), `loop` for a working animation. */
export function CutMark({ size = 34, className, loop = false }: { size?: number; className?: string; loop?: boolean }) {
  return <MinerStrike size={size} strikes={loop ? 3 : 0} loop={loop} startState={loop ? 0 : 3} className={className} />;
}

/**
 * Fires one strike whenever `trigger` changes, then fades out. Always mounted so
 * it never shifts layout; invisible at rest. Keyed by `trigger`, so each new
 * value remounts and replays the swing from the top.
 */
export function CutBeat({ trigger, size = 36 }: { trigger: number; size?: number }) {
  return (
    <span className="pointer-events-none inline-flex items-center justify-center align-middle" style={{ width: size * ASPECT, height: size }}>
      <AnimatePresence mode="wait">
        {trigger > 0 && (
          <motion.span
            key={trigger}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.98] }}
            transition={{ duration: 1.4, times: [0, 0.1, 0.78, 1], ease: 'easeOut' }}
            className="inline-flex"
          >
            <MinerStrike size={size} strikes={1} startState={1} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

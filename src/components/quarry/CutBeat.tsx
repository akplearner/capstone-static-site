'use client';

import { AnimatePresence, motion } from 'framer-motion';

/**
 * The reward beat when a step lands: a cut landing on stone.
 *
 * Replaces the little pickaxe-swinging figure that used to play here. Same job —
 * a small, earned moment of feedback — without the cartoon, so the art direction
 * matches the hero and the rest of the product. It is a mark being struck: a
 * scribe line, a flash at the point of contact, and chips of mineral.
 *
 * Inherits `--color-accent` and `--stone-*`, so it takes the course's palette
 * like everything else.
 */

export function CutMark({
  size = 34,
  className,
  loop = false,
}: {
  size?: number;
  className?: string;
  /** Repeat forever (an idle "still working" state) vs a single strike. */
  loop?: boolean;
}) {
  const repeat = loop ? Infinity : 0;
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="A cut landing on stone"
    >
      {/* The stone being worked. */}
      <path
        d="M10 40 L6 22 L18 10 L36 8 L43 22 L39 40 Z"
        fill="var(--stone-rock, #3f434b)"
        stroke="var(--stone-vein, #d8dce3)"
        strokeOpacity={0.35}
        strokeWidth={1.2}
      />
      {/* Facets already cut. */}
      <path
        d="M18 10 L24 24 L43 22 M24 24 L22 40 M24 24 L6 22"
        stroke="var(--stone-vein, #d8dce3)"
        strokeOpacity={0.4}
        strokeWidth={1}
        fill="none"
      />
      {/* The scribe sweeping across, then the impact flash. */}
      <motion.line
        x1={4}
        y1={4}
        x2={4}
        y2={44}
        stroke="var(--color-accent)"
        strokeWidth={1.6}
        initial={{ opacity: 0 }}
        animate={{ x1: [4, 44], x2: [4, 44], opacity: [0, 0.9, 0] }}
        transition={{ duration: 0.75, ease: 'easeInOut', repeat, repeatDelay: 0.9 }}
      />
      <motion.circle
        cx={24}
        cy={24}
        r={7}
        fill="var(--color-accent)"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.75, 0], scale: [0.4, 1.5, 1.9] }}
        transition={{ duration: 0.7, delay: 0.28, ease: 'easeOut', repeat, repeatDelay: 0.95 }}
        style={{ transformBox: 'view-box', transformOrigin: '24px 24px' }}
      />
      {/* Chips flying off, in the mineral colour so they read as ore. */}
      <motion.g
        fill="var(--stone-crystal, #7aa2c8)"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0], y: [0, -7, -12] }}
        transition={{ duration: 0.7, delay: 0.28, ease: 'easeOut', repeat, repeatDelay: 0.95 }}
      >
        <circle cx={19} cy={19} r={1.5} />
        <circle cx={29} cy={17} r={1.2} />
        <circle cx={25} cy={13} r={1} />
      </motion.g>
    </svg>
  );
}

/**
 * Fires a single cut whenever `trigger` changes, then fades out. Always mounted
 * so it never shifts layout; invisible at rest. Keyed by `trigger` so each new
 * value restarts it.
 */
export function CutBeat({ trigger, size = 34 }: { trigger: number; size?: number }) {
  return (
    <span className="pointer-events-none inline-flex h-[34px] w-[34px] items-center justify-center align-middle">
      <AnimatePresence mode="wait">
        {trigger > 0 && (
          <motion.span
            key={trigger}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1, 1, 0.95] }}
            transition={{ duration: 1.5, times: [0, 0.15, 0.7, 1], ease: 'easeOut' }}
            className="inline-flex"
          >
            <CutMark size={size} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

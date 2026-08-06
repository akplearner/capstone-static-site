'use client';

import { AnimatePresence, motion } from 'framer-motion';

/**
 * A little miner swinging a pickaxe at the rock — the small reward beat when a
 * step or task is finished. Drawn as inline SVG (like `CapstoneStone`) so it
 * inherits the region's mineral colours: the same figure strikes iron quartz in
 * the Foundation Quarry and obsidian in the Audit Vault, with no extra assets.
 *
 * Reduced motion is handled globally by `<MotionConfig reducedMotion="user">`:
 * the pickaxe's swing is a transform, so it stills to a raised-and-ready pose
 * for anyone who asked for less motion; nothing flickers.
 */
export function QuarryMiner({
  size = 40,
  className,
  loop = true,
}: {
  size?: number;
  className?: string;
  /** Swing on a loop (idle celebration) vs a single strike (a one-off beat). */
  loop?: boolean;
}) {
  // One strike cycle: raised, hold, drive down onto the rock, recover.
  const swing = {
    rotate: [-42, -42, 18, -42],
  };
  const spark = {
    opacity: [0, 0, 1, 0],
    scale: [0.4, 0.4, 1, 0.6],
  };
  const cycle = {
    duration: 1.1,
    times: [0, 0.28, 0.52, 1],
    ease: 'easeInOut' as const,
    repeat: loop ? Infinity : 0,
    repeatDelay: loop ? 0.5 : 0,
  };

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="A miner striking the rock"
    >
      {/* The rock being worked. */}
      <path
        d="M30 44 L26 34 L34 30 L44 34 L46 44 Z"
        fill="var(--stone-rock, #3f434b)"
        stroke="var(--stone-vein, #d8dce3)"
        strokeOpacity={0.3}
        strokeWidth={1}
      />

      {/* Chips flying off on impact — the mineral, so they read as ore. */}
      <motion.g
        fill="var(--stone-crystal, #7aa2c8)"
        initial={{ opacity: 0 }}
        animate={spark}
        transition={cycle}
        style={{ transformBox: 'view-box', transformOrigin: '34px 32px' }}
      >
        <circle cx={34} cy={30} r={1.4} />
        <circle cx={38} cy={27} r={1.1} />
        <circle cx={30} cy={28} r={1} />
      </motion.g>

      {/* The miner: a hard-hatted figure. */}
      <g>
        {/* Legs + body. */}
        <path
          d="M14 44 L14 30 L20 30 L20 44"
          stroke="var(--color-accent)"
          strokeWidth={3.4}
          strokeLinecap="round"
          fill="none"
        />
        {/* Head. */}
        <circle cx={17} cy={17} r={4.4} fill="var(--color-accent)" />
        {/* Hard-hat brim. */}
        <path
          d="M11 14 L23 14"
          stroke="var(--stone-vein, #d8dce3)"
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </g>

      {/* Arm + pickaxe, swinging from the shoulder. */}
      <motion.g
        initial={{ rotate: -42 }}
        animate={loop ? swing : { rotate: [-42, 18, -42] }}
        transition={loop ? cycle : { duration: 0.6, ease: 'easeInOut' }}
        style={{ transformBox: 'view-box', transformOrigin: '18px 22px' }}
      >
        {/* Upper arm from shoulder to the hands. */}
        <path
          d="M18 22 L27 20"
          stroke="var(--color-accent)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        {/* Pickaxe handle. */}
        <path
          d="M27 20 L38 10"
          stroke="var(--color-ink)"
          strokeOpacity={0.75}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        {/* Pickaxe head. */}
        <path
          d="M33 6 Q40 9 42 16"
          stroke="var(--stone-vein, #d8dce3)"
          strokeWidth={2.6}
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>
    </svg>
  );
}

/**
 * A one-shot miner beat: shows the miner for a single strike whenever `trigger`
 * changes, then fades out on its own. Always mounted (so it never shifts
 * layout); invisible at rest. Keyed by `trigger` so each new value restarts it.
 */
export function MinerBeat({ trigger, size = 34 }: { trigger: number; size?: number }) {
  return (
    <span className="pointer-events-none inline-flex h-[34px] w-[34px] items-center justify-center align-middle">
      <AnimatePresence mode="wait">
        {trigger > 0 && (
          <motion.span
            key={trigger}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 0.9] }}
            transition={{ duration: 1.4, times: [0, 0.2, 0.7, 1], ease: 'easeOut' }}
            className="inline-flex"
          >
            <QuarryMiner size={size} loop={false} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

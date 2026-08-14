'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { MinerMascot } from './MinerMascot';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

/**
 * The landing hero: a miner working a black stone under a shaft of light until it
 * breaks open into a bright, vendor-coloured crystal.
 *
 * The figure is back. R28 removed the old pickaxe-swinging miner because it read
 * as clip-art and the hero went abstract; the product owner has since asked for a
 * proper miner, done as a clean *icon mascot* (see MinerMascot) — a mark of a few
 * shapes with no rendered face, so it reads like a logo rather than a cartoon.
 * The mascot is the subject; the atmospheric layers below (quarry benches, the
 * measuring light shaft, drifting dust, a vignette) are the setting he works in,
 * and they already read well.
 *
 * Why vector rather than a commissioned or generated image: the palette re-themes
 * per vendor through the `--stone-*` / `--color-accent` cascade (the `[data-region]`
 * blocks in globals.css). A raster hero would be one fixed picture that is wrong on
 * six of the seven vendor palettes. This follows the theme for free, scales to any
 * size, and adds no asset to load.
 *
 * Motion is gated twice: `MotionConfig reducedMotion="user"` stills transforms
 * app-wide, and `useReducedMotion()` inside the mascot renders the finished lit
 * strike instead of looping it.
 */

export function QuarryScene({ className }: { className?: string }) {
  const reduce = useReducedMotionSafe();
  const hostRef = useRef<HTMLDivElement>(null);

  // Parallax: pointer position drives a few px of opposed layer movement.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 55, damping: 22 });
  const sy = useSpring(py, { stiffness: 55, damping: 22 });
  const backX = useTransform(sx, (v) => v * -8);
  const backY = useTransform(sy, (v) => v * -5);
  const midX = useTransform(sx, (v) => v * -16);
  const midY = useTransform(sy, (v) => v * -9);
  const foreX = useTransform(sx, (v) => v * 22);
  const foreY = useTransform(sy, (v) => v * 12);

  function onPointerMove(e: React.PointerEvent) {
    if (reduce) return;
    const box = hostRef.current?.getBoundingClientRect();
    if (!box) return;
    px.set((e.clientX - box.left) / box.width - 0.5);
    py.set((e.clientY - box.top) / box.height - 0.5);
  }

  return (
    <div
      ref={hostRef}
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
      className={`relative overflow-hidden rounded-[var(--radius-card)] border border-line ${className ?? ''}`}
      style={{ background: 'radial-gradient(120% 100% at 50% 0%, var(--stone-rock-dark, #24272c), #090b0e 70%)' }}
    >
      {/* Atmospheric backdrop — benches, light shaft, dust. */}
      <svg
        viewBox="0 0 640 480"
        className="absolute inset-0 block h-full w-full"
        role="img"
        aria-label="A miner cutting a stone into a bright crystal under a shaft of light"
      >
        <defs>
          <linearGradient id="qs-beam" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="var(--stone-crystal, #7aa2c8)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--stone-crystal, #7aa2c8)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="qs-slab" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--stone-rock, #3f434b)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--stone-rock-dark, #24272c)" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* ── Back: quarry benches, stepping away ─────────────────────────── */}
        <motion.g style={{ x: backX, y: backY }} opacity={0.5}>
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M${-60 + i * 26} ${150 + i * 62} H${700} V${168 + i * 62} H${-60 + i * 26} Z`}
              fill="url(#qs-slab)"
            />
          ))}
        </motion.g>

        {/* ── The measuring beam, breathing slowly ────────────────────────── */}
        <motion.polygon
          points="250,-20 390,-20 430,470 210,470"
          fill="url(#qs-beam)"
          animate={reduce ? undefined : { opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ── Mid: unworked blocks waiting ────────────────────────────────── */}
        <motion.g style={{ x: midX, y: midY }} opacity={0.75}>
          <path d="M-20 340 L70 262 L150 300 L150 470 L-20 470 Z" fill="url(#qs-slab)" />
          <path d="M500 300 L570 250 L660 286 L660 470 L500 470 Z" fill="url(#qs-slab)" />
        </motion.g>

        {/* ── Ambient motes in the beam ───────────────────────────────────── */}
        {!reduce && (
          <g>
            {MOTES.map((m, i) => (
              <motion.circle
                key={i}
                cx={m.x}
                cy={m.y}
                r={m.r}
                fill="var(--stone-vein, #d8dce3)"
                initial={{ opacity: 0 }}
                animate={{ y: [0, -60, -120], opacity: [0, m.o, 0] }}
                transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: 'linear' }}
              />
            ))}
          </g>
        )}

        {/* Vignette, to seat the whole thing. */}
        <rect x="0" y="0" width="640" height="480" fill="url(#qs-vignette)" pointerEvents="none" />
        <defs>
          <radialGradient id="qs-vignette" cx="0.5" cy="0.45" r="0.75">
            <stop offset="60%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
          </radialGradient>
        </defs>
      </svg>

      {/* ── The subject: the miner, under the shaft, on the quarry floor. ──── */}
      <motion.div
        style={{ x: foreX, y: foreY }}
        className="pointer-events-none absolute inset-0 flex items-end justify-center pb-[6%]"
      >
        <MinerMascot fill loop className="h-[82%] w-auto" />
      </motion.div>
    </div>
  );
}

/** Fixed values, not random: identical on server and client, so no hydration mismatch. */
const MOTES = [
  { x: 268, y: 380, r: 1.7, o: 0.5, dur: 12, delay: 0 },
  { x: 322, y: 430, r: 1.2, o: 0.38, dur: 15, delay: 2.5 },
  { x: 366, y: 350, r: 1.9, o: 0.42, dur: 10.5, delay: 1.2 },
  { x: 300, y: 300, r: 1.1, o: 0.3, dur: 16, delay: 4 },
  { x: 400, y: 410, r: 1.4, o: 0.36, dur: 13, delay: 6 },
];

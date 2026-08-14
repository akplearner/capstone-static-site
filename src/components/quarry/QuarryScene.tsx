'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

/**
 * The landing hero: rough stone resolving into a cut capstone under a measuring
 * beam.
 *
 * Deliberately abstract — there is no figure. An earlier version had a miner
 * swinging a pickaxe and it read as clip-art next to a product about verified
 * engineering work. The metaphor survives; the cartoon doesn't. What's left is
 * the thing the product is actually about: raw material being measured, scribed
 * and cut with precision, one facet at a time.
 *
 * Why vector rather than a commissioned or generated image: the palette
 * re-themes per vendor through the `--stone-*` / `--color-accent` token cascade
 * (see the `[data-region]` blocks in globals.css). A raster hero would be one
 * fixed picture that is wrong on six of the seven vendor palettes. This follows
 * the theme for free, scales to any size, and adds no asset to load.
 *
 * Motion is gated twice: `MotionConfig reducedMotion="user"` stills transforms
 * app-wide, and `useReducedMotion()` here drops the ambient loops entirely and
 * renders the finished, fully-cut composition instead.
 */

const CYCLE = 3.2; // seconds per scribe → cut → settle pass
const FACETS = 5;

export function QuarryScene({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [cut, setCut] = useState(2);
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
  const foreX = useTransform(sx, (v) => v * 20);
  const foreY = useTransform(sy, (v) => v * 11);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setCut((f) => (f >= FACETS ? 1 : f + 1)), CYCLE * 1000);
    return () => clearInterval(id);
  }, [reduce]);

  // Derived, not pushed into state from an effect: with no animation running
  // there is nothing to synchronise, and setState in an effect just cascades.
  const facets = reduce ? FACETS : cut;

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
      <svg
        viewBox="0 0 640 480"
        className="block h-full w-full"
        role="img"
        aria-label="Rough stone being measured and cut into a faceted capstone"
      >
        <defs>
          <linearGradient id="qs-face" x1="0.1" y1="0" x2="0.75" y2="1">
            <stop offset="0%" stopColor="var(--stone-vein, #d8dce3)" stopOpacity="0.42" />
            <stop offset="42%" stopColor="var(--stone-rock, #3f434b)" stopOpacity="0.98" />
            <stop offset="100%" stopColor="var(--stone-rock-dark, #24272c)" />
          </linearGradient>
          <linearGradient id="qs-beam" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="var(--stone-crystal, #7aa2c8)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="var(--stone-crystal, #7aa2c8)" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="qs-core">
            <stop offset="0%" stopColor="var(--stone-crystal, #7aa2c8)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--stone-crystal, #7aa2c8)" stopOpacity="0" />
          </radialGradient>
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

        {/* ── The subject ─────────────────────────────────────────────────── */}
        <motion.g style={{ x: foreX, y: foreY }}>
          <g transform="translate(320 250)">
            {/* Plinth, so the block reads as seated and worked. */}
            <path d="M-116 132 H116 L86 172 H-86 Z" fill="var(--stone-rock-dark, #24272c)" opacity={0.85} />

            {/* The uncut mass, still visible behind the cut face — the "before"
                stays on screen so the cut means something. */}
            <path
              d="M-104 118 L-128 6 L-58 -104 L54 -122 L124 -34 L112 96 L18 148 Z"
              fill="var(--stone-rock-dark, #24272c)"
              opacity={0.55}
            />

            {/* The cut face. */}
            <path
              d="M-92 108 L-112 6 L-52 -92 L48 -108 L110 -30 L100 88 L14 132 Z"
              fill="url(#qs-face)"
              stroke="var(--stone-vein, #d8dce3)"
              strokeOpacity={0.7}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />

            {/* Rim light along the lit edge. */}
            <path
              d="M-52 -92 L48 -108 L110 -30"
              stroke="var(--stone-vein, #d8dce3)"
              strokeOpacity={0.95}
              strokeWidth={3.5}
              strokeLinecap="round"
              fill="none"
            />

            {/* Facets, scribed one per cycle. Each draws itself, so the eye reads
                a line being cut rather than geometry appearing. */}
            {FACET_PATHS.slice(0, facets).map((d) => (
              <motion.path
                key={d}
                d={d}
                initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                stroke="var(--stone-vein, #d8dce3)"
                strokeWidth={1.8}
                strokeLinecap="round"
                fill="none"
              />
            ))}

            {/* The core brightening as the stone takes shape. */}
            <motion.circle
              cx={0}
              cy={4}
              initial={false}
              animate={{ r: 24 + facets * 7, opacity: 0.16 + facets * 0.1 }}
              transition={{ duration: 0.6 }}
              fill="url(#qs-core)"
            />

            {/* The scribe: a precision line that sweeps the face and leaves the
                next facet behind it. This is the "tool" — a mark, not a mascot. */}
            {!reduce && (
              <motion.g
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: CYCLE, times: [0, 0.12, 0.4, 0.55], repeat: Infinity }}
              >
                {/* `initial={false}` is required: animating an SVG geometry
                    attribute without it leaves x1/x2 undefined on the first
                    frame and the browser rejects the element. Same trap as
                    CapstoneStone's animated radius. */}
                <motion.line
                  y1={-130}
                  y2={150}
                  stroke="var(--stone-crystal, #7aa2c8)"
                  strokeWidth={1.5}
                  strokeOpacity={0.85}
                  initial={false}
                  animate={{ x1: [-150, 140], x2: [-150, 140] }}
                  transition={{ duration: CYCLE, times: [0, 1], repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.g>
            )}
          </g>
        </motion.g>

        {/* Vignette, to seat the whole thing. */}
        <rect x="0" y="0" width="640" height="480" fill="url(#qs-vignette)" pointerEvents="none" />
        <defs>
          <radialGradient id="qs-vignette" cx="0.5" cy="0.45" r="0.75">
            <stop offset="60%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

/** One facet per cut, in the order a cutter would take them. */
const FACET_PATHS = [
  'M-52 -92 L0 4 L110 -30',
  'M0 4 L14 132',
  'M0 4 L-112 6',
  'M48 -108 L0 4',
  'M0 4 L100 88',
];

/** Fixed values, not random: identical on server and client, so no hydration mismatch. */
const MOTES = [
  { x: 268, y: 380, r: 1.7, o: 0.5, dur: 12, delay: 0 },
  { x: 322, y: 430, r: 1.2, o: 0.38, dur: 15, delay: 2.5 },
  { x: 366, y: 350, r: 1.9, o: 0.42, dur: 10.5, delay: 1.2 },
  { x: 300, y: 300, r: 1.1, o: 0.3, dur: 16, delay: 4 },
  { x: 400, y: 410, r: 1.4, o: 0.36, dur: 13, delay: 6 },
];

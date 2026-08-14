'use client';

import { useId } from 'react';
import { motion } from 'framer-motion';
import { CRYSTAL, CRYSTAL_FACE, RIM, SILHOUETTE, facetsFor } from './stoneGeometry';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

/**
 * The miner mascot — a clean, iconic figure striking a black stone that cracks
 * open into a bright, vendor-coloured crystal.
 *
 * WHY A FIGURE AGAIN: R28 removed the old pickaxe-swinging miner because it read
 * as clip-art, and the hero went abstract. The product owner has since asked for
 * the miner back, and specifically for an *icon-style* mascot — a confident mark
 * of a few shapes, no rendered face — so it reads like a logo, not a cartoon.
 * That is the lowest-clip-art-risk way to put a character back on screen.
 *
 * ONE OBJECT, TWO SIZES: this is both the landing-hero centrepiece (large, on the
 * quarry backdrop) and the step-completion beat (~34px). It re-themes per vendor
 * because every colour is a token — the hard hat and the crystal both take
 * `--color-accent` / `--stone-crystal`, so a CompTIA miner wears a red hat over a
 * red crystal, a Cisco miner blue, and so on.
 *
 * The stone is the *same* stone as everywhere else (imported silhouette + facets),
 * so the mascot, the progress emblem and the favicon are provably one object.
 *
 * Motion: the pickaxe swings, and on impact the stone ignites — facets snap from
 * a cold near-black to full shading, the crystal blazes with a bloom and a shock
 * ring, chips fly. `loop` runs it forever (hero / idle beat); a changing `swing`
 * plays it once. `useReducedMotion()` renders the finished lit strike, still.
 */

/** Place the shared 120-unit stone into this mascot's 100-unit box, lower-right. */
const STONE_TF = 'translate(66 60) scale(0.5) translate(-58 -56)';
/** The arm+pickaxe rotate around the miner's shoulder. */
const PIVOT = { x: 30, y: 49 };
/** Where the pick lands and the crystal breaks open, in mascot coordinates. */
const STRIKE = { x: 57, y: 43 };

const CYCLE = 2.4;

export function MinerMascot({
  size = 80,
  fill = false,
  className,
  loop = false,
  swing = 0,
  cycleSeconds = CYCLE,
}: {
  size?: number;
  /** Fill the parent instead of a fixed px box — the hero sizes it with CSS. */
  fill?: boolean;
  className?: string;
  /** Run the strike on a forever loop (hero, idle beat). */
  loop?: boolean;
  /** Bump this to fire exactly one strike (keyed, so each new value replays). */
  swing?: number;
  /** Seconds per swing. The hero idles slowly; the completion beat wants a snap. */
  cycleSeconds?: number;
}) {
  const reduce = useReducedMotionSafe();
  const uid = useId();
  const rockId = `mm-rock-${uid}`;
  const glowId = `mm-glow-${uid}`;
  const lampId = `mm-lamp-${uid}`;
  const facets = facetsFor('cut');

  // Strokes are authored in the 100-unit box; scale so they mean device pixels at
  // the rendered size (same trick as CapstoneStone) — a hero at 260px and a beat
  // at 34px both get a real ~1px handle instead of a hairline or a slab. When
  // filling, the box is roughly hero-scale, so use a fixed small factor.
  const k = fill ? 0.4 : 100 / size;

  const animate = !reduce && (loop || swing > 0);
  const repeat = loop ? Infinity : 0;
  const cyc = cycleSeconds;

  // Timeline (fractions of the cycle): hold raised → snap down → strike at ~0.38 →
  // recoil and lift back. The stone ignites at the strike and cools before the
  // next one, so the "black → crystal" reveal replays.
  const swingT = { duration: cyc, repeat, ease: 'easeInOut' as const, times: [0, 0.26, 0.38, 0.5, 0.66, 1] };
  const pickRotate = animate ? [-58, -58, 4, -14, -40, -58] : reduce ? 2 : -58;

  const igniteT = { duration: cyc, repeat, ease: 'easeOut' as const, times: [0, 0.34, 0.42, 0.72, 0.86, 1] };
  const igniteOpacity = animate ? [0.14, 0.14, 1, 1, 1, 0.14] : 1;

  const flashT = { duration: cyc, repeat, ease: 'easeOut' as const, times: [0, 0.36, 0.44, 0.7, 1] };

  return (
    <svg
      viewBox="0 0 100 100"
      width={fill ? '100%' : size}
      height={fill ? '100%' : size}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      role="img"
      aria-label="A miner striking a stone that breaks open into a bright crystal"
    >
      <defs>
        <linearGradient id={rockId} x1="0.2" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="var(--stone-rock, #3f434b)" />
          <stop offset="100%" stopColor="var(--stone-rock-dark, #24272c)" />
        </linearGradient>
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor="var(--stone-crystal, #7aa2c8)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--stone-crystal, #7aa2c8)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={lampId}>
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ground shadow, so the pair is seated. */}
      <ellipse cx={52} cy={90} rx={42} ry={3.2} fill="var(--stone-rock-dark, #24272c)" opacity={0.45} />

      {/* ── The stone ─────────────────────────────────────────────────────── */}
      <g transform={STONE_TF}>
        <path
          d={SILHOUETTE.cut}
          fill={`url(#${rockId})`}
          stroke="var(--stone-vein, #d8dce3)"
          strokeOpacity={0.32}
          strokeWidth={2.2 * k}
          strokeLinejoin="round"
        />
        {/* Facets: near-invisible when the stone is cold, snapping to full shading
            on the strike. Animating the group opacity (not each face) keeps it one
            cheap transition. */}
        <motion.g initial={false} animate={{ opacity: igniteOpacity }} transition={igniteT}>
          {facets.map((f) => (
            <path
              key={f.d}
              d={f.d}
              fill={f.tone >= 0 ? 'var(--stone-vein, #d8dce3)' : 'var(--stone-rock-dark, #24272c)'}
              opacity={Math.abs(f.tone)}
            />
          ))}
          <path
            d={RIM}
            stroke="var(--stone-vein, #d8dce3)"
            strokeOpacity={0.85}
            strokeWidth={3 * k}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </motion.g>
      </g>

      {/* Crystal glow bloom, drawn in mascot space at the strike point. */}
      <motion.circle
        cx={STRIKE.x}
        cy={STRIKE.y}
        r={26}
        fill={`url(#${glowId})`}
        initial={false}
        animate={
          animate
            ? { opacity: [0, 0, 0.95, 0.4, 0], scale: [0.3, 0.3, 1.5, 2.1, 2.4] }
            : { opacity: 0.6, scale: 1.6 }
        }
        transition={flashT}
        style={{ transformBox: 'view-box', transformOrigin: `${STRIKE.x}px ${STRIKE.y}px` }}
      />

      {/* The crystal itself. */}
      <motion.g
        transform={STONE_TF}
        initial={false}
        animate={{ opacity: igniteOpacity }}
        transition={igniteT}
      >
        <path d={CRYSTAL} fill="var(--stone-crystal, #7aa2c8)" opacity={0.95} />
        <path d={CRYSTAL_FACE} fill="var(--stone-vein, #d8dce3)" opacity={0.5} />
      </motion.g>

      {/* Shock ring + chips at the point of impact. */}
      {animate && (
        <>
          <motion.circle
            cx={STRIKE.x}
            cy={STRIKE.y}
            r={7}
            fill="none"
            stroke="var(--stone-vein, #d8dce3)"
            strokeWidth={1.4 * k}
            initial={false}
            animate={{ opacity: [0, 0, 0.85, 0], scale: [0.3, 0.3, 1.7, 2.3] }}
            transition={{ duration: cyc, repeat, ease: 'easeOut', times: [0, 0.36, 0.44, 0.62] }}
            style={{ transformBox: 'view-box', transformOrigin: `${STRIKE.x}px ${STRIKE.y}px` }}
          />
          <motion.g
            fill="var(--stone-crystal, #7aa2c8)"
            initial={false}
            animate={{ opacity: [0, 0, 1, 0], y: [0, 0, -9, -17] }}
            transition={{ duration: cyc, repeat, ease: 'easeOut', times: [0, 0.36, 0.46, 0.72] }}
          >
            <circle cx={STRIKE.x - 4} cy={STRIKE.y - 3} r={1.6} />
            <circle cx={STRIKE.x + 5} cy={STRIKE.y - 5} r={1.3} />
            <circle cx={STRIKE.x + 1} cy={STRIKE.y - 8} r={1} />
          </motion.g>
        </>
      )}

      {/* ── The miner ─────────────────────────────────────────────────────── */}
      {/* Body first (static), then the arm+pickaxe on top (swinging). No face —
          the head is a plain dome under the hat, which is what keeps an icon
          reading as a mark rather than a cartoon. */}
      <g>
        {/* Legs. */}
        <path d="M22 68 L20 87 L27 87 L28 68 Z" fill="var(--stone-rock-dark, #24272c)" />
        <path d="M31 68 L35 87 L42 87 L37 68 Z" fill="var(--stone-rock-dark, #24272c)" />
        {/* Torso. */}
        <path
          d="M19 47 Q17 58 23 69 L37 69 Q43 58 41 47 Z"
          fill="var(--stone-rock, #3f434b)"
          stroke="var(--stone-rock-dark, #24272c)"
          strokeWidth={0.6 * k}
        />
        {/* A vein rim on the lit (stone-facing) edge, so the crystal light catches
            him. */}
        <path
          d="M41 47 Q43 58 37 69"
          fill="none"
          stroke="var(--stone-vein, #d8dce3)"
          strokeOpacity={0.35}
          strokeWidth={1.2 * k}
          strokeLinecap="round"
        />
        {/* Head. */}
        <circle cx={30} cy={40} r={6.5} fill="var(--stone-rock, #3f434b)" />
        {/* Hard hat — the vendor's brand colour, the mascot's one bold shape. */}
        <path d="M19 39 Q20 26 30 25 Q40 26 41 39 Z" fill="var(--color-accent)" />
        <path
          d="M16 38.5 L44 38.5 Q45 41 44 41.5 L16 41.5 Q15 41 16 38.5 Z"
          fill="var(--color-accent)"
        />
        <path d="M30 25 L30 39" stroke="var(--color-accent-strong, #0c5d74)" strokeWidth={1 * k} opacity={0.6} />
        {/* Head-lamp, front of the hat, throwing a soft beam at the stone. */}
        <path d="M40 34 L64 39 L64 48 L40 39 Z" fill={`url(#${lampId})`} />
        <circle cx={40} cy={35} r={2.6} fill="var(--stone-vein, #f2f5f9)" />
        <circle cx={40} cy={35} r={4.5} fill={`url(#${lampId})`} />
      </g>

      {/* Arm + pickaxe, rotating as one around the shoulder. */}
      <motion.g
        initial={false}
        animate={{ rotate: pickRotate }}
        transition={swingT}
        style={{ transformBox: 'view-box', transformOrigin: `${PIVOT.x}px ${PIVOT.y}px` }}
      >
        {/* Upper arm. */}
        <path
          d="M29 50 L46 44"
          stroke="var(--stone-rock, #3f434b)"
          strokeWidth={5 * k}
          strokeLinecap="round"
          fill="none"
        />
        {/* Handle. */}
        <path
          d={`M45 45 L${STRIKE.x} ${STRIKE.y}`}
          stroke="var(--stone-vein, #cdd3db)"
          strokeWidth={2.4 * k}
          strokeLinecap="round"
          fill="none"
        />
        {/* Hands. */}
        <circle cx={45} cy={44.5} r={2.6} fill="var(--stone-rock-dark, #24272c)" />
        {/* Pick head — a shallow curved bar with a back poll. */}
        <path
          d={`M${STRIKE.x - 6} ${STRIKE.y - 5} Q${STRIKE.x + 1} ${STRIKE.y - 7} ${STRIKE.x + 6} ${STRIKE.y - 2} L${STRIKE.x + 4} ${STRIKE.y} Q${STRIKE.x} ${STRIKE.y - 4} ${STRIKE.x - 5} ${STRIKE.y - 2} Z`}
          fill="var(--stone-vein, #cdd3db)"
        />
        <rect
          x={STRIKE.x - 3}
          y={STRIKE.y - 4}
          width={6}
          height={2.4}
          rx={1}
          fill="var(--stone-vein, #aeb6c0)"
          transform={`rotate(-24 ${STRIKE.x} ${STRIKE.y - 3})`}
        />
      </motion.g>
    </svg>
  );
}

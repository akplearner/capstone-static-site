'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

/**
 * The landing hero: a miner working a seam, drawn as one layered scene.
 *
 * Cinematic but deliberately restrained — depth, light and weight, not cartoon
 * outlines or bouncy easing. The stone gains a facet on every strike and resets
 * after five, so the animation *is* the product metaphor: you cut the capstone by
 * repeated, deliberate work.
 *
 * Built the same way as CapstoneStone and QuarryMiner: inline SVG driven by
 * framer-motion transforms, inheriting `--stone-*` and `--color-accent`, so it
 * re-themes per region and needs no assets, no canvas and no new dependencies.
 *
 * Motion is gated twice. `MotionConfig reducedMotion="user"` (app-wide) stills
 * transforms, and `useReducedMotion()` here additionally stops the ambient dust
 * and parallax loops entirely — for those users the scene renders as a single
 * composed still, which is the honest interpretation of "reduce motion" for a
 * decorative element.
 */

const STRIKE = 2.4; // one full anticipation → impact → recover cycle, seconds
const IMPACT_AT = 0.42; // fraction of the cycle where the pick lands

export function QuarryScene({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [cut, setCut] = useState(2);
  const hostRef = useRef<HTMLDivElement>(null);

  // Parallax: pointer position → a few px of opposed movement per layer.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 20 });
  const sy = useSpring(py, { stiffness: 60, damping: 20 });
  const backX = useTransform(sx, (v) => v * -6);
  const backY = useTransform(sy, (v) => v * -4);
  const midX = useTransform(sx, (v) => v * -12);
  const midY = useTransform(sy, (v) => v * -7);
  const foreX = useTransform(sx, (v) => v * 16);
  const foreY = useTransform(sy, (v) => v * 9);

  // Advance the cut on each impact. An interval rather than an animation
  // callback so the geometry and the swing can never drift apart.
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setCut((f) => (f >= 5 ? 2 : f + 1)), STRIKE * 1000);
    return () => clearInterval(id);
  }, [reduce]);

  // Reduced motion gets the finished stone rather than a half-drawn one. Derived
  // rather than pushed into state from an effect: with no animation running there
  // is nothing to synchronise, so state here would just be a cascading render.
  const facets = reduce ? 5 : cut;

  function onPointerMove(e: React.PointerEvent) {
    if (reduce) return;
    const box = hostRef.current?.getBoundingClientRect();
    if (!box) return;
    px.set((e.clientX - box.left) / box.width - 0.5);
    py.set((e.clientY - box.top) / box.height - 0.5);
  }

  const swing = reduce
    ? { rotate: -38 }
    : { rotate: [-38, -46, 26, 26, -38] as number[] };
  const swingTiming = {
    duration: STRIKE,
    times: [0, 0.3, IMPACT_AT, 0.52, 1],
    ease: 'easeInOut' as const,
    repeat: Infinity,
  };

  return (
    <div
      ref={hostRef}
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
      className={`relative overflow-hidden rounded-[var(--radius-card)] border border-line ${className ?? ''}`}
      style={{ background: 'linear-gradient(180deg, var(--stone-rock-dark, #24272c), #0d0f12)' }}
    >
      <svg viewBox="0 0 640 420" className="block h-full w-full" role="img"
        aria-label="A miner cutting a capstone from the rock face of a quarry">
        <defs>
          <linearGradient id="qs-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--stone-rock, #3f434b)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--stone-rock-dark, #24272c)" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="qs-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--stone-rock, #3f434b)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--stone-rock-dark, #24272c)" stopOpacity="0.96" />
          </linearGradient>
          {/* The shaft of daylight down the quarry — the scene's only light source. */}
          <linearGradient id="qs-shaft" x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%" stopColor="var(--stone-vein, #d8dce3)" stopOpacity="0.30" />
            <stop offset="60%" stopColor="var(--stone-vein, #d8dce3)" stopOpacity="0.07" />
            <stop offset="100%" stopColor="var(--stone-vein, #d8dce3)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="qs-stone" x1="0.1" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="var(--stone-vein, #d8dce3)" stopOpacity="0.34" />
            <stop offset="45%" stopColor="var(--stone-rock, #3f434b)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--stone-rock-dark, #24272c)" />
          </linearGradient>
          <radialGradient id="qs-glow">
            <stop offset="0%" stopColor="var(--stone-crystal, #7aa2c8)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--stone-crystal, #7aa2c8)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── Layer 1: the far wall ─────────────────────────────────────── */}
        <motion.g style={{ x: backX, y: backY }}>
          <rect x="-40" y="-40" width="720" height="500" fill="url(#qs-wall)" />
          {/* Cut benches stepping down the far face. */}
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M${-40 + i * 40} ${120 + i * 52} H${700} V${132 + i * 52} H${-40 + i * 40} Z`}
              fill="var(--stone-rock-dark, #24272c)"
              opacity={0.35}
            />
          ))}
        </motion.g>

        {/* ── Layer 2: the light shaft ──────────────────────────────────── */}
        <motion.polygon
          points="150,-20 330,-20 470,420 250,420"
          fill="url(#qs-shaft)"
          animate={reduce ? undefined : { opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ── Layer 3: mid formations ───────────────────────────────────── */}
        <motion.g style={{ x: midX, y: midY }}>
          <path d="M-20 300 L80 210 L170 250 L250 200 L330 260 L330 440 L-20 440 Z" fill="url(#qs-mid)" />
          <path d="M380 268 L450 214 L540 246 L660 200 L660 440 L380 440 Z" fill="url(#qs-mid)" opacity={0.9} />
          <path
            d="M80 210 L170 250 M450 214 L540 246"
            stroke="var(--stone-vein, #d8dce3)"
            strokeOpacity={0.18}
            strokeWidth={1.5}
            fill="none"
          />
        </motion.g>

        {/* ── Layer 4: dust drifting through the light ──────────────────── */}
        {!reduce && (
          <g>
            {DUST.map((d, i) => (
              <motion.circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={d.r}
                fill="var(--stone-vein, #d8dce3)"
                initial={{ opacity: 0 }}
                animate={{ y: [0, -46, -92], opacity: [0, d.o, 0] }}
                transition={{
                  duration: d.dur,
                  delay: d.delay,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}
          </g>
        )}

        {/* ── Layer 5: the working face — miner and stone ───────────────── */}
        <motion.g style={{ x: foreX, y: foreY }}>
          {/* Ground the figure stands on. */}
          <path d="M120 372 H560 L540 420 H140 Z" fill="var(--stone-rock-dark, #24272c)" />

          {/* The capstone being cut, gaining a facet per strike. It is the
              brightest solid in the scene on purpose — it's the subject, and at
              rock-coloured fill it disappeared into the wall behind it. */}
          <g transform="translate(392 262)">
            {/* Plinth, so the block reads as seated and worked rather than floating. */}
            <path d="M-34 108 H120 L104 132 H-18 Z" fill="var(--stone-rock-dark, #24272c)" />
            <path
              d="M0 96 L-26 34 L14 -14 L74 -22 L112 22 L104 88 L52 112 Z"
              fill="url(#qs-stone)"
              stroke="var(--stone-vein, #d8dce3)"
              strokeOpacity={0.75}
              strokeWidth={2.2}
            />
            {/* Rim light down the struck edge. */}
            <path
              d="M14 -14 L74 -22 L112 22"
              stroke="var(--stone-vein, #d8dce3)"
              strokeOpacity={0.95}
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
            />
            {FACET_PATHS.slice(0, facets).map((d, i) => (
              <motion.path
                key={i}
                d={d}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.65 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                stroke="var(--stone-vein, #d8dce3)"
                strokeWidth={1.6}
                fill="none"
              />
            ))}
            {/* The core lights as the stone takes shape. */}
            {/* `initial={false}` matters: without it framer has no starting `r`
                and emits r="undefined" for the first frame, which the browser
                rejects. Same pattern as CapstoneStone's core. */}
            <motion.circle
              cx={44}
              cy={44}
              initial={false}
              animate={{ r: 10 + facets * 4, opacity: 0.2 + facets * 0.13 }}
              transition={{ duration: 0.5 }}
              fill="url(#qs-glow)"
            />
          </g>

          {/* Impact flash + chips, timed to the pick landing. */}
          {!reduce && (
            <motion.g
              animate={{ opacity: [0, 0, 1, 0], scale: [0.5, 0.5, 1.15, 0.7] }}
              transition={{ ...swingTiming, times: [0, IMPACT_AT - 0.02, IMPACT_AT + 0.03, 0.72] }}
              style={{ transformBox: 'view-box', transformOrigin: '404px 258px' }}
            >
              <circle cx={404} cy={258} r={22} fill="url(#qs-glow)" />
              {[[-16, -14], [10, -22], [22, -6], [-6, -26]].map(([dx, dy], i) => (
                <circle
                  key={i}
                  cx={404 + dx}
                  cy={258 + dy}
                  r={2.4}
                  fill="var(--stone-crystal, #7aa2c8)"
                />
              ))}
            </motion.g>
          )}

          {/* The miner, in ABSOLUTE viewBox coordinates rather than inside a
              translate(). `transformBox: 'view-box'` resolves transformOrigin
              against the viewBox, not the local group — so a translated group
              with a local-looking origin pivots around the wrong point entirely
              and flings the pickaxe off the figure. Writing the arm's pivot as
              the real shoulder coordinate keeps the swing attached to the body. */}
          <g>
            {/* Back leg, front leg — braced stance. */}
            <path d="M256 372 L252 328 L272 310" stroke="var(--color-accent)" strokeWidth={11}
              strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.7} />
            <path d="M294 372 L290 326 L272 310" stroke="var(--color-accent)" strokeWidth={11}
              strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* Torso, leaning into the work. */}
            <path d="M272 310 L284 266" stroke="var(--color-accent)" strokeWidth={14}
              strokeLinecap="round" fill="none" />
            {/* Head + hard hat. */}
            <circle cx={288} cy={254} r={11} fill="var(--color-accent)" />
            <path d="M275 246 Q288 233 301 246 Z" fill="var(--stone-vein, #d8dce3)" opacity={0.9} />
            <path d="M272 247 H306" stroke="var(--stone-vein, #d8dce3)" strokeWidth={3.4}
              strokeLinecap="round" />

            {/* Arm + pickaxe, swinging from the shoulder at (284, 272) — which is
                where the raised pick clears the stone and the driven pick lands
                on its upper-left face. */}
            <motion.g
              initial={{ rotate: -38 }}
              animate={swing}
              transition={reduce ? { duration: 0 } : swingTiming}
              style={{ transformBox: 'view-box', transformOrigin: '284px 272px' }}
            >
              <path d="M284 272 L336 266" stroke="var(--color-accent)" strokeWidth={10}
                strokeLinecap="round" fill="none" />
              {/* Handle. */}
              <path d="M336 266 L382 224" stroke="var(--color-ink)" strokeOpacity={0.8}
                strokeWidth={7} strokeLinecap="round" />
              {/* Steel head. */}
              <path d="M366 206 Q392 220 396 252" stroke="var(--stone-vein, #d8dce3)"
                strokeWidth={8} strokeLinecap="round" fill="none" />
            </motion.g>
          </g>
        </motion.g>
      </svg>
    </div>
  );
}

/** Facets added one per strike — the stone becoming a cut capstone. */
const FACET_PATHS = [
  'M14 -14 L44 44 L112 22',
  'M44 44 L52 112',
  'M44 44 L-26 34',
  'M74 -22 L44 44',
  'M44 44 L104 88',
];

/** Ambient motes. Fixed values, not random: a seeded look that renders the same
 *  on server and client, so nothing can hydrate-mismatch. */
const DUST = [
  { x: 210, y: 330, r: 1.6, o: 0.5, dur: 11, delay: 0 },
  { x: 268, y: 372, r: 1.1, o: 0.38, dur: 14, delay: 2.5 },
  { x: 322, y: 300, r: 1.9, o: 0.42, dur: 9.5, delay: 1.2 },
  { x: 366, y: 356, r: 1.3, o: 0.34, dur: 13, delay: 4 },
  { x: 240, y: 402, r: 1.5, o: 0.45, dur: 12, delay: 5.5 },
  { x: 300, y: 258, r: 1.0, o: 0.3, dur: 15, delay: 3.2 },
  { x: 410, y: 322, r: 1.4, o: 0.36, dur: 10.5, delay: 6.4 },
];

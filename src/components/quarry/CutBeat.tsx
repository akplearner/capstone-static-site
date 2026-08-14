'use client';

import { useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HUB, RIM, SILHOUETTE, SWEEP_BAND, facetsFor } from './stoneGeometry';

/**
 * The reward beat when a step lands: a cut landing on stone.
 *
 * Replaces the little pickaxe-swinging figure that used to play here. Same job —
 * a small, earned moment of feedback — without the cartoon, so the art direction
 * matches the hero and the rest of the product.
 *
 * The stone drawn here is now literally the same object as the progress emblem
 * and the favicon: it reads its geometry from `stoneGeometry.ts` rather than the
 * separate 6-vertex rock it used to author inline. That drawing had a different
 * vertex count and different proportions, so the product shipped three different
 * stones and the reward beat rewarded you with a shape you'd never seen.
 *
 * Inherits `--color-accent` and `--stone-*`, so it takes the course's palette
 * like everything else.
 */

/** The canonical stone lives in a 120 box; this mark is drawn in 48. */
const SCALE = 48 / 120;

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
  const facets = facetsFor('cut');
  const clipId = `cut-${useId()}`;
  // Strokes are authored in the 120-unit space, so they need scaling twice: once
  // into the 48 box, once for the rendered pixel size.
  const k = (120 / size) * (1 / SCALE);

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="A cut landing on stone"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={SILHOUETTE.cut} />
        </clipPath>
      </defs>
      <g transform={`scale(${SCALE})`}>
        {/* The stone being worked — faces filled, so it still reads as a cut
            stone at the 30–34px this actually renders at. */}
        <path
          d={SILHOUETTE.cut}
          fill="var(--stone-rock, #3f434b)"
          stroke="var(--stone-vein, #d8dce3)"
          strokeOpacity={0.4}
          strokeWidth={1.1 * k}
          strokeLinejoin="round"
        />
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
          strokeWidth={1.6 * k}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* The scribe sweeping across. Same slanted band as the emblem's specular
            sweep, so a landed step and an advanced stage share a motion idiom.
            Clipped to the silhouette — unclipped, the band is far larger than the
            stone and flicks a stray accent-coloured wedge across the layout. */}
        <g clipPath={`url(#${clipId})`}>
          <motion.path
            d={SWEEP_BAND}
            fill="var(--color-accent)"
            initial={{ x: -70, opacity: 0 }}
            animate={{ x: 190, opacity: [0, 0.85, 0] }}
            transition={{ duration: 0.75, ease: 'easeInOut', repeat, repeatDelay: 0.9 }}
          />
        </g>
      </g>

      {/* The impact flash and chips are authored directly in the 48 box, centred
          on the stone's hub so they land where the cut lands. */}
      <motion.circle
        cx={HUB.x * SCALE}
        cy={HUB.y * SCALE}
        r={7}
        fill="var(--color-accent)"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.75, 0], scale: [0.4, 1.5, 1.9] }}
        transition={{ duration: 0.7, delay: 0.28, ease: 'easeOut', repeat, repeatDelay: 0.95 }}
        style={{
          transformBox: 'view-box',
          transformOrigin: `${HUB.x * SCALE}px ${HUB.y * SCALE}px`,
        }}
      />
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
    <span
      className="pointer-events-none inline-flex items-center justify-center align-middle"
      // Sized from the prop rather than a hardcoded 34px box, which silently
      // clipped any caller passing something larger.
      style={{ width: size, height: size }}
    >
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

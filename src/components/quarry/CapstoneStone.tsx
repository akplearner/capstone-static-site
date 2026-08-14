'use client';

import { useId, useState } from 'react';
import { motion } from 'framer-motion';
import { STONE_STAGES, type StoneStage, stoneStage } from '@/lib/quarry';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import {
  BEZEL,
  CLAWS,
  CRYSTAL,
  CRYSTAL_FACE,
  CROWN_BASE,
  GIRDLE,
  HUB,
  PLINTH,
  RIM,
  SCRIBE,
  SCRIBE_TICKS,
  SILHOUETTE,
  SPOKES,
  SWEEP_BAND,
  SWEEP_FROM,
  SWEEP_TO,
  facetsFor,
  kindFor,
} from './stoneGeometry';

/**
 * Capstone progress emblem — one evolving mark for the whole project.
 *
 * A quiet, professional progress indicator rather than an XP bar: it advances only
 * when a week is genuinely finished, so it can't flatter someone who hasn't done
 * the work.
 *
 * ── Why this was redrawn ─────────────────────────────────────────────────────
 *
 * The previous version layered eight sets of hairlines onto a flat blob and drew
 * the identical picture at every size. It renders at 30px (`PathRail`), 44px
 * (`CatalogCard`, landing), 48px (`/portfolio`) and 84px (`CapstoneStonePanel`) —
 * and a `strokeWidth={1}` line in a 120-unit viewBox shown at 30px is a *quarter
 * of a device pixel*. The facets and survey marks were, literally, invisible where
 * most stones actually appear. Three things changed:
 *
 *  1. **Faces are filled, not outlined.** A cut stone reads as cut because
 *     adjacent faces differ in value. Filled polygons survive downscaling; 1px
 *     hairlines do not.
 *  2. **The stage lives in the silhouette.** `rough` → `crown` → `cut` (see
 *     stoneGeometry.ts). The old art distinguished stage 0 from stage 2 by moving
 *     each vertex about two units, which nobody could see. Now the outline itself
 *     goes from lumpy to half-straight to fully faceted.
 *  3. **Optical sizing.** Small stones drop the fine detail and thicken their
 *     strokes instead of rendering it into mud. Same silhouette and the same stage
 *     meaning at every size — only the density changes.
 *
 * Colour comes entirely from the `--stone-*` / `--color-accent` cascade, so the
 * mark takes each vendor's palette (see the `[data-region]` blocks in globals.css).
 */

/** Below this, fine detail becomes noise rather than information. */
const COMPACT_BELOW = 56;

export function CapstoneStone({
  stage,
  size = 96,
  className,
}: {
  stage: StoneStage;
  size?: number;
  className?: string;
}) {
  const def = stoneStage(stage);
  const reduce = useReducedMotionSafe();
  const uid = useId();

  // Ids must be unique per instance. They used to be `rock-${stage}`, which is
  // document-global: /explore renders ~24 cards mostly at stage 3, so every
  // `url(#rock-3)` resolved to the FIRST one in the document and every stone on
  // the page silently took the first card's rock colour. Per-vendor theming was
  // being computed and then thrown away.
  const rockId = `rock-${uid}`;
  const glowId = `glow-${uid}`;
  const sweepId = `sweep-${uid}`;
  const clipId = `clip-${uid}`;

  // Fire the "a cut landed" beat only when the stage actually advances. Adjusting
  // state during render (React's documented pattern for deriving from a changed
  // prop) rather than in an effect: an effect here would either cascade a second
  // render pass or trip the no-setState-in-effect rule.
  const [seen, setSeen] = useState(stage);
  const [pulse, setPulse] = useState(0);
  if (seen !== stage) {
    setSeen(stage);
    if (stage > seen) setPulse((p) => p + 1);
  }
  // Nothing animates in on mount. Six stones used to replay their entrance springs
  // every time /portfolio was opened, which made a static page look busy.
  const advanced = pulse > 0;
  const enter = (v: Record<string, number>) => (advanced ? v : false);

  const kind = kindFor(stage);
  const compact = size < COMPACT_BELOW;
  const facets = facetsFor(kind);

  // A stroke of width W renders at W * size/120 device px, so authoring in viewBox
  // units means every stroke is four times too thin at 30px. Scale so the numbers
  // below mean "device pixels at the rendered size".
  const k = 120 / size;

  const ambient = !compact && !reduce;
  const sweeping = ambient || pulse > 0;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`${def.name}: ${def.means}`}
    >
      <defs>
        <linearGradient id={rockId} x1="0.15" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="var(--stone-rock, #3f434b)" />
          <stop offset="100%" stopColor="var(--stone-rock-dark, #24272c)" />
        </linearGradient>
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor="var(--stone-crystal, #7aa2c8)" stopOpacity="0.75" />
          <stop offset="100%" stopColor="var(--stone-crystal, #7aa2c8)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={sweepId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--stone-vein, #d8dce3)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--stone-vein, #d8dce3)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--stone-vein, #d8dce3)" stopOpacity="0" />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={SILHOUETTE[kind]} />
        </clipPath>
      </defs>

      {/* Contact shadow, so the stone sits on something instead of floating. The
          plinth takes over this job at stage 5. */}
      {!compact && stage < 5 && (
        <ellipse
          cx={60}
          cy={106}
          rx={29}
          ry={3.5}
          fill="var(--stone-rock-dark, #24272c)"
          opacity={0.5}
        />
      )}

      {/* The body. The silhouette swaps instantly rather than tweening: the three
          kinds have different vertex counts (12 / 8 / 7), and interpolating `d`
          between mismatched paths produces garbage. The sweep below covers the
          swap, which is why the cut reads as an event rather than a glitch. */}
      <path
        d={SILHOUETTE[kind]}
        fill={`url(#${rockId})`}
        stroke="var(--stone-vein, #d8dce3)"
        strokeOpacity={0.38}
        strokeWidth={1.1 * k}
        strokeLinejoin="round"
      />

      {/* The faces. This is the drawing — everything else is trim. */}
      <g clipPath={`url(#${clipId})`}>
        {facets.map((f) => (
          <path
            key={f.d}
            d={f.d}
            fill={f.tone >= 0 ? 'var(--stone-vein, #d8dce3)' : 'var(--stone-rock-dark, #24272c)'}
            opacity={Math.abs(f.tone)}
          />
        ))}
      </g>

      {/* Facet edges, only where they'll resolve. At 30px these would be noise. */}
      {!compact && facets.length > 0 && (
        <g
          stroke="var(--stone-rock-dark, #24272c)"
          strokeOpacity={0.45}
          strokeWidth={0.7 * k}
          fill="none"
        >
          {SPOKES[kind].map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      )}

      {/* Stage 2: the unworked half washed dark, then the line the cut stopped
          at. Without the wash the crown's three lit faces are the only shading on
          the stone and stage 2 renders *brighter* than the fully-cut stage 3, so
          the progression reads backwards. */}
      {kind === 'crown' && (
        <>
          <path d={CROWN_BASE} fill="var(--stone-rock-dark, #24272c)" opacity={0.55} />
          <path
            d={GIRDLE}
            stroke="var(--stone-vein, #d8dce3)"
            strokeOpacity={0.8}
            strokeWidth={1.4 * k}
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}

      {/* Rim light along the lit edges. */}
      {facets.length > 0 && (
        <path
          d={RIM}
          stroke="var(--stone-vein, #d8dce3)"
          strokeOpacity={stage >= 5 ? 1 : 0.8}
          strokeWidth={(stage >= 5 ? 2 : 1.6) * k}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}

      {/* Stage 1 — the cut planned on raw rock. Solid accent guides, not the old
          3-3 dashes: `--color-accent` is the one token defined on every surface,
          and a dash pattern at 30px is a smudge. */}
      {stage === 1 && (
        <g clipPath={`url(#${clipId})`}>
          <motion.g
            stroke="var(--color-accent)"
            strokeWidth={1.6 * k}
            strokeLinecap="round"
            fill="none"
            initial={enter({ pathLength: 0, opacity: 0 })}
            animate={{ pathLength: 1, opacity: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {SCRIBE.map((d) => (
              <path key={d} d={d} />
            ))}
            {!compact && SCRIBE_TICKS.map((d) => <path key={d} d={d} strokeWidth={1.2 * k} />)}
          </motion.g>
        </g>
      )}

      {/* Stage 3 — the mineral core lights. A polygon rather than the old radial
          gradient: at 30px a soft r=21 blob just fogged the middle of the stone. */}
      {stage >= 3 && (
        <>
          {!compact && (
            <motion.circle
              cx={HUB.x}
              cy={HUB.y}
              r={26}
              fill={`url(#${glowId})`}
              initial={false}
              animate={ambient ? { opacity: [0.55, 0.9, 0.55] } : { opacity: 0.75 }}
              transition={ambient ? { duration: 6, repeat: Infinity, ease: 'easeInOut' } : undefined}
            />
          )}
          <motion.g
            initial={enter({ opacity: 0, scale: 0.7 })}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            style={{ transformBox: 'view-box', transformOrigin: `${HUB.x}px ${HUB.y}px` }}
          >
            <path d={CRYSTAL} fill="var(--stone-crystal, #7aa2c8)" opacity={0.95} />
            <path d={CRYSTAL_FACE} fill="var(--stone-vein, #d8dce3)" opacity={0.5} />
            <path
              d={CRYSTAL}
              fill="none"
              stroke="var(--stone-vein, #d8dce3)"
              strokeOpacity={0.55}
              strokeWidth={0.8 * k}
              strokeLinejoin="round"
            />
          </motion.g>
        </>
      )}

      {/* Stage 4 — set in a bezel. The old art drew two heavy bands in an X across
          the face, which wiped out the facet read the stone had just earned. A
          setting says "protected" without touching a single face. */}
      {stage >= 4 && (
        <motion.g
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={enter({ pathLength: 0, opacity: 0 })}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Keylined: a dark stroke under a light one. `--stone-vein` is a pale
              colour tuned for dark rock, so a single-stroke bezel vanished into a
              light page background and read as a blur rather than a setting. */}
          <path d={BEZEL} stroke="var(--stone-rock-dark, #24272c)" strokeOpacity={0.6} strokeWidth={4 * k} />
          <path d={BEZEL} stroke="var(--stone-vein, #d8dce3)" strokeOpacity={0.95} strokeWidth={2.2 * k} />
          {!compact &&
            CLAWS.map((d) => (
              <path
                key={d}
                d={d}
                stroke="var(--stone-vein, #d8dce3)"
                strokeOpacity={0.9}
                strokeWidth={2 * k}
              />
            ))}
        </motion.g>
      )}

      {/* Stage 5 — handed over and seated. */}
      {stage >= 5 && (
        <motion.g
          initial={enter({ opacity: 0, y: 5 })}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <rect {...PLINTH} fill="var(--color-accent)" opacity={0.92} />
          <rect
            x={PLINTH.x}
            y={PLINTH.y}
            width={PLINTH.width}
            height={2}
            rx={1}
            fill="var(--stone-vein, #d8dce3)"
            opacity={0.45}
          />
        </motion.g>
      )}

      {/* The specular sweep: the "cut lands" beat, and the slow ambient shimmer at
          large sizes. Keyed on `pulse` so a stage advance restarts it. Compact
          stones never run it — 24 twinkling 30px marks on /explore is a migraine,
          and `useReducedMotion` is checked explicitly because MotionConfig stills
          transforms but not loops. */}
      {sweeping && (
        <g clipPath={`url(#${clipId})`}>
          <motion.path
            key={pulse}
            d={SWEEP_BAND}
            fill={`url(#${sweepId})`}
            initial={{ x: SWEEP_FROM, opacity: 0 }}
            animate={{ x: SWEEP_TO, opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 0.85,
              ease: 'easeInOut',
              ...(ambient ? { repeat: Infinity, repeatDelay: 10 } : {}),
            }}
          />
        </g>
      )}
    </svg>
  );
}

/**
 * The stone plus its name and what it means — the header block for a course.
 * The progression rail underneath shows the whole arc, so a student can see
 * where they are without having to remember six stage names.
 */
export function CapstoneStonePanel({
  stage,
  nextPhase,
  className,
}: {
  stage: StoneStage;
  /** The expedition phase the student is working through now — what the week
   *  they're in will actually earn. Without it the stone says where you've been
   *  but never where you're going. */
  nextPhase?: string | null;
  className?: string;
}) {
  const def = stoneStage(stage);
  const next = stage < 5 ? stoneStage((stage + 1) as StoneStage) : null;

  return (
    <div className={className}>
      <div className="flex items-start gap-4">
        <CapstoneStone stage={stage} size={84} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="eyebrow">Capstone progress</div>
          <div className="mt-0.5 text-base font-semibold text-ink">{def.name}</div>
          {/* `means` is deliberately not rendered as body text. It said the same
              thing as the stage name in a longer form, and it is still carried
              by the SVG's aria-label and each rail diamond's tooltip — so the
              explanation is a hover away and screen readers keep it in full. */}
          {next && (
            <p className="mt-1.5 text-sm text-muted">
              <span className="font-semibold text-ink">Next:</span> {next.name}
              {nextPhase ? ` — ${nextPhase}` : ''}
            </p>
          )}

          {/* The arc. Cut stages are solid; the rest are outlines waiting. */}
          <div className="mt-3 flex flex-wrap items-center gap-1">
            {STONE_STAGES.map((s) => {
              const done = s.stage <= stage;
              return (
                <span
                  key={s.stage}
                  title={`${s.name} — ${s.means}`}
                  className="inline-flex items-center gap-1"
                >
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full border-2"
                    style={{
                      borderColor: 'var(--color-accent)',
                      background: done ? 'var(--color-accent)' : 'transparent',
                      opacity: done ? 1 : 0.35,
                    }}
                  />
                  {s.stage < STONE_STAGES.length - 1 && (
                    <span
                      aria-hidden
                      className="h-px w-3"
                      style={{
                        background: 'var(--color-accent)',
                        opacity: s.stage < stage ? 0.8 : 0.2,
                      }}
                    />
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { STONE_STAGES, type StoneStage, stoneStage } from '@/lib/quarry';

/**
 * Capstone progress emblem — one evolving abstract mark for the whole project.
 *
 * A quiet, professional progress indicator rather than an XP bar: it advances
 * only when a week is genuinely finished, so it can't flatter someone who hasn't
 * done the work. Drawn as inline SVG so it inherits the course's accent tokens
 * (`--stone-*` are just colour variables) and stays crisp at any size — no game
 * or pixel styling, and its labels are the professional programme phases.
 *
 * Each stage adds geometry rather than swapping art, so the progression reads as
 * one mark being completed, not six unrelated pictures (0 not started → 5
 * delivered).
 */

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
  const lit = stage >= 3;

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
        <linearGradient id={`rock-${stage}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--stone-rock, #3f434b)" />
          <stop offset="100%" stopColor="var(--stone-rock-dark, #24272c)" />
        </linearGradient>
        <radialGradient id={`core-${stage}`}>
          <stop offset="0%" stopColor="var(--stone-crystal, #7aa2c8)" stopOpacity={lit ? 0.95 : 0.35} />
          <stop offset="100%" stopColor="var(--stone-crystal, #7aa2c8)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* The rock. Stage 0-1 is a rough blob; from stage 2 it gains cut facets. */}
      <motion.path
        initial={false}
        animate={{
          d:
            stage < 2
              ? 'M28 84 L20 52 L38 26 L74 20 L98 44 L94 82 L64 100 Z'
              : 'M30 86 L18 54 L40 24 L74 18 L100 44 L96 84 L62 102 Z',
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        fill={`url(#rock-${stage})`}
        stroke="var(--stone-vein, #d8dce3)"
        strokeOpacity={0.25}
        strokeWidth={1.5}
      />

      {/* Cut facets — the stone gains defined internal geometry once structured. */}
      {stage >= 2 && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          stroke="var(--stone-vein, #d8dce3)"
          strokeOpacity={0.3}
          strokeWidth={1}
          fill="none"
        >
          <path d="M40 24 L58 56 L100 44" />
          <path d="M58 56 L62 102" />
          <path d="M58 56 L18 54" />
        </motion.g>
      )}

      {/* The mineral core. Dim until the environment is operational, then lit. */}
      <motion.circle
        cx={58}
        cy={56}
        initial={false}
        animate={{ r: 12 + stage * 3, opacity: lit ? 1 : 0.5 }}
        transition={{ duration: 0.5 }}
        fill={`url(#core-${stage})`}
      />

      {/* Survey marks — chalk lines from reading the requirements. */}
      {stage >= 1 && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: stage === 1 ? 0.9 : 0.4 }}
          stroke="var(--stone-vein, #d8dce3)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          fill="none"
        >
          <path d="M34 40 L86 34" />
          <path d="M36 70 L88 64" />
        </motion.g>
      )}

      {/* Live seams — services talking to each other through the stone. */}
      {stage >= 3 && (
        <motion.g
          stroke="var(--stone-crystal, #7aa2c8)"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.9 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <path d="M58 56 L40 26" />
          <path d="M58 56 L96 46" />
          <path d="M58 56 L34 74" />
        </motion.g>
      )}

      {/* Reinforcing bands — controls applied and tested. */}
      {stage >= 4 && (
        <motion.g
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.85, scale: 1 }}
          transition={{ duration: 0.4 }}
          stroke="var(--stone-vein, #d8dce3)"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        >
          <path d="M24 62 L98 54" />
          <path d="M44 22 L52 100" />
        </motion.g>
      )}

      {/* Mount — the finished artefact, seated in the team's portfolio. */}
      {stage >= 5 && (
        <motion.g
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <rect
            x={34}
            y={102}
            width={56}
            height={8}
            rx={1}
            fill="var(--color-accent)"
            opacity={0.9}
          />
        </motion.g>
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

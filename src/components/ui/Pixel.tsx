'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Badge as BadgeInfo, LevelInfo } from '@/lib/game';

/**
 * The arcade primitives.
 *
 * These are deliberately thin: the retro look lives in the `.pixel*` utility
 * classes in globals.css, which are driven by the same accent tokens as
 * everything else — so a pixel badge in the CySA course is CySA-coloured with
 * no per-course code here.
 *
 * The pixel *font* is only ever applied to short strings. Nothing in this file
 * accepts a paragraph.
 */

/** A short label in the arcade face. Titles, chips, counters — never prose. */
export function PixelHeading({
  children,
  className,
  as: Tag = 'span',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'h2' | 'h3' | 'div';
}) {
  return <Tag className={clsx('pixel', className)}>{children}</Tag>;
}

/** Chunky square chip. `tone` picks accent vs neutral vs earned-badge styling. */
export function PixelBadge({
  children,
  tone = 'neutral',
  title,
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'muted';
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={clsx(
        'pixel inline-flex items-center gap-1 border-2 px-1.5 py-0.5 text-[9px] uppercase leading-none',
        tone === 'accent' && 'border-accent bg-accent-soft text-accent-ink',
        tone === 'neutral' && 'border-line bg-panel text-ink',
        tone === 'muted' && 'border-line bg-panel-2 text-muted opacity-60',
        className
      )}
      style={{ borderRadius: 0 }}
    >
      {children}
    </span>
  );
}

/**
 * A stepped XP meter. The fill is a solid accent bar overlaid with the
 * `.pixel-meter` gutter pattern, which cuts it into discrete blocks — so it
 * reads as a game meter rather than a percentage bar, without needing to know
 * how many segments to draw.
 */
export function XPBar({
  level,
  xp,
  className,
}: {
  level: LevelInfo;
  xp: number;
  className?: string;
}) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <PixelBadge tone="accent" title={`Level ${level.level}`}>
        LV{level.level}
      </PixelBadge>
      <div
        className="relative h-3 w-24 border-2 border-line bg-panel-2"
        role="progressbar"
        aria-valuenow={level.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Level ${level.level} progress`}
      >
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{ background: 'var(--color-accent)' }}
          initial={{ width: 0 }}
          animate={{ width: `${level.percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {/* Gutters sit above the fill so the bar looks segmented. */}
        <div className="pixel-meter absolute inset-0" aria-hidden />
      </div>
      <span className="pixel text-[9px] text-muted" title={`${xp} XP total`}>
        {xp} XP
      </span>
    </div>
  );
}

/** The earned/unearned badge rail. Unearned badges stay visible but dimmed, so
 *  a student can see what there is to aim at. */
export function BadgeRail({ badges }: { badges: BadgeInfo[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b, i) => (
        <motion.span
          key={b.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05, duration: 0.2 }}
        >
          <PixelBadge tone={b.earned ? 'accent' : 'muted'} title={b.hint}>
            {b.label}
          </PixelBadge>
        </motion.span>
      ))}
    </div>
  );
}

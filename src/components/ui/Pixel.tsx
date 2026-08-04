'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Milestone } from '@/lib/quarry';

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
 * Work done, stated as work — "34 of 60 steps cut" rather than a point score.
 * The bar is stepped so it reads as a game meter, but the number underneath is
 * always the real count, so it can be checked against the checklist.
 */
export function StepTally({
  done,
  total,
  className,
}: {
  done: number;
  total: number;
  className?: string;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div
        className="relative h-3 w-24 border-2 border-line bg-panel-2"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${done} of ${total} steps complete`}
      >
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{ background: 'var(--color-accent)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <div className="pixel-meter absolute inset-0" aria-hidden />
      </div>
      <span className="pixel text-[9px] text-muted" title={`${done} of ${total} steps`}>
        {done}/{total}
      </span>
    </div>
  );
}

/** Professional milestones. Unearned ones stay visible but dimmed, so the rail
 *  doubles as a checklist of what is still to prove. */
export function MilestoneRail({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {milestones.map((b, i) => (
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

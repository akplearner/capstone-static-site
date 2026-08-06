'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Milestone } from '@/lib/quarry';

/**
 * Small label + progress primitives.
 *
 * These were the old "arcade" primitives; the retro bitmap treatment has been
 * retired in favour of the professional IBM Plex Mono kicker (`.eyebrow`) and a
 * smooth accent meter. The component names are kept so call sites don't churn,
 * but nothing here renders a game/pixel aesthetic any more — the content reads
 * as a professional technical UI, and each piece still takes the course's accent
 * token so it stays course-coloured with no per-course code here.
 */

/** A short mono, uppercase, letter-spaced kicker. Titles, chips, counters — never prose. */
export function PixelHeading({
  children,
  className,
  as: Tag = 'span',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'h2' | 'h3' | 'div';
}) {
  return <Tag className={clsx('eyebrow', className)}>{children}</Tag>;
}

/** A clean mono chip. `tone` picks accent vs neutral vs muted styling. */
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
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase leading-none tracking-wider',
        tone === 'accent' && 'border-accent/40 bg-accent-soft text-accent-ink',
        tone === 'neutral' && 'border-line bg-panel text-ink',
        tone === 'muted' && 'border-line bg-panel-2 text-muted',
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Work done, stated as work — "34 of 60 steps" rather than a point score, over a
 * smooth accent meter (no stepped/blocky fill).
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
        className="relative h-2 w-24 overflow-hidden rounded-full bg-panel-2"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${done} of ${total} steps complete`}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: 'var(--color-accent)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="font-mono text-[11px] text-muted" title={`${done} of ${total} steps`}>
        {done}/{total}
      </span>
    </div>
  );
}

/** Milestones. Unearned ones stay visible but dimmed, so the rail doubles as a
 *  checklist of what is still to prove. */
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
          <PixelBadge tone={b.earned ? 'accent' : 'muted'} title={b.hint} className={b.earned ? '' : 'opacity-60'}>
            {b.label}
          </PixelBadge>
        </motion.span>
      ))}
    </div>
  );
}

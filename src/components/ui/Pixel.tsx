'use client';

import { motion } from 'framer-motion';
import { meter } from '@/lib/motion';
import clsx from 'clsx';

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
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-3xs font-semibold uppercase leading-none tracking-wider',
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
          className="absolute inset-0 origin-left rounded-full"
          style={{ background: 'var(--color-accent)' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: pct / 100 }}
          transition={meter}
        />
      </div>
      <span className="font-mono text-2xs text-muted" title={`${done} of ${total} steps`}>
        {done}/{total}
      </span>
    </div>
  );
}

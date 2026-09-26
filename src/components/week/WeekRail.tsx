'use client';

import { formatMinutes } from '@/lib/course-helpers';

import { useId, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { SPRING } from '@/lib/motion';

/**
 * The week selector, once.
 *
 * There were two of these and they had drifted, which is the ordinary way a
 * duplicated control goes wrong: the Tasks rail gained a sliding pill, per-week
 * phase dots, a lock and a pulse in R63, and the Deliverables rail — the same
 * geometry, character for character — got none of it. `WeekRailSkeleton` was a
 * third copy of the same button widths. A student moving between the two tabs
 * saw the same control behave differently for no reason they could name.
 *
 * What genuinely differs between the two is data, not layout, so it is props:
 *
 *   Tasks         weeks exclude Setup · labels from `phaseTag` · done from
 *                 step progress · lock from the gate · pulse on the week you
 *                 are actually on · not sticky
 *   Deliverables  weeks include Setup · labels built inline · done when every
 *                 deliverable you own that week is filed · sticky under the
 *                 sub-nav
 *
 * Two things here are load-bearing and easy to break:
 *
 *  - `layoutId` is scoped with `useId()`. Two rails can now exist in one tree
 *    (they do not today, but nothing stops it), and a shared literal id would
 *    make the pill fly between them — the exact bug `ui/Tabs.tsx` documents.
 *  - The container's identifying attribute is passed through, because
 *    `page-shape.test.ts` reads `data-block="week-rail"` from the Deliverables
 *    source and asserts its position among the other blocks.
 */

export interface WeekRailItem {
  /** The week number. 0 is Setup, which deliberately has no phase colour. */
  week: number;
  label: ReactNode;
  /** Renders a tick. What "done" means is the caller's business. */
  done?: boolean;
  /** Renders a lock. */
  locked?: boolean;
  /** Renders a slow pulse on the dot — "this is where you actually are". */
  pulse?: boolean;
  /** An advanced week: on the rail like any other, marked so nobody reads it
   *  as required. Never counted toward completion (see `isGradedWeek`). */
  advanced?: boolean;
  /** A tooltip — the cohort calendar's "due Fri 20 Sep · in 3 days" (R68). */
  hint?: string;
  /** How long the week is, from its tasks' estimates (R79). */
  minutes?: number | null;
}

export function WeekRail({
  items,
  selected,
  onSelect,
  dots = false,
  sticky = false,
  className = '',
  ...rest
}: {
  items: WeekRailItem[];
  selected: number;
  onSelect: (week: number) => void;
  /**
   * Show the per-week phase dot. Off by default: a rail whose weeks are not a
   * sequence the student is moving along has nothing to say with it.
   */
  dots?: boolean;
  /** Pin under the site header and sub-nav, for a rail above a long page. */
  sticky?: boolean;
  className?: string;
  // `onSelect` is also a DOM event on HTMLElement, and the spread below would
  // otherwise widen ours to accept a SyntheticEvent. Omitted so the prop means
  // one thing.
} & Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'>) {
  const pillId = `week-rail-pill-${useId()}`;

  return (
    <nav
      {...rest}
      aria-label="Weeks"
      style={sticky ? { top: 'calc(var(--nav-h, 0px) + var(--subnav-h, 3rem))' } : undefined}
      className={[
        'flex flex-wrap items-center gap-1.5',
        sticky
          ? 'glass sticky z-20 -mx-4 border-b px-4 py-2'
          : 'scroll-under-chrome',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map((it) => {
        const on = it.week === selected;
        return (
          <button
            key={it.week}
            type="button"
            onClick={() => onSelect(it.week)}
            aria-current={on ? 'true' : undefined}
            title={it.hint}
            className={`relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              on ? 'text-accent-contrast' : 'text-muted hover:bg-panel-2 hover:text-ink'
            }`}
          >
            {/* The selected fill is one shared element, so changing week slides
                it across the rail instead of repainting one button and
                un-painting another. It sits BEHIND the label (-z-10) rather
                than wrapping it, so the text does not re-animate with it. */}
            {on && (
              <motion.span
                layoutId={pillId}
                transition={SPRING.slide}
                className="absolute inset-0 -z-10 rounded-md bg-accent"
                aria-hidden
              />
            )}
            {dots && (
              // Every week wears its own phase colour, always, so the rail reads
              // as a coloured sequence you are moving along. On the selected
              // week the pill behind it is already the accent, so the dot
              // switches to `bg-current` rather than putting a second hue on a
              // filled chip. Week 0 (Setup) has no phase colour and falls back
              // to the accent — deliberate: it is preparation, not a phase.
              <span
                data-week={it.week}
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${it.pulse ? 'qi-pulse' : ''} ${
                  on ? 'bg-current' : ''
                }`}
                style={on ? undefined : { background: 'var(--week, var(--color-accent))' }}
                aria-hidden
              />
            )}
            {it.label}
            {it.minutes != null && it.minutes > 0 && (
              <span className={`text-2xs ${on ? 'opacity-80' : 'text-muted'}`}>~{formatMinutes(it.minutes)}</span>
            )}
            {it.advanced && <Sparkles className="h-3.5 w-3.5" aria-label="advanced, optional" />}
            {it.done && <CheckCircle2 className="h-3.5 w-3.5" aria-label="done" />}
            {it.locked && <Lock className="h-3.5 w-3.5" aria-label="locked" />}
          </button>
        );
      })}
    </nav>
  );
}

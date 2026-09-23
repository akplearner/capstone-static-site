'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { DUR, EASE } from '@/lib/motion';

/**
 * Disclosure is for tools, actions, and the supporting detail of a step a
 * student has already chosen to do — and there is ONE per level: one for the
 * week ("More for this week"), one for the task ("About this task"), one for
 * the step ("Details"). Primary reading material, the Guide and the Reference
 * routes, renders open; `src/lib/page-shape.test.ts` enforces that those pages
 * never import this component.
 *
 * R78-B revised the first sentence. It used to say "never for reading
 * material", and that was right for the Guide — but on the Tasks tab the
 * opposite failure was the one students reported: everything a step could say
 * was on screen at once, so nobody could find the one line that said what to
 * do. A disclosure is how the detail stays reachable without being in the way.
 *
 * `hint` is what makes one disclosure per level honest: a closed bar that says
 * "3 setup tasks · lab access not set · Gate 1 in progress" tells the student
 * whether anything inside needs them, so closed is not the same as hidden.
 *
 * ── The close animation nobody had ever seen ──
 * This used to animate `height: auto → 0` *and* set `hidden` on the same render.
 * `hidden` is `display: none`, so the panel was removed from layout on frame one
 * and the 200ms it was told to spend closing played against an element that was
 * already gone. The `hidden` was there for a real reason — collapsed content
 * must not be tabbable or findable by Ctrl-F — so the fix is not to drop it but
 * to let AnimatePresence own the lifetime: the panel genuinely unmounts, after
 * it has finished closing. The wrapper stays mounted so `aria-controls` always
 * resolves to a real element.
 */
interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** Controlled: the parent owns the open state (a deep link or a "Read their
   *  steps →" button elsewhere on the page has to be able to open it). */
  open?: boolean;
  onToggle?: (open: boolean) => void;
  /** A few muted words on the right of the bar saying what is inside. */
  hint?: string;
  /** `warn` when something inside needs the student — an unset lab address. */
  tone?: 'neutral' | 'warn';
}

export function Collapsible({ title, children, defaultOpen = false, open, onToggle, hint, tone = 'neutral' }: CollapsibleProps) {
  const [inner, setInner] = React.useState(defaultOpen);
  const isOpen = open ?? inner;
  const panelId = React.useId();
  const toggle = () => {
    const next = !isOpen;
    if (open === undefined) setInner(next);
    onToggle?.(next);
  };

  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="focusable flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] py-3 text-left font-medium transition-colors hover:text-accent"
      >
        <span className="min-w-0">{title}</span>
        <span className="flex min-w-0 shrink items-center gap-2">
          {hint && (
            <span className={`truncate text-xs font-normal ${tone === 'warn' ? 'text-warn' : 'text-muted'}`}>{hint}</span>
          )}
          {/* A real icon, at the weight of every other icon in the app. */}
          <motion.span
            aria-hidden
            className="shrink-0 text-muted"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: DUR.disclosure, ease: EASE.out }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </span>
      </button>
      <div id={panelId}>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: DUR.disclosure, ease: EASE.out }}
              className="overflow-hidden"
            >
              <div className="pb-3 pl-4">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

/**
 * Disclosure is for tools and actions, never for reading material — prose either
 * fits on the page or moves to the Reference route, where it renders open.
 * `src/lib/page-shape.test.ts` enforces that the Guide and Reference pages never
 * import this component.
 *
 * ── The close animation nobody had ever seen ──
 * This used to animate `height: auto → 0` *and* set `hidden` on the same render.
 * `hidden` is `display: none`, so the panel was removed from layout on frame one
 * and the 200ms it was told to spend closing played against an element that was
 * already gone. Opening looked considered; closing blinked. The `hidden` was
 * there for a real reason — collapsed content must not be tabbable or findable
 * by Ctrl-F — so the fix is not to drop it but to let AnimatePresence own the
 * lifetime: the panel genuinely unmounts, after it has finished closing.
 *
 * The wrapper stays mounted so `aria-controls` always resolves to a real
 * element, which it would not if the whole panel came and went.
 */
interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Collapsible({ title, children, defaultOpen = false }: CollapsibleProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const panelId = React.useId();

  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="focusable flex w-full items-center justify-between rounded-[var(--radius-sm)] py-3 text-left font-medium transition-colors hover:text-accent"
      >
        {title}
        {/* A real icon, at the weight of every other icon in the app. The `▼`
            glyph this replaces rendered at whatever size and colour the font
            felt like, and sat a couple of pixels off the text baseline. */}
        <motion.span
          aria-hidden
          className="text-muted"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <div id={panelId}>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
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

'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

/**
 * The panel card, and the platform's interaction standard for anything clickable.
 *
 * THE RULE (applies to every interactive card, not only this component):
 *   - static card    → `rounded-[var(--radius-card)] border border-line bg-panel`
 *   - interactive    → add `group transition-colors hover:border-accent` and
 *                      `whileHover={{ y: -2 }}` (reduced motion is already
 *                      honoured app-wide by MotionConfig in MotionProvider)
 *   - meters animate once on mount; chips never stagger individually
 *   - progress uses `accent`, success `ok`, warnings `warn`, errors `danger` —
 *     never raw palette classes (`gray-*`, `blue-600`, `green-50`…), which do
 *     not re-theme per course or in dark mode.
 *
 * `interactive` bakes the hover recipe in so call sites can't half-apply it.
 */
interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  /** Apply the standard hover treatment (border tint + 2px lift). */
  interactive?: boolean;
}

export function Card({ children, className = '', interactive = false, ...props }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={interactive ? { y: -2 } : undefined}
      transition={{ duration: 0.3 }}
      className={`rounded-[var(--radius-card)] border border-line bg-panel p-6 shadow-[var(--shadow-1)] ${
        interactive
          ? // An interactive card carries the focus ring itself, because the
            // thing that receives focus inside it is usually a stretched link
            // whose own outline would trace the text rather than the card.
            'focusable group transition-[border-color,box-shadow] focus-within:border-accent hover:border-accent hover:shadow-[var(--shadow-2)]'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

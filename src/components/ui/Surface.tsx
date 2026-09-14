import { cva, type VariantProps } from 'class-variance-authority';
import type { CSSProperties, HTMLAttributes } from 'react';

/**
 * The one card, and the platform's interaction standard for anything boxed.
 *
 * Before R68 every card in the app was a hand-written class string — 37 copies
 * of `rounded-[var(--radius-card)] border border-line bg-panel`, most with a
 * shadow on top of the line, plus five different left-border "status" edges
 * (4px, 3px, 2px, role colour, week colour). `ui/Card` existed and had zero
 * call sites. Nothing could be changed in one place, so nothing was.
 *
 * THE RULE, now enforced by page-shape.test.ts (this file is the only one
 * allowed to spell the card string):
 *   - a surface has a line OR elevation, never both — `card` draws the
 *     hairline, `raised` draws --shadow-1, `flat` draws neither, `inset` is a
 *     tone step down, `glass` is the frosted material of bars and overlays;
 *   - colour-as-status is ONE thing: a 4px left seam (`accent="week"` takes
 *     the phase colour from the nearest data-week ancestor, `accent="role"`
 *     takes `seamColor`). Not fills, not tints, not icons;
 *   - `glow` is for the one panel on a screen that is the point of it;
 *   - `interactive` tints the border on hover/focus-within and nothing moves.
 *     Motion belongs to the wrapper (`<motion.div {...reveal}><Surface/>`), or
 *     use `surfaceVariants()` on a motion element directly.
 *   - progress uses `accent`, success `ok`, warnings `warn`, errors `danger` —
 *     never raw palette classes, which do not re-theme.
 *
 * No hooks and no 'use client': Skeletons and server pages render it too.
 */
export const surfaceVariants = cva('rounded-[var(--radius-card)]', {
  variants: {
    variant: {
      card: 'border border-line bg-panel',
      raised: 'bg-panel shadow-[var(--shadow-1)]',
      inset: 'border border-line bg-panel-2',
      flat: 'bg-panel',
      glass: 'glass border',
    },
    accent: {
      none: '',
      week: 'border-l-4 border-l-[var(--week,var(--color-accent))]',
      role: 'border-l-4 border-l-[var(--accent-seam,var(--color-accent))]',
    },
    glow: {
      none: '',
      accent: 'shadow-[var(--glow-accent)]',
      week: 'shadow-[var(--glow-week)]',
    },
    padding: {
      none: '',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
    },
  },
  defaultVariants: { variant: 'card', accent: 'none', glow: 'none', padding: 'md' },
});

export type SurfaceProps = HTMLAttributes<HTMLElement> &
  VariantProps<typeof surfaceVariants> & {
    as?: 'div' | 'section' | 'article' | 'aside' | 'li' | 'dl' | 'nav' | 'header' | 'footer';
    /** Border tint on hover and focus-within. Nothing lifts. */
    interactive?: boolean;
    /** The seam colour for `accent="role"` — e.g. the role definition's colour. */
    seamColor?: string;
  };

export function Surface({
  as: Tag = 'div',
  variant,
  accent,
  glow,
  padding,
  interactive,
  seamColor,
  className,
  style,
  ...rest
}: SurfaceProps) {
  const styles = seamColor ? ({ ...style, '--accent-seam': seamColor } as CSSProperties) : style;
  const classes = [
    surfaceVariants({ variant, accent, glow, padding }),
    interactive && 'transition-colors hover:border-accent focus-within:border-accent',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <Tag {...rest} style={styles} className={classes} />;
}

import { cva } from 'class-variance-authority';
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
 * THE LAW (R77), enforced by page-shape.test.ts (this file is the only one
 * allowed to spell the card string):
 *
 *   DEPTH IS ONE TOKEN, AND THE EDGE LIVES INSIDE IT.
 *
 * The old rule was "a line OR elevation, never both", because a border and a
 * box-shadow are two independent declarations of the same edge and drawing both
 * doubled it. Clay does not bypass that reasoning — it moves the edge inside the
 * elevation. A `--clay-*` tier carries its own light top rim and dark bottom rim
 * as `inset` layers, which is what the eye reads as extruded, so a clay surface
 * never also declares a border. One element, one tier, edge included.
 *
 * The tiers are a ladder of IMPORTANCE, not decoration:
 *   - `dense` (tier 0) rims only, no cast — table wrappers, nested strata, the
 *     dashboard's stat grid. This is how "clay everywhere" survives a screen of
 *     data: a 16px cast under every row of a twelve-row table is grey haze, and
 *     it would make the app look worse rather than slicker. A rim still reads as
 *     extruded; it just does not float.
 *   - `card` (tier 1) at rest, the default;
 *   - `raised` (tier 2) hover, or the one card that is the point of the screen;
 *   - `inset` a socket cut INTO the page (--clay-well), for wells and fields;
 *   - `flat` names no tier — that is the ladder's zero, not an exception to it;
 *   - `glass` is the frosted material of bars and overlays, and composes the
 *     overlay tier at its call site so "one tier per element" stays true;
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
/**
 * The fill, the seam and the padding. Everything except the depth — see
 * `surfaceVariants` below, which resolves that in one place so an element can
 * never wear two tiers.
 */
const surfaceBase = cva('rounded-[var(--radius-card)]', {
  variants: {
    variant: {
      card: 'bg-panel',
      raised: 'bg-panel',
      inset: 'bg-panel-2',
      dense: 'rounded-[var(--radius-clay-sm)] bg-panel',
      flat: 'bg-panel',
      glass: 'glass',
    },
    accent: {
      none: '',
      week: 'border-l-4 border-l-[var(--week,var(--color-accent))]',
      role: 'border-l-4 border-l-[var(--accent-seam,var(--color-accent))]',
    },
    padding: {
      none: '',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
    },
  },
  defaultVariants: { variant: 'card', accent: 'none', padding: 'md' },
});

export type SurfaceVariant = 'card' | 'raised' | 'inset' | 'dense' | 'flat' | 'glass';
export type SurfaceGlow = 'none' | 'accent' | 'week' | 'ok' | 'warn' | 'danger' | 'info';

/**
 * The ladder itself, named — the one place in the app that spells a tier.
 *
 * Most depth arrives through `<Surface>`, but three things legitimately need a
 * tier without being a card: an overlay composed onto `glass` (Dialog, the
 * command palette), a tooltip, and an illustration that should sit off the page
 * without gaining a panel background. Before this export each of those typed the
 * token itself, and `page-shape.test.ts` had to keep a list of filenames allowed
 * to do so — a list whose natural maintenance is deleting your file from it.
 *
 * `overlay` is tier 3 and deliberately has no `Surface` variant: a floating
 * layer is a composition (glass + tier), not a kind of card.
 */
export type ClayTier = 'none' | 'dense' | 'card' | 'raised' | 'overlay' | 'well';

const TIER_CLASS: Record<ClayTier, string> = {
  none: '',
  dense: 'shadow-[var(--clay-0)]',
  card: 'shadow-[var(--clay-1)]',
  raised: 'shadow-[var(--clay-2)]',
  overlay: 'shadow-[var(--clay-3)]',
  well: 'shadow-[var(--clay-well)]',
};

/** One rung of the ladder, as a class. Exactly one per element — see THE LAW. */
export function clayTier(tier: ClayTier): string {
  return TIER_CLASS[tier];
}

/** The ladder, by variant. `flat` and `glass` name no tier — that is the
 *  ladder's zero, not an exception to it. `glass` composes one at its call
 *  site with `clayTier('overlay')`, which is why it names none here. */
const TIER: Record<SurfaceVariant, ClayTier> = {
  dense: 'dense',
  card: 'card',
  raised: 'raised',
  inset: 'well',
  flat: 'none',
  glass: 'none',
};

/** The bloom, for the one panel on a screen that is the point of it. */
const GLOW: Record<Exclude<SurfaceGlow, 'none'>, string> = {
  accent: 'shadow-[var(--glow-accent)]',
  week: 'shadow-[var(--glow-week)]',
  ok: 'shadow-[var(--glow-ok)]',
  warn: 'shadow-[var(--glow-warn)]',
  danger: 'shadow-[var(--glow-danger)]',
  info: 'shadow-[var(--glow-info)]',
};

export interface SurfaceVariantProps {
  variant?: SurfaceVariant | null;
  accent?: 'none' | 'week' | 'role' | null;
  glow?: SurfaceGlow | null;
  padding?: 'none' | 'sm' | 'md' | 'lg' | null;
}

/**
 * The class string for a surface — fill, seam, padding, and EXACTLY ONE tier.
 *
 * Depth is resolved here rather than emitted by two independent cva axes,
 * because a variant and a glow both wanting to be the shadow is precisely the
 * smudge the law forbids, and "whichever class Tailwind happened to emit last
 * wins" is not a rule anyone can reason about. A glow REPLACES the tier: it is
 * the louder statement, and a panel that is the point of the screen does not
 * also need to be told it is a card.
 */
export function surfaceVariants(props: SurfaceVariantProps = {}): string {
  const variant = props.variant ?? 'card';
  const glow = props.glow ?? 'none';
  const depth = glow !== 'none' ? GLOW[glow] : clayTier(TIER[variant]);
  return [surfaceBase({ variant, accent: props.accent, padding: props.padding }), depth]
    .filter(Boolean)
    .join(' ');
}

export type SurfaceProps = HTMLAttributes<HTMLElement> &
  SurfaceVariantProps & {
    as?: 'div' | 'section' | 'article' | 'aside' | 'li' | 'dl' | 'nav' | 'header' | 'footer';
    /** Lifts one tier on hover and blooms on focus-within. Nothing moves. */
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
    // Interactive used to tint a border. There is no border now, so it lifts one
    // tier instead — still one tier at a time, so the law holds — and the focus
    // state blooms rather than tints, which is far easier to see.
    interactive &&
      'transition-[box-shadow] duration-[var(--dur-press)] hover:shadow-[var(--clay-2)] focus-within:shadow-[var(--glow-accent)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <Tag {...rest} style={styles} className={classes} />;
}

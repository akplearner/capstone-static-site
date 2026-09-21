'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { SPRING } from '@/lib/motion';
import { ClayGloss } from './ClayEdge';

// Tabs and Collapsible used to live in this file, which made them invisible —
// pages hand-rolled markup rather than importing a primitive nobody could find
// under "Button". Each now has its own file; the re-exports keep every existing
// import working. (Card and Badge were retired in R68: the card is `Surface`,
// the chip is `PixelBadge`.)
export { Tabs } from './Tabs';
export { Collapsible } from './Collapsible';

// `children` is narrowed off framer's prop type deliberately. HTMLMotionProps
// widens it to `ReactNode | MotionValue`, which exists so you can bind a motion
// value straight into a node — and a MotionValue cannot go inside the label
// <span> the gloss requires. Narrowing here keeps the error at the call site
// instead of forcing a cast in the render.
interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: ReactNode;
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  /** `pill` is the default — the reference's controls are fully round. `rect`
   *  is for a button that has to line up with an input or a table cell. */
  shape?: 'pill' | 'rect';
}

/**
 * THE LAW (R77), the same one `Surface` states: depth is one token, and the
 * edge lives inside it. A clay tier already draws its own rims, so none of these
 * declares a border — the hairline `secondary` used to wear is now the rim of
 * its tier, which is why the variants finally read as one family rather than as
 * "the raised one and three flat ones".
 *
 * Each state names EXACTLY ONE tier and swaps to the next; they never stack.
 * `--clay-tint` is what makes a swap cheap: the tinted tiers are authored once
 * in `globals.css` against that one parameter, so `destructive` re-colours its
 * whole depth by setting the parameter (`[--clay-tint:var(--color-danger)]`)
 * rather than by adding a fifth set of shadow tokens — and a course seam that
 * moves `--color-accent` moves every primary button's shadow with it, free.
 */
const variantStyles = {
  // text-accent-contrast, not text-white: the dark themes lighten the accent
  // for legibility against a dark page, which makes white label text fail
  // contrast. The token flips to near-black there. `tokens.test.ts` measures
  // this exact pair, in all 26 theme contexts.
  default:
    'bg-accent text-accent-contrast shadow-[var(--clay-1-tint)] hover:bg-accent-strong hover:shadow-[var(--clay-2-tint)] active:shadow-[var(--clay-press-tint)]',
  // One tier down, untinted: same geometry, same gloss, quieter voice.
  secondary:
    'bg-panel-2 text-ink shadow-[var(--clay-1)] hover:bg-panel hover:shadow-[var(--clay-2)] active:shadow-[var(--clay-press)]',
  // The one variant with no depth at rest. A ghost that sits proud of the page
  // is not a ghost, and a toolbar of eight extruded pills is a toolbar nobody
  // can find the primary action in.
  ghost: 'text-accent hover:bg-accent-soft active:shadow-[var(--clay-press)]',
  destructive:
    '[--clay-tint:var(--color-danger)] bg-danger text-white shadow-[var(--clay-1-tint)] hover:shadow-[var(--clay-2-tint)] active:shadow-[var(--clay-press-tint)]',
};

const sizeStyles = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  // Square, so the pill radius makes it a circle. 40px clears the 24px tap
  // target minimum with room for the rim.
  icon: 'h-10 w-10 p-0 text-base',
};

/**
 * Disabled is a state this app has never drawn.
 *
 * `disabled:` appeared zero times in the repo before R63, so a button the code
 * had disabled looked exactly like one you could press — same fill, same
 * pointer, same hover. It stops reacting, it stops looking raised, and the
 * cursor says so before you click.
 *
 * R77 note: it flattens to `--clay-0` rather than to `shadow-none`. Rims with no
 * cast is the tier that means "this is a surface, and it is not going anywhere",
 * which is exactly the message — where `shadow-none` beside a row of extruded
 * siblings reads as an element that failed to render.
 */
const disabledStyles =
  'disabled:pointer-events-none disabled:opacity-55 disabled:shadow-[var(--clay-0)] disabled:cursor-not-allowed';

export function Button({
  variant = 'default',
  size = 'md',
  shape = 'pill',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  // A gloss on a ghost would be a highlight on nothing — there is no extruded
  // body under it to catch the light.
  const glossy = !disabled && variant !== 'ghost';
  return (
    <motion.button
      // Guarded, not unconditional: a disabled <button> still receives pointer
      // events in some browsers, and a button that springs under the cursor
      // while refusing to do anything reads as broken rather than as disabled.
      //
      // R77 adds `y` to what was a pure scale. Scale alone says "bigger"; a
      // solid object answering a finger travels, and 1px up on hover against
      // 1.5px down on press is what sells the thing as having a thickness to be
      // pushed into. Both are positional, so `MotionConfig reducedMotion="user"`
      // stills them for free — while the shadow swap beside them is CSS state,
      // not animation, so the press still reads under reduced motion.
      whileHover={disabled ? undefined : { y: -1, scale: 1.015 }}
      whileTap={disabled ? undefined : { y: 1.5, scale: 0.985 }}
      transition={SPRING.press}
      disabled={disabled}
      className={`focusable relative isolate overflow-hidden ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${
        shape === 'pill' ? 'rounded-[var(--radius-pill)]' : 'rounded-[var(--radius-clay-sm)]'
      } inline-flex items-center justify-center gap-2 font-medium transition-[background-color,box-shadow,color] duration-[var(--dur-press)] ${className}`}
      {...props}
    >
      {glossy && <ClayGloss shape={size === 'icon' ? 'disc' : shape === 'pill' ? 'pill' : 'card'} />}
      {/* The label rides above the sheen. `isolate` on the button plus this one
          stacking context is the whole trick — without it the gloss paints over
          the text, which is the bug every "glassy button" ships with. */}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { SPRING } from '@/lib/motion';

// Tabs and Collapsible used to live in this file, which made them invisible —
// pages hand-rolled markup rather than importing a primitive nobody could find
// under "Button". Each now has its own file; the re-exports keep every existing
// import working. (Card and Badge were retired in R68: the card is `Surface`,
// the chip is `PixelBadge`.)
export { Tabs } from './Tabs';
export { Collapsible } from './Collapsible';

// `children` is narrowed off framer's prop type: HTMLMotionProps widens it to
// `ReactNode | MotionValue`, which exists so a motion value can be bound straight
// into a node, and a button label is never that.
interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: ReactNode;
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

/**
 * THE LAW (see `Surface`): depth is one token, and the edge lives inside it.
 * Each state names EXACTLY ONE tier and swaps to the next; they never stack,
 * and none declares a border — tier 0 already IS the 1px ring.
 *
 * R78 note. R77 made this a glossy pill that travelled on press. The instructor
 * called it cheap, and they were right: a control in a professional tool should
 * be a crisp rectangle that darkens under the cursor and settles under the
 * finger, nothing more. The tint parameter survives because it is structure,
 * not decoration — `destructive` re-colours its whole edge by setting
 * `[--depth-tint:var(--color-danger)]` instead of owning a second token family.
 */
const variantStyles = {
  // text-accent-contrast, not text-white: the dark themes lighten the accent
  // for legibility against a dark page, which makes white label text fail
  // contrast. The token flips to near-black there. `tokens.test.ts` measures
  // this exact pair in all 26 theme contexts.
  default:
    'bg-accent text-accent-contrast shadow-[var(--depth-1-tint)] hover:bg-accent-strong hover:shadow-[var(--depth-2-tint)] active:shadow-[var(--depth-press-tint)]',
  secondary:
    'bg-panel text-ink shadow-[var(--depth-1)] hover:bg-panel-2 hover:shadow-[var(--depth-2)] active:shadow-[var(--depth-press)]',
  // No depth at rest: a ghost that sits on the page is not a ghost, and a
  // toolbar of eight edged controls is a toolbar nobody can find the primary
  // action in.
  ghost: 'text-accent hover:bg-accent-soft active:shadow-[var(--depth-press)]',
  destructive:
    '[--depth-tint:var(--color-danger)] bg-danger text-white shadow-[var(--depth-1-tint)] hover:shadow-[var(--depth-2-tint)] active:shadow-[var(--depth-press-tint)]',
};

const sizeStyles = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  // Square, and the only size that is round: 40px clears the 24px tap target.
  icon: 'h-10 w-10 p-0 text-base',
};

/**
 * Disabled is a state this app has never drawn.
 *
 * `disabled:` appeared zero times in the repo before R63, so a button the code
 * had disabled looked exactly like one you could press. It stops reacting, it
 * drops to the ring (tier 0 — still an edge, no lift), and the cursor says so
 * before you click.
 */
const disabledStyles =
  'disabled:pointer-events-none disabled:opacity-55 disabled:shadow-[var(--depth-0)] disabled:cursor-not-allowed';

export function Button({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      // Guarded, not unconditional: a disabled <button> still receives pointer
      // events in some browsers, and a button that springs under the cursor
      // while refusing to do anything reads as broken rather than as disabled.
      //
      // Scale only. No travel on the y axis: a button that lifts toward the
      // cursor and sinks under the finger is the "3D" the instructor asked to
      // lose. A 2% settle with the CSS tier swap beside it is enough to read as
      // a press, and it is stilled by `MotionConfig reducedMotion="user"`.
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={SPRING.press}
      disabled={disabled}
      className={`focusable ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${
        size === 'icon' ? 'rounded-full' : 'rounded-[var(--radius-control)]'
      } inline-flex items-center justify-center gap-2 font-medium transition-[background-color,box-shadow,color] duration-[var(--dur-press)] ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

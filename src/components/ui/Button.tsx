'use client';

import { motion, HTMLMotionProps } from 'framer-motion';

// Card, Badge, Tabs and Collapsible used to live in this file, which made them
// invisible — pages hand-rolled card markup (and raw gray-* classes with it)
// rather than importing a primitive nobody could find under "Button". Each now
// has its own file; the re-exports keep every existing import working.
export { Card } from './Card';
export { Badge } from './Badge';
export { Tabs } from './Tabs';
export { Collapsible } from './Collapsible';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  // text-accent-contrast, not text-white: the dark themes lighten the accent
  // for legibility against a dark page, which makes white label text fail
  // contrast. The token flips to near-black there.
  //
  // The primary variant is the only one that carries a resting shadow. That is
  // the point of it — on a screen of flat panels the raised element is the one
  // thing you are meant to press, and pressing it should visibly sit it back
  // down (see `whileTap` below, which the shadow makes readable).
  default:
    'bg-accent text-accent-contrast shadow-[var(--shadow-1)] hover:bg-accent-strong hover:shadow-[var(--shadow-2)] active:bg-accent-strong active:shadow-none',
  secondary: 'bg-panel-2 text-ink border border-line hover:bg-surface active:bg-panel-2',
  ghost: 'text-accent hover:bg-accent-soft active:bg-accent-soft',
  destructive: 'bg-danger text-white shadow-[var(--shadow-1)] hover:opacity-90 active:opacity-80 active:shadow-none',
};

const sizeStyles = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

/**
 * Disabled is a state this app has never drawn.
 *
 * `disabled:` appeared zero times in the repo before R63, so a button the code
 * had disabled looked exactly like one you could press — same fill, same
 * pointer, same hover. The three properties below are the whole fix: it stops
 * reacting, it stops looking raised, and the cursor says so before you click.
 */
const disabledStyles =
  'disabled:pointer-events-none disabled:opacity-55 disabled:shadow-none disabled:cursor-not-allowed';

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
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      disabled={disabled}
      className={`focusable ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} rounded-lg font-medium transition-[background-color,box-shadow,color] ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

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
  default: 'bg-accent text-accent-contrast hover:bg-accent-strong active:bg-accent-strong',
  secondary: 'bg-panel-2 text-ink border border-line hover:bg-surface',
  ghost: 'text-accent hover:bg-accent-soft',
  destructive: 'bg-danger text-white hover:opacity-90 active:opacity-80',
};

const sizeStyles = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${variantStyles[variant]} ${sizeStyles[size]} rounded-lg font-medium transition-colors ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

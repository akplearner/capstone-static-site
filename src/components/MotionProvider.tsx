'use client';

import { MotionConfig } from 'framer-motion';

/**
 * App-wide motion config. `reducedMotion="user"` makes every framer-motion
 * animation honour the OS "reduce motion" setting automatically, so we don't
 * have to gate each component by hand.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

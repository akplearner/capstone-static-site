'use client';

import { useReducedMotion } from 'framer-motion';
import { useHydrated } from './useClientStore';

/**
 * `useReducedMotion` that is safe to branch DOM structure on during SSR.
 *
 * framer-motion's `useReducedMotion` reads `matchMedia('(prefers-reduced-motion)')`
 * at module init, so on a client with reduced motion enabled it returns `true` on
 * the very first render while the server rendered `false`. Any component that
 * mounts or omits elements based on that value then produces a hydration mismatch
 * (React error #418) — silent until someone actually browses with the OS setting
 * on, which is exactly the accessibility case we must not break.
 *
 * Gating it behind `useHydrated()` (a `useSyncExternalStore` with a `false` server
 * snapshot) forces the first client render to match the server — reduced motion is
 * applied one tick later, after hydration, which is imperceptible. The app-wide
 * `MotionConfig reducedMotion="user"` already stills transforms in that first tick,
 * so nothing actually animates before this resolves.
 */
export function useReducedMotionSafe(): boolean {
  const reduce = useReducedMotion();
  const hydrated = useHydrated();
  return hydrated ? !!reduce : false;
}

'use client';

import { useEffect, useState } from 'react';
import { animate } from 'framer-motion';
import { DUR, EASE } from './motion';
import { useReducedMotionSafe } from './useReducedMotionSafe';

/**
 * R108 — a figure that counts up to its value when it arrives, inside the
 * meter budget (`DUR.meter`), because here the motion carries the
 * information: how far the number travelled. framer's `animate()` is not
 * under `MotionConfig`, so the reduced-motion preference is read explicitly
 * and the figure lands at once. `replayKey` restarts the count.
 */
export function useCountUp(value: number, replayKey = 0): number {
  const reduce = useReducedMotionSafe();
  const [n, setN] = useState(0);
  useEffect(() => {
    // Under reduced motion the hook returns the value itself below; nothing to animate.
    if (reduce) return;
    const controls = animate(0, value, { duration: DUR.meter, ease: EASE.out, onUpdate: (v) => setN(Math.round(v)) });
    return () => controls.stop();
  }, [value, replayKey, reduce]);
  return reduce ? value : n;
}

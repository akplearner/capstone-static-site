import type { Transition } from 'framer-motion';
import { DUR, EASE } from './motion';
import type { RoleMotion } from './docs/roles';

/**
 * R105 — the role motion spec, resolved.
 *
 * The course document names tokens (`stagger: 'press'`, `draw: 'meter'`,
 * `ease: 'out'`); this turns them into framer transitions using only the
 * motion scale, so no role picture ever carries a number of its own. Every
 * delay is capped at `DUR.meter`, so a four-role course with twelve arrows
 * settles in about a second. Under reduced motion every duration and delay
 * is zero and `on` is false, so callers pass `initial={false}`.
 */
export interface ResolvedRoleMotion {
  /** False under reduced motion: nothing draws in, focus changes snap. */
  on: boolean;
  /** A role box (or row, or picker button) revealing, staggered by index. */
  box(i: number): Transition;
  /** An arrow drawing in after the boxes, staggered by index. */
  edge(i: number, boxes: number): Transition;
  /** A table row or picker button; the same beat as a box. */
  row(i: number): Transition;
  /** The focus change: a dim or a return to full strength. */
  dim: Transition;
}

const CAP = DUR.meter;

export function resolveRoleMotion(spec: RoleMotion, reduce: boolean): ResolvedRoleMotion {
  if (reduce) {
    const none: Transition = { duration: 0, delay: 0 };
    return { on: false, box: () => none, edge: () => none, row: () => none, dim: none };
  }
  const ease = EASE[spec.ease] ?? EASE.out;
  const step = DUR[spec.stagger] ?? DUR.press;
  const draw = DUR[spec.draw] ?? DUR.meter;
  const box = (i: number): Transition => ({ duration: DUR.reveal, delay: Math.min(i * step, CAP), ease });
  return {
    on: true,
    box,
    row: box,
    edge: (i, boxes) => ({ duration: draw, delay: Math.min(boxes * step, CAP) + Math.min(i * DUR.press, CAP), ease }),
    dim: { duration: DUR.swap, ease: EASE.out },
  };
}

import type { Transition, Variants } from 'framer-motion';

/**
 * One motion vocabulary.
 *
 * Before this there were 52 hand-written `transition={{ … }}` objects across
 * the app and no agreement between them: 0.18, 0.2, 0.25, 0.3, 0.4, 0.45, 0.5
 * and 0.6 all appeared, several of them on the same screen, and everything
 * else fell through to framer's defaults — which are a spring for transforms
 * and 300ms for everything else, so two elements told to move together did not.
 *
 * The brief for this round was "subtle and fast", which is a budget, not a
 * feeling: nothing an interaction depends on may take longer than a quarter of
 * a second, because past that the animation stops reading as the interface
 * responding and starts reading as the interface being slow.
 *
 * ── Which one to reach for ──
 *   press    a control reacting under the cursor or the finger
 *   slide    a bounded element moving to a new position (the tab underline,
 *            the week pill) — a spring, because a position change wants
 *            momentum, and springs are the one thing framer stills for free
 *            under prefers-reduced-motion
 *   swap     one panel replacing another; deliberately the shortest, since a
 *            crossfade is dead time between two things you can read
 *   reveal   something arriving that was not there before
 *   meter    a bar or ring growing to a new value — the slowest of the set on
 *            purpose: this one is the only case where the MOTION carries the
 *            information (how far it moved), so it is worth watching
 *
 * A duration NOT in this file is a decision someone should have to justify.
 */

/** Seconds. The whole scale — there is no sixth. */
export const DUR = {
  press: 0.12,
  swap: 0.15,
  reveal: 0.2,
  meter: 0.45,
} as const;

/**
 * Springs, not durations, for anything that changes position.
 *
 * `MotionConfig reducedMotion="user"` stills positional keys automatically, so
 * a spring on x/y/scale/layout is the accessible default and needs no gate.
 * The values are stiff and heavily damped: at these numbers the element is
 * essentially settled inside 200ms and never overshoots enough to look bouncy.
 */
export const SPRING: Record<'slide' | 'press', Transition> = {
  slide: { type: 'spring', stiffness: 480, damping: 38, mass: 0.6 },
  press: { type: 'spring', stiffness: 700, damping: 34, mass: 0.5 },
};

export const EASE = {
  /** Arriving: fast to start, settling at the end. The default here. */
  out: [0.16, 1, 0.3, 1] as const,
  /** Leaving: the reverse, so an exit does not linger. */
  in: [0.7, 0, 0.84, 0] as const,
};

/** A panel replacing another — the course tab switch, the week body. */
export const swap: Variants = {
  enter: { opacity: 0, y: 4 },
  center: { opacity: 1, y: 0, transition: { duration: DUR.swap, ease: EASE.out } },
  exit: { opacity: 0, y: -4, transition: { duration: DUR.press, ease: EASE.in } },
};

/** Something arriving that was not on screen before. */
export const reveal: Variants = {
  hidden: { opacity: 0, y: 6 },
  shown: { opacity: 1, y: 0, transition: { duration: DUR.reveal, ease: EASE.out } },
};

/**
 * A meter growing to a value.
 *
 * Animate the transform, never the width: a width transition re-lays-out the
 * row on every frame, and on the task list that is 24 rows of layout per frame.
 * The call sites scale a full-width bar from its left edge instead.
 */
export const meter: Transition = { duration: DUR.meter, ease: EASE.out };

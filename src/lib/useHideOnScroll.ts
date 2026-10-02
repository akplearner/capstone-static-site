import { useEffect, useState, type RefObject } from 'react';

/**
 * R100 — true while the reader is scrolling DOWN past the top of the page;
 * false again on the first scroll up or back near the top. Coalesced to one
 * read per animation frame, passive, and ignoring the small jitter a
 * trackpad or a rubber-band produces (`delta`).
 */
export function useHideOnScroll(
  enabled: boolean,
  { minY = 96, delta = 10, revealWithin }: { minY?: number; delta?: number; /** Focus landing inside this element shows the bar again (Tab into a hidden header). */ revealWithin?: RefObject<HTMLElement | null> } = {}
): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let last = window.scrollY;
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      const dy = y - last;
      if (y <= minY || dy < -delta) setHidden(false);
      else if (dy > delta) setHidden(true);
      if (Math.abs(dy) > delta) last = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    const onFocus = (e: FocusEvent) => {
      if (revealWithin?.current?.contains(e.target as Node)) setHidden(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('focusin', onFocus);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('focusin', onFocus);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled, minY, delta, revealWithin]);
  // Disabled reads as shown without a render round-trip; the stale flag is
  // reset by the next listener's first read.
  return enabled && hidden;
}

'use client';

import { Info } from 'lucide-react';

/** A small hover/focus tooltip for explaining jargon (gates, pipeline, …) inline
 *  without cluttering the page. Keyboard-focusable for accessibility. */
export function InfoTip({ label }: { label: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <Info
        tabIndex={0}
        role="img"
        aria-label={label}
        className="h-4 w-4 cursor-help text-muted outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      <span
        role="tooltip"
        // A 16rem box CENTRED on the icon hung off the right of a phone screen and
        // widened the PAGE, so the Overview and Reference tabs scrolled sideways.
        // Narrow screens anchor it to the trigger's right edge instead, and the
        // width is clamped to the viewport. Centred again from sm: upward.
        className="pointer-events-none absolute top-6 z-40 w-[min(16rem,calc(100vw-2rem))] rounded-lg bg-ink px-3 py-2 text-xs font-normal leading-relaxed text-surface opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-sm:right-0 sm:left-1/2 sm:-translate-x-1/2"
      >
        {label}
      </span>
    </span>
  );
}

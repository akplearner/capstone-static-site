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
        className="h-4 w-4 cursor-help text-gray-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-gray-500"
      />
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-6 z-40 w-64 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-gray-700"
      >
        {label}
      </span>
    </span>
  );
}

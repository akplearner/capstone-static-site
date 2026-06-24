'use client';

import { ReactNode } from 'react';
import { InfoTip } from '../InfoTip';

export interface LegendItem {
  label: string;
  /** Hex color for the swatch; omit for a neutral/dashed marker. */
  color?: string;
  /** Render the swatch as a dashed outline (e.g. "monitoring" / "optional"). */
  dashed?: boolean;
}

/**
 * Consistent wrapper for every diagram: an optional title with a "how to read
 * this" tooltip, a horizontal-scroll body for wide SVGs, and a colour legend.
 */
export function DiagramFrame({
  title,
  subtitle,
  howToRead,
  legend,
  scroll = true,
  children,
}: {
  title?: string;
  subtitle?: string;
  howToRead?: string;
  legend?: LegendItem[];
  scroll?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      {(title || subtitle) && (
        <div>
          {title && (
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
              {title}
              {howToRead && <InfoTip label={howToRead} />}
            </h3>
          )}
          {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      )}
      <div className={scroll ? 'overflow-x-auto' : ''}>{children}</div>
      {legend && legend.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600 dark:text-gray-400">
          {legend.map((l) => (
            <span key={l.label} className="inline-flex items-center gap-1.5">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  l.color ? '' : 'bg-gray-300 dark:bg-gray-600'
                } ${l.dashed ? 'border border-dashed bg-transparent' : ''}`}
                style={l.color ? { backgroundColor: l.dashed ? 'transparent' : l.color, borderColor: l.color } : undefined}
              />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

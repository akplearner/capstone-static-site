'use client';

import type { KitSpec } from '@/lib/diagrams/kitSpec';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import { kitTone } from './tones';

/**
 * A left-to-right path: the stages evidence moves through, with a packet
 * walking the connector (`qa-dash`, the quarry's own dashed-flow beat). For
 * reduced motion the connector holds still — the arrowheads already carry
 * the direction.
 */
export function FlowPath({ spec, highlight }: { spec: KitSpec; highlight?: string[] }) {
  const reduce = useReducedMotionSafe();
  const stages = spec.stages ?? [];
  const hi = new Set(highlight ?? []);
  return (
    <div className="min-w-[480px]">
      <div className="flex items-stretch gap-0">
        {stages.map((s, i) => (
          <div key={s.id} className="flex min-w-0 flex-1 items-center">
            <div
              className={`min-w-0 flex-1 rounded-lg border-t-2 depth-edge bg-panel-2 px-2.5 py-2 ${
                hi.has(s.id) ? 'ring-2 ring-[var(--acc,var(--color-accent))]' : ''
              }`}
              style={{ borderTopColor: kitTone(s.kind) }}
            >
              <span className="block text-2xs font-semibold text-ink">{s.label}</span>
              {s.sub && <span className="mt-0.5 block text-3xs text-muted">{s.sub}</span>}
            </div>
            {i < stages.length - 1 && (
              <svg viewBox="0 0 34 12" className="h-3 w-8 shrink-0" aria-hidden>
                <line
                  x1="1"
                  y1="6"
                  x2="26"
                  y2="6"
                  stroke="var(--acc, var(--color-accent))"
                  strokeWidth="2"
                  strokeDasharray="4 3.4"
                  className={reduce ? '' : 'qa-dash'}
                />
                <path d="M26 1.5 33 6 26 10.5 Z" fill="var(--acc, var(--color-accent))" />
              </svg>
            )}
          </div>
        ))}
      </div>
      {spec.footer && <p className="mt-2 text-3xs text-muted">{spec.footer}</p>}
    </div>
  );
}

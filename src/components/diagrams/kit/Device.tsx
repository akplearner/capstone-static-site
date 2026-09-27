'use client';

import type { KitSpec } from '@/lib/diagrams/kitSpec';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import { kitTone } from './tones';

/**
 * One device as its faceplate: the name plate, a row of labelled ports, and a
 * status light. The light breathes with `qa-flicker` — the same idle-life the
 * quarry art uses — and holds steady for reduced motion.
 */
export function Device({ device }: { device: NonNullable<KitSpec['device']> }) {
  const reduce = useReducedMotionSafe();
  return (
    <div className="max-w-md rounded-lg depth-edge bg-panel-2 p-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="font-mono text-2xs font-bold text-ink">{device.name}</span>
        <span
          aria-hidden
          className={`h-2 w-2 rounded-full ${reduce ? '' : 'qa-flicker'}`}
          style={{ background: kitTone(device.kind) }}
        />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1 rounded-md bg-panel p-1.5">
        {device.ports.map((p) => (
          <span
            key={p.label}
            className={`rounded border px-1 py-0.5 font-mono text-3xs ${
              p.on ? 'border-transparent text-ink' : 'border-dashed border-line text-muted'
            }`}
            style={p.on ? { background: 'var(--color-ok-soft)', borderColor: 'var(--color-ok)' } : undefined}
          >
            {p.label}
          </span>
        ))}
      </div>
      {device.note && <p className="mt-1 px-1 text-3xs text-muted">{device.note}</p>}
    </div>
  );
}

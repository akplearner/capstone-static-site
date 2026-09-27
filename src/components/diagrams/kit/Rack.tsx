import type { KitSpec } from '@/lib/diagrams/kitSpec';
import { kitTone } from './tones';

/**
 * A rack elevation, read the way a student standing in front of one reads it:
 * top U down, every occupied slot colour-coded by what it is. `span` draws a
 * taller card, and a `blank` slot renders dashed — free U is information, not
 * absence (the ≥20% growth rule is a graded check).
 */
export function Rack({ rack, highlight }: { rack: NonNullable<KitSpec['rack']>; highlight?: string[] }) {
  const hi = new Set(highlight ?? []);
  return (
    <div className="max-w-md">
      <div className="mb-1 text-3xs uppercase tracking-wide text-muted">{rack.heading}</div>
      <div className="space-y-1">
        {rack.slots.map((s) => {
          const blank = s.kind === 'blank';
          const lit = hi.has(s.u) || hi.has(s.label);
          return (
            <div
              key={s.u}
              className={`flex items-start gap-2 rounded-md px-2 py-1 ${
                blank ? 'border border-dashed border-line' : 'depth-edge bg-panel-2 border-l-2'
              } ${lit ? 'ring-2 ring-[var(--acc,var(--color-accent))]' : ''}`}
              style={{
                ...(blank ? {} : { borderLeftColor: kitTone(s.kind) }),
                minHeight: `${Math.max(s.span, 1) * 1.9}rem`,
              }}
            >
              <span className="w-14 shrink-0 pt-px font-mono text-3xs font-semibold text-muted">{s.u}</span>
              <span className="min-w-0">
                {s.label ? (
                  <>
                    <span className="block text-2xs font-semibold text-ink">{s.label}</span>
                    {s.sub && <span className="block text-3xs text-muted">{s.sub}</span>}
                  </>
                ) : (
                  <span className="block text-3xs italic text-muted">free</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      {rack.caption && <p className="mt-1.5 text-3xs text-muted">{rack.caption}</p>}
    </div>
  );
}

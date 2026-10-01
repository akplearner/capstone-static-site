'use client';

import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import type { WeekProcess } from '@/lib/weekVisual';

/**
 * R99 — the week's process, drawn over a picture that owns its coordinates.
 *
 * An SVG fragment: one dashed, walking arrow per step, from the edge of the
 * `from` part to the edge of the `to` part, with the step's label on it. The
 * picture supplies `anchors` (where each of its parts is), so the arrows sit
 * on the real boxes rather than on a second table of positions. Colour is the
 * accent token, the label keeps the panel-stroke paint order the cloud picture
 * uses, and the dash walks with the quarry's own `qa-dash` beat unless the
 * reader asked for less motion.
 */
export interface Anchor {
  x: number;
  y: number;
  /** How far from the centre the arrow stops — the part's radius. */
  r: number;
}

export function ProcessArrows({
  process,
  anchors,
  markerId,
  fontSize = 10,
}: {
  process: WeekProcess;
  anchors: (id: string) => Anchor | null;
  /** A per-picture unique id for the arrowhead marker. */
  markerId: string;
  fontSize?: number;
}) {
  const reduce = useReducedMotionSafe();
  return (
    <g data-process={process.title} pointerEvents="none">
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" fill="var(--color-accent)" />
        </marker>
      </defs>
      {process.steps.map((s, i) => {
        const a = anchors(s.from);
        const b = anchors(s.to);
        if (!a || !b) return null;
        const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const ux = (b.x - a.x) / d;
        const uy = (b.y - a.y) / d;
        const x1 = a.x + ux * a.r;
        const y1 = a.y + uy * a.r;
        const x2 = b.x - ux * (b.r + 3);
        const y2 = b.y - uy * (b.r + 3);
        // The label sits beside the arrow's middle, offset to its left so two
        // arrows between the same parts do not print on top of each other.
        const mx = (x1 + x2) / 2 - uy * 9;
        const my = (y1 + y2) / 2 + ux * 9;
        return (
          <g key={`${s.from}-${s.to}-${i}`} data-step={`${s.from}>${s.to}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-panel)" strokeWidth={5} opacity={0.7} />
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--color-accent)"
              strokeWidth={2}
              strokeDasharray="5 4"
              strokeLinecap="round"
              className={reduce ? '' : 'qa-dash'}
              markerEnd={`url(#${markerId})`}
            />
            <text
              x={mx}
              y={my}
              textAnchor="middle"
              fontSize={fontSize}
              fontWeight={600}
              style={{ fill: 'var(--color-accent-ink)', paintOrder: 'stroke', stroke: 'var(--color-panel)', strokeWidth: 3.5 }}
            >
              {s.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

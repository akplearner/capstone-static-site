'use client';

import { useId } from 'react';
import { useCourseDocument } from '@/lib/useCourse';
import { hubOf } from '@/lib/content/read';
import type { WeekProcess } from '@/lib/weekVisual';
import { DiagramFrame } from './DiagramFrame';
import { ProcessArrows } from './ProcessArrows';

/**
 * The hub picture (R101): the system a course secures — SecAI+'s Service Hub
 * AI, CISSP's migration estate — drawn from the course document
 * (`content.hub`). Every word and every coordinate is data; this file owns the
 * box shape, the dimming, the glow and the colour of each kind of part. A part
 * that arrives in a later week is faded and tagged; the week's process is
 * drawn over the same boxes.
 */

const BOX = { w: 150, h: 44 };
const KIND_COLOR: Record<string, string> = {
  people: 'var(--color-w4)',
  app: 'var(--color-w2)',
  ai: 'var(--color-w5)',
  data: 'var(--color-w1)',
  control: 'var(--color-accent)',
  monitor: 'var(--color-w3)',
  pipeline: 'var(--color-w6)',
  network: 'var(--color-w8)',
  identity: 'var(--color-w7)',
  outside: 'var(--color-muted)',
};

export function HubDiagram({
  builtThrough,
  glow = [],
  process,
}: {
  /** Parts that arrive after this week are faded and tagged. Omitted = the whole system. */
  builtThrough?: number;
  /** The parts that arrive this week — they glow. */
  glow?: string[];
  /** The week's process, drawn over the picture. */
  process?: WeekProcess;
} = {}) {
  const { HUB, HUB_BUILD } = hubOf(useCourseDocument());
  const mid = useId().replace(/:/g, '');
  if (!HUB || !HUB_BUILD) return null;
  const arrives = HUB_BUILD.arrives as Record<string, number>;
  const built = (id: string) => builtThrough == null || (arrives[id] ?? 0) <= builtThrough;
  const lit = new Set(glow);
  const at = new Map(HUB.nodes.map((n) => [n.id, n]));
  const anchor = (id: string) => {
    const n = at.get(id);
    return n ? { x: n.x, y: n.y, r: BOX.w / 2 - 12 } : null;
  };

  return (
    <DiagramFrame
      title={HUB.copy.title}
      howToRead={HUB.copy.howToRead}
      legend={HUB.zones.map((z) => ({ label: z.label, color: `var(--color-w${z.tone})`, dashed: true }))}
    >
      <svg
        viewBox={`0 0 ${HUB.view.w} ${HUB.view.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full min-w-0 sm:min-w-[640px] lg:max-h-[28rem]"
        role="img"
        aria-label={`${HUB.copy.title}${builtThrough != null ? `, week ${builtThrough}` : ''}`}
      >
        <defs>
          <marker id={`${mid}-e`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="var(--color-line)" />
          </marker>
        </defs>

        {HUB.zones.map((z) => (
          <g key={z.id}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} fill="none" stroke={`var(--color-w${z.tone})`} strokeWidth={1.2} strokeDasharray="6 4" />
            <text x={z.x + 10} y={z.y - 8} fontSize="11" fontWeight="700" style={{ fill: `var(--color-w${z.tone})` }}>
              {z.label}
            </text>
            <text x={z.x + z.w - 8} y={z.y - 8} textAnchor="end" fontSize="8.5" fontFamily="var(--font-mono)" style={{ fill: 'var(--color-muted)' }}>
              {z.note}
            </text>
          </g>
        ))}

        {/* The standing paths, once both ends exist — and only when no process is drawn over them. */}
        {!process &&
          HUB.edges.map((e) => {
            const a = anchor(e.from);
            const b = anchor(e.to);
            if (!a || !b || !built(e.from) || !built(e.to)) return null;
            const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
            const ux = (b.x - a.x) / d;
            const uy = (b.y - a.y) / d;
            const x1 = a.x + ux * a.r;
            const y1 = a.y + uy * a.r;
            const x2 = b.x - ux * (b.r + 3);
            const y2 = b.y - uy * (b.r + 3);
            return (
              <g key={`${e.from}-${e.to}`} pointerEvents="none">
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-line)" strokeWidth={1.6} markerEnd={`url(#${mid}-e)`} />
                <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 5} textAnchor="middle" fontSize="8.5" style={{ fill: 'var(--color-muted)', paintOrder: 'stroke', stroke: 'var(--color-panel)', strokeWidth: 3 }}>
                  {e.label}
                </text>
              </g>
            );
          })}

        {HUB.nodes.map((n) => {
          const color = KIND_COLOR[n.kind] ?? 'var(--color-muted)';
          const later = !built(n.id);
          return (
            <g key={n.id} opacity={later ? 0.28 : 1} data-node={n.id} data-later={later ? 'true' : undefined} data-glow={lit.has(n.id) ? 'true' : undefined}>
              {lit.has(n.id) && (
                <rect x={n.x - BOX.w / 2 - 4} y={n.y - BOX.h / 2 - 4} width={BOX.w + 8} height={BOX.h + 8} rx={11} fill="none" stroke="var(--week, var(--color-accent))" strokeWidth={2.5} opacity={0.85} />
              )}
              <rect
                x={n.x - BOX.w / 2}
                y={n.y - BOX.h / 2}
                width={BOX.w}
                height={BOX.h}
                rx={8}
                fill="var(--color-panel)"
                stroke={color}
                strokeWidth={1.4}
                strokeDasharray={n.external ? '5 3' : undefined}
              />
              <text x={n.x} y={n.y - 3} textAnchor="middle" fontSize="10.5" fontWeight="700" style={{ fill: 'var(--color-ink)' }}>
                {n.label}
              </text>
              <text x={n.x} y={n.y + 11} textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)" style={{ fill: 'var(--color-muted)' }}>
                {n.sub}
              </text>
              {later && (
                <text x={n.x + BOX.w / 2 - 4} y={n.y - BOX.h / 2 + 9} textAnchor="end" fontSize="7.5" fontWeight="700" style={{ fill: 'var(--color-muted)' }}>
                  Week {arrives[n.id]}
                </text>
              )}
            </g>
          );
        })}

        {process && <ProcessArrows process={process} anchors={anchor} markerId={`${mid}-p`} />}
      </svg>
      <p className="mt-2 text-center text-3xs text-muted">{HUB.copy.footer}</p>
    </DiagramFrame>
  );
}

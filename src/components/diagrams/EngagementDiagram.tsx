'use client';

import { useId } from 'react';
import { useCourseDocument } from '@/lib/useCourse';
import { msspOf } from '@/lib/content/read';
import type { WeekProcess } from '@/lib/weekVisual';
import { DiagramFrame } from './DiagramFrame';
import { ProcessArrows, type Anchor } from './ProcessArrows';

/**
 * The MSSP picture (R99): the engagement itself — the client's estate on the
 * left, the MSSP SOC your team runs on the right, and around them the people
 * who scope, test and audit it. Every word and node comes from the course
 * document (`content.mssp`); this file owns the layout, the dimming and the
 * glow. A part that arrives in a later week is faded and tagged; the week's
 * process is drawn over the same boxes.
 */

const BOX = { w: 170, h: 50 };
/** Where each part sits — the one table the boxes AND the arrows are drawn from. */
const ANCHORS: Record<string, Anchor> = {
  'client-net': { x: 140, y: 105, r: 88 },
  'client-edge': { x: 340, y: 105, r: 88 },
  baseline: { x: 140, y: 190, r: 88 },
  controls: { x: 340, y: 190, r: 88 },
  siem: { x: 570, y: 105, r: 88 },
  detections: { x: 770, y: 105, r: 88 },
  analysts: { x: 570, y: 190, r: 88 },
  tickets: { x: 770, y: 190, r: 88 },
  evidence: { x: 670, y: 262, r: 88 },
  scope: { x: 140, y: 330, r: 88 },
  pentester: { x: 340, y: 330, r: 88 },
  auditor: { x: 770, y: 330, r: 88 },
};
const ZONE: Record<'client' | 'mssp', { x: number; w: number; color: string }> = {
  client: { x: 40, w: 400, color: 'var(--color-w2)' },
  mssp: { x: 470, w: 400, color: 'var(--color-accent)' },
};
const KIND_COLOR: Record<string, string> = {
  people: 'var(--color-w4)',
  sensor: 'var(--color-w3)',
  server: 'var(--color-w1)',
  firewall: 'var(--color-w8)',
  workstation: 'var(--color-muted)',
  browser: 'var(--color-w6)',
};

export function EngagementDiagram({
  builtThrough,
  glow = [],
  process,
}: {
  /** Parts that arrive after this week are faded and tagged. Omitted = the whole engagement. */
  builtThrough?: number;
  /** The parts that arrive this week — they glow. */
  glow?: string[];
  /** The week's process, drawn over the picture. */
  process?: WeekProcess;
} = {}) {
  const { ENGAGEMENT, ENGAGEMENT_BUILD } = msspOf(useCourseDocument());
  const mid = useId().replace(/:/g, '');
  if (!ENGAGEMENT || !ENGAGEMENT_BUILD) return null;
  const arrives = ENGAGEMENT_BUILD.arrives as Record<string, number>;
  const built = (id: string) => builtThrough == null || (arrives[id] ?? 0) <= builtThrough;
  const lit = new Set(glow);

  return (
    <DiagramFrame
      title={ENGAGEMENT.copy.title}
      howToRead={ENGAGEMENT.copy.howToRead}
      legend={[
        { label: ENGAGEMENT.zones[0].label, color: ZONE.client.color, dashed: true },
        { label: ENGAGEMENT.zones[1].label, color: ZONE.mssp.color, dashed: true },
        { label: 'People around the engagement', color: KIND_COLOR.people },
      ]}
    >
      <svg viewBox="0 0 910 372" preserveAspectRatio="xMidYMid meet" className="h-auto w-full min-w-0 sm:min-w-[640px] lg:max-h-[28rem]" role="img" aria-label={`${ENGAGEMENT.copy.title}${builtThrough != null ? `, week ${builtThrough}` : ''}`}>
        <defs>
          <marker id={`${mid}-e`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="var(--color-line)" />
          </marker>
        </defs>

        {/* The two sides of the contract. */}
        {ENGAGEMENT.zones.map((z) => {
          const zone = ZONE[z.id as 'client' | 'mssp'];
          return (
            <g key={z.id}>
              <rect x={zone.x} y={50} width={zone.w} height={240} rx={12} fill="none" stroke={zone.color} strokeWidth={1.2} strokeDasharray="6 4" />
              <text x={zone.x + 12} y={40} fontSize="11.5" fontWeight="700" style={{ fill: zone.color }}>
                {z.label}
              </text>
              <text x={zone.x + zone.w - 12} y={40} textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" style={{ fill: 'var(--color-muted)' }}>
                {z.note}
              </text>
            </g>
          );
        })}

        {/* The standing data paths, once both ends exist. */}
        {!process &&
          ENGAGEMENT.edges.map((e) => {
            const a = ANCHORS[e.from];
            const b = ANCHORS[e.to];
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

        {ENGAGEMENT.nodes.map((n) => {
          const a = ANCHORS[n.id];
          if (!a) return null;
          const color = KIND_COLOR[n.kind] ?? 'var(--color-muted)';
          const later = !built(n.id);
          return (
            <g key={n.id} opacity={later ? 0.28 : 1} data-node={n.id} data-later={later ? 'true' : undefined} data-glow={lit.has(n.id) ? 'true' : undefined}>
              {lit.has(n.id) && (
                <rect x={a.x - BOX.w / 2 - 4} y={a.y - BOX.h / 2 - 4} width={BOX.w + 8} height={BOX.h + 8} rx={12} fill="none" stroke="var(--week, var(--color-accent))" strokeWidth={2.5} opacity={0.85} data-glow="true" />
              )}
              <rect
                x={a.x - BOX.w / 2}
                y={a.y - BOX.h / 2}
                width={BOX.w}
                height={BOX.h}
                rx={9}
                fill="var(--color-panel)"
                stroke={color}
                strokeWidth={1.4}
                strokeDasharray={n.external ? '5 3' : undefined}
              />
              <text x={a.x} y={a.y - 4} textAnchor="middle" fontSize="11" fontWeight="700" style={{ fill: 'var(--color-ink)' }}>
                {n.label}
              </text>
              <text x={a.x} y={a.y + 11} textAnchor="middle" fontSize="8.5" fontFamily="var(--font-mono)" style={{ fill: 'var(--color-muted)' }}>
                {n.sub}
              </text>
              {later && (
                <text x={a.x + BOX.w / 2 - 4} y={a.y - BOX.h / 2 + 10} textAnchor="end" fontSize="8" fontWeight="700" style={{ fill: 'var(--color-muted)' }}>
                  Week {arrives[n.id]}
                </text>
              )}
            </g>
          );
        })}

        {/* The week's process, over the same picture. */}
        {process && <ProcessArrows process={process} anchors={(id) => ANCHORS[id] ?? null} markerId={`${mid}-p`} />}
      </svg>
      <p className="mt-2 text-center text-3xs text-muted">{ENGAGEMENT.copy.footer}</p>
    </DiagramFrame>
  );
}

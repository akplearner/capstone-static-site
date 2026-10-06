'use client';

import { useId } from 'react';
import { useCourseDocument } from '@/lib/useCourse';
import { archOf } from '@/lib/content/read';
import type { WeekProcess } from '@/lib/weekVisual';
import type { ArchEdgeKind, ArchKind, ArchNode } from '@/lib/docs/archPicture';
import { DiagramFrame } from './DiagramFrame';
import { ProcessArrows } from './ProcessArrows';

/**
 * The architecture picture (R103): the system a course works on, drawn from
 * the course document (`content.arch`). Every word and every coordinate is
 * data; this file owns the box shapes, the dimming, the glow and the colour
 * of each kind of part. A part that arrives in a later week is faded and
 * tagged; a record (a form) is a pill in the lane at the bottom; the week's
 * process is drawn over the same boxes.
 */

const BOX = { w: 150, h: 48 };
const PILL = { w: 128, h: 24 };
const KIND_COLOR: Record<ArchKind, string> = {
  people: 'var(--color-w4)',
  outside: 'var(--color-muted)',
  endpoint: 'var(--color-w4)',
  server: 'var(--color-w1)',
  app: 'var(--color-w2)',
  ai: 'var(--color-w5)',
  data: 'var(--color-w1)',
  firewall: 'var(--color-w8)',
  router: 'var(--color-w8)',
  switch: 'var(--color-w8)',
  wireless: 'var(--color-w8)',
  network: 'var(--color-w8)',
  idp: 'var(--color-w7)',
  identity: 'var(--color-w7)',
  siem: 'var(--color-w3)',
  monitor: 'var(--color-w3)',
  pipeline: 'var(--color-w6)',
  backup: 'var(--color-w1)',
  scanner: 'var(--color-w3)',
  ticket: 'var(--color-w6)',
  evidence: 'var(--color-w6)',
  control: 'var(--color-accent)',
  record: 'var(--color-accent)',
};
const EDGE_DASH: Record<ArchEdgeKind, string | undefined> = {
  traffic: undefined,
  trust: '2 3',
  log: '6 3',
  backup: '1 4',
  admin: '8 4 2 4',
};
const EDGE_LABEL: Record<ArchEdgeKind, string> = { traffic: 'traffic', trust: 'trust', log: 'logs', backup: 'backup', admin: 'admin' };

const size = (n: ArchNode) => (n.kind === 'record' ? PILL : BOX);

export function ArchDiagram({
  builtThrough,
  glow = [],
  process,
  highlightRole,
}: {
  /** Parts that arrive after this week are faded and tagged. Omitted = the whole system. */
  builtThrough?: number;
  /** The parts that arrive this week — they glow. */
  glow?: string[];
  /** The week's process, drawn over the picture. */
  process?: WeekProcess;
  /** The viewer's role: its parts stay bright, the others dim. */
  highlightRole?: string;
} = {}) {
  const { ARCH, ARCH_BUILD } = archOf(useCourseDocument());
  const mid = useId().replace(/:/g, '');
  if (!ARCH || !ARCH_BUILD) return null;
  const arrives = ARCH_BUILD.arrives as Record<string, number>;
  const built = (id: string) => builtThrough == null || (arrives[id] ?? 0) <= builtThrough;
  const lit = new Set(glow);
  const at = new Map(ARCH.nodes.map((n) => [n.id, n]));
  const anchor = (id: string) => {
    const n = at.get(id);
    return n ? { x: n.x, y: n.y, r: size(n).w / 2 - 12 } : null;
  };
  const edgeKinds = [...new Set(ARCH.edges.map((e) => e.kind ?? 'traffic'))];

  return (
    <DiagramFrame
      title={ARCH.copy.title}
      howToRead={ARCH.copy.howToRead}
      legend={[
        ...ARCH.zones.filter((z) => !z.lane).map((z) => ({ label: z.label, color: `var(--color-w${z.tone})`, dashed: true })),
        ...edgeKinds.filter((k) => k !== 'traffic').map((k) => ({ label: EDGE_LABEL[k], dashed: true })),
      ]}
    >
      <svg
        viewBox={`0 0 ${ARCH.view.w} ${ARCH.view.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full min-w-0 sm:min-w-[640px] lg:max-h-[32rem]"
        role="img"
        aria-label={`${ARCH.copy.title}${builtThrough != null ? `, week ${builtThrough}` : ''}`}
      >
        <defs>
          <marker id={`${mid}-e`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="var(--color-line)" />
          </marker>
        </defs>

        {ARCH.zones.map((z) => (
          <g key={z.id} data-zone={z.id}>
            <rect
              x={z.x}
              y={z.y}
              width={z.w}
              height={z.h}
              rx={12}
              fill={z.lane ? 'var(--color-panel-2)' : 'none'}
              stroke={`var(--color-w${z.tone})`}
              strokeWidth={z.lane ? 0.8 : 1.2}
              strokeDasharray="6 4"
            />
            <text x={z.x + 10} y={z.y - 8} fontSize="11" fontWeight="700" style={{ fill: `var(--color-w${z.tone})` }}>
              {z.label}
            </text>
            <text x={z.x + z.w - 8} y={z.y - 8} textAnchor="end" fontSize="8.5" fontFamily="var(--font-mono)" style={{ fill: 'var(--color-muted)' }}>
              {z.note}
            </text>
          </g>
        ))}

        {/* The standing paths, once both ends exist, and only when no process is drawn over them. */}
        {!process &&
          ARCH.edges.map((e) => {
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
              <g key={`${e.from}-${e.to}`} pointerEvents="none" data-edge={e.kind ?? 'traffic'}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-line)" strokeWidth={1.6} strokeDasharray={EDGE_DASH[e.kind ?? 'traffic']} markerEnd={`url(#${mid}-e)`} />
                <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 5} textAnchor="middle" fontSize="8.5" style={{ fill: 'var(--color-muted)', paintOrder: 'stroke', stroke: 'var(--color-panel)', strokeWidth: 3 }}>
                  {e.label}
                </text>
              </g>
            );
          })}

        {ARCH.nodes.map((n) => {
          const color = KIND_COLOR[n.kind] ?? 'var(--color-muted)';
          const later = !built(n.id);
          const dimmed = !!highlightRole && !!n.role && n.role !== highlightRole;
          const { w, h } = size(n);
          const pill = n.kind === 'record';
          return (
            <g
              key={n.id}
              opacity={later ? 0.28 : dimmed ? 0.45 : 1}
              data-node={n.id}
              data-kind={n.kind}
              data-later={later ? 'true' : undefined}
              data-glow={lit.has(n.id) ? 'true' : undefined}
            >
              <title>{n.purpose}</title>
              {lit.has(n.id) && (
                <rect x={n.x - w / 2 - 4} y={n.y - h / 2 - 4} width={w + 8} height={h + 8} rx={pill ? 16 : 11} fill="none" stroke="var(--week, var(--color-accent))" strokeWidth={2.5} opacity={0.85} />
              )}
              <rect
                x={n.x - w / 2}
                y={n.y - h / 2}
                width={w}
                height={h}
                rx={pill ? 12 : 8}
                fill="var(--color-panel)"
                stroke={color}
                strokeWidth={pill ? 1.1 : 1.4}
                strokeDasharray={n.external ? '5 3' : undefined}
              />
              {pill ? (
                <text x={n.x} y={n.y + 3.5} textAnchor="middle" fontSize="9" fontWeight="700" style={{ fill: 'var(--color-ink)' }}>
                  {n.label}
                </text>
              ) : (
                <>
                  <text x={n.x} y={n.y - 4} textAnchor="middle" fontSize="10.5" fontWeight="700" style={{ fill: 'var(--color-ink)' }}>
                    {n.label}
                  </text>
                  <text x={n.x} y={n.y + 11} textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)" style={{ fill: 'var(--color-muted)' }}>
                    {n.addr ?? n.sub}
                  </text>
                </>
              )}
              {later && (
                <text x={n.x + w / 2 - 4} y={n.y - h / 2 + 9} textAnchor="end" fontSize="7.5" fontWeight="700" style={{ fill: 'var(--color-muted)' }}>
                  Week {arrives[n.id]}
                </text>
              )}
            </g>
          );
        })}

        {process && <ProcessArrows process={process} anchors={anchor} markerId={`${mid}-p`} />}
      </svg>
      {ARCH.spec && (
        <table className="mt-2 w-full text-left text-2xs text-muted">
          <thead>
            <tr>
              {ARCH.spec.columns.map((c) => (
                <th key={c} className="pr-3 font-semibold text-ink">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ARCH.spec.rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j} className="pr-3 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-2 text-center text-3xs text-muted">{ARCH.copy.footer}</p>
    </DiagramFrame>
  );
}

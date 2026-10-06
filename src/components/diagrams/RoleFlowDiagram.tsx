'use client';

import { useId } from 'react';
import type { Course } from '@/lib/types';
import { describeRoleFlow, roleFlow, roleFlowPairs, type RoleFlowPair } from '@/lib/docs/roleFlow';
import { deliverablesOf } from '@/lib/content/read';
import { useCourseDocument } from '@/lib/useCourse';
import { DiagramFrame } from './DiagramFrame';

/**
 * R104: how the roles hand off, drawn from the RACI and the chain. One box
 * per role on a row; an arrow per direction that carries documents, its
 * weight the number of documents, its label the breakdown (reviews,
 * approvals, forms that feed). Forward arrows arc above the row, backward
 * ones below, so no two labels share a spot. The same flow as sentences sits
 * under the picture for a screen reader; the arrows say it for everyone else.
 */
const BOX_W = 150;
const BOX_H = 48;
const STEP = 240;
const PAD_X = 40;

const KIND_LABEL: Record<'review' | 'approve' | 'feeds', string> = { review: 'review', approve: 'approve', feeds: 'feed' };

const pillW = (p: RoleFlowPair) => label(p).length * 5.4 + 16;

function label(p: RoleFlowPair): string {
  return (['review', 'approve', 'feeds'] as const)
    .filter((k) => p[k] > 0)
    .map((k) => `${p[k]} ${KIND_LABEL[k]}`)
    .join(' · ');
}

export function RoleFlowDiagram({ course, highlightRole }: { course: Course; highlightRole?: string }) {
  const mid = useId().replace(/:/g, '');
  const defs = deliverablesOf(useCourseDocument());
  const flow = roleFlow(course.roles, defs);
  const pairs = roleFlowPairs(flow);
  const roles = course.roles;
  const n = roles.length;
  const index = new Map(roles.map((r, i) => [r.id, i]));
  const name = (id: string) => roles.find((r) => r.id === id)?.name ?? id;
  const color = (id: string) => roles.find((r) => r.id === id)?.color ?? 'var(--color-muted)';

  const arcH = (d: number) => 40 + 58 * (d - 1);
  const margin = arcH(Math.max(1, n - 1)) + 28;
  const rowTop = margin;
  const width = PAD_X * 2 + BOX_W + STEP * (n - 1);
  const height = margin * 2 + BOX_H;
  const cx = (i: number) => PAD_X + BOX_W / 2 + STEP * i;
  const maxTotal = Math.max(1, ...pairs.map((p) => p.total));
  const dim = (p: RoleFlowPair) => (highlightRole && p.from !== highlightRole && p.to !== highlightRole ? 0.3 : 1);

  const arc = (p: RoleFlowPair) => {
    const i = index.get(p.from) ?? 0;
    const j = index.get(p.to) ?? 0;
    const forward = i < j;
    const d = Math.abs(j - i);
    const h = arcH(d);
    const y = forward ? rowTop : rowTop + BOX_H;
    const x1 = cx(i) + (forward ? 30 : -30);
    const x2 = cx(j) + (forward ? -30 : 30);
    const cy = forward ? y - 2 * h : y + 2 * h;
    const apex = { x: (x1 + x2) / 2, y: forward ? y - h : y + h };
    return { path: `M${x1} ${y} Q${(x1 + x2) / 2} ${cy} ${x2} ${y}`, apex, forward };
  };

  const sentences = describeRoleFlow(flow, name);

  return (
    <DiagramFrame>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="h-auto w-full min-w-0 sm:min-w-[560px] lg:max-h-[26rem]" role="img" aria-label={`How the roles hand off in ${course.title}`} data-role-flow>
        <defs>
          {roles.map((r) => (
            <marker key={r.id} id={`${mid}-${r.id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" fill={r.color} />
            </marker>
          ))}
        </defs>
        {pairs.map((p) => {
          const a = arc(p);
          return (
            <g key={`${p.from}-${p.to}`} opacity={dim(p)} data-flow={`${p.from}-${p.to}`} data-weight={p.total}>
              <path d={a.path} fill="none" stroke={color(p.from)} strokeWidth={1 + (2.5 * p.total) / maxTotal} markerEnd={`url(#${mid}-${p.from})`} />
              <rect x={a.apex.x - pillW(p) / 2} y={a.apex.y - 9} width={pillW(p)} height={18} rx={9} fill="var(--color-panel)" stroke={color(p.from)} strokeWidth={0.8} />
              <text x={a.apex.x} y={a.apex.y + 3.5} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="var(--color-ink)">
                {label(p)}
              </text>
            </g>
          );
        })}
        {roles.map((r, i) => {
          const x = cx(i) - BOX_W / 2;
          const row = flow.rows[i];
          const mine = highlightRole === r.id;
          return (
            <g key={r.id} data-role-box={r.id}>
              <rect x={x} y={rowTop} width={BOX_W} height={BOX_H} rx={8} fill={r.color} opacity={mine ? 0.22 : 0.1} />
              <rect x={x} y={rowTop} width={BOX_W} height={BOX_H} rx={8} fill="none" stroke={r.color} strokeWidth={mine ? 2.5 : 1.5} />
              <text x={cx(i)} y={rowTop + 20} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--color-ink)">
                {r.name.split('(')[0].trim()}
              </text>
              <text x={cx(i)} y={rowTop + 36} textAnchor="middle" fontSize="9" fill="var(--color-muted)">
                {`drafts ${row.drafts.length} · reviews ${row.reviews.length} · approves ${row.approves.length}`}
              </text>
            </g>
          );
        })}
      </svg>
      <ul className="sr-only" aria-label="Hand-offs">
        {sentences.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </DiagramFrame>
  );
}

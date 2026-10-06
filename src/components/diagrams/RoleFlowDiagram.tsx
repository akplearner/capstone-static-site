'use client';

import { useId, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import type { Course } from '@/lib/types';
import { describeRoleFlow, pairKey, roleFlow, roleFlowPairs, type RoleFlowKind, type RoleFlowPair } from '@/lib/docs/roleFlow';
import { splitRoleName } from '@/lib/docs/roles';
import { deliverablesOf, rolesOf } from '@/lib/content/read';
import { useCourseDocument } from '@/lib/useCourse';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import { resolveRoleMotion } from '@/lib/roleMotion';
import { useRoleFocus } from '@/lib/useRoleFocus';
import { getIcon } from '@/lib/icons';
import { DiagramFrame } from './DiagramFrame';

/**
 * R104/R105: how the roles hand off, drawn from the RACI and the chain.
 *
 * One box per role on a row, with its icon, its function, its title and
 * its counts. One line per direction and kind — review solid, approve
 * dashed, feeds dotted — weighted by the documents it carries; forward
 * lines arc above the row, backward ones below, and the pair's pill says
 * the total large and the breakdown small. The viewer's role starts in
 * focus; a click or Enter moves it, a second click clears it. Boxes and
 * lines draw in once, on the course's motion spec resolved from the motion
 * scale; under reduced motion nothing moves. The same flow as sentences
 * sits under the picture for a screen reader.
 */
const BOX_W = 160;
const BOX_H = 60;
const STEP = 250;
const PAD_X = 40;
const KINDS: RoleFlowKind[] = ['review', 'approve', 'feeds'];
const KIND_DASH: Record<RoleFlowKind, string | undefined> = { review: undefined, approve: '7 4', feeds: '2 4' };

function BoxIcon({ name, x, y, color }: { name: string; x: number; y: number; color: string }) {
  const Icon = getIcon(name);
  // eslint-disable-next-line react-hooks/static-components
  return <Icon x={x} y={y} width={14} height={14} color={color} strokeWidth={2.2} aria-hidden />;
}

export function RoleFlowDiagram({ course, highlightRole }: { course: Course; highlightRole?: string }) {
  const mid = useId().replace(/:/g, '');
  const content = rolesOf(useCourseDocument());
  const defs = deliverablesOf(useCourseDocument());
  const m = resolveRoleMotion(content.MOTION, useReducedMotionSafe());
  const { focus, pinned, toggle, setHover, touches } = useRoleFocus(highlightRole);
  const flow = roleFlow(course.roles, defs);
  const pairs = roleFlowPairs(flow);
  const roles = course.roles;
  const n = roles.length;
  const index = new Map(roles.map((r, i) => [r.id, i]));
  const name = (id: string) => roles.find((r) => r.id === id)?.name ?? id;
  const color = (id: string) => roles.find((r) => r.id === id)?.color ?? 'var(--color-muted)';

  const arcH = (d: number) => 44 + 60 * (d - 1);
  const margin = arcH(Math.max(1, n - 1)) + 30;
  const rowTop = margin;
  const width = PAD_X * 2 + BOX_W + STEP * (n - 1);
  const height = margin * 2 + BOX_H;
  const cx = (i: number) => PAD_X + BOX_W / 2 + STEP * i;
  const maxEdge = Math.max(1, ...pairs.flatMap((p) => p.edges.map((e) => e.ids.length)));

  const arc = (p: RoleFlowPair, offset: number) => {
    const i = index.get(p.from) ?? 0;
    const j = index.get(p.to) ?? 0;
    const forward = i < j;
    const h = arcH(Math.abs(j - i)) + offset;
    const y = forward ? rowTop : rowTop + BOX_H;
    const x1 = cx(i) + (forward ? 34 : -34);
    const x2 = cx(j) + (forward ? -34 : 34);
    const cy = forward ? y - 2 * h : y + 2 * h;
    return { path: `M${x1} ${y} Q${(x1 + x2) / 2} ${cy} ${x2} ${y}`, apex: { x: (x1 + x2) / 2, y: forward ? y - h : y + h } };
  };
  const breakdown = (p: RoleFlowPair) => p.edges.map((e) => `${e.ids.length} ${content.FLOW_KIND_LABEL[e.kind].toLowerCase()}`).join(' · ');
  const pillW = (p: RoleFlowPair) => Math.max(44, breakdown(p).length * 4.6 + 16);
  const sentences = describeRoleFlow(flow, name);
  const onKey = (id: string) => (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle(id);
    }
  };

  let edgeIndex = 0;
  return (
    <DiagramFrame legend={KINDS.map((k) => ({ label: content.FLOW_KIND_LABEL[k], dash: KIND_DASH[k] ?? true }))} footer={content.FLOW_HOW_TO_READ}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full min-w-0 sm:min-w-[560px] lg:max-h-[28rem]"
        role="group"
        aria-label={`How the roles hand off in ${course.title}`}
        data-role-flow
        data-focus={focus ?? 'none'}
        data-motion={m.on ? 'on' : 'off'}
      >
        <defs>
          {roles.map((r) => (
            <marker key={r.id} id={`${mid}-${r.id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" fill={r.color} />
            </marker>
          ))}
        </defs>
        {pairs.map((p) => {
          const lit = touches(p.from, p.to);
          const spread = (p.edges.length - 1) / 2;
          const base = arc(p, 0);
          return (
            <motion.g key={pairKey(p)} data-flow={pairKey(p)} data-weight={p.total} data-dim={lit ? undefined : 'true'} initial={false} animate={{ opacity: lit ? 1 : 0.22 }} transition={m.dim}>
              {p.edges.map((e, k) => {
                const a = arc(p, (k - spread) * 8);
                const i = edgeIndex++;
                const maskId = `${mid}-m${i}`;
                return (
                  <g key={e.kind}>
                    {/* The draw-in runs on a solid mask path, so the line's own
                        dash array (the kind) survives the animation. */}
                    {m.on && (
                      <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
                        <motion.path d={a.path} fill="none" stroke="white" strokeWidth={10} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={m.edge(i, n)} />
                      </mask>
                    )}
                    <path
                      d={a.path}
                      fill="none"
                      stroke={color(p.from)}
                      strokeWidth={1 + (2 * e.ids.length) / maxEdge}
                      strokeDasharray={KIND_DASH[e.kind]}
                      strokeLinecap="round"
                      markerEnd={k === p.edges.length - 1 ? `url(#${mid}-${p.from})` : undefined}
                      mask={m.on ? `url(#${maskId})` : undefined}
                      data-kind={e.kind}
                    />
                  </g>
                );
              })}
              <rect x={base.apex.x - pillW(p) / 2} y={base.apex.y - 13} width={pillW(p)} height={26} rx={13} fill="var(--color-panel)" stroke={color(p.from)} strokeWidth={0.8} />
              <text x={base.apex.x} y={base.apex.y - 1} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--color-ink)">
                {p.total}
              </text>
              <text x={base.apex.x} y={base.apex.y + 9} textAnchor="middle" fontSize="7.5" fill="var(--color-muted)">
                {breakdown(p)}
              </text>
            </motion.g>
          );
        })}
        {roles.map((r, i) => {
          const x = cx(i) - BOX_W / 2;
          const row = flow.rows[i];
          const lit = touches(r.id);
          const { fn, tag } = splitRoleName(r.name);
          return (
            <motion.g
              key={r.id}
              data-role-box={r.id}
              role="button"
              tabIndex={0}
              aria-pressed={pinned === r.id}
              aria-label={r.name}
              className="cursor-pointer outline-none focus-visible:[&>rect:first-child]:stroke-[var(--color-accent)]"
              onClick={() => toggle(r.id)}
              onKeyDown={onKey(r.id)}
              onMouseEnter={() => setHover(r.id)}
              onMouseLeave={() => setHover(null)}
              initial={m.on ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: lit ? 1 : 0.45, y: 0 }}
              transition={m.box(i)}
            >
              <rect x={x} y={rowTop} width={BOX_W} height={BOX_H} rx={9} fill={r.color} opacity={focus === r.id ? 0.22 : 0.09} />
              <rect x={x} y={rowTop} width={BOX_W} height={BOX_H} rx={9} fill="none" stroke={r.color} strokeWidth={focus === r.id ? 2.5 : 1.4} />
              <BoxIcon name={r.icon} x={x + 10} y={rowTop + 11} color={r.color} />
              <text x={x + 30} y={rowTop + 22} fontSize="12" fontWeight="700" fill="var(--color-ink)">
                {fn}
              </text>
              {tag && (
                <text x={x + 30} y={rowTop + 35} fontSize="8.5" fill="var(--color-muted)">
                  {tag}
                </text>
              )}
              <text x={cx(i)} y={rowTop + 51} textAnchor="middle" fontSize="8.5" fill="var(--color-body)">
                {`drafts ${row.drafts.length} · reviews ${row.reviews.length} · approves ${row.approves.length}`}
              </text>
            </motion.g>
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

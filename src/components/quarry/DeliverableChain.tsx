'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, FileText } from 'lucide-react';
import { Course } from '@/lib/types';
import { getRoleDef } from '@/lib/course-helpers';
import { describeChain, downstreamOf, type DeliverableChain } from '@/lib/deliverableChain';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import type { DeliverableDef } from '@/lib/docs/types';
import { DiagramFrame } from '@/components/diagrams/DiagramFrame';

/**
 * How your work connects — each role's files, and the optional links between them.
 *
 * Every role completes their own files start to finish on their own; nothing
 * here waits on a teammate. The arrows are optional connections: they show where
 * one file's findings can enrich another (yours or a teammate's) when people
 * collaborate. This draws it — role lanes down the side, weeks across the top,
 * and each **file** sitting where its owner produces it.
 *
 * The node face shows the real filename the student saves (e.g.
 * `05_IOC_Database.csv`) — the technical anchor, not a paraphrase. Hovering or
 * focusing a file opens a plain, technical read-out beneath the diagram: who
 * produces it, what it's built from, and what it connects to. That read-out is
 * attached to the file it describes instead of floating in a separate paragraph.
 *
 * Reduced motion is handled globally by `<MotionConfig reducedMotion="user">`;
 * no guard is needed here.
 */

const COL_W = 200;
const PAD_X = 116; // room for the role labels down the left
const PAD_Y = 34; // room for the week headers across the top
const NODE_W = 160;
const NODE_H = 40;
const SLOT_GAP = 10; // vertical gap between stacked nodes in one cell
const LANE_PAD = 9; // breathing room above/below a lane's stack

function truncate(s: string, max: number) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function DeliverableChainDiagram({
  course,
  chain,
  highlightRole,
}: {
  course: Course;
  chain: DeliverableChain;
  /** The student's own role — their lane stays full strength, others dim. */
  highlightRole?: string;
}) {
  const [active, setActive] = useState<string | null>(null);

  // The definitions carry the prose the diagram can't ("built from", "feeds"),
  // keyed by id so the detail card can look one up in O(1).
  const defById = useMemo(() => {
    const m = new Map<string, DeliverableDef>();
    for (const d of deliverablesForCourse(course.id)) m.set(d.id, d);
    return m;
  }, [course.id]);

  // A chain with no edges is not a chain — it is a grid of disconnected boxes,
  // which reads as broken rather than as "this course has no dependencies".
  // Render nothing rather than something misleading.
  if (chain.nodes.length === 0 || chain.edges.length === 0) return null;

  const width = PAD_X + chain.columns.length * COL_W;

  // Lanes grow with their deepest cell: a role that owns three files in one
  // week gets three stacked rows, not three nodes rendered on top of each
  // other (which is exactly what Week 1 used to look like).
  const laneRows = chain.lanes.map((_, li) => {
    let rows = 1;
    for (const col of chain.columns.keys()) {
      const inCell = chain.nodes.filter((n) => n.lane === li && n.column === col).length;
      rows = Math.max(rows, inCell);
    }
    return rows;
  });
  const laneHeight = (li: number) => laneRows[li] * (NODE_H + SLOT_GAP) - SLOT_GAP + LANE_PAD * 2;
  const laneTop = (li: number) => {
    let y = PAD_Y;
    for (let i = 0; i < li; i++) y += laneHeight(i);
    return y;
  };
  const height = laneTop(chain.lanes.length) + 12;

  const cx = (n: { column: number }) => PAD_X + n.column * COL_W + COL_W / 2 - NODE_W / 2;
  const cy = (n: { lane: number; slot: number }) =>
    laneTop(n.lane) + LANE_PAD + n.slot * (NODE_H + SLOT_GAP);
  const byId = new Map(chain.nodes.map((n) => [n.id, n]));

  const roleName = (id: string) => getRoleDef(course, id)?.name ?? id;
  const roleColor = (id: string) => getRoleDef(course, id)?.color ?? 'var(--color-muted)';
  const dim = (id: string) => (highlightRole && highlightRole !== id ? 0.42 : 1);

  const sentences = describeChain(chain, roleName);

  // The focused file's full detail: node (position/status) + def (the prose).
  const activeNode = active ? byId.get(active) : undefined;
  const activeDef = active ? defById.get(active) : undefined;
  const activeDownstream = activeNode
    ? downstreamOf(chain, activeNode.id)
        .map((id) => byId.get(id))
        .filter((n): n is NonNullable<typeof n> => !!n)
    : [];

  return (
    <DiagramFrame
      title="How your work connects"
      subtitle="You complete your own files alone — arrows show where they can enrich other work (optional)"
      howToRead="Each box is a file you produce and finish on your own — nothing here waits on a teammate. The arrows are optional: they show where one file's findings can enrich another, yours or a teammate's, when you collaborate. Hover, tap, or focus a file for details."
      legend={[
        { label: 'Filed', color: 'var(--stone-crystal, #7aa2c8)' },
        { label: 'Not yet filed', color: 'var(--color-line)', dashed: true },
        { label: 'Connects to another role', color: 'var(--color-accent)' },
        { label: 'Continues your own work', color: 'var(--color-muted)', dashed: true },
      ]}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        // No fixed width: the viewBox scales the drawing to the container, so it
        // shrinks on a phone instead of forcing a horizontal scroll forever.
        style={{ width: '100%', maxWidth: width, height: 'auto' }}
        role="img"
        aria-label={`How your work connects for ${course.title}: ${sentences.length} optional connections across ${chain.columns.length} weeks.`}
        className="block"
      >
        <defs>
          <marker
            id="chain-arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L8 4 L0 8 z" fill="var(--color-accent)" />
          </marker>
        </defs>

        {/* Week columns — tinted with the same per-phase token as the week
            headers, so a column here and a week there are the same colour. */}
        {chain.columns.map((week, i) => (
          <g key={`col-${week}`}>
            <rect
              x={PAD_X + i * COL_W}
              y={0}
              width={COL_W}
              height={height}
              fill={`var(--color-w${Math.min(4, Math.max(1, week))})`}
              opacity={i % 2 === 0 ? 0.05 : 0.02}
            />
            <text
              x={PAD_X + i * COL_W + COL_W / 2}
              y={20}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              letterSpacing="1"
              fill={`var(--color-w${Math.min(4, Math.max(1, week))})`}
            >
              {week === 0 ? 'SETUP' : `WEEK ${week}`}
            </text>
          </g>
        ))}

        {/* Role lanes. Every role gets its colour, not only your own — a lane
            you can't identify is not a lane. */}
        {chain.lanes.map((role, i) => (
          <g key={`lane-${role}`} opacity={dim(role)}>
            <rect
              x={0}
              y={laneTop(i)}
              width={width}
              height={laneHeight(i)}
              fill={roleColor(role)}
              opacity={highlightRole === role ? 0.09 : 0.035}
            />
            <rect x={0} y={laneTop(i)} width={4} height={laneHeight(i)} fill={roleColor(role)} />
            <text
              x={12}
              y={laneTop(i) + laneHeight(i) / 2 + 4}
              fontSize="11"
              fontWeight="700"
              fill={roleColor(role)}
            >
              {roleName(role)}
            </text>
          </g>
        ))}

        {/* Edges, drawn in with the pathLength idiom. */}
        {chain.edges.map((e, i) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          // Two shapes of edge, because there are two shapes of handoff. Most
          // flow forward in time and are drawn left-to-right. But plenty happen
          // *within* one week — the Analyst escalates and the Hunter picks it up
          // the same week — and those share a column, where a left-to-right
          // curve would have to double back on itself and read as an error.
          // Those are drawn vertically between lanes instead.
          const sameColumn = b.column <= a.column;
          let d: string;
          if (sameColumn) {
            const x = cx(a) + NODE_W / 2;
            const down = b.lane > a.lane;
            const y1 = cy(a) + (down ? NODE_H : 0);
            const y2 = cy(b) + (down ? 0 : NODE_H);
            const bow = (down ? 1 : -1) * 14;
            d = `M${x} ${y1} C${x + 26} ${y1 + bow}, ${x + 26} ${y2 - bow}, ${x} ${y2}`;
          } else {
            const x1 = cx(a) + NODE_W;
            const y1 = cy(a) + NODE_H / 2;
            const x2 = cx(b);
            const y2 = cy(b) + NODE_H / 2;
            const mid = x1 + (x2 - x1) / 2;
            d = `M${x1} ${y1} C${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
          }
          // An edge touching the focused file is the thing the detail card is
          // talking about — lift it so "where it goes" is visible on the diagram.
          const touchesActive = !!active && (e.from === active || e.to === active);
          const delay = Math.min(i * 0.05, 0.5);
          return (
            <g key={`${e.from}->${e.to}`}>
              <motion.path
                d={d}
                fill="none"
                stroke={e.sameRole ? 'var(--color-muted)' : 'var(--color-accent)'}
                strokeWidth={touchesActive ? (e.sameRole ? 2.5 : 3.25) : e.sameRole ? 1.75 : 2.25}
                strokeDasharray={e.sameRole ? '4 3' : undefined}
                markerEnd="url(#chain-arrow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: touchesActive ? 1 : e.sameRole ? 0.65 : 0.95,
                }}
                transition={{ duration: 0.7, delay, ease: 'easeOut' }}
              />
              {/* The transfer itself: an artefact travelling the edge. Only for
                  real handoffs — carrying your own work forward isn't one. */}
              {!e.sameRole && (
                <motion.circle
                  r={3.5}
                  fill="var(--stone-crystal, #7aa2c8)"
                  stroke="var(--color-panel)"
                  strokeWidth={1}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0], offsetDistance: ['0%', '100%'] }}
                  transition={{
                    duration: 2.2,
                    delay: delay + 0.6,
                    repeat: Infinity,
                    repeatDelay: 2.6,
                    ease: 'easeInOut',
                  }}
                  style={{ offsetPath: `path("${d}")`, offsetRotate: '0deg' }}
                />
              )}
            </g>
          );
        })}

        {/* Nodes — each an interactive, focusable file. */}
        {chain.nodes.map((n, i) => {
          const isActive = active === n.id;
          return (
            <motion.g
              key={n.id}
              opacity={dim(n.owner)}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: dim(n.owner), y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.5), duration: 0.25 }}
              tabIndex={0}
              role="button"
              aria-label={`${n.file}, produced by ${roleName(n.owner)}${n.filed ? ', filed' : ', not yet filed'}. Show details.`}
              style={{ cursor: 'pointer', outline: 'none' }}
              onMouseEnter={() => setActive(n.id)}
              onFocus={() => setActive(n.id)}
            >
              <title>
                {n.file} — {n.title}
                {n.filed ? ' (filed)' : ' (not yet filed)'}
              </title>
              {/* Focus/hover ring so keyboard users can see where they are. */}
              {isActive && (
                <rect
                  x={cx(n) - 3}
                  y={cy(n) - 3}
                  width={NODE_W + 6}
                  height={NODE_H + 6}
                  rx={6}
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                />
              )}
              <rect
                x={cx(n)}
                y={cy(n)}
                width={NODE_W}
                height={NODE_H}
                rx={4}
                fill={n.filed ? 'var(--stone-crystal, #7aa2c8)' : 'var(--color-panel)'}
                fillOpacity={n.filed ? 0.22 : 1}
                stroke={n.capstone ? 'var(--color-accent)' : roleColor(n.owner)}
                strokeWidth={n.capstone ? 2 : 1.25}
                strokeDasharray={n.filed ? undefined : '3 2'}
              />
              {/* The real filename the student saves and hands off. */}
              <text
                x={cx(n) + NODE_W / 2}
                y={cy(n) + NODE_H / 2 + 3.5}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="600"
                className="fill-[var(--color-ink)]"
                style={{ fontFamily: 'var(--font-mono, ui-monospace), monospace' }}
              >
                {truncate(n.file, 26)}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* The technical read-out for the focused file — the "how your work
          connects" detail, attached to the file it describes. */}
      <div className="mt-3 min-h-[4.5rem] rounded-lg border border-line bg-panel-2 p-3 text-sm">
        {activeNode ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-muted" />
              <code className="font-mono text-sm font-semibold text-ink">{activeNode.file}</code>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  activeNode.filed
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'bg-panel text-muted'
                }`}
              >
                {activeNode.filed ? 'Filed' : 'Not yet filed'}
              </span>
              {activeNode.capstone && (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-ink">
                  Final artefact
                </span>
              )}
            </div>
            <p className="font-medium text-ink">{activeNode.title}</p>
            <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
              <dt className="eyebrow-muted">Produced by</dt>
              <dd style={{ color: roleColor(activeNode.owner) }} className="font-medium">
                {roleName(activeNode.owner)}
              </dd>
              {activeDef?.source && (
                <>
                  <dt className="eyebrow-muted">Built from</dt>
                  <dd className="text-muted">{activeDef.source}</dd>
                </>
              )}
              <dt className="eyebrow-muted">Connects to</dt>
              <dd className="text-muted">
                {activeDownstream.length > 0 ? (
                  <span className="flex flex-wrap items-center gap-x-1 gap-y-1">
                    {activeDownstream.map((d, idx) => (
                      <span key={d.id} className="inline-flex items-center gap-1">
                        {idx > 0 && <span className="text-line">·</span>}
                        <ArrowRight className="h-3 w-3 text-muted" />
                        <code className="font-mono text-xs text-ink">{d.file}</code>
                        <span className="text-xs" style={{ color: roleColor(d.owner) }}>
                          ({roleName(d.owner)})
                        </span>
                      </span>
                    ))}
                  </span>
                ) : (
                  'Nothing downstream — this is an endpoint.'
                )}
              </dd>
              {activeDef?.useIt && (
                <>
                  <dt className="eyebrow-muted">Why</dt>
                  <dd className="text-muted">{activeDef.useIt}</dd>
                </>
              )}
            </dl>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-muted">
            <FileText className="h-4 w-4 shrink-0" />
            Hover, tap, or focus a file above to see who produces it, what it&apos;s built from, and
            where it goes next.
          </p>
        )}
      </div>

      {/* The same information as prose. An arrow between two boxes conveys
          nothing to a screen reader, and this is not a diagram anyone should
          need sight to read. */}
      <ul className="sr-only">
        {sentences.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </DiagramFrame>
  );
}

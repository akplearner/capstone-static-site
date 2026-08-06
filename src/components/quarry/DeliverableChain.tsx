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
 * The deliverable chain — the whole capstone as one relay you can inspect.
 *
 * A three-person crew only works if each person's output is the next person's
 * input, but that relay is easy to lose sight of: a student sees the task in
 * front of them and never that someone is waiting on it. This draws it — role
 * lanes down the side, weeks across the top, and each **file** sitting where its
 * owner produces it, with arrows to the files it feeds.
 *
 * The node face shows the real filename the student saves and hands off (e.g.
 * `05_IOC_Database.csv`) — the technical anchor, not a paraphrase. Hovering or
 * focusing a file opens a plain, technical read-out beneath the diagram: who
 * produces it, what it's built from, and where it goes next. That read-out is
 * where the old "how your work connects" hand-off list now lives, attached to
 * the thing it describes instead of floating in a separate paragraph.
 *
 * Reduced motion is handled globally by `<MotionConfig reducedMotion="user">`;
 * no guard is needed here.
 */

const LANE_H = 78;
const COL_W = 190;
const PAD_X = 116; // room for the role labels down the left
const PAD_Y = 34; // room for the week headers across the top
const NODE_W = 152;
const NODE_H = 40;

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
  const height = PAD_Y + chain.lanes.length * LANE_H + 12;

  const cx = (n: { column: number }) => PAD_X + n.column * COL_W + COL_W / 2 - NODE_W / 2;
  const cy = (n: { lane: number }) => PAD_Y + n.lane * LANE_H + (LANE_H - NODE_H) / 2;
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
      title="The deliverable chain"
      subtitle="Every file is someone else's starting point"
      howToRead="Each box is a file one crew member produces; an arrow means the file on the left feeds the one on the right. A solid arrow hands a file to another role; a dashed arrow carries your own work forward. Hover, tap, or focus a file to see who produces it and where it goes."
      legend={[
        { label: 'Produced', color: 'var(--stone-crystal, #7aa2c8)' },
        { label: 'Still owed', color: 'var(--color-line)', dashed: true },
        { label: 'Feeds another role', color: 'var(--color-accent)' },
        { label: 'Carried forward', color: 'var(--color-muted)', dashed: true },
      ]}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label={`Deliverable chain for ${course.title}: ${sentences.length} handoffs across ${chain.columns.length} weeks.`}
        className="max-w-none"
      >
        <defs>
          <marker
            id="chain-arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="5"
            markerHeight="5"
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
              y={PAD_Y + i * LANE_H}
              width={width}
              height={LANE_H}
              fill={roleColor(role)}
              opacity={highlightRole === role ? 0.09 : 0.035}
            />
            <rect
              x={0}
              y={PAD_Y + i * LANE_H}
              width={4}
              height={LANE_H}
              fill={roleColor(role)}
            />
            <text
              x={12}
              y={PAD_Y + i * LANE_H + LANE_H / 2 + 4}
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
                strokeWidth={touchesActive ? (e.sameRole ? 2 : 2.75) : e.sameRole ? 1.25 : 1.75}
                strokeDasharray={e.sameRole ? '4 3' : undefined}
                markerEnd="url(#chain-arrow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: touchesActive ? 1 : e.sameRole ? 0.5 : 0.85,
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
                {truncate(n.file, 24)}
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
              <code className="font-mono text-[13px] font-semibold text-ink">{activeNode.file}</code>
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
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Produced by</dt>
              <dd style={{ color: roleColor(activeNode.owner) }} className="font-medium">
                {roleName(activeNode.owner)}
              </dd>
              {activeDef?.source && (
                <>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Built from</dt>
                  <dd className="text-muted">{activeDef.source}</dd>
                </>
              )}
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Feeds</dt>
              <dd className="text-muted">
                {activeDownstream.length > 0 ? (
                  <span className="flex flex-wrap items-center gap-x-1 gap-y-1">
                    {activeDownstream.map((d, idx) => (
                      <span key={d.id} className="inline-flex items-center gap-1">
                        {idx > 0 && <span className="text-line">·</span>}
                        <ArrowRight className="h-3 w-3 text-muted" />
                        <code className="font-mono text-[12px] text-ink">{d.file}</code>
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
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Why</dt>
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

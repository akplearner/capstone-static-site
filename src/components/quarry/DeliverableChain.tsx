'use client';

import { motion } from 'framer-motion';
import { Course } from '@/lib/types';
import { getRoleDef } from '@/lib/course-helpers';
import { describeChain, type DeliverableChain } from '@/lib/deliverableChain';
import { DiagramFrame } from '@/components/diagrams/DiagramFrame';

/**
 * The deliverable chain — the whole capstone as one relay.
 *
 * A three-person crew only works if each person's output is the next person's
 * input, but until now that relay was invisible: a student could see the task
 * in front of them and never the fact that someone is waiting on it. This draws
 * it — role lanes down the side, weeks across the top, and an artefact
 * travelling each edge from the crew member who produces it to the one who
 * needs it.
 *
 * Nodes fill with the region's mineral once the document is actually filed, so
 * the picture is a status board rather than a plan: an unfilled node in week 1
 * with three edges leaving it is visibly the thing blocking everyone.
 *
 * Reduced motion is handled globally by `<MotionConfig reducedMotion="user">`;
 * no guard is needed here.
 */

const LANE_H = 78;
const COL_W = 190;
const PAD_X = 116; // room for the role labels down the left
const PAD_Y = 34; // room for the week headers across the top
const NODE_W = 150;
const NODE_H = 40;

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

  return (
    <DiagramFrame
      title="The deliverable chain"
      subtitle="Every document is someone else's starting point"
      howToRead="Each row is a role, each column a week. A filled stone means the document is written; an arrow means it feeds the next one. Follow the arrows out of your own row to see who is waiting on you."
      legend={[
        { label: 'Filed', color: 'var(--stone-crystal, #7aa2c8)' },
        { label: 'Still owed', color: 'var(--color-line)', dashed: true },
        { label: 'Handed to another role', color: 'var(--color-accent)' },
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
          const delay = Math.min(i * 0.05, 0.5);
          return (
            <g key={`${e.from}->${e.to}`}>
              <motion.path
                d={d}
                fill="none"
                stroke={e.sameRole ? 'var(--color-muted)' : 'var(--color-accent)'}
                strokeWidth={e.sameRole ? 1.25 : 1.75}
                strokeDasharray={e.sameRole ? '4 3' : undefined}
                markerEnd="url(#chain-arrow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: e.sameRole ? 0.5 : 0.85 }}
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

        {/* Nodes. */}
        {chain.nodes.map((n, i) => (
          <motion.g
            key={n.id}
            opacity={dim(n.owner)}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: dim(n.owner), y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.5), duration: 0.25 }}
          >
            <title>
              {n.title} — {n.file}
              {n.filed ? ' (filed)' : ' (not yet filed)'}
            </title>
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
            <text
              x={cx(n) + NODE_W / 2}
              y={cy(n) + NODE_H / 2 + 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              className="fill-[var(--color-ink)]"
            >
              {n.short.length > 22 ? `${n.short.slice(0, 21)}…` : n.short}
            </text>
          </motion.g>
        ))}
      </svg>

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

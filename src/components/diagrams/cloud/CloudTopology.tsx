'use client';

import { useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { CloudContainer, CloudNode, CloudTopology as Topology } from '@/lib/cloud/model';
import { CONTAINER_FILL, CONTAINER_STROKE } from '@/lib/cloud/brand';
import { DiagramFrame } from '../DiagramFrame';
import { CloudIcon } from './CloudIcon';

/**
 * The cloud capstones' architecture picture (R87): the platform's own
 * nesting (Azure: subscription › resource group › VNet › subnets; AWS: AWS
 * Cloud › Region › VPC › AZ › subnets), one icon per template resource, and
 * the traffic that flows between them.
 *
 * The week control turns it into Architecture v1…v12: resources that arrive
 * later dim and carry their week, this week's additions glow. "Template
 * dependencies" swaps the view to the template's own reference graph — what
 * the ARM visualizer and CloudFormation's designer draw.
 */

const TRAFFIC_COLOUR = { azure: '#0078D4', aws: '#FF9900' } as const;
const DEPENDS_COLOUR = '#8A8F98';

export function CloudTopology({
  topology,
  week: fixedWeek,
  onWeekChange,
  initialWeek = 12,
  selected,
  onSelect,
  controls = true,
  title,
}: {
  topology: Topology;
  /** Pin the view to one week (a document's week); hides the week control. */
  week?: number;
  /** With `week`, makes the week control controlled (shared with the IaC viewer). */
  onWeekChange?: (week: number) => void;
  initialWeek?: number;
  selected?: string | null;
  onSelect?: (id: string) => void;
  controls?: boolean;
  /** Override the frame title (e.g. "Architecture v3"). */
  title?: string;
}) {
  const [stateWeek, setStateWeek] = useState(initialWeek);
  const setWeek = onWeekChange ?? setStateWeek;
  const pinned = fixedWeek != null && !onWeekChange;
  const [showDeps, setShowDeps] = useState(false);
  const week = fixedWeek ?? stateWeek;
  const markerId = useId().replace(/:/g, '');
  const p = topology.platform;
  const traffic = TRAFFIC_COLOUR[p];

  const nodeById = new Map(topology.nodes.map((n) => [n.id, n]));
  const boxById = new Map(topology.containers.map((c) => [c.id, c]));
  const anchor = (id: string): { x: number; y: number; r: number } | null => {
    const n = nodeById.get(id);
    if (n) return { x: n.x, y: n.y, r: n.small ? 14 : 24 };
    const c = boxById.get(id);
    if (c) return { x: c.x + c.w / 2, y: c.y, r: 0 };
    return null;
  };
  const edges = topology.edges.filter((e) =>
    e.kind === 'depends' ? showDeps && e.week <= week : !showDeps && e.week <= week && (e.until == null || week <= e.until)
  );
  const added = topology.nodes.filter((n) => !n.external && n.week === week).length;

  return (
    <DiagramFrame
      title={title ?? (pinned ? `Architecture v${week}` : topology.title)}
      howToRead={topology.howToRead}
      subtitle={
        pinned
          ? `The environment as it stands in Week ${week}. Glowing: added this week. Faded: arrives later.`
          : undefined
      }
    >
      {controls && !pinned && (
        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5" role="group" aria-label="Architecture version">
            <button
              type="button"
              aria-label="Previous week"
              onClick={() => setWeek(Math.max(1, week - 1))}
              className="rounded-md p-1 text-muted hover:bg-panel-2 hover:text-ink"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <label className="flex items-center gap-2">
              <span className="font-semibold text-ink tabular-nums">Architecture v{week}</span>
              <input
                type="range"
                min={1}
                max={12}
                value={week}
                onChange={(e) => setWeek(Number(e.target.value))}
                aria-label="Week"
                className="w-32 accent-[var(--color-accent)]"
              />
            </label>
            <button
              type="button"
              aria-label="Next week"
              onClick={() => setWeek(Math.min(12, week + 1))}
              className="rounded-md p-1 text-muted hover:bg-panel-2 hover:text-ink"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="text-muted">{added > 0 ? `· ${added} new this week` : '· nothing new — operate what exists'}</span>
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 text-muted">
            <input type="checkbox" checked={showDeps} onChange={(e) => setShowDeps(e.target.checked)} />
            Template dependencies
          </label>
        </div>
      )}

      <svg
        viewBox={`0 0 ${topology.width} ${topology.height}`}
        className="h-auto w-full min-w-[640px]"
        role="img"
        aria-label={`${topology.title}, week ${week}`}
      >
        <defs>
          <marker id={`${markerId}-t`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill={traffic} />
          </marker>
          <marker id={`${markerId}-d`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill={DEPENDS_COLOUR} />
          </marker>
        </defs>

        {topology.containers.map((c) => (
          <Box key={c.id} c={c} platform={p} week={week} />
        ))}

        {edges.map((e, i) => {
          const a = anchor(e.from);
          const b = anchor(e.to);
          if (!a || !b) return null;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const x1 = a.x + (dx / len) * a.r;
          const y1 = a.y + (dy / len) * a.r;
          const x2 = b.x - (dx / len) * (b.r + 3);
          const y2 = b.y - (dy / len) * (b.r + 3);
          const dep = e.kind === 'depends';
          return (
            <g key={`${e.from}-${e.to}-${i}`} pointerEvents="none">
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={dep ? DEPENDS_COLOUR : traffic}
                strokeWidth={dep ? 1.1 : 1.8}
                strokeDasharray={dep ? '4 3' : undefined}
                markerEnd={`url(#${markerId}-${dep ? 'd' : 't'})`}
                opacity={dep ? 0.75 : 0.9}
              />
              {e.label && !dep && (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 4}
                  textAnchor="middle"
                  fontSize="10"
                  style={{ fill: 'var(--color-ink)', paintOrder: 'stroke', stroke: 'var(--color-panel)', strokeWidth: 3 }}
                >
                  {e.label}
                </text>
              )}
            </g>
          );
        })}

        {topology.nodes.map((n) => (
          <NodeMark
            key={n.id}
            n={n}
            platform={p}
            week={week}
            selected={selected === n.id}
            glow={traffic}
            onSelect={onSelect}
          />
        ))}
      </svg>

      {/* The same picture, as a list, for screen readers. */}
      <ul className="sr-only">
        {topology.nodes
          .filter((n) => !n.external && n.week <= week)
          .map((n) => (
            <li key={n.id}>
              {n.label}
              {n.name ? ` — ${n.name}` : ''} (from week {n.week})
            </li>
          ))}
      </ul>
    </DiagramFrame>
  );
}

function Box({ c, platform, week }: { c: CloudContainer; platform: 'azure' | 'aws'; week: number }) {
  const later = c.week > week;
  const stroke = CONTAINER_STROKE[platform][c.kind];
  const fill = CONTAINER_FILL[platform][c.kind] ?? 'transparent';
  const dashed = c.kind === 'group' || c.kind === 'region' || c.kind === 'zone' || (platform === 'azure' && c.kind.startsWith('subnet'));
  return (
    <g opacity={later ? 0.35 : 1} pointerEvents="none">
      <rect
        x={c.x}
        y={c.y}
        width={c.w}
        height={c.h}
        rx={platform === 'azure' ? 6 : 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={c.kind === 'account' || c.kind === 'network' ? 1.6 : 1.2}
        strokeDasharray={dashed ? '6 4' : undefined}
      />
      {/* AWS diagrams tab the container's name at its top-left corner. */}
      {platform === 'aws' && c.kind !== 'zone' && <rect x={c.x} y={c.y} width={8} height={8} fill={stroke} />}
      <text x={c.x + (platform === 'aws' ? 14 : 8)} y={c.y + 14} fontSize="11" fontWeight="600" style={{ fill: stroke }}>
        {c.label}
        {later ? ` · Week ${c.week}` : ''}
      </text>
      {c.sub && (
        <text x={c.x + (platform === 'aws' ? 14 : 8)} y={c.y + 27} fontSize="9.5" fontFamily="var(--font-mono)" style={{ fill: 'var(--color-muted)' }}>
          {c.sub}
        </text>
      )}
    </g>
  );
}

function NodeMark({
  n,
  platform,
  week,
  selected,
  glow,
  onSelect,
}: {
  n: CloudNode;
  platform: 'azure' | 'aws';
  week: number;
  selected: boolean;
  glow: string;
  onSelect?: (id: string) => void;
}) {
  const later = n.week > week;
  const isNew = !n.external && n.week === week;
  const size = n.small ? 24 : 40;
  const clickable = !!onSelect && !n.external;
  return (
    <g
      opacity={later ? 0.28 : 1}
      onClick={clickable ? () => onSelect!(n.id) : undefined}
      style={clickable ? { cursor: 'pointer' } : undefined}
      className={clickable ? 'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent' : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ') && onSelect!(n.id) : undefined}
      aria-label={clickable ? `${n.label}${n.name ? ` ${n.name}` : ''} — show in template` : undefined}
    >
      <title>{`${n.label}${n.name ? ` — ${n.name}` : ''}${n.external ? '' : ` · from week ${n.week}`}`}</title>
      {/* The whole icon is the target, not only its painted strokes. */}
      {clickable && <rect x={n.x - size / 2 - 4} y={n.y - size / 2 - 4} width={size + 8} height={size + 8} fill="transparent" />}
      {(isNew || selected) && (
        <circle
          cx={n.x}
          cy={n.y}
          r={size / 2 + 6}
          fill="none"
          stroke={selected ? 'var(--color-accent)' : glow}
          strokeWidth={selected ? 3 : 2.5}
          opacity={selected ? 1 : 0.8}
        />
      )}
      <CloudIcon platform={platform} icon={n.icon} size={size} x={n.x} y={n.y} />
      <text
        x={n.x}
        y={n.y + size / 2 + (n.small ? 10 : 13)}
        textAnchor="middle"
        fontSize={n.small ? 8.5 : 10.5}
        fontWeight={n.small ? 500 : 600}
        style={{ fill: 'var(--color-ink)', paintOrder: 'stroke', stroke: 'var(--color-panel)', strokeWidth: 3 }}
      >
        {n.label}
      </text>
      {n.name && !n.small && (
        <text
          x={n.x}
          y={n.y + size / 2 + 25}
          textAnchor="middle"
          fontSize="8.5"
          fontFamily="var(--font-mono)"
          style={{ fill: 'var(--color-muted)', paintOrder: 'stroke', stroke: 'var(--color-panel)', strokeWidth: 3 }}
        >
          {n.name}
        </text>
      )}
      {later && (
        <text x={n.x + size / 2 + 2} y={n.y - size / 2 + 4} fontSize="8" fontWeight="700" style={{ fill: 'var(--color-muted)' }}>
          W{n.week}
        </text>
      )}
    </g>
  );
}

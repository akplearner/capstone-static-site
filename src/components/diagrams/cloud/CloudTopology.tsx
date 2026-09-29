'use client';

import { useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { CloudContainer, CloudNode, CloudTopology as Topology } from '@/lib/cloud/model';
import { CONTAINER_FILL, CONTAINER_STROKE } from '@/lib/cloud/brand';
import { officialContainerHref } from '@/lib/cloud/officialIcons';
import { DiagramFrame } from '../DiagramFrame';
import { CloudIcon } from './CloudIcon';

/**
 * The cloud capstones' architecture picture (R87, week-scoped in R88): the
 * platform's own nesting (Azure: subscription › resource group › VNet ›
 * subnets; AWS: AWS Cloud › Region › VPC › AZ › subnets), the official icon
 * for every template resource, and the traffic between them.
 *
 * The picture is ONE WEEK at a time. Students work Weeks 1–4 first, and a
 * Week-1 student shown thirty resources reads "too much"; so only what exists
 * by the selected week is drawn, this week's additions glow, and "Show what
 * comes later" is the way to peek ahead (later resources greyed, with their
 * week). "Template dependencies" swaps the arrows for the template's own
 * reference graph — what the ARM visualizer and CloudFormation's designer
 * draw. Supporting resources (a NIC, a role assignment, a route-table
 * association) always keep a thin attachment line to what they belong to, so
 * nothing floats.
 */

const TRAFFIC_COLOUR = { azure: '#0078D4', aws: '#FF9900' } as const;
const DEPENDS_COLOUR = '#8A8F98';
const WEEKS = Array.from({ length: 12 }, (_, i) => i + 1);

export function CloudTopology({
  topology,
  week: fixedWeek,
  onWeekChange,
  initialWeek = 12,
  selected,
  onSelect,
  controls = true,
  title,
  weekRange,
}: {
  topology: Topology;
  /** R90: the global weeks this course is (e.g. [5, 8]). The picture still
   *  knows all twelve; the controls show this course's four, numbered 1–4. */
  weekRange?: [number, number];
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
  const [showDeps, setShowDeps] = useState(false);
  const [showLater, setShowLater] = useState(false);
  const setWeek = onWeekChange ?? setStateWeek;
  const pinned = fixedWeek != null && !onWeekChange;
  const week = fixedWeek ?? stateWeek;
  const markerId = useId().replace(/:/g, '');
  const [lo, hi] = weekRange ?? [1, 12];
  const local = (w: number) => w - lo + 1;
  const weeksShown = WEEKS.filter((w) => w >= lo && w <= hi);
  const p = topology.platform;
  const traffic = TRAFFIC_COLOUR[p];

  const nodeById = new Map(topology.nodes.map((n) => [n.id, n]));
  const boxById = new Map(topology.containers.map((c) => [c.id, c]));
  const exists = (w: number) => w <= week;
  const drawn = (w: number) => exists(w) || (showLater && !pinned);
  const anchor = (id: string): { x: number; y: number; r: number } | null => {
    const n = nodeById.get(id);
    if (n) return { x: n.x, y: n.y, r: n.small ? 15 : 25 };
    // A container is tied at its corner icon, where the platform names it.
    const c = boxById.get(id);
    if (c) return officialContainerHref(p, c.kind) ? { x: c.x + 14, y: c.y + 14, r: 14 } : { x: c.x + c.w / 2, y: c.y, r: 0 };
    return null;
  };
  const isSmall = (id: string) => !!nodeById.get(id)?.small;
  // Attachment lines: the template's references that touch a supporting
  // resource. Drawn always, so a NIC is visibly the VM's and a role assignment
  // visibly sits on its vault — the rest of the reference graph is the toggle.
  const edges = topology.edges.filter((e) => {
    if (!exists(e.week)) return false;
    if (e.kind === 'depends') return showDeps || isSmall(e.from) || isSmall(e.to);
    return !showDeps && (e.until == null || week <= e.until);
  });
  const added = topology.nodes.filter((n) => !n.external && n.week === week).length;
  const containers = topology.containers.filter((c) => drawn(c.week));
  const nodes = topology.nodes.filter((n) => drawn(n.week));

  return (
    <DiagramFrame
      title={title ?? (pinned ? `Architecture v${local(week)}` : topology.title)}
      howToRead={topology.howToRead}
      subtitle={
        week < lo
          ? 'What this course starts from — the previous course’s finished environment.'
          : showLater && !pinned
            ? `What exists by the end of Week ${local(week)}. Glowing: added this week. Faded: arrives later.`
            : `What exists by the end of Week ${local(week)}. Glowing: added this week.`
      }
    >
      {controls && !pinned && (
        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Architecture version">
            <button
              type="button"
              aria-label="Previous week"
              onClick={() => setWeek(Math.max(lo, week - 1))}
              className="rounded-md p-1 text-muted hover:bg-panel-2 hover:text-ink"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            {/* One pill per week, in its phase colour — the same rail the Tasks tab draws. */}
            {weeksShown.map((w) => (
              <button
                key={w}
                type="button"
                data-week={local(w)}
                aria-pressed={w === week}
                aria-label={`Week ${local(w)}`}
                onClick={() => setWeek(w)}
                className={`min-w-[1.75rem] rounded-md border-b-2 px-1.5 py-0.5 font-semibold tabular-nums ${
                  w === week ? 'bg-panel-2 text-ink' : 'text-muted hover:bg-panel-2 hover:text-ink'
                }`}
                style={{ borderBottomColor: w === week ? 'var(--week)' : 'transparent' }}
              >
                {local(w)}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next week"
              onClick={() => setWeek(Math.min(hi, week + 1))}
              className="rounded-md p-1 text-muted hover:bg-panel-2 hover:text-ink"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="ml-1 text-muted">
              {week < lo ? 'Week 0 · what you inherit' : `Week ${local(week)} · ${added > 0 ? `${added} new this week` : 'nothing new — operate what exists'}`}
            </span>
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 text-muted">
            <input type="checkbox" checked={showLater} onChange={(e) => setShowLater(e.target.checked)} />
            Show what comes later
          </label>
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
        aria-label={`${topology.title}, week ${local(week)}`}
      >
        <defs>
          <marker id={`${markerId}-t`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill={traffic} />
          </marker>
          <marker id={`${markerId}-d`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill={DEPENDS_COLOUR} />
          </marker>
        </defs>

        {containers.map((c) => (
          <Box key={c.id} c={c} platform={p} week={week} />
        ))}

        {edges.map((e, i) => {
          const a = anchor(e.from);
          const b = anchor(e.to);
          if (!a || !b) return null;
          const dep = e.kind === 'depends';
          // An attachment line is a dependency touching a supporting resource;
          // in the traffic view it is a plain tie, not an arrow.
          const attach = dep && !showDeps;
          // Straight, or two legs through a waypoint. Each end stops at the
          // icon's edge, measured along the leg that touches it.
          const first = e.via ?? b;
          const last = e.via ?? a;
          const d1 = Math.hypot(first.x - a.x, first.y - a.y) || 1;
          const d2 = Math.hypot(b.x - last.x, b.y - last.y) || 1;
          const x1 = a.x + ((first.x - a.x) / d1) * a.r;
          const y1 = a.y + ((first.y - a.y) / d1) * a.r;
          const tip = attach ? b.r : b.r + 3;
          const x2 = b.x - ((b.x - last.x) / d2) * tip;
          const y2 = b.y - ((b.y - last.y) / d2) * tip;
          const points = e.via ? `${x1},${y1} ${e.via.x},${e.via.y} ${x2},${y2}` : `${x1},${y1} ${x2},${y2}`;
          const lx = e.via ? e.via.x : (x1 + x2) / 2;
          const ly = e.via ? e.via.y : (y1 + y2) / 2;
          return (
            <g key={`${e.from}-${e.to}-${i}`} pointerEvents="none">
              <polyline
                points={points}
                fill="none"
                stroke={dep ? DEPENDS_COLOUR : traffic}
                strokeWidth={attach ? 1 : dep ? 1.1 : 1.8}
                strokeLinejoin="round"
                strokeDasharray={dep && !attach ? '4 3' : undefined}
                markerEnd={attach ? undefined : `url(#${markerId}-${dep ? 'd' : 't'})`}
                opacity={attach ? 0.55 : dep ? 0.75 : 0.9}
              />
              {e.label && !dep && (
                <text
                  x={lx}
                  y={ly - 4}
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

        {nodes.map((n) => (
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
  const icon = officialContainerHref(platform, c.kind);
  const textX = c.x + (icon ? 30 : 8);
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
      {/* The platform's group icon sits in the corner, as its own diagrams draw it. */}
      {icon &&
        (icon.dark ? (
          <>
            <image href={icon.light} x={c.x + 2} y={c.y + 2} width={24} height={24} className="only-light" />
            <image href={icon.dark} x={c.x + 2} y={c.y + 2} width={24} height={24} className="only-dark" />
          </>
        ) : (
          <image href={icon.light} x={c.x + 2} y={c.y + 2} width={24} height={24} />
        ))}
      <text x={textX} y={c.y + 14} fontSize="11" fontWeight="600" style={{ fill: stroke }}>
        {c.label}
        {later ? ` · Week ${c.week}` : ''}
      </text>
      {c.sub && (
        <text x={textX} y={c.y + 26} fontSize="9.5" fontFamily="var(--font-mono)" style={{ fill: 'var(--color-muted)' }}>
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
  const size = n.small ? 26 : 44;
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

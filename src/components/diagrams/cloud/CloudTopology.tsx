'use client';

import { useId, useState } from 'react';
import type { CloudContainer, CloudNode, CloudTopology as Topology } from '@/lib/cloud/model';
import type { WeekProcess } from '@/lib/weekVisual';
import { processIds } from '@/lib/weekVisual';
import { WeekPills } from '@/components/week/WeekPills';
import { ProcessArrows } from '../ProcessArrows';
import { CONTAINER_FILL, CONTAINER_STROKE } from '@/lib/cloud/brand';
import { officialContainerHref } from '@/lib/cloud/officialIcons';
import { ICON_SIZE, layoutTopology, type Rect } from '@/lib/cloud/layout';
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
 * draw. Supporting resources (an NSG, a public IP, a role) keep a thin
 * attachment line to what they belong to, so nothing floats.
 *
 * R94: the picture fits what it shows. Containers shrink-wrap their visible
 * members and the viewBox crops to the drawn part (`layout.ts`), so an early
 * week is a small, zoomed picture rather than empty boxes. Template plumbing
 * (`detail` nodes: an API stage, a route association, runtime storage) and
 * the full reference graph live behind "Show template details"; a person or
 * GitHub is drawn only once something connects to it.
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
  process,
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
  /** Override the frame title (e.g. "Architecture v3"); `null` draws no
   *  title at all — the caller already has a heading over the picture (R100). */
  title?: string | null;
  /** R99: the week's process, drawn over the picture as walking arrows. */
  process?: WeekProcess;
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
  const exists = (w: number) => w <= week;
  const drawn = (w: number) => exists(w) || (showLater && !pinned);
  const isSmall = (id: string) => !!nodeById.get(id)?.small;
  const live = (e: (typeof topology.edges)[number]) => exists(e.week) && (e.until == null || week <= e.until);
  // What is drawn this week: template resources by week, plumbing only on
  // request, and a person or GitHub only once a line reaches them.
  const inProcess = new Set(processIds(process));
  // R100: a person the week's process names is drawn whatever their week —
  // the arrow has to land on someone, and the crop has to include them. A
  // person whose own week has not come is DISPLACED: drawn just beside the
  // crop rather than at their authored place (which, in an early week, can be
  // a whole canvas away from the few things built — the arrow would cross an
  // empty picture to reach them).
  const forced = (n: CloudNode) => !!n.external && inProcess.has(n.id);
  const displaced = (n: CloudNode) => forced(n) && !drawn(n.week);
  const shown = (n: CloudNode) => {
    if (forced(n)) return true;
    if (!drawn(n.week)) return false;
    if (n.detail && !showDeps) return false;
    if (n.external) return topology.edges.some((e) => e.kind === 'traffic' && live(e) && (e.from === n.id || e.to === n.id)) || (showLater && !pinned);
    return true;
  };
  const nodes = topology.nodes.filter(shown);
  const visible = new Set(nodes.filter((n) => !displaced(n)).map((n) => n.id));
  // Attachment lines: the template's references that touch a supporting
  // resource. Drawn always, so a public IP is visibly the VM's and a role
  // assignment visibly sits on its vault — the rest of the graph is the toggle.
  const edges = topology.edges.filter((e) => {
    if (!exists(e.week)) return false;
    if (!(visible.has(e.from) || boxDrawn(e.from)) || !(visible.has(e.to) || boxDrawn(e.to))) return false;
    if (e.kind === 'depends') return showDeps || isSmall(e.from) || isSmall(e.to);
    return !showDeps && (e.until == null || week <= e.until);
  });
  function boxDrawn(id: string) {
    const c = topology.containers.find((x) => x.id === id);
    return !!c && drawn(c.week);
  }
  // Boxes wrap everything drawn — including faded later nodes when they are
  // shown, so a Week-11 policy still sits inside its governance box.
  const layout = layoutTopology(topology, visible, edges.filter((e) => e.via).map((e) => e.via!));
  const containers = topology.containers.filter((c) => drawn(c.week) && layout.boxes.has(c.id));
  // The displaced people stand in a column to the right of the crop, and the
  // crop grows to hold them.
  const placed = new Map<string, { x: number; y: number }>();
  const extras = nodes.filter(displaced);
  const view = { ...layout.view };
  if (extras.length) {
    const x = view.x + view.w + 84;
    const gap = 92;
    const top = view.y + view.h / 2 - ((extras.length - 1) * gap) / 2;
    extras.forEach((n, i) => placed.set(n.id, { x, y: top + i * gap }));
    view.w += 84 + 64;
    const lo = Math.min(view.y, top - 48);
    const hi = Math.max(view.y + view.h, top + (extras.length - 1) * gap + 48);
    view.y = lo;
    view.h = hi - lo;
  }
  const place = (n: CloudNode): CloudNode => (placed.has(n.id) ? { ...n, ...placed.get(n.id)! } : n);
  const anchor = (id: string): { x: number; y: number; r: number } | null => {
    const n = nodeById.get(id);
    if (n) {
      const p = place(n);
      return { x: p.x, y: p.y, r: n.small ? ICON_SIZE.small / 2 + 2 : ICON_SIZE.main / 2 + 3 };
    }
    // A container is tied at its corner icon, where the platform names it.
    const c = topology.containers.find((x) => x.id === id);
    const r = c && layout.boxes.get(c.id);
    if (c && r) return officialContainerHref(p, c.kind) ? { x: r.x + 14, y: r.y + 14, r: 14 } : { x: r.x + r.w / 2, y: r.y, r: 0 };
    return null;
  };
  const added = topology.nodes.filter((n) => !n.external && n.week === week).length;

  return (
    <DiagramFrame
      title={title === null ? undefined : (title ?? (pinned ? `Architecture v${local(week)}` : topology.title))}
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
          <WeekPills
            weeks={weeksShown}
            selected={week}
            onSelect={setWeek}
            label={(w) => `${local(w)}`}
            ariaLabel="Architecture version"
            status={week < lo ? 'Week 0 · what you inherit' : `Week ${local(week)} · ${added > 0 ? `${added} new this week` : 'nothing new — operate what exists'}`}
          />
          <label className="flex cursor-pointer items-center gap-1.5 text-muted">
            <input type="checkbox" checked={showLater} onChange={(e) => setShowLater(e.target.checked)} />
            Show what comes later
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-muted">
            <input type="checkbox" checked={showDeps} onChange={(e) => setShowDeps(e.target.checked)} />
            Show template details
          </label>
        </div>
      )}

      <svg
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        data-canvas={`${topology.width}x${topology.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full min-w-0 sm:min-w-[640px] lg:max-h-[28rem]"
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
          <Box key={c.id} c={c} r={layout.boxes.get(c.id)!} platform={p} week={week} />
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
            n={place(n)}
            platform={p}
            week={week}
            forced={forced(n)}
            selected={selected === n.id}
            glow={traffic}
            onSelect={onSelect}
          />
        ))}

        {/* R99: the week's process, over the same picture. */}
        {process && <ProcessArrows process={process} anchors={anchor} markerId={`${markerId}-p`} />}
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

function Box({ c, r, platform, week }: { c: CloudContainer; r: Rect; platform: 'azure' | 'aws'; week: number }) {
  const later = c.week > week;
  const isNew = c.week === week;
  const stroke = CONTAINER_STROKE[platform][c.kind];
  const fill = CONTAINER_FILL[platform][c.kind] ?? 'transparent';
  const dashed = c.kind === 'group' || c.kind === 'region' || c.kind === 'zone' || (platform === 'azure' && c.kind.startsWith('subnet'));
  const icon = officialContainerHref(platform, c.kind);
  const textX = r.x + (icon ? 30 : 8);
  return (
    <g opacity={later ? 0.35 : 1} pointerEvents="none" data-node={c.id} data-glow={isNew ? 'true' : undefined} data-later={later ? 'true' : undefined}>
      {/* R99: a box that arrives this week glows like a node that does. */}
      {isNew && <rect x={r.x - 3} y={r.y - 3} width={r.w + 6} height={r.h + 6} rx={platform === 'azure' ? 8 : 4} fill="none" stroke="var(--week, var(--color-accent))" strokeWidth={2.5} opacity={0.8} />}
      <rect
        x={r.x}
        y={r.y}
        width={r.w}
        height={r.h}
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
            <image href={icon.light} x={r.x + 2} y={r.y + 2} width={24} height={24} className="only-light" />
            <image href={icon.dark} x={r.x + 2} y={r.y + 2} width={24} height={24} className="only-dark" />
          </>
        ) : (
          <image href={icon.light} x={r.x + 2} y={r.y + 2} width={24} height={24} />
        ))}
      <text x={textX} y={r.y + 14} fontSize="11.5" fontWeight="600" style={{ fill: stroke }}>
        {c.label}
        {later ? ` · Week ${c.week}` : ''}
      </text>
      {c.sub && (
        <text x={textX} y={r.y + 26} fontSize="9.5" fontFamily="var(--font-mono)" style={{ fill: 'var(--color-muted)' }}>
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
  forced = false,
  selected,
  glow,
  onSelect,
}: {
  n: CloudNode;
  platform: 'azure' | 'aws';
  week: number;
  /** Drawn at full strength although their week has not come (a person the process names). */
  forced?: boolean;
  selected: boolean;
  glow: string;
  onSelect?: (id: string) => void;
}) {
  const later = !forced && n.week > week;
  const isNew = !n.external && n.week === week;
  const size = n.small ? ICON_SIZE.small : ICON_SIZE.main;
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
      data-node={n.id}
      data-glow={isNew ? 'true' : undefined}
      data-later={later ? 'true' : undefined}
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
        fontSize={n.small ? 9 : 11}
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
          fontSize="9"
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

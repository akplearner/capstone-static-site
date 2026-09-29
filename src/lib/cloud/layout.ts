import type { CloudContainer, CloudNode, CloudTopology } from './model';

/**
 * R94 — the picture fits what it shows.
 *
 * Node positions are authored once for the full twelve-week environment, so
 * a Week-1 view drawn on the same canvas is mostly empty boxes. Two rules
 * make it compact without a second layout:
 *
 *   1. A container shrink-wraps its visible members (nodes inside its
 *      authored rectangle, and child containers), plus a header and padding.
 *      Membership is geometric, so the authored rectangle only has to be
 *      big enough to hold what belongs in it.
 *   2. The viewBox crops to what is drawn, so an early week zooms in and the
 *      icons and labels get bigger on screen, not smaller.
 *
 * Pure functions on plain data, so the renderer stays thin and the rules
 * can be tested week by week.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const ICON_SIZE = { main: 44, small: 26 } as const;

/** The space a node takes: its icon, its glow ring, and the label(s) under it. */
export function nodeExtent(n: CloudNode): Rect {
  const size = n.small ? ICON_SIZE.small : ICON_SIZE.main;
  const labelW = Math.max(n.label.length * (n.small ? 5.2 : 6.2), n.name && !n.small ? n.name.length * 5.4 : 0);
  const w = Math.max(size + 12, labelW + 6);
  const below = n.small ? 16 : n.name ? 32 : 20;
  return { x: n.x - w / 2, y: n.y - size / 2 - 7, w, h: size + 7 + below };
}

const union = (a: Rect | null, b: Rect): Rect => {
  if (!a) return { ...b };
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
};

const inside = (r: Rect, x: number, y: number) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;

/** The container's own header: icon + two text lines. Members start under it. */
const HEADER = 32;
const PAD = 12;

/** The authored rectangle a node or child box sits in, innermost first. */
export function parentOf(topology: CloudTopology, x: number, y: number, exclude?: string): CloudContainer | undefined {
  return topology.containers
    .filter((c) => c.id !== exclude && inside(c, x, y))
    .sort((a, b) => a.w * a.h - b.w * b.h)[0];
}

export interface Layout {
  /** Computed rectangle per drawn container. Containers with nothing visible are absent. */
  boxes: Map<string, Rect>;
  /** The crop: what to put in the SVG viewBox. */
  view: Rect;
}

/**
 * Lay the picture out for one view: `visible` is the set of node ids drawn.
 * `extra` points (edge waypoints, faded later nodes) widen the crop only.
 */
export function layoutTopology(topology: CloudTopology, visible: Set<string>, extra: { x: number; y: number }[] = []): Layout {
  const nodes = topology.nodes.filter((n) => visible.has(n.id));
  // Innermost containers first, so a parent can union its children's computed boxes.
  const order = [...topology.containers].sort((a, b) => a.w * a.h - b.w * b.h);
  const boxes = new Map<string, Rect>();
  const parentBox = (c: CloudContainer) => parentOf(topology, c.x + 1, c.y + 1, c.id);

  for (const c of order) {
    let r: Rect | null = null;
    for (const n of nodes) {
      if (n.external) continue;
      const p = parentOf(topology, n.x, n.y);
      if (p?.id === c.id) r = union(r, nodeExtent(n));
    }
    for (const [id, child] of boxes) {
      const cc = topology.containers.find((x) => x.id === id)!;
      if (parentBox(cc)?.id === c.id) r = union(r, child);
    }
    if (!r) continue;
    const minW = Math.max(c.label.length * 7.2, (c.sub?.length ?? 0) * 5.9) + 42;
    // A box may spill past its authored rectangle (a wide label near the edge);
    // nesting still holds because a parent unions its children's computed boxes.
    // When the header needs more width than the members, grow towards the
    // authored rectangle's inside rather than off its right edge.
    const w = Math.max(r.w + PAD * 2, minW);
    const surplus = w - (r.w + PAD * 2);
    const x = r.x - PAD - Math.min(surplus, Math.max(0, r.x - PAD - c.x));
    boxes.set(c.id, { x, y: r.y - HEADER, w, h: r.h + HEADER + PAD });
  }

  let view: Rect | null = null;
  for (const n of nodes) view = union(view, nodeExtent(n));
  for (const b of boxes.values()) view = union(view, b);
  for (const p of extra) view = union(view, { x: p.x - 4, y: p.y - 4, w: 8, h: 8 });
  const v = view ?? { x: 0, y: 0, w: topology.width, h: topology.height };
  // Breathing room, then a floor on the width so one lonely box is not blown up.
  let x = v.x - 10;
  const y = v.y - 10;
  let w = v.w + 20;
  const h = v.h + 20;
  const MIN_W = 700;
  if (w < MIN_W) {
    x -= (MIN_W - w) / 2;
    w = MIN_W;
  }
  // The crop may reach past the canvas: nothing is drawn there, and clipping a
  // box's border to keep inside an arbitrary rectangle would be worse.
  return { boxes, view: { x, y, w, h } };
}

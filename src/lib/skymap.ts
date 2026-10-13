import type { ProfileRow } from './skillProfile';
import type { SkillLevel } from './docs/skillsCopy';

/**
 * R108 — the competency map's layout: one constellation per competency area
 * the role practises, one star per competency row, edges between rows that
 * share a task. Pure and deterministic: the same rows give the same picture,
 * the angle a star takes on its ring comes from a hash of its id, never from
 * a random number, and no star lands within `MIN_DISTANCE` of another. The
 * scene (`src/components/quarry/skymap/`) draws it; the lighting order is
 * the course order of each row's first task.
 */

export interface SkyStar {
  id: string;
  label: string;
  level: SkillLevel;
  area: string;
  x: number;
  y: number;
  next?: ProfileRow['next'];
  /** The index of the row's first task in the course order; the draw-in order. */
  order: number;
}

export interface SkyEdge {
  a: string;
  b: string;
}

export interface SkyConstellation {
  area: string;
  label: string;
  cx: number;
  cy: number;
  stars: SkyStar[];
}

export interface SkyMapLayout {
  view: { w: number; h: number };
  constellations: SkyConstellation[];
  edges: SkyEdge[];
}

export const VIEW = { w: 960, h: 540 } as const;
export const MIN_DISTANCE = 28;
const MARGIN = 36;

/** FNV-1a over a string: a stable angle offset per constellation and per star. */
export function fnv(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const areaOf = (id: string) => id.split('.')[1] ?? 'other';
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function skymapLayout(rows: ProfileRow[], areas: Record<string, string>, taskOrder: string[]): SkyMapLayout {
  if (rows.length === 0) return { view: { ...VIEW }, constellations: [], edges: [] };
  const index = new Map(taskOrder.map((id, i) => [id, i]));
  const orderOf = (r: ProfileRow) => Math.min(taskOrder.length, ...r.tasks.map((t) => index.get(t) ?? taskOrder.length));

  // Group by area; constellations in the order the course first reaches them.
  const groups = new Map<string, ProfileRow[]>();
  for (const r of rows) {
    const a = areaOf(r.id);
    groups.set(a, [...(groups.get(a) ?? []), r]);
  }
  const ordered = [...groups.entries()].sort((p, q) => {
    const op = Math.min(...p[1].map(orderOf));
    const oq = Math.min(...q[1].map(orderOf));
    return op - oq || p[0].localeCompare(q[0]);
  });

  const n = ordered.length;
  const cols = Math.ceil(Math.sqrt(n));
  const gridRows = Math.ceil(n / cols);
  const cellW = (VIEW.w - 2 * MARGIN) / cols;
  const cellH = (VIEW.h - 2 * MARGIN) / gridRows;

  const constellations: SkyConstellation[] = ordered.map(([area, list], i) => {
    const cx = MARGIN + cellW * (i % cols) + cellW / 2;
    const cy = MARGIN + cellH * Math.floor(i / cols) + cellH / 2;
    const count = list.length;
    const radius = count === 1 ? 0 : Math.min(cellW, cellH) * (0.22 + 0.16 * Math.min(1, count / 8));
    const offset = (fnv(area) % 360) * (Math.PI / 180);
    const sorted = [...list].sort((p, q) => orderOf(p) - orderOf(q) || p.id.localeCompare(q.id));
    const stars: SkyStar[] = sorted.map((r, k) => {
      const angle = offset + (2 * Math.PI * k) / count;
      const wobble = ((fnv(r.id) % 1000) / 1000 - 0.5) * 0.18 * radius;
      return {
        id: r.id,
        label: r.label,
        level: r.level,
        area,
        x: cx + Math.cos(angle) * (radius + wobble),
        y: cy + Math.sin(angle) * (radius + wobble),
        ...(r.next ? { next: r.next } : {}),
        order: orderOf(r),
      };
    });
    return { area, label: areas[area] ?? area, cx, cy, stars };
  });

  // Keep every star a readable distance from every other, inside its cell.
  const all = constellations.flatMap((c) => c.stars.map((s) => ({ s, c })));
  for (let pass = 0; pass < 12; pass++) {
    let moved = false;
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i].s;
        const b = all[j].s;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d >= MIN_DISTANCE) continue;
        const push = (MIN_DISTANCE - (d || 0.001)) / 2 + 0.5;
        const ux = d > 0 ? dx / d : 1;
        const uy = d > 0 ? dy / d : 0;
        a.x -= ux * push;
        a.y -= uy * push;
        b.x += ux * push;
        b.y += uy * push;
        moved = true;
      }
    }
    for (const { s, c } of all) {
      s.x = clamp(s.x, c.cx - cellW / 2 + 8, c.cx + cellW / 2 - 8);
      s.y = clamp(s.y, c.cy - cellH / 2 + 8, c.cy + cellH / 2 - 8);
    }
    if (!moved) break;
  }
  for (const { s } of all) {
    s.x = Math.round(s.x * 10) / 10;
    s.y = Math.round(s.y * 10) / 10;
  }

  // Edges: rows that share a task, each pair once.
  const byTask = new Map<string, string[]>();
  for (const r of rows) for (const t of r.tasks) byTask.set(t, [...(byTask.get(t) ?? []), r.id]);
  const seen = new Set<string>();
  const edges: SkyEdge[] = [];
  for (const ids of byTask.values()) {
    const sorted = [...ids].sort();
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const k = `${sorted[i]}|${sorted[j]}`;
        if (seen.has(k)) continue;
        seen.add(k);
        edges.push({ a: sorted[i], b: sorted[j] });
      }
    }
  }

  return { view: { ...VIEW }, constellations, edges };
}

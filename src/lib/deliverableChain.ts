import { Course, Role } from './types';
import { DeliverableData, DeliverableDef } from './docs/types';
import { deliverablesForCourse } from './docs/definitions';

/**
 * The deliverable chain — who produces what, and where it goes next.
 *
 * A capstone is a relay: the Analyst's baseline is what makes the Hunter's
 * "weird" mean anything, and the Hunter's timeline is what the Responder writes
 * the report from. That relay was real in the content but invisible in the app —
 * it existed only as English in each deliverable's `source` / `useIt` prose,
 * which reads well and no code can follow. `DeliverableDef.feeds` makes the same
 * edges machine-readable so they can be drawn.
 *
 * Everything here is pure: the layout is computed, not measured, so it can be
 * unit-tested. (vitest collects `*.test.ts` only, so logic that lives in a
 * component is logic that never gets tested.)
 */

export interface ChainNode {
  id: string;
  /** '05_IOC_Database.csv' — what the student actually saves. */
  file: string;
  title: string;
  /** Short label for the diagram; the full title is the tooltip. */
  short: string;
  owner: Role;
  /** The week it's due — the earliest week the deliverable is worked in. */
  week: number;
  /** Row index: which role lane it sits in. */
  lane: number;
  /** Column index: which week column it sits in. */
  column: number;
  /** The team has actually filled this in. */
  filed: boolean;
  /** This is the course's final, defended artefact. */
  capstone: boolean;
}

export interface ChainEdge {
  from: string;
  to: string;
  /** True when both ends belong to the same role — no handoff, just carry-over.
   *  Drawn differently because "I use my own earlier work" is not a handoff and
   *  shouldn't look like one. */
  sameRole: boolean;
}

export interface DeliverableChain {
  nodes: ChainNode[];
  edges: ChainEdge[];
  /** Role ids in lane order, top to bottom. */
  lanes: Role[];
  /** Week numbers in column order, left to right. */
  columns: number[];
}

/**
 * Has this deliverable actually been filled in?
 *
 * A saved-but-empty shell is what you get from merely opening a form, so an
 * entry existing is not evidence of work. Requires at least one non-blank field
 * or one group row.
 */
export function isDeliverableFiled(data: DeliverableData | undefined): boolean {
  if (!data) return false;
  const hasField = Object.values(data.fields ?? {}).some(
    (v) => typeof v === 'string' && v.trim() !== ''
  );
  if (hasField) return true;
  return Object.values(data.groups ?? {}).some(
    (rows) =>
      Array.isArray(rows) &&
      rows.some((row) => Object.values(row ?? {}).some((v) => String(v ?? '').trim() !== ''))
  );
}

/** The course's capstone deliverable, if one is flagged. */
export function capstoneDeliverable(courseId: string): DeliverableDef | undefined {
  return deliverablesForCourse(courseId).find((d) => d.capstone);
}

/** Has the team filed the course's capstone? Drives the stone's final stage. */
export function isCapstoneFiled(
  courseId: string,
  saved: Record<string, DeliverableData> | null | undefined
): boolean {
  const def = capstoneDeliverable(courseId);
  if (!def || !saved) return false;
  return isDeliverableFiled(saved[def.id]);
}

/** Drop the leading number and extension: '05_IOC_Database.csv' → 'IOC Database'. */
function shortLabel(def: DeliverableDef): string {
  return def.file
    .replace(/^\d+[_-]/, '')
    .replace(/\.(md|csv)$/i, '')
    .replace(/_/g, ' ');
}

/**
 * Build the chain for a course.
 *
 * Nodes are placed at (role lane × week column). Edges come from `feeds`, and
 * any edge pointing at an id that isn't in this course is **dropped rather than
 * drawn broken** — a diagram that silently invents a node is worse than one
 * that omits an edge, and `content-integrity.test.ts` fails the build on an
 * unresolvable id so this path should never fire in practice.
 */
export function buildDeliverableChain(
  course: Course,
  saved?: Record<string, DeliverableData> | null
): DeliverableChain {
  const defs = deliverablesForCourse(course.id);
  const lanes = course.roles.map((r) => r.id);

  // Columns are the weeks that actually carry a deliverable, in order — an
  // empty week would otherwise leave a gap the reader has to explain away.
  const columns = Array.from(
    new Set(defs.map((d) => Math.min(...d.weeks)).filter((n) => Number.isFinite(n)))
  ).sort((a, b) => a - b);

  const nodes: ChainNode[] = defs.map((d) => {
    const week = Math.min(...d.weeks);
    const lane = lanes.indexOf(d.owner);
    return {
      id: d.id,
      file: d.file,
      title: d.title,
      short: shortLabel(d),
      owner: d.owner,
      week,
      // A deliverable owned by a role the course doesn't define would otherwise
      // land at lane -1 and render off the top of the diagram.
      lane: lane >= 0 ? lane : lanes.length,
      column: Math.max(0, columns.indexOf(week)),
      filed: isDeliverableFiled(saved?.[d.id]),
      capstone: !!d.capstone,
    };
  });

  const known = new Map(nodes.map((n) => [n.id, n]));
  const edges: ChainEdge[] = [];
  const seen = new Set<string>();
  for (const d of defs) {
    for (const target of d.feeds ?? []) {
      const to = known.get(target);
      const from = known.get(d.id);
      if (!to || !from || to.id === from.id) continue;
      const key = `${from.id}->${to.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: from.id, to: to.id, sameRole: from.owner === to.owner });
    }
  }

  return { nodes, edges, lanes, columns };
}

/**
 * Ids reachable from a node by following `feeds`, excluding itself.
 *
 * Iterative with a visited set so a cyclic `feeds` graph (two documents that
 * each claim to feed the other) terminates instead of hanging the render.
 */
export function downstreamOf(chain: DeliverableChain, id: string): string[] {
  const out = new Set<string>();
  const queue = [id];
  while (queue.length) {
    const current = queue.shift() as string;
    for (const e of chain.edges) {
      if (e.from === current && !out.has(e.to)) {
        out.add(e.to);
        queue.push(e.to);
      }
    }
  }
  out.delete(id);
  return [...out];
}

/**
 * A plain-language reading of the chain, one line per edge.
 *
 * This is not a fallback nobody sees — it is the accessible equivalent of the
 * SVG, rendered alongside it. An arrow drawn between two boxes conveys nothing
 * to a screen reader, and this is the same information as a sentence.
 */
export function describeChain(chain: DeliverableChain, roleName: (id: Role) => string): string[] {
  const byId = new Map(chain.nodes.map((n) => [n.id, n]));
  return chain.edges.flatMap((e) => {
    const from = byId.get(e.from);
    const to = byId.get(e.to);
    if (!from || !to) return [];
    return e.sameRole
      ? [`${roleName(from.owner)} carries ${from.short} forward into ${to.short}.`]
      : [
          `${roleName(from.owner)} hands ${from.short} to ${roleName(to.owner)} for ${to.short}.`,
        ];
  });
}

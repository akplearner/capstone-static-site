import type { Role, RoleDef } from '../types';
import type { DeliverableDef } from './types';

/**
 * R104 — the roles, read off the documents.
 *
 * The overview used to explain the roles in prose: a mission card per role,
 * a radial picture with lines to a hub that carried no information, and a
 * paragraph about what the team owes. The RACI on every document and the
 * `feeds` chain already say all of it: what each role drafts, reviews and
 * approves, and how many documents cross from one role to another. This
 * module derives the table and the flow from that data, so the overview is
 * as short as the data and never drifts from it. Pure, unit-tested.
 */

export type RoleFlowKind = 'review' | 'approve' | 'feeds';

export interface RoleRow {
  role: RoleDef;
  /** Deliverable ids this role drafts (its `owner`). */
  drafts: string[];
  /** Deliverable ids this role reviews. */
  reviews: string[];
  /** Deliverable ids this role approves, where approving is not reviewing. */
  approves: string[];
  /** Roles that review or approve this role's drafts, in role order. */
  handsTo: Role[];
  /** Roles whose drafts this role reviews or approves, in role order. */
  waitsOn: Role[];
}

export interface RoleFlowEdge {
  from: Role;
  to: Role;
  kind: RoleFlowKind;
  /** The documents that make this edge; its weight is their count. */
  ids: string[];
}

export interface RoleFlow {
  rows: RoleRow[];
  /** One edge per (from, to, kind) with at least one document; never a self edge. */
  edges: RoleFlowEdge[];
}

/** Count per (from, to) across kinds — the arrow weight. */
export interface RoleFlowPair {
  from: Role;
  to: Role;
  review: number;
  approve: number;
  feeds: number;
  total: number;
}

const KIND_ORDER: RoleFlowKind[] = ['review', 'approve', 'feeds'];

export function roleFlow(roles: RoleDef[], defs: DeliverableDef[]): RoleFlow {
  const ids = new Set(roles.map((r) => r.id));
  const owner = new Map(defs.map((d) => [d.id, d.owner]));
  const edgeMap = new Map<string, RoleFlowEdge>();
  const add = (from: Role, to: Role, kind: RoleFlowKind, id: string) => {
    if (from === to || !ids.has(from) || !ids.has(to)) return;
    const key = `${from}>${to}>${kind}`;
    const e = edgeMap.get(key) ?? { from, to, kind, ids: [] };
    if (!e.ids.includes(id)) e.ids.push(id);
    edgeMap.set(key, e);
  };

  for (const d of defs) {
    if (d.raci) {
      add(d.raci.drafts, d.raci.reviews, 'review', d.id);
      if (d.raci.approves !== d.raci.reviews) add(d.raci.reviews, d.raci.approves, 'approve', d.id);
    }
    for (const target of d.feeds ?? []) {
      const to = owner.get(target);
      if (to) add(d.owner, to, 'feeds', d.id);
    }
  }

  const order = (a: RoleFlowEdge, b: RoleFlowEdge) => {
    const ra = roles.findIndex((r) => r.id === a.from) - roles.findIndex((r) => r.id === b.from);
    if (ra) return ra;
    const rb = roles.findIndex((r) => r.id === a.to) - roles.findIndex((r) => r.id === b.to);
    if (rb) return rb;
    return KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);
  };
  const edges = [...edgeMap.values()].sort(order);

  const rows: RoleRow[] = roles.map((role) => {
    const drafts = defs.filter((d) => d.owner === role.id).map((d) => d.id);
    const reviews = defs.filter((d) => d.raci?.reviews === role.id).map((d) => d.id);
    const approves = defs.filter((d) => d.raci && d.raci.approves === role.id && d.raci.approves !== d.raci.reviews).map((d) => d.id);
    const mine = defs.filter((d) => d.owner === role.id && d.raci);
    const theirs = defs.filter((d) => d.raci && (d.raci.reviews === role.id || d.raci.approves === role.id) && d.owner !== role.id);
    const handsTo = roles.map((r) => r.id).filter((r) => r !== role.id && mine.some((d) => d.raci!.reviews === r || d.raci!.approves === r));
    const waitsOn = roles.map((r) => r.id).filter((r) => r !== role.id && theirs.some((d) => d.owner === r));
    return { role, drafts, reviews, approves, handsTo, waitsOn };
  });

  return { rows, edges };
}

/** The directed pairs with any document crossing, weighted — what the picture draws. */
export function roleFlowPairs(flow: RoleFlow): RoleFlowPair[] {
  const out = new Map<string, RoleFlowPair>();
  for (const e of flow.edges) {
    const key = `${e.from}>${e.to}`;
    const p = out.get(key) ?? { from: e.from, to: e.to, review: 0, approve: 0, feeds: 0, total: 0 };
    p[e.kind] += e.ids.length;
    p.total += e.ids.length;
    out.set(key, p);
  }
  return [...out.values()];
}

/**
 * The accessible reading of the flow, one sentence per directed pair — the
 * same information as the arrows, for a screen reader and for the test.
 */
export function describeRoleFlow(flow: RoleFlow, roleName: (id: Role) => string): string[] {
  return roleFlowPairs(flow).map((p) => {
    const parts = [p.review && `reviews ${p.review}`, p.approve && `approves ${p.approve}`, p.feeds && `is fed by ${p.feeds}`].filter(Boolean);
    return `${roleName(p.to)} ${parts.join(', ')} of ${roleName(p.from)}'s documents.`;
  });
}

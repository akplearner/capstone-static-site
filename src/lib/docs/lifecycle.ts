/**
 * R103 — the deliverable lifecycle, as pure rules.
 *
 * A form is a document in an organisation: one role drafts it, another
 * reviews it, a third approves it, and then it is issued to whoever consumes
 * it. The platform used to know only an owner and an instructor's verdict;
 * this module is the state machine the team itself works through —
 * draft → in review → approved → issued, with a return path — and the rules
 * for who may move it. Every transition is an append-only row
 * (`DeliverableStatus`); the current state is the latest row per form.
 *
 * Nothing here touches storage or the DOM: the repositories keep the rows,
 * the StatusStrip draws them, and this file decides what is allowed.
 */
import type { Role } from '../types';
import type { DeliverableDef, Raci } from './types';

export type DocStatus = 'draft' | 'in_review' | 'approved' | 'issued';
export type LifecycleAction = 'submit' | 'approve' | 'return' | 'issue' | 'reopen';

export interface DeliverableStatus {
  courseId: string;
  teamId: string;
  deliverableId: string;
  status: DocStatus;
  /** The member who made the transition. */
  changedBy: string;
  role: Role;
  at: number;
  /** A returned form always carries the reviewer's reason. */
  note?: string;
  /** The frozen submission's version this state refers to (0 = none yet). */
  version: number;
}

export const STATUS_ORDER: DocStatus[] = ['draft', 'in_review', 'approved', 'issued'];
export const STATUS_LABEL: Record<DocStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  approved: 'Approved',
  issued: 'Issued',
};
export const ACTION_LABEL: Record<LifecycleAction, string> = {
  submit: 'Submit for review',
  approve: 'Approve',
  return: 'Return for changes',
  issue: 'Issue',
  reopen: 'Reopen',
};
const NEXT: Record<LifecycleAction, DocStatus> = {
  submit: 'in_review',
  approve: 'approved',
  return: 'draft',
  issue: 'issued',
  reopen: 'draft',
};

export interface Actor {
  memberId: string;
  role: Role;
}

/** The latest transition of a form, or none. */
export function latestStatus(rows: DeliverableStatus[], deliverableId: string): DeliverableStatus | undefined {
  let best: DeliverableStatus | undefined;
  for (const r of rows) if (r.deliverableId === deliverableId && (!best || r.at >= best.at)) best = r;
  return best;
}

export function statusOf(rows: DeliverableStatus[], deliverableId: string): DocStatus {
  return latestStatus(rows, deliverableId)?.status ?? 'draft';
}

/** Who sent the form into review last — the person a reviewer must not be. */
export function submitterOf(rows: DeliverableStatus[], deliverableId: string): string | undefined {
  let best: DeliverableStatus | undefined;
  for (const r of rows) if (r.deliverableId === deliverableId && r.status === 'in_review' && (!best || r.at >= best.at)) best = r;
  return best?.changedBy;
}

/**
 * What this member may do to this form now.
 *
 * - submit: the drafting role, from draft, once the definition of done due by
 *   this week passes;
 * - approve / return: the reviewing role, from in review — and not the person
 *   who submitted it when another member holds that role;
 * - issue: the approving role, from approved;
 * - reopen: the drafting role, from approved or issued.
 */
export function allowedActions(
  def: Pick<DeliverableDef, 'id' | 'raci'>,
  rows: DeliverableStatus[],
  actor: Actor,
  team: Actor[],
  dodOk: boolean
): LifecycleAction[] {
  const raci = def.raci;
  if (!raci) return [];
  const current = statusOf(rows, def.id);
  const out: LifecycleAction[] = [];
  if (current === 'draft' && actor.role === raci.drafts && dodOk) out.push('submit');
  if (current === 'in_review' && actor.role === raci.reviews) {
    const submitter = submitterOf(rows, def.id);
    const otherReviewer = team.some((m) => m.role === raci.reviews && m.memberId !== actor.memberId);
    if (!(submitter === actor.memberId && otherReviewer)) out.push('approve', 'return');
  }
  if (current === 'approved' && actor.role === raci.approves) out.push('issue');
  if ((current === 'approved' || current === 'issued') && actor.role === raci.drafts) out.push('reopen');
  return out;
}

/** The row an allowed action produces. Throws on anything the rules refuse. */
export function transition(
  def: Pick<DeliverableDef, 'id' | 'raci' | 'courseId'>,
  rows: DeliverableStatus[],
  action: LifecycleAction,
  actor: Actor,
  opts: { teamId: string; courseId: string; dodOk?: boolean; note?: string; version?: number; at?: number; team?: Actor[] }
): DeliverableStatus {
  const allowed = allowedActions(def, rows, actor, opts.team ?? [], opts.dodOk ?? true);
  if (!allowed.includes(action)) throw new Error(`${action} is not allowed on ${def.id} for ${actor.role} (now ${statusOf(rows, def.id)})`);
  if (action === 'return' && !opts.note?.trim()) throw new Error('a returned form needs a reason');
  return {
    courseId: opts.courseId,
    teamId: opts.teamId,
    deliverableId: def.id,
    status: NEXT[action],
    changedBy: actor.memberId,
    role: actor.role,
    at: opts.at ?? Date.now(),
    note: opts.note?.trim() || undefined,
    version: opts.version ?? latestStatus(rows, def.id)?.version ?? 0,
  };
}

export interface WaitingOn {
  id: string;
  title: string;
  status: DocStatus;
  /** The role that drafts the upstream form. */
  role: Role;
}

/** The forms this one is built from that are not yet approved or issued. */
export function waitingOn(defs: DeliverableDef[], rows: DeliverableStatus[], def: Pick<DeliverableDef, 'id'>): WaitingOn[] {
  return defs
    .filter((u) => u.feeds?.includes(def.id))
    .map((u) => ({ id: u.id, title: u.title, status: statusOf(rows, u.id), role: u.raci?.drafts ?? u.owner }))
    .filter((w) => w.status !== 'approved' && w.status !== 'issued');
}

/** The RACI line a form header prints. */
export function raciLine(raci: Raci | undefined, name: (role: Role) => string): string {
  if (!raci) return '';
  const parts = [`Drafts: ${name(raci.drafts)}`, `Reviews: ${name(raci.reviews)}`, `Approves: ${name(raci.approves)}`];
  if (raci.informed?.length) parts.push(`Informed: ${raci.informed.map(name).join(', ')}`);
  return parts.join(' · ');
}

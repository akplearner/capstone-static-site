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
/**
 * R118 — the instructor's verdict on a form, in words that cannot be mistaken
 * for the team's own lifecycle above (Draft, In review, Approved, Issued). The
 * form's banner said "Under review" and the cohort table "In review" for the
 * same verdict, and "Approved" named both; the instructor is named every time.
 */
export const REVIEW_VERDICT_LABEL = {
  approved: { head: 'Instructor approved this', short: 'Instructor: approved' },
  revise: { head: 'Instructor asks for changes', short: 'Instructor: revise' },
  pending: { head: 'Instructor is reviewing', short: 'Instructor: reviewing' },
} as const;
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

/**
 * R117 — an empty role never strands a document.
 *
 * A step belongs to a role (the drafting, reviewing or approving role of the
 * form's RACI), but a team can be smaller than the role list, or a member can
 * leave. A role is VACANT when the team has members and none holds it; then
 * any member may do its step, and the history says so ("Covering for …"). The
 * rule is about the team the app is handed: an empty `team` means unknown, so
 * a caller that forgets it never opens everything.
 */
export function isVacant(team: readonly Actor[], role: Role): boolean {
  return team.length > 0 && !team.some((m) => m.role === role);
}

/** May `actor` do the step this role is named for: the role's holder, or anyone while the role is vacant. */
function mayAct(actor: Actor, role: Role, team: readonly Actor[]): boolean {
  return actor.role === role || isVacant(team, role);
}

/** The RACI role a step belongs to. */
export function roleForAction(raci: Raci, action: LifecycleAction): Role {
  return action === 'submit' || action === 'reopen' ? raci.drafts : action === 'approve' || action === 'return' ? raci.reviews : raci.approves;
}

/** A covering transition's note starts with this, then the covered role's id and a full stop. */
export const COVER_PREFIX = 'Covering for ';

/** The role a covering member did the step for, or null when the row is an ordinary one. */
export function coverOf(note: string | undefined): Role | null {
  if (!note || !note.startsWith(COVER_PREFIX)) return null;
  const m = /^([^\s.]+)\./.exec(note.slice(COVER_PREFIX.length));
  return m ? m[1] : null;
}

/** A note as a person reads it: the cover marker named by role, then the member's own words. */
export function noteText(note: string | undefined, roleName: (role: Role) => string): string {
  if (!note) return '';
  const covered = coverOf(note);
  if (!covered) return note;
  const rest = note.slice(COVER_PREFIX.length + covered.length + 1).trim();
  return `${COVER_PREFIX}${roleName(covered)}.${rest ? ` ${rest}` : ''}`;
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
 *   who submitted it when another member could do it;
 * - issue: the approving role, from approved;
 * - reopen: the drafting role, from approved or issued.
 *
 * R117: where no one on the team holds a step's role, any member may do it
 * (`isVacant`), and the transition records that it was cover.
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
  if (current === 'draft' && mayAct(actor, raci.drafts, team) && dodOk) out.push('submit');
  if (current === 'in_review' && mayAct(actor, raci.reviews, team)) {
    const submitter = submitterOf(rows, def.id);
    const otherReviewer = team.some((m) => m.memberId !== actor.memberId && mayAct(m, raci.reviews, team));
    if (!(submitter === actor.memberId && otherReviewer)) out.push('approve', 'return');
  }
  if (current === 'approved' && mayAct(actor, raci.approves, team)) out.push('issue');
  if ((current === 'approved' || current === 'issued') && mayAct(actor, raci.drafts, team)) out.push('reopen');
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
  // Allowed by someone who does not hold the step's role: that is cover, and it is written down.
  const stepRole = def.raci ? roleForAction(def.raci, action) : actor.role;
  const own = opts.note?.trim() ?? '';
  const note = actor.role === stepRole ? own : `${COVER_PREFIX}${stepRole}.${own ? ` ${own}` : ''}`;
  return {
    courseId: opts.courseId,
    teamId: opts.teamId,
    deliverableId: def.id,
    status: NEXT[action],
    changedBy: actor.memberId,
    role: actor.role,
    at: opts.at ?? Date.now(),
    note: note || undefined,
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

import { describe, it, expect } from 'vitest';
import { COVER_PREFIX, allowedActions, coverOf, isVacant, latestStatus, noteText, roleForAction, statusOf, transition, waitingOn, type DeliverableStatus } from './lifecycle';
import type { DeliverableDef } from './types';

/**
 * R103 — the lifecycle rules, action by action: who may move a form, from
 * which state, and what a reviewer may not do to their own submission.
 */
const def = { id: 'pentest_report', courseId: 'security-plus', raci: { drafts: 'red', reviews: 'blue', approves: 'grc' } } as Pick<DeliverableDef, 'id' | 'courseId' | 'raci'>;
const red = { memberId: 'm-red', role: 'red' };
const blue = { memberId: 'm-blue', role: 'blue' };
const blue2 = { memberId: 'm-blue-2', role: 'blue' };
const grc = { memberId: 'm-grc', role: 'grc' };
const team = [red, blue, blue2, grc];
const opts = { teamId: 't1', courseId: 'security-plus', team };
const row = (status: DeliverableStatus['status'], by = red, at = 1, version = 1): DeliverableStatus => ({
  courseId: 'security-plus', teamId: 't1', deliverableId: def.id, status, changedBy: by.memberId, role: by.role, at, version,
});

describe('R103 — the deliverable lifecycle', () => {
  it('a form with no RACI has no lifecycle', () => {
    expect(allowedActions({ id: 'x' }, [], red, team, true)).toEqual([]);
  });

  it('only the drafting role submits, and only once the definition of done passes', () => {
    expect(allowedActions(def, [], red, team, false)).toEqual([]);
    expect(allowedActions(def, [], red, team, true)).toEqual(['submit']);
    expect(allowedActions(def, [], blue, team, true)).toEqual([]);
    expect(allowedActions(def, [], grc, team, true)).toEqual([]);
  });

  it('the reviewing role approves or returns an in-review form; the approving role issues an approved one', () => {
    const inReview = [row('in_review')];
    expect(allowedActions(def, inReview, blue, team, true)).toEqual(['approve', 'return']);
    expect(allowedActions(def, inReview, red, team, true)).toEqual([]);
    expect(allowedActions(def, inReview, grc, team, true)).toEqual([]);
    const approved = [row('in_review', red, 1), row('approved', blue, 2)];
    expect(allowedActions(def, approved, grc, team, true)).toEqual(['issue']);
    expect(allowedActions(def, approved, red, team, true)).toEqual(['reopen']);
    expect(allowedActions(def, approved, blue, team, true)).toEqual([]);
  });

  it('a reviewer never approves their own submission while another reviewer exists', () => {
    const selfDef = { ...def, raci: { drafts: 'blue', reviews: 'blue', approves: 'grc' } };
    const mine = [row('in_review', blue)];
    expect(allowedActions(selfDef, mine, blue, team, true)).toEqual([]);
    expect(allowedActions(selfDef, mine, blue2, team, true)).toEqual(['approve', 'return']);
    // A one-person role may still move the form on — the rule is about a second pair of eyes, not a dead end.
    expect(allowedActions(selfDef, mine, blue, [blue, grc], true)).toEqual(['approve', 'return']);
  });

  it('transitions produce the next state and refuse what the rules refuse', () => {
    const submitted = transition(def, [], 'submit', red, { ...opts, version: 1, at: 10 });
    expect(submitted.status).toBe('in_review');
    expect(submitted.version).toBe(1);
    const rows = [submitted];
    expect(() => transition(def, rows, 'approve', red, opts)).toThrow(/not allowed/);
    expect(() => transition(def, rows, 'return', blue, opts)).toThrow(/reason/);
    const returned = transition(def, rows, 'return', blue, { ...opts, note: 'Scope says no RDP', at: 11 });
    expect(returned.status).toBe('draft');
    expect(returned.note).toBe('Scope says no RDP');
    expect(statusOf([...rows, returned], def.id)).toBe('draft');
    const approved = transition(def, rows, 'approve', blue, { ...opts, at: 12 });
    const issued = transition(def, [...rows, approved], 'issue', grc, { ...opts, at: 13 });
    expect(issued.status).toBe('issued');
    expect(latestStatus([...rows, approved, issued], def.id)?.status).toBe('issued');
    expect(allowedActions(def, [...rows, approved, issued], red, team, true)).toEqual(['reopen']);
  });

  it('waitingOn lists the upstream forms that are not yet approved', () => {
    const defs = [
      { id: 'scope_roe', title: 'Scope', owner: 'grc', feeds: ['pentest_report'], raci: { drafts: 'grc', reviews: 'red', approves: 'grc' } },
      { id: 'vm_sop', title: 'VM SOP', owner: 'grc', feeds: ['pentest_report'] },
      { id: 'pentest_report', title: 'Pentest', owner: 'red' },
    ] as DeliverableDef[];
    const rows: DeliverableStatus[] = [{ ...row('approved', grc), deliverableId: 'scope_roe' }];
    expect(waitingOn(defs, rows, def)).toEqual([{ id: 'vm_sop', title: 'VM SOP', status: 'draft', role: 'grc' }]);
  });
});

/**
 * R117 — an empty role never strands a document. Where no one on the team
 * holds a step's role, any member may do it, and the history says it was cover.
 */
describe('R117 — cover for an empty role', () => {
  const noBlue = [red, grc];
  const noRed = [blue, grc];
  const inReview = [row('in_review')];
  const name = (r: string) => ({ red: 'Offensive Security', blue: 'Defensive Operations', grc: 'Governance' })[r] ?? r;

  it('a role is vacant only when the team has members and none holds it; an unknown (empty) team is never vacant', () => {
    expect(isVacant(team, 'blue')).toBe(false);
    expect(isVacant(noBlue, 'blue')).toBe(true);
    expect(isVacant([], 'blue')).toBe(false);
    expect(isVacant(noBlue, 'red')).toBe(false);
  });

  it('with no reviewer on the team, another member approves or returns an in-review form', () => {
    expect(allowedActions(def, inReview, grc, noBlue, true)).toEqual(['approve', 'return']);
    // The drafter submitted it, and a second pair of eyes exists, so the drafter may not approve it.
    expect(allowedActions(def, inReview, red, noBlue, true)).toEqual([]);
  });

  it('a one-person team can still move its own form on: there is no one else to review it', () => {
    expect(allowedActions(def, [row('in_review', red)], red, [red], true)).toEqual(['approve', 'return']);
    const solo = [red];
    expect(allowedActions(def, [], red, solo, true)).toEqual(['submit']);
    expect(allowedActions(def, [row('in_review'), row('approved', red, 2)], red, solo, true)).toEqual(['issue', 'reopen']);
  });

  it('with no drafter, another member submits and reopens; with no approver, another member issues', () => {
    expect(allowedActions(def, [], blue, noRed, true)).toEqual(['submit']);
    expect(allowedActions(def, [], blue, noRed, false)).toEqual([]);
    const approved = [row('in_review', blue, 1), row('approved', blue, 2)];
    expect(allowedActions(def, approved, blue, noRed, true).sort()).toEqual(['reopen']);
    const noGrc = [red, blue];
    expect(allowedActions(def, approved, red, noGrc, true).sort()).toEqual(['issue', 'reopen']);
  });

  it('a held role is unchanged: a member who is not its holder cannot act while someone is', () => {
    expect(allowedActions(def, [], blue, team, true)).toEqual([]);
    expect(allowedActions(def, inReview, grc, team, true)).toEqual([]);
    expect(allowedActions(def, [row('in_review'), row('approved', blue, 2)], red, team, true)).toEqual(['reopen']);
  });

  it('a covering transition says so in its note, keeps the actor’s own role, and an ordinary one carries no marker', () => {
    const covered = transition(def, inReview, 'approve', grc, { ...opts, team: noBlue, at: 5 });
    expect(covered.role).toBe('grc');
    expect(covered.note).toBe(`${COVER_PREFIX}blue.`);
    expect(coverOf(covered.note)).toBe('blue');
    const returned = transition(def, inReview, 'return', grc, { ...opts, team: noBlue, note: 'Scope says no RDP', at: 6 });
    expect(returned.note).toBe('Covering for blue. Scope says no RDP');
    expect(coverOf(returned.note)).toBe('blue');
    const own = transition(def, inReview, 'approve', blue, { ...opts, at: 7 });
    expect(own.note).toBeUndefined();
    expect(coverOf(own.note)).toBeNull();
    expect(coverOf('Covering for')).toBeNull();
    expect(coverOf(undefined)).toBeNull();
  });

  it('a covering member still has to say why when returning, and the rules still refuse what they refuse', () => {
    expect(() => transition(def, inReview, 'return', grc, { ...opts, team: noBlue })).toThrow(/reason/);
    expect(() => transition(def, [row('in_review'), row('approved', blue, 2)], 'issue', red, { ...opts, team })).toThrow(/not allowed/);
    expect(() => transition(def, inReview, 'approve', red, { ...opts, team: noBlue })).toThrow(/not allowed/);
  });

  it('notes read as a person would say them, with the role named', () => {
    expect(noteText('Covering for blue.', name)).toBe('Covering for Defensive Operations.');
    expect(noteText('Covering for blue. Scope says no RDP', name)).toBe('Covering for Defensive Operations. Scope says no RDP');
    expect(noteText('Scope says no RDP', name)).toBe('Scope says no RDP');
    expect(noteText(undefined, name)).toBe('');
  });

  it('each action belongs to one RACI role', () => {
    const raci = { drafts: 'red', reviews: 'blue', approves: 'grc' };
    expect(['submit', 'reopen'].map((a) => roleForAction(raci, a as 'submit' | 'reopen'))).toEqual(['red', 'red']);
    expect(['approve', 'return'].map((a) => roleForAction(raci, a as 'approve' | 'return'))).toEqual(['blue', 'blue']);
    expect(roleForAction(raci, 'issue')).toBe('grc');
  });
});

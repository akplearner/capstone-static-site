import { describe, it, expect } from 'vitest';
import { allowedActions, latestStatus, statusOf, transition, waitingOn, type DeliverableStatus } from './lifecycle';
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

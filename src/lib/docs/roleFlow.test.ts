import { describe, it, expect } from 'vitest';
import { describeRoleFlow, roleFlow, roleFlowPairs } from './roleFlow';
import { deliverablesForCourse } from './definitions';
import { SECURITY_PLUS } from '../data/seed/securityPlus';
import { CYSA_PLUS } from '../data/seed/cysa';
import { MSSP } from '../data/seed/mssp';
import { SERVER_PLUS } from '../data/seed/serverPlus';
import { CCNA } from '../data/seed/ccna';
import { SECAI_PLUS } from '../data/seed/secaiPlus';
import { CISSP } from '../data/seed/cissp';
import { AZURE_COURSES } from '../data/seed/azureCloud';
import { AWS_COURSES } from '../data/seed/awsCloud';
import type { DeliverableDef } from './types';
import type { RoleDef } from '../types';

/**
 * R104 — the role table and the hand-off flow are derived from the RACI and
 * the chain, never typed. Every role in every course drafts something, hands
 * its drafts to another role, and the picture's arrows add up to the table.
 */
const COURSES = [SECURITY_PLUS, CYSA_PLUS, MSSP, SERVER_PLUS, CCNA, SECAI_PLUS, CISSP, ...AZURE_COURSES, ...AWS_COURSES];

const roles: RoleDef[] = [
  { id: 'a', name: 'A', mission: '', color: 'var(--x)', icon: 'Shield' },
  { id: 'b', name: 'B', mission: '', color: 'var(--x)', icon: 'Shield' },
  { id: 'c', name: 'C', mission: '', color: 'var(--x)', icon: 'Shield' },
];
const def = (id: string, owner: string, raci: [string, string, string], feeds: string[] = []): DeliverableDef =>
  ({ id, owner, raci: { drafts: raci[0], reviews: raci[1], approves: raci[2] }, feeds, num: 1, file: `${id}.md`, title: id, weeks: [1], sections: [] }) as unknown as DeliverableDef;

describe('roleFlow', () => {
  it('derives rows and weighted edges from the RACI and the chain', () => {
    const flow = roleFlow(roles, [def('d1', 'a', ['a', 'b', 'c'], ['d2']), def('d2', 'b', ['b', 'c', 'c']), def('d3', 'a', ['a', 'b', 'c'])]);
    expect(flow.rows.map((r) => [r.role.id, r.drafts.length, r.reviews.length, r.approves.length])).toEqual([
      ['a', 2, 0, 0],
      ['b', 1, 2, 0],
      ['c', 0, 1, 2],
    ]);
    expect(flow.rows[0].handsTo).toEqual(['b', 'c']);
    expect(flow.rows[2].waitsOn).toEqual(['a', 'b']);
    expect(flow.edges).toEqual([
      { from: 'a', to: 'b', kind: 'review', ids: ['d1', 'd3'] },
      { from: 'a', to: 'b', kind: 'feeds', ids: ['d1'] },
      { from: 'b', to: 'c', kind: 'review', ids: ['d2'] },
      { from: 'b', to: 'c', kind: 'approve', ids: ['d1', 'd3'] },
    ]);
    const pairs = roleFlowPairs(flow);
    expect(pairs.find((p) => p.from === 'a' && p.to === 'b')).toMatchObject({ review: 2, feeds: 1, total: 3 });
    expect(describeRoleFlow(flow, (id) => id.toUpperCase())).toEqual(['B reviews 2, is fed by 1 of A\'s documents.', 'C reviews 1, approves 2 of B\'s documents.']);
  });

  it('never draws a self edge or a role the course does not have', () => {
    const flow = roleFlow(roles, [def('d1', 'a', ['a', 'a', 'a'], ['d1']), def('d2', 'zzz', ['zzz', 'a', 'b'])]);
    expect(flow.edges.filter((e) => e.from === e.to)).toEqual([]);
    expect(flow.edges.every((e) => ['a', 'b', 'c'].includes(e.from) && ['a', 'b', 'c'].includes(e.to))).toBe(true);
  });

  it.each(COURSES.map((c) => [c.id, c] as const))('%s: every role drafts and hands off, and the arrows add up to the table', (_id, course) => {
    // The cloud Architect drafts every document and the other three approve
    // their own; so the rule is a part in the RACI and a hand-off, not a draft
    // for everyone.
    const defs = deliverablesForCourse(course.id);
    const flow = roleFlow(course.roles, defs);
    for (const row of flow.rows) {
      expect(row.drafts.length + row.reviews.length + row.approves.length, `${row.role.id} has no part in any document`).toBeGreaterThan(0);
      expect(row.handsTo.length + row.waitsOn.length, `${row.role.id} hands nothing to anyone`).toBeGreaterThan(0);
    }
    const reviewArrows = flow.edges.filter((e) => e.kind === 'review').reduce((n, e) => n + e.ids.length, 0);
    expect(reviewArrows).toBe(defs.filter((d) => d.raci).length);
    const approveArrows = flow.edges.filter((e) => e.kind === 'approve').reduce((n, e) => n + e.ids.length, 0);
    expect(approveArrows).toBe(flow.rows.reduce((n, r) => n + r.approves.length, 0));
    expect(roleFlowPairs(flow).length).toBeLessThanOrEqual(course.roles.length * (course.roles.length - 1));
  });
});

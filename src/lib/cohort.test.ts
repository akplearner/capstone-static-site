import { describe, it, expect } from 'vitest';
import { buildCohort, cohortCsv, stuckSummary } from './cohort';
import { SERVER_PLUS } from './data/seed/serverPlus';
import type { StepEvidence } from './data/types';

const roster = [
  { memberId: 'a', teamId: '2026-09-t3', role: 'net', displayName: 'Ana', cohort: '2026-09', joinedAt: 1 },
  { memberId: 'b', teamId: '2026-09-t3', role: 'lnx', displayName: 'Ben', cohort: '2026-09', joinedAt: 2 },
  { memberId: 'c', teamId: '2026-09-t4', role: 'mgmt', displayName: 'Cy', cohort: '2026-09', joinedAt: 3 },
];

describe('buildCohort', () => {
  const rows = buildCohort({
    course: SERVER_PLUS,
    roster,
    // Ana did every week-1 step; nobody else did anything.
    isStepDone: (m, taskId) => m === 'a' && /-w1-/.test(taskId),
    evidenceFor: (m): Record<string, StepEvidence> =>
      m === 'a'
        ? { 'sp-w1-bringup::sp-w1-bringup-s1': { courseId: 'server-plus', taskId: 'sp-w1-bringup', stepId: 'sp-w1-bringup-s1', verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts: 1 } }
        : {},
    docsFor: () => ({}),
    stuckFor: (m) => (m === 'b' ? [{ memberId: 'b', taskId: 'sp-w1-bringup', stepId: 'sp-w1-bringup-s2', at: 5 }] : []),
  });

  it('sorts by team then role, and reads the cohort off the team id', () => {
    expect(rows.map((r) => r.displayName)).toEqual(['Ben', 'Ana', 'Cy']);
    expect(rows.every((r) => r.cohort === '2026-09')).toBe(true);
  });

  it('computes week percentages and the verified/self-attested split', () => {
    const ana = rows.find((r) => r.memberId === 'a')!;
    expect(ana.weeks[1]).toBe(100);
    expect(ana.weeks[2]).toBe(0);
    expect(ana.overall).toBeGreaterThan(0);
    expect(ana.overall).toBeLessThan(100);
    expect(ana.verifiable).toBeGreaterThan(0);
    // One verified record; every other done verifiable week-1 step is self-attested.
    expect(ana.verified + ana.selfAttested).toBeGreaterThan(0);
    expect(ana.points.find((p) => p.week === 1)?.focus).toBe(30);
    expect(ana.points).toHaveLength(6);
  });

  it('carries stuck flags and summarises them by step', () => {
    expect(rows.find((r) => r.memberId === 'b')!.stuck).toHaveLength(1);
    expect(stuckSummary(rows)).toEqual([{ taskId: 'sp-w1-bringup', stepId: 'sp-w1-bringup-s2', members: ['Ben'] }]);
  });

  it('exports one CSV line per member per marked week, with the bonus flag', () => {
    const csv = cohortCsv(rows, SERVER_PLUS, [
      { courseId: 'server-plus', teamId: '2026-09-t3', deliverableId: 'srv_as_built', week: 4, status: 'revise', comment: '', reviewer: 'i', at: 1 },
    ]);
    const lines = csv.trim().split('\r\n');
    expect(lines[0].startsWith('course,cohort,team,member,role,week,bonus,team_points,focus_points,total')).toBe(true);
    expect(lines).toHaveLength(1 + 3 * 6);
    expect(lines.some((l) => l.includes('2026-09-t3,Ana,net,1,false'))).toBe(true);
    expect(lines.some((l) => l.includes(',5,true,'))).toBe(true);
    expect(lines.some((l) => l.includes('srv_as_built:revise'))).toBe(true);
  });
});

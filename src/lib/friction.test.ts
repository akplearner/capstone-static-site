import { describe, it, expect } from 'vitest';
import { FRICTION_CSV_HEADER, FRICTION_SCHEMA, REWRITE_PCT, frictionCsv, frictionReport } from './friction';
import { courseDto } from './content/dto';
import type { StepEvidence } from './data/types';
import { verifiableSteps } from './evidenceLedger';
import { isSetupWeek } from './course-helpers';

/**
 * R112 — friction is counted per step among the members whose role has the
 * task; a tick without output, a stuck flag and an earlier tick without this
 * one are the signals; steps are ordered by friction, never people.
 */
const COURSE = courseDto('security-plus').course;
const roster = [
  { memberId: 'a', teamId: '2026-09-t3', role: 'red', displayName: 'Ana', cohort: '2026-09', joinedAt: 1 },
  { memberId: 'b', teamId: '2026-09-t3', role: 'red', displayName: 'Ben', cohort: '2026-09', joinedAt: 2 },
  { memberId: 'c', teamId: '2026-09-t4', role: 'blue', displayName: 'Cy', cohort: '2026-09', joinedAt: 3 },
];
const task = COURSE.tasks.find((t) => t.role === 'red' && !isSetupWeek(COURSE, t.week) && verifiableSteps(t.steps.filter((s) => !s.optional)).length >= 2)!;
const req = task.steps.filter((s) => !s.optional);
const [first, second] = verifiableSteps(req);
const ev = (stepId: string, verified: boolean, attempts = 1): StepEvidence => ({ courseId: 'security-plus', taskId: task.id, stepId, verified, method: verified ? 'verified-output' : 'self-attested', matchedTokens: verified ? 1 : 0, totalTokens: 1, attempts });

const report = frictionReport({
  course: COURSE,
  roster,
  facts: {
    // Ana ticked and verified the first step and ticked the second without output; Ben ticked every step before the second and is stuck on it.
    isStepDone: (m, t, s) => t === task.id && ((m === 'a' && (s === first.id || s === second.id)) || (m === 'b' && req.findIndex((x) => x.id === s) < req.findIndex((x) => x.id === second.id))),
    evidenceFor: (m): Record<string, StepEvidence> => (m === 'a' ? { [`${task.id}::${first.id}`]: ev(first.id, true), [`${task.id}::${second.id}`]: ev(second.id, false, 3) } : {}),
    stuck: [{ memberId: 'b', taskId: task.id, stepId: second.id, at: 1 }],
  },
});

describe('frictionReport', () => {
  it('counts the signals per step among the members with the task, and flags the step both members struggled on', () => {
    expect(report.schema).toBe(FRICTION_SCHEMA);
    const row = report.rows.find((r) => r.taskId === task.id && r.stepId === second.id)!;
    expect(row.members, 'only the red members').toBe(2);
    expect(row.ticked).toBe(1);
    expect(row.verified).toBe(0);
    expect(row.selfAttestedOnly).toBe(1);
    expect(row.multiAttempt).toBe(1);
    expect(row.stuck).toBe(1);
    expect(row.stopped, 'Ben ticked the steps before it and not this one').toBe(1);
    expect(row.pct).toBe(100);
    expect(row.candidate).toBe(true);
    const firstRow = report.rows.find((r) => r.taskId === task.id && r.stepId === first.id)!;
    expect(firstRow.verified).toBe(1);
    expect(REWRITE_PCT).toBe(25);
  });

  it('orders steps by friction, carries nobody, and writes a fixed CSV header', () => {
    for (let i = 1; i < report.rows.length; i++) expect(report.rows[i].pct).toBeLessThanOrEqual(report.rows[i - 1].pct);
    expect(report.rows[0].pct).toBe(100);
    const json = JSON.stringify(report);
    for (const who of ['Ana', 'Ben', 'Cy', 'memberId']) expect(json).not.toContain(who);
    const csv = frictionCsv(report, COURSE);
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toBe(FRICTION_CSV_HEADER.join(','));
    expect(lines).toHaveLength(1 + report.rows.length);
    const lone = frictionReport({ course: COURSE, roster: [roster[0]], facts: { isStepDone: () => false, evidenceFor: () => ({}), stuck: [{ memberId: 'a', taskId: task.id, stepId: first.id, at: 1 }] } });
    expect(lone.rows.find((r) => r.stepId === first.id && r.taskId === task.id)?.candidate, 'one member never makes a candidate').toBe(false);
  });
});

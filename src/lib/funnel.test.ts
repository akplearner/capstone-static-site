import { describe, it, expect } from 'vitest';
import { FUNNEL_CSV_HEADER, FUNNEL_SCHEMA, FUNNEL_STAGES, funnelCsv, funnelReport, retentionBand } from './funnel';
import { SERVER_PLUS } from './data/seed/serverPlus';
import { courseDto } from './content/dto';
import { deliverablesOf } from './content/read';
import type { StepEvidence } from './data/types';
import { verifiableSteps } from './evidenceLedger';

/**
 * R112 — the funnel counts members who reached each stage and every stage
 * before it, so the counts never rise; retention bands sum to the members;
 * the report and its CSV carry nobody.
 */
const roster = [
  { memberId: 'a', teamId: '2026-09-t3', role: 'net', displayName: 'Ana', cohort: '2026-09', joinedAt: 1 },
  { memberId: 'b', teamId: '2026-09-t3', role: 'lnx', displayName: 'Ben', cohort: '2026-09', joinedAt: 2 },
  { memberId: 'c', teamId: '2026-11-t1', role: 'mgmt', displayName: 'Cy', cohort: '2026-11', joinedAt: 3 },
];
const doc = courseDto('server-plus');
const anaTask = SERVER_PLUS.tasks.find((t) => t.role === 'net' && verifiableSteps(t.steps.filter((s) => !s.optional)).length > 0)!;
const anaStep = verifiableSteps(anaTask.steps.filter((s) => !s.optional))[0];
const benTask = SERVER_PLUS.tasks.find((t) => t.role === 'lnx' && t.week === 1)!;

const report = funnelReport({
  course: SERVER_PLUS,
  roster,
  deliverables: deliverablesOf(doc),
  facts: {
    // Ana ticked every week-1 step and verified one; Ben ticked one step of a week-1 task; Cy did nothing.
    isStepDone: (m, taskId, stepId) => (m === 'a' && (/-w1-/.test(taskId) || taskId === anaTask.id)) || (m === 'b' && taskId === benTask.id && stepId === benTask.steps[0].id),
    evidenceFor: (m): Record<string, StepEvidence> =>
      m === 'a' ? { [`${anaTask.id}::${anaStep.id}`]: { courseId: 'server-plus', taskId: anaTask.id, stepId: anaStep.id, verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts: 1, verifiedAt: 2 } } : {},
    docsFor: () => ({}),
  },
});

describe('funnelReport', () => {
  it('counts each stage among members who reached every stage before it, so nothing rises along the funnel', () => {
    expect(report.schema).toBe(FUNNEL_SCHEMA);
    expect(report.courseId).toBe('server-plus');
    expect(report.groups.map((g) => g.cohort)).toEqual(['2026-09', '2026-11']);
    expect(report.all.members).toBe(3);
    expect(report.all.stages.enrolled).toBe(3);
    expect(report.all.stages.firstTick).toBe(2);
    expect(report.all.stages.firstVerified).toBe(1);
    expect(report.all.stages.capstoneFiled).toBe(0);
    for (const g of [report.all, ...report.groups]) {
      const counts = FUNNEL_STAGES.map((s) => g.stages[s]);
      for (let i = 1; i < counts.length; i++) expect(counts[i], `${g.cohort} ${FUNNEL_STAGES[i]}`).toBeLessThanOrEqual(counts[i - 1]);
      expect(Object.values(g.retention).reduce((n, v) => n + v, 0), g.cohort).toBe(g.members);
    }
    expect(report.groups[1].stages.firstTick, 'Cy did nothing').toBe(0);
    expect(report.all.retention.none).toBe(1);
  });

  it('a verification without a tick does not skip the tick stage', () => {
    const onlyPaste = funnelReport({
      course: SERVER_PLUS,
      roster: [roster[2]],
      deliverables: deliverablesOf(doc),
      facts: { isStepDone: () => false, evidenceFor: () => ({ 'x::y': { courseId: 'server-plus', taskId: 'x', stepId: 'y', verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts: 1 } }), docsFor: () => ({}) },
    });
    expect(onlyPaste.all.stages.firstVerified).toBe(0);
    expect(onlyPaste.all.stages.firstTick).toBe(0);
  });

  it('retention bands and the CSV: a fixed header, one line per group, nobody named', () => {
    expect([0, 1, 2, 3, 4, 9].map(retentionBand)).toEqual(['none', 'one', 'twoToThree', 'twoToThree', 'fourPlus', 'fourPlus']);
    const csv = funnelCsv(report, SERVER_PLUS);
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toBe(FUNNEL_CSV_HEADER.join(','));
    expect(lines[0]).toBe('course,cohort,members,enrolled,first_tick,first_verified,first_week_cleared,capstone_filed,weeks_none,weeks_one,weeks_two_to_three,weeks_four_plus');
    expect(lines).toHaveLength(1 + 1 + report.groups.length);
    const json = JSON.stringify(report);
    for (const who of ['Ana', 'Ben', 'Cy', '"a"', 'memberId']) expect(json).not.toContain(who);
    expect(csv).not.toMatch(/Ana|Ben|Cy/);
  });
});

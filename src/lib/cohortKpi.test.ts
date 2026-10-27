import { describe, it, expect } from 'vitest';
import { COHORT_KPI_CSV_HEADER, COHORT_KPI_SCHEMA, bandOf, cohortKpiCsv, cohortKpiReport } from './cohortKpi';
import { SERVER_PLUS } from './data/seed/serverPlus';
import { courseDto } from './content/dto';
import { certOf, deliverablesOf, skillsOf } from './content/read';
import { ONTOLOGY_VERSION } from './docs/ontology';
import { KPIS } from './docs/kpis';
import type { StepEvidence } from './data/types';
import { verifiableSteps } from './evidenceLedger';

/**
 * R108 — the cohort report folds every member's sixteen into bands and
 * sums per cohort and carries nobody: no member id, no name, no per-member
 * value; the CSV has one line per KPI per group.
 */
const roster = [
  { memberId: 'a', teamId: '2026-09-t3', role: 'net', displayName: 'Ana', cohort: '2026-09', joinedAt: 1 },
  { memberId: 'b', teamId: '2026-09-t3', role: 'lnx', displayName: 'Ben', cohort: '2026-09', joinedAt: 2 },
  { memberId: 'c', teamId: '2026-09-t4', role: 'mgmt', displayName: 'Cy', cohort: '2026-09', joinedAt: 3 },
];
const doc = courseDto('server-plus');
// Ana's one verified step: the first verifiable required step of a week-1 task of her own role.
const anaTask = SERVER_PLUS.tasks.find((t) => t.role === 'net' && verifiableSteps(t.steps.filter((s) => !s.optional)).length > 0)!;
const anaStep = verifiableSteps(anaTask.steps.filter((s) => !s.optional))[0];

const report = cohortKpiReport({
  course: SERVER_PLUS,
  week: 2,
  roster,
  ontologyVersion: ONTOLOGY_VERSION,
  registry: skillsOf(doc),
  cert: certOf(doc),
  deliverables: deliverablesOf(doc),
  facts: {
    // Ana did every week-1 step and the first verifiable task of her role; nobody else did anything.
    isStepDone: (m, taskId) => m === 'a' && (/-w1-/.test(taskId) || taskId === anaTask.id),
    evidenceFor: (m): Record<string, StepEvidence> =>
      m === 'a'
        ? { [`${anaTask.id}::${anaStep.id}`]: { courseId: 'server-plus', taskId: anaTask.id, stepId: anaStep.id, verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts: 1, firstAttemptAt: 1, verifiedAt: 2 } }
        : {},
    artifactsFor: () => [],
    docsFor: () => ({}),
    statusFor: () => [],
    submissionsFor: () => [],
    reviewsFor: () => [],
  },
});

describe('cohortKpiReport', () => {
  it('groups by cohort, keeps twenty-eight rows in registry order, and the bands sum to the members', () => {
    expect(report.schema).toBe(COHORT_KPI_SCHEMA);
    expect(report.courseId).toBe('server-plus');
    expect(report.week).toBe(2);
    expect(report.all.members).toBe(3);
    expect(report.groups.map((g) => g.cohort)).toEqual(['2026-09']);
    for (const g of [report.all, ...report.groups]) {
      expect(g.kpis.map((k) => k.id)).toEqual(KPIS.map((k) => k.id));
      for (const k of g.kpis) {
        expect(k.members).toBe(g.members);
        expect(k.bands.notStarted + k.bands.inProgress + k.bands.complete + k.bands.noDenominator, k.id).toBe(g.members);
        // R132: a count KPI (teammate steps) has no denominator.
        if (k.id !== 'kpi.teamwork.teammate-steps') expect(k.sumValue, k.id).toBeLessThanOrEqual(k.sumOf);
        // R132: the flag history, the review queue, the cohort calendar and the page clock are not handed to the cohort report yet.
        if (!['kpi.problem-solving.flags-cleared', 'kpi.teamwork.peer-reviews-given', 'kpi.professionalism.on-time', 'kpi.growth.learning-velocity'].includes(k.id)) expect(k.loaded, k.id).toBe(g.members);
      }
    }
    const a1 = report.all.kpis.find((k) => k.id === 'kpi.technical.skills-verified')!;
    expect(a1.bands.inProgress + a1.bands.complete).toBeGreaterThanOrEqual(1);
    expect(a1.bands.notStarted).toBeGreaterThanOrEqual(2);
    expect(report.all.kpis.find((k) => k.id === 'kpi.execution.dod-met')!.bands.notStarted + report.all.kpis.find((k) => k.id === 'kpi.execution.dod-met')!.bands.noDenominator).toBe(3);
  });

  it('carries no member', () => {
    const json = JSON.stringify(report);
    for (const word of ['Ana', 'Ben', 'Cy', 'memberId', 'displayName', '"a"', '"b"']) expect(json, word).not.toContain(word);
  });

  it('bands: no denominator, not started, in progress, complete', () => {
    expect(bandOf({ value: 0, of: 0 })).toBe('noDenominator');
    expect(bandOf({ value: 0, of: 3 })).toBe('notStarted');
    expect(bandOf({ value: 1, of: 3 })).toBe('inProgress');
    expect(bandOf({ value: 3, of: 3 })).toBe('complete');
  });

  it('the CSV has the fixed header and one line per KPI for the whole course and per cohort', () => {
    const csv = cohortKpiCsv(report, SERVER_PLUS);
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toBe(COHORT_KPI_CSV_HEADER.join(','));
    expect(lines[0]).toBe('course,cohort,week,kpi,family,metric,fact,members,loaded,not_started,in_progress,complete,no_denominator,sum_value,sum_of');
    expect(lines).toHaveLength(1 + 28 * (report.groups.length + 1));
    expect(lines[1].startsWith('server-plus,all,2,kpi.technical.skills-verified,technical,metric.skill-verified,own,3,3,')).toBe(true);
    expect(csv).not.toContain('Ana');
  });

  it('an empty roster gives an empty report with the twenty-eight as empty rows', () => {
    const empty = cohortKpiReport({ course: SERVER_PLUS, week: 1, roster: [], ontologyVersion: ONTOLOGY_VERSION, registry: skillsOf(doc), cert: certOf(doc), deliverables: deliverablesOf(doc), facts: { isStepDone: () => false, evidenceFor: () => ({}), artifactsFor: () => [], docsFor: () => ({}), statusFor: () => [], submissionsFor: () => [], reviewsFor: () => [] } });
    expect(empty.groups).toEqual([]);
    expect(empty.all.members).toBe(0);
    expect(empty.all.kpis).toHaveLength(28);
  });

  it('R134: folds the scores as means over the members whose score stood on something, the timing across the group, and sums only ratios', () => {
    for (const g of [report.all, ...report.groups]) {
      expect(g.scores.map((sc) => sc.id)).toEqual(skillsOf(doc).SCORING.map((sc) => sc.id));
      for (const sc of g.scores) {
        expect(sc.loaded).toBeLessThanOrEqual(g.members);
        expect(sc.mean).toBeGreaterThanOrEqual(0);
        expect(sc.mean).toBeLessThanOrEqual(100);
      }
      expect(g.timing).toEqual({ timedSteps: 1, withinHour: 1, over24h: 0, medianMinutes: 0 });
      const count = g.kpis.find((k) => k.id === 'kpi.teamwork.teammate-steps')!;
      expect(count.sumOf, 'a count sums into no ratio').toBe(0);
      const minutes = g.kpis.find((k) => k.id === 'kpi.problem-solving.time-to-resolution')!;
      expect(minutes.sumValue, 'a median sums into no ratio').toBe(0);
    }
    expect(report.all.scores.find((sc) => sc.id === 'score.tool-proficiency')!.loaded).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(report)).not.toContain('Ana');
  });
});

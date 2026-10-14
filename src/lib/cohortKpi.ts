import type { Course, RosterEntry } from './types';
import type { DeliverableReview, DeliverableSubmission, EvidenceArtifact, StepEvidence } from './data/types';
import type { DeliverableData, DeliverableDef } from './docs/types';
import type { DeliverableStatus } from './docs/lifecycle';
import type { CertContent, SkillsContent } from './content/read';
import type { KpiFact, KpiFamily } from './docs/kpis';
import { skillProfile } from './skillProfile';
import { defaultMeasure, kpiBoard, type KpiValue } from './kpiBoard';
import { isDeliverableFiled } from './deliverableChain';
import { gradedWeeksCleared } from './course-helpers';
import { toCsv } from './csv';

/**
 * R108 — the cohort KPI report: the sixteen numbers of every member of a
 * course, folded into bands per cohort. An instructor reads how many members
 * have started, are in progress or are complete on each KPI, and the sums
 * behind them; nothing orders members against each other, and the report
 * carries no member id, no name and no per-member value, so handing it on
 * discloses nobody. Team facts are judged through the review week the page
 * selects. Pure: the page gathers the facts and hands them in.
 */

export const COHORT_KPI_SCHEMA = 'capstone-cohort-kpis/1';

export type KpiBand = 'notStarted' | 'inProgress' | 'complete' | 'noDenominator';

export interface CohortKpiRow {
  id: string;
  family: KpiFamily;
  metricId: string;
  fact: KpiFact;
  /** Members in the group. */
  members: number;
  /** Members whose fact behind this KPI was loaded. */
  loaded: number;
  bands: Record<KpiBand, number>;
  sumValue: number;
  sumOf: number;
}

export interface CohortKpiGroup {
  cohort: string;
  members: number;
  /** Sixteen, in registry order. */
  kpis: CohortKpiRow[];
}

export interface CohortKpiReport {
  schema: typeof COHORT_KPI_SCHEMA;
  courseId: string;
  /** The review week team facts are judged through. */
  week: number;
  /** Sorted by cohort id. */
  groups: CohortKpiGroup[];
  all: CohortKpiGroup;
}

export interface CohortKpiInput {
  course: Course;
  week: number;
  roster: RosterEntry[];
  ontologyVersion: string;
  registry: SkillsContent;
  cert: CertContent;
  deliverables: DeliverableDef[];
  facts: {
    isStepDone(memberId: string, taskId: string, stepId: string): boolean;
    evidenceFor(memberId: string): Record<string, StepEvidence>;
    artifactsFor(memberId: string): EvidenceArtifact[];
    docsFor(teamId: string): Record<string, DeliverableData>;
    statusFor(teamId: string): DeliverableStatus[];
    submissionsFor(teamId: string): DeliverableSubmission[];
    reviewsFor(teamId: string): DeliverableReview[];
  };
}

export function bandOf(v: Pick<KpiValue, 'value' | 'of'>): KpiBand {
  if (v.of === 0) return 'noDenominator';
  if (v.value === 0) return 'notStarted';
  if (v.value >= v.of) return 'complete';
  return 'inProgress';
}

const BANDS: KpiBand[] = ['notStarted', 'inProgress', 'complete', 'noDenominator'];

function emptyGroup(cohort: string, template: KpiValue[]): CohortKpiGroup {
  return {
    cohort,
    members: 0,
    kpis: template.map((k) => ({ id: k.id, family: k.family, metricId: k.metricId, fact: k.fact, members: 0, loaded: 0, bands: { notStarted: 0, inProgress: 0, complete: 0, noDenominator: 0 }, sumValue: 0, sumOf: 0 })),
  };
}

function fold(group: CohortKpiGroup, kpis: KpiValue[]) {
  group.members += 1;
  kpis.forEach((k, i) => {
    const row = group.kpis[i];
    row.members += 1;
    if (k.loaded) row.loaded += 1;
    row.bands[bandOf(k)] += 1;
    row.sumValue += k.value;
    row.sumOf += k.of;
  });
}


export function cohortKpiReport(input: CohortKpiInput): CohortKpiReport {
  const { course, week, roster, registry, cert, deliverables, facts } = input;
  const capstone = deliverables.find((d) => d.capstone);
  const groups = new Map<string, CohortKpiGroup>();
  let all: CohortKpiGroup | undefined;

  for (const m of roster) {
    const docs = facts.docsFor(m.teamId);
    const profile = skillProfile({
      course,
      role: m.role,
      memberId: m.memberId,
      isStepDone: (t, s) => facts.isStepDone(m.memberId, t, s),
      evidence: facts.evidenceFor(m.memberId),
      artifacts: facts.artifactsFor(m.memberId),
      registry,
      cert,
      deliverables,
      team: { docs, status: facts.statusFor(m.teamId), submissions: facts.submissionsFor(m.teamId), reviews: facts.reviewsFor(m.teamId), currentWeek: week },
    });
    // The graded weeks with tasks for the role, and those whose required steps the member has all ticked.
    const weeks = gradedWeeksCleared(course, m.role, (t, s) => facts.isStepDone(m.memberId, t, s));
    const board = kpiBoard({
      profile,
      registry,
      cert,
      measure: defaultMeasure(registry, m.role),
      outcome: { capstoneFiled: !!capstone && isDeliverableFiled(docs[capstone.id]), weeksCleared: weeks.cleared, weeksTotal: weeks.total },
      ontologyVersion: input.ontologyVersion,
    });
    all ??= emptyGroup('all', board.kpis);
    const group = groups.get(m.cohort) ?? emptyGroup(m.cohort, board.kpis);
    groups.set(m.cohort, group);
    fold(group, board.kpis);
    fold(all, board.kpis);
  }

  const template = all ?? emptyGroup('all', kpiBoardTemplate(registry));
  return {
    schema: COHORT_KPI_SCHEMA,
    courseId: course.id,
    week,
    groups: [...groups.values()].sort((a, b) => a.cohort.localeCompare(b.cohort)),
    all: template,
  };
}

/** The sixteen as empty values, for a report with nobody in it. */
function kpiBoardTemplate(registry: SkillsContent): KpiValue[] {
  return registry.KPIS.map((k) => ({ id: k.id, family: k.family, metricId: k.metricId, value: 0, of: 0, pct: 0, loaded: false, fact: k.fact }));
}

export const COHORT_KPI_CSV_HEADER = ['course', 'cohort', 'week', 'kpi', 'family', 'metric', 'fact', 'members', 'loaded', ...BANDS.map((b) => b.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)), 'sum_value', 'sum_of'];

/** One line per KPI for the whole course and per cohort; no member anywhere. */
export function cohortKpiCsv(report: CohortKpiReport, course: Pick<Course, 'id'>): string {
  const rows: (string | number)[][] = [];
  for (const g of [report.all, ...report.groups]) {
    for (const k of g.kpis) rows.push([course.id, g.cohort, report.week, k.id, k.family, k.metricId, k.fact, k.members, k.loaded, ...BANDS.map((b) => k.bands[b]), k.sumValue, k.sumOf]);
  }
  return toCsv(COHORT_KPI_CSV_HEADER, rows);
}

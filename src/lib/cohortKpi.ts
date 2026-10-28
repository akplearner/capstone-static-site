import type { Course, RosterEntry } from './types';
import type { DeliverableReview, DeliverableReviewMark, DeliverableSubmission, EvidenceArtifact, StepEvidence, StepFlagEvent, ValidationAnswer } from './data/types';
import type { DeliverableData, DeliverableDef } from './docs/types';
import type { DeliverableStatus } from './docs/lifecycle';
import type { CertContent, SkillsContent } from './content/read';
import type { KpiFact, KpiFamily } from './docs/kpis';
import { skillProfile } from './skillProfile';
import { applyEarned, type EarnedRow } from './earnedSkills';
import { defaultMeasure, kpiBoard, type KpiBoard, type KpiValue } from './kpiBoard';
import { isDeliverableFiled } from './deliverableChain';
import { gradedWeeksCleared } from './course-helpers';
import { toCsv } from './csv';

/**
 * R108 — the cohort KPI report: the KPI board of every member of a
 * course, folded into bands per cohort. An instructor reads how many members
 * have started, are in progress or are complete on each KPI, and the sums
 * behind them; nothing orders members against each other, and the report
 * carries no member id, no name and no per-member value, so handing it on
 * discloses nobody. Team facts are judged through the review week the page
 * selects. Pure: the page gathers the facts and hands them in.
 */

export const COHORT_KPI_SCHEMA = 'capstone-cohort-kpis/1';

/** R137: `notMeasured` is a row not loaded, or loaded with nothing the course measures for the role; `noDenominator` is a measured ratio with nothing to count yet. */
export type KpiBand = 'notStarted' | 'inProgress' | 'complete' | 'noDenominator' | 'notMeasured';

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
  /** In registry order. */
  kpis: CohortKpiRow[];
  /** R134: per score, the mean over the members whose score stood on something, and how many those were. */
  scores: { id: string; mean: number; loaded: number }[];
  /** R134: the steps timed across the group, the share within the hour and over a day, and the median of the members' medians. */
  timing: { timedSteps: number; withinHour: number; over24h: number; medianMinutes: number | null };
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
    /** R136: the instructor's marks per team, each member's flag history and review counts, and the cohort calendar; absent where the loader did not read them. */
    marksFor?(teamId: string): DeliverableReviewMark[];
    flagEventsFor?(memberId: string): StepFlagEvent[];
    peerReviewsFor?(memberId: string): { done: number; assigned: number } | undefined;
    /** R140: the member's validation answers; absent where the table was not read. */
    validationFor?(memberId: string): ValidationAnswer[];
    weekDueFor?(cohort: string): ((week: number) => number | undefined) | undefined;
    /** R137: the member's earned ledger, laid over the live profile as the member's own pages do. */
    earnedFor?(memberId: string): readonly EarnedRow[];
  };
}

export function bandOf(v: Pick<KpiValue, 'value' | 'of'> & Partial<Pick<KpiValue, 'unit' | 'loaded' | 'applies' | 'notMeasured' | 'pct'>>): KpiBand {
  // R137: per unit. Not loaded, or not measured in this course for the role, is its own band.
  if (v.loaded === false || v.notMeasured === 'role') return 'notMeasured';
  if (v.unit === 'count') return v.value > 0 ? 'complete' : 'notStarted';
  if (v.of === 0) return 'noDenominator';
  // A minutes row's value is a median; its percentage (the share within the hour) is what bands it.
  if (v.unit === 'minutes') return (v.pct ?? 0) >= 100 ? 'complete' : (v.pct ?? 0) > 0 ? 'inProgress' : 'notStarted';
  if (v.value === 0) return 'notStarted';
  if (v.value >= v.of) return 'complete';
  return 'inProgress';
}

const BANDS: KpiBand[] = ['notStarted', 'inProgress', 'complete', 'noDenominator', 'notMeasured'];

function emptyGroup(cohort: string, template: KpiValue[], scoreIds: string[]): CohortKpiGroup {
  return {
    cohort,
    members: 0,
    kpis: template.map((k) => ({ id: k.id, family: k.family, metricId: k.metricId, fact: k.fact, members: 0, loaded: 0, bands: { notStarted: 0, inProgress: 0, complete: 0, noDenominator: 0, notMeasured: 0 }, sumValue: 0, sumOf: 0 })),
    scores: scoreIds.map((id) => ({ id, mean: 0, loaded: 0 })),
    timing: { timedSteps: 0, withinHour: 0, over24h: 0, medianMinutes: null },
  };
}

/** The running sums behind a group's means and median, kept apart from the report so the report carries no per-member value. */
interface Running {
  scoreSums: number[];
  medians: number[];
}

function fold(group: CohortKpiGroup, running: Running, board: Pick<KpiBoard, 'kpis' | 'scores' | 'timing'>) {
  group.members += 1;
  board.kpis.forEach((k, i) => {
    const row = group.kpis[i];
    row.members += 1;
    if (k.loaded) row.loaded += 1;
    row.bands[bandOf(k)] += 1;
    // A count has no denominator and a minutes row's value is a median: neither sums into a ratio. R137: a row not measured for the role sums nothing.
    if (k.unit === 'ratio' && k.notMeasured !== 'role') {
      row.sumValue += k.value;
      row.sumOf += k.of;
    }
  });
  board.scores.forEach((sc, i) => {
    if (!sc.loaded) return;
    group.scores[i].loaded += 1;
    running.scoreSums[i] += sc.value;
    group.scores[i].mean = Math.round(running.scoreSums[i] / group.scores[i].loaded);
  });
  group.timing.timedSteps += board.timing.timedSteps;
  group.timing.withinHour += board.timing.withinHour;
  group.timing.over24h += board.timing.over24h;
  if (board.timing.medianMinutes !== null) {
    running.medians.push(board.timing.medianMinutes);
    const sorted = [...running.medians].sort((a, b) => a - b);
    group.timing.medianMinutes = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2);
  }
}


export function cohortKpiReport(input: CohortKpiInput): CohortKpiReport {
  const { course, week, roster, registry, cert, deliverables, facts } = input;
  const capstone = deliverables.find((d) => d.capstone);
  const groups = new Map<string, CohortKpiGroup>();
  const running = new Map<string, Running>();
  const runningOf = (cohort: string, n: number) => {
    const r = running.get(cohort) ?? { scoreSums: Array.from({ length: n }, () => 0), medians: [] };
    running.set(cohort, r);
    return r;
  };
  let all: CohortKpiGroup | undefined;

  for (const m of roster) {
    const docs = facts.docsFor(m.teamId);
    const live = skillProfile({
      course,
      role: m.role,
      memberId: m.memberId,
      isStepDone: (t, s) => facts.isStepDone(m.memberId, t, s),
      evidence: facts.evidenceFor(m.memberId),
      artifacts: facts.artifactsFor(m.memberId),
      registry,
      cert,
      deliverables,
      team: { docs, status: facts.statusFor(m.teamId), submissions: facts.submissionsFor(m.teamId), reviews: facts.reviewsFor(m.teamId), currentWeek: week, marks: facts.marksFor?.(m.teamId) },
      // R136: the member's own history and queue, and the calendar, so the instructor's figures stand on the same facts as the member's.
      own: facts.flagEventsFor || facts.peerReviewsFor || facts.validationFor ? { notes: [], reports: [], flagEvents: facts.flagEventsFor?.(m.memberId), peerReviews: facts.peerReviewsFor?.(m.memberId), validation: facts.validationFor?.(m.memberId) } : undefined,
      weekDue: facts.weekDueFor?.(m.cohort),
    });
    const ledger = facts.earnedFor?.(m.memberId);
    const profile = ledger ? applyEarned(live, ledger) : live;
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
    const scoreIds = board.scores.map((sc) => sc.id);
    all ??= emptyGroup('all', board.kpis, scoreIds);
    const group = groups.get(m.cohort) ?? emptyGroup(m.cohort, board.kpis, scoreIds);
    groups.set(m.cohort, group);
    fold(group, runningOf(m.cohort, scoreIds.length), board);
    fold(all, runningOf('all', scoreIds.length), board);
  }

  const template = all ?? emptyGroup('all', kpiBoardTemplate(registry), registry.SCORING.map((sc) => sc.id));
  return {
    schema: COHORT_KPI_SCHEMA,
    courseId: course.id,
    week,
    groups: [...groups.values()].sort((a, b) => a.cohort.localeCompare(b.cohort)),
    all: template,
  };
}

/** Every KPI as an empty value, for a report with nobody in it. */
function kpiBoardTemplate(registry: SkillsContent): KpiValue[] {
  return registry.KPIS.map((k) => ({ id: k.id, family: k.family, metricId: k.metricId, value: 0, of: 0, pct: 0, unit: k.unit, scored: k.scored, loaded: false, applies: true, fact: k.fact }));
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

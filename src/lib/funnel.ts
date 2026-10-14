import type { Course, RosterEntry } from './types';
import type { StepEvidence } from './data/types';
import type { DeliverableData, DeliverableDef } from './docs/types';
import { isDeliverableFiled } from './deliverableChain';
import { getTasksByRole, gradedWeeksCleared, isGradedWeek, isSetupWeek } from './course-helpers';
import { toCsv } from './csv';

/**
 * R112 — the platform funnel: of the members enrolled on a course, how many
 * reached each stage of the work in turn (a stage counts members who reached
 * it and every stage before it, so the counts never rise along the funnel),
 * and how many were active in none, one, two or three, or four or more graded
 * weeks. Counts per cohort and for the whole course; no member id, no name,
 * no per-member value, no clock. Pure: the page gathers the facts.
 */

export const FUNNEL_SCHEMA = 'capstone-funnel/1';

export type FunnelStage = 'enrolled' | 'firstTick' | 'firstVerified' | 'firstWeekCleared' | 'capstoneFiled';
export const FUNNEL_STAGES: FunnelStage[] = ['enrolled', 'firstTick', 'firstVerified', 'firstWeekCleared', 'capstoneFiled'];

export type RetentionBand = 'none' | 'one' | 'twoToThree' | 'fourPlus';
export const RETENTION_BANDS: RetentionBand[] = ['none', 'one', 'twoToThree', 'fourPlus'];

export interface FunnelGroup {
  cohort: string;
  members: number;
  stages: Record<FunnelStage, number>;
  retention: Record<RetentionBand, number>;
}

export interface FunnelReport {
  schema: typeof FUNNEL_SCHEMA;
  courseId: string;
  /** Sorted by cohort id. */
  groups: FunnelGroup[];
  all: FunnelGroup;
}

export interface FunnelInput {
  course: Course;
  roster: RosterEntry[];
  deliverables: Pick<DeliverableDef, 'id' | 'capstone'>[];
  facts: {
    isStepDone(memberId: string, taskId: string, stepId: string): boolean;
    evidenceFor(memberId: string): Record<string, StepEvidence>;
    docsFor(teamId: string): Record<string, DeliverableData>;
  };
}

function emptyGroup(cohort: string): FunnelGroup {
  return {
    cohort,
    members: 0,
    stages: { enrolled: 0, firstTick: 0, firstVerified: 0, firstWeekCleared: 0, capstoneFiled: 0 },
    retention: { none: 0, one: 0, twoToThree: 0, fourPlus: 0 },
  };
}

export function retentionBand(activeWeeks: number): RetentionBand {
  if (activeWeeks <= 0) return 'none';
  if (activeWeeks === 1) return 'one';
  if (activeWeeks <= 3) return 'twoToThree';
  return 'fourPlus';
}

/** The furthest stage one member reached, in order, from their own facts. */
export function memberStage(input: FunnelInput, m: RosterEntry): { stage: number; activeWeeks: number } {
  const { course, deliverables, facts } = input;
  const done = (t: string, s: string) => facts.isStepDone(m.memberId, t, s);
  const own = getTasksByRole(course, m.role).filter((t) => !isSetupWeek(course, t.week));
  const tickedWeeks = new Set(own.filter((t) => t.steps.some((s) => !s.optional && done(t.id, s.id))).map((t) => t.week));
  const ticked = tickedWeeks.size > 0;
  const verified = Object.values(facts.evidenceFor(m.memberId)).some((r) => r.verified);
  const cleared = gradedWeeksCleared(course, m.role, done).cleared > 0;
  const capstone = deliverables.find((d) => d.capstone);
  const filed = !!capstone && isDeliverableFiled(facts.docsFor(m.teamId)[capstone.id]);
  const reached = [true, ticked, verified, cleared, filed];
  let stage = 0;
  while (stage + 1 < reached.length && reached[stage + 1]) stage += 1;
  const activeWeeks = [...tickedWeeks].filter((w) => isGradedWeek(course, w)).length;
  return { stage, activeWeeks };
}

function fold(group: FunnelGroup, at: { stage: number; activeWeeks: number }) {
  group.members += 1;
  FUNNEL_STAGES.forEach((s, i) => {
    if (i <= at.stage) group.stages[s] += 1;
  });
  group.retention[retentionBand(at.activeWeeks)] += 1;
}

export function funnelReport(input: FunnelInput): FunnelReport {
  const groups = new Map<string, FunnelGroup>();
  const all = emptyGroup('all');
  for (const m of input.roster) {
    const at = memberStage(input, m);
    const group = groups.get(m.cohort) ?? emptyGroup(m.cohort);
    groups.set(m.cohort, group);
    fold(group, at);
    fold(all, at);
  }
  return {
    schema: FUNNEL_SCHEMA,
    courseId: input.course.id,
    groups: [...groups.values()].sort((a, b) => a.cohort.localeCompare(b.cohort)),
    all,
  };
}

export const FUNNEL_CSV_HEADER = ['course', 'cohort', 'members', ...FUNNEL_STAGES.map((s) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)), ...RETENTION_BANDS.map((b) => `weeks_${b.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}`)];

/** One line for the whole course and one per cohort; counts only. */
export function funnelCsv(report: FunnelReport, course: Pick<Course, 'id'>): string {
  const rows = [report.all, ...report.groups].map((g) => [course.id, g.cohort, g.members, ...FUNNEL_STAGES.map((s) => g.stages[s]), ...RETENTION_BANDS.map((b) => g.retention[b])]);
  return toCsv(FUNNEL_CSV_HEADER, rows);
}

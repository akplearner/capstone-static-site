import type { Course, RosterEntry } from './types';
import type { StepEvidence, StuckFlag } from './data/types';
import { isSetupWeek } from './course-helpers';
import { verifiableSteps } from './evidenceLedger';
import { toCsv } from './csv';

/**
 * R112 — the step friction map: for every verifiable required step of a
 * course, among the members whose role has the task, how many ticked it
 * without matching output, verified it, needed more than one paste, are
 * flagged stuck on it now, or ticked an earlier step of the task and not this
 * one. A step where a quarter or more of at least two members show any of
 * those is a rewrite candidate. Steps are ordered, never people; the report
 * carries no member id and no name. Pure: the page gathers the facts.
 */

export const FRICTION_SCHEMA = 'capstone-friction/1';

/** A step is a rewrite candidate from this share of members with any friction signal, given at least two members. */
export const REWRITE_PCT = 25;

export interface FrictionRow {
  taskId: string;
  taskTitle: string;
  stepId: string;
  stepTitle: string;
  week: number;
  role: string;
  /** Members whose role has the task. */
  members: number;
  ticked: number;
  verified: number;
  /** Ticked, no matching output. */
  selfAttestedOnly: number;
  /** A record with two or more pastes. */
  multiAttempt: number;
  /** Flagged stuck on this step now. */
  stuck: number;
  /** Ticked an earlier required step of the task and not this one. */
  stopped: number;
  /** Members with any of the three friction signals (self-attested only, stuck, stopped), as a percentage of members. */
  pct: number;
  candidate: boolean;
}

export interface FrictionReport {
  schema: typeof FRICTION_SCHEMA;
  courseId: string;
  /** Highest friction first; ties in course order. */
  rows: FrictionRow[];
}

export interface FrictionInput {
  course: Course;
  roster: RosterEntry[];
  facts: {
    isStepDone(memberId: string, taskId: string, stepId: string): boolean;
    evidenceFor(memberId: string): Record<string, StepEvidence>;
    stuck: StuckFlag[];
  };
}

export function frictionReport(input: FrictionInput): FrictionReport {
  const { course, roster, facts } = input;
  const stuck = new Set(facts.stuck.map((f) => `${f.memberId}|${f.taskId}::${f.stepId}`));
  const rows: FrictionRow[] = [];
  const orderOf = new Map<FrictionRow, number>();
  for (const task of course.tasks) {
    if (isSetupWeek(course, task.week)) continue;
    const required = task.steps.filter((s) => !s.optional);
    const members = roster.filter((m) => m.role === task.role);
    for (const step of verifiableSteps(required)) {
      const index = required.findIndex((s) => s.id === step.id);
      const earlier = required.slice(0, index);
      let ticked = 0;
      let verified = 0;
      let selfAttestedOnly = 0;
      let multiAttempt = 0;
      let stuckCount = 0;
      let stopped = 0;
      let flagged = 0;
      for (const m of members) {
        const done = facts.isStepDone(m.memberId, task.id, step.id);
        const rec = facts.evidenceFor(m.memberId)[`${task.id}::${step.id}`];
        const isVerified = !!rec?.verified;
        const isStuck = stuck.has(`${m.memberId}|${task.id}::${step.id}`);
        const hasStopped = !done && earlier.some((s) => facts.isStepDone(m.memberId, task.id, s.id));
        if (done) ticked += 1;
        if (isVerified) verified += 1;
        if (done && !isVerified) selfAttestedOnly += 1;
        if ((rec?.attempts ?? 0) >= 2) multiAttempt += 1;
        if (isStuck) stuckCount += 1;
        if (hasStopped) stopped += 1;
        if ((done && !isVerified) || isStuck || hasStopped) flagged += 1;
      }
      const pct = members.length > 0 ? Math.round((100 * flagged) / members.length) : 0;
      const row: FrictionRow = {
        taskId: task.id,
        taskTitle: task.title,
        stepId: step.id,
        stepTitle: step.title,
        week: task.week,
        role: task.role,
        members: members.length,
        ticked,
        verified,
        selfAttestedOnly,
        multiAttempt,
        stuck: stuckCount,
        stopped,
        pct,
        candidate: members.length >= 2 && pct >= REWRITE_PCT,
      };
      orderOf.set(row, rows.length);
      rows.push(row);
    }
  }
  rows.sort((a, b) => b.pct - a.pct || (orderOf.get(a) ?? 0) - (orderOf.get(b) ?? 0));
  return { schema: FRICTION_SCHEMA, courseId: course.id, rows };
}

export const FRICTION_CSV_HEADER = ['course', 'week', 'role', 'task', 'step', 'members', 'ticked', 'verified', 'self_attested_only', 'multi_attempt', 'stuck', 'stopped', 'pct', 'rewrite_candidate'];

export function frictionCsv(report: FrictionReport, course: Pick<Course, 'id'>): string {
  return toCsv(FRICTION_CSV_HEADER, report.rows.map((r) => [course.id, r.week, r.role, r.taskId, r.stepId, r.members, r.ticked, r.verified, r.selfAttestedOnly, r.multiAttempt, r.stuck, r.stopped, r.pct, r.candidate ? 'yes' : 'no']));
}

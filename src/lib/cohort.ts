/**
 * The cohort view: every member of every team, with the numbers an instructor
 * marks from. Pure — the page feeds it whichever storage mode is live.
 */
import type { Course } from './types';
import type { RosterEntry } from './types';
import type { DeliverableData } from './docs/types';
import type { StepEvidence, StuckFlag, DeliverableReview } from './data/types';
import { getTasksByRole, getRequiredSteps, isGradedWeek } from './course-helpers';
import { verifiableSteps } from './evidenceLedger';
import { markedWeeks, weeklyPoints, type WeeklyPoints } from './rubric';
import { toCsv } from './csv';
import { parseTeamId } from './team';

export interface CohortMember {
  memberId: string;
  displayName: string;
  teamId: string;
  role: string;
  cohort: string;
  /** Required steps done ÷ total across graded weeks, 0..100. */
  overall: number;
  /** week → 0..100 */
  weeks: Record<number, number>;
  stepsDone: number;
  stepsTotal: number;
  verifiable: number;
  verified: number;
  selfAttested: number;
  stuck: StuckFlag[];
  points: WeeklyPoints[];
}

export interface BuildCohortInput {
  course: Course;
  roster: RosterEntry[];
  isStepDone: (memberId: string, taskId: string, stepId: string) => boolean;
  evidenceFor: (memberId: string) => Record<string, StepEvidence>;
  docsFor: (teamId: string) => Record<string, DeliverableData>;
  stuckFor: (memberId: string) => StuckFlag[];
}

export function buildCohort({ course, roster, isStepDone, evidenceFor, docsFor, stuckFor }: BuildCohortInput): CohortMember[] {
  const rows = roster.map((m): CohortMember => {
    const tasks = getTasksByRole(course, m.role);
    const evidence = evidenceFor(m.memberId);
    const weeks: Record<number, number> = {};
    let stepsDone = 0;
    let stepsTotal = 0;
    let verifiable = 0;
    let verified = 0;
    let selfAttested = 0;
    for (const w of course.weeks) {
      const wt = tasks.filter((t) => t.week === w.number);
      let d = 0;
      let n = 0;
      for (const t of wt) {
        for (const s of getRequiredSteps(t)) {
          n += 1;
          if (isStepDone(m.memberId, t.id, s.id)) d += 1;
        }
      }
      weeks[w.number] = n === 0 ? 0 : Math.round((d / n) * 100);
      if (isGradedWeek(course, w.number)) {
        stepsDone += d;
        stepsTotal += n;
        for (const t of wt) {
          for (const s of verifiableSteps(t.steps)) {
            verifiable += 1;
            const rec = evidence[`${t.id}::${s.id}`];
            if (rec?.verified) verified += 1;
            else if (isStepDone(m.memberId, t.id, s.id)) selfAttested += 1;
          }
        }
      }
    }
    const docs = docsFor(m.teamId);
    const points = markedWeeks(course).map(({ week }) =>
      weeklyPoints({ course, role: m.role, week, teamDocs: docs, isStepDone: (t, s) => isStepDone(m.memberId, t, s) })
    );
    return {
      memberId: m.memberId,
      displayName: m.displayName || m.memberId,
      teamId: m.teamId,
      role: m.role,
      cohort: parseTeamId(m.teamId).cohort ?? m.cohort,
      overall: stepsTotal === 0 ? 0 : Math.round((stepsDone / stepsTotal) * 100),
      weeks,
      stepsDone,
      stepsTotal,
      verifiable,
      verified,
      selfAttested,
      stuck: stuckFor(m.memberId),
      points,
    };
  });
  return rows.sort((a, b) => a.teamId.localeCompare(b.teamId) || a.role.localeCompare(b.role) || a.displayName.localeCompare(b.displayName));
}

/** Who is stuck where, grouped by step, most people first. */
export function stuckSummary(rows: CohortMember[]): { taskId: string; stepId: string; members: string[] }[] {
  const by = new Map<string, { taskId: string; stepId: string; members: string[] }>();
  for (const r of rows) {
    for (const f of r.stuck) {
      const k = `${f.taskId}::${f.stepId}`;
      const e = by.get(k) ?? { taskId: f.taskId, stepId: f.stepId, members: [] };
      e.members.push(r.displayName);
      by.set(k, e);
    }
  }
  return [...by.values()].sort((a, b) => b.members.length - a.members.length);
}

/** One line per member per marked week — the sheet the rubric PDF prints,
 *  filled in as far as the platform can see. */
export function cohortCsv(rows: CohortMember[], course: Course, reviews: DeliverableReview[] = []): string {
  const header = [
    'course', 'cohort', 'team', 'member', 'role', 'week', 'bonus',
    'team_points', 'focus_points', 'total', 'focus_mirrors_team',
    'checks_met', 'checks_due', 'week_pct', 'steps_done', 'steps_total', 'verified', 'verifiable', 'self_attested', 'stuck_count', 'reviews',
  ];
  const marked = markedWeeks(course);
  const body: (string | number | boolean)[][] = [];
  for (const r of rows) {
    for (const { week, bonus } of marked) {
      const p = r.points.find((x) => x.week === week);
      if (!p) continue;
      const rv = reviews.filter((x) => x.teamId === r.teamId && x.week === week).map((x) => `${x.deliverableId}:${x.status}`).join(' ');
      body.push([
        course.id, r.cohort, r.teamId, r.displayName, r.role, week, bonus,
        p.team, p.focus, p.total, p.focusMirrorsTeam,
        p.checksMet, p.checksDue, r.weeks[week] ?? 0, r.stepsDone, r.stepsTotal, r.verified, r.verifiable, r.selfAttested, r.stuck.length, rv,
      ]);
    }
  }
  return toCsv(header, body);
}

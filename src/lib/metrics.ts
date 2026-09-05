import type { Course, Step, Task } from './types';
import type { EvidenceArtifact, StepEvidence } from './data/types';
import { getTasksByRole, isSetupWeek } from './course-helpers';
import { verifiableSteps } from './evidenceLedger';
import { localDay } from './localDate';

/**
 * Per-student metrics — projections, never a source of truth.
 *
 * Everything here is recomputed from completions plus the evidence ledger, so it
 * cannot disagree with the progress bars and it resets when progress resets. This
 * follows the rule `game.ts` already sets: no XP, no badges for showing up. The
 * question these answer is "did this person actually build and prove the thing",
 * which is the only question an employer cares about.
 *
 * Two deliberate choices, both from docs/ARCHITECTURE.md §3:
 *   * **Effort is measured, never rewarded.** Time spans and attempt counts are
 *     reported because they are interesting evidence of real troubleshooting —
 *     never scored, ranked, or used to dock anyone. The rubric is not speed.
 *   * **Verification rate leads.** Steps done is attendance; steps *verified from
 *     real output* is the closest honest signal that the work happened.
 */

export interface CourseMetrics {
  courseId: string;
  courseTitle: string;
  /** Steps completed / steps that count for this role. */
  stepsDone: number;
  stepsTotal: number;
  /** Steps that CAN be verified (they carry `verify` tokens). */
  verifiable: number;
  /** Verifiable steps actually verified from pasted output. */
  verified: number;
  /** Completed steps recorded without matching output. */
  selfAttested: number;
  /**
   * Verified ÷ verifiable, 0–100. The headline number.
   * 0 when nothing is verifiable, and `verifiable` is reported alongside so the
   * UI can say "no verifiable steps" instead of implying a failed 0%.
   */
  verificationRate: number;
  /** Distinct evidence files hashed for this course. */
  artifacts: number;
  /** Artifacts whose filename matched the course naming convention. */
  artifactsNamedWell: number;
  /** Total pastes across all steps — real troubleshooting, never penalised. */
  attempts: number;
  /** First and last recorded activity, epoch ms; 0 when there is none. */
  firstActivity: number;
  lastActivity: number;
  /** Distinct calendar days with recorded activity. */
  activeDays: number;
  /** Frameworks touched by at least one VERIFIED step — a skills profile that
   *  is earned rather than merely attempted. */
  frameworksVerified: string[];
  /** Frameworks appearing anywhere in this role's tasks. */
  frameworksTotal: string[];
}

export interface MetricsInput {
  course: Course;
  role: string;
  /** taskId -> 0..100, as the pages already compute it. */
  taskPercent: Record<string, number>;
  /** `${taskId}::${stepId}` -> record. */
  evidence: Record<string, StepEvidence>;
  artifacts: EvidenceArtifact[];
}

// Local, not UTC: an 8pm session on the US east coast falls on the next UTC
// day, which split one evening's work across two buckets and dated a late one
// tomorrow. See `lib/localDate.ts`.
const dayKey = localDay;

/** Steps that count toward completion — optional ones are tracked but excluded,
 *  matching how progress and gates already treat them. */
function countedSteps(task: Task): Step[] {
  return task.steps.filter((s) => !s.optional);
}

export function courseMetrics({
  course,
  role,
  taskPercent,
  evidence,
  artifacts,
}: MetricsInput): CourseMetrics {
  // Setup weeks are opt-in and don't count, exactly as deriveCrewProgress treats
  // them — otherwise a student who skipped the home build looks incomplete.
  const tasks = getTasksByRole(course, role).filter((t) => !isSetupWeek(course, t.week));

  let stepsDone = 0;
  let stepsTotal = 0;
  let verifiable = 0;
  let verified = 0;
  let selfAttestedCount = 0;
  let attempts = 0;
  let firstActivity = 0;
  let lastActivity = 0;
  const days = new Set<string>();
  const frameworksVerified = new Set<string>();
  const frameworksTotal = new Set<string>();

  for (const task of tasks) {
    task.frameworks?.forEach((f) => frameworksTotal.add(f));
    const counted = countedSteps(task);
    stepsTotal += counted.length;
    stepsDone += Math.round(((taskPercent[task.id] ?? 0) / 100) * counted.length);

    for (const step of verifiableSteps(counted)) {
      verifiable += 1;
      const rec = evidence[`${task.id}::${step.id}`];
      if (rec?.verified) {
        verified += 1;
        step.frameworks?.forEach((f) => frameworksVerified.add(f));
        task.frameworks?.forEach((f) => frameworksVerified.add(f));
      }
    }

    // Attempts and activity span come from every record, verifiable or not.
    for (const step of counted) {
      const rec = evidence[`${task.id}::${step.id}`];
      if (!rec) continue;
      attempts += rec.attempts;
      if (rec.method === 'self-attested') selfAttestedCount += 1;
      for (const t of [rec.firstAttemptAt, rec.verifiedAt]) {
        if (!t) continue;
        if (!firstActivity || t < firstActivity) firstActivity = t;
        if (t > lastActivity) lastActivity = t;
        days.add(dayKey(t));
      }
    }
  }

  const courseArtifacts = artifacts.filter((a) => a.courseId === course.id);
  courseArtifacts.forEach((a) => {
    if (!a.hashedAt) return;
    if (!firstActivity || a.hashedAt < firstActivity) firstActivity = a.hashedAt;
    if (a.hashedAt > lastActivity) lastActivity = a.hashedAt;
    days.add(dayKey(a.hashedAt));
  });

  return {
    courseId: course.id,
    courseTitle: course.title,
    stepsDone,
    stepsTotal,
    verifiable,
    verified,
    selfAttested: selfAttestedCount,
    verificationRate: verifiable > 0 ? Math.round((verified / verifiable) * 100) : 0,
    artifacts: courseArtifacts.length,
    artifactsNamedWell: courseArtifacts.filter((a) => a.nameOk).length,
    attempts,
    firstActivity,
    lastActivity,
    activeDays: days.size,
    frameworksVerified: [...frameworksVerified].sort(),
    frameworksTotal: [...frameworksTotal].sort(),
  };
}

export interface PortfolioSummary {
  courses: number;
  stepsDone: number;
  stepsTotal: number;
  verified: number;
  verifiable: number;
  verificationRate: number;
  artifacts: number;
  attempts: number;
  activeDays: number;
  firstActivity: number;
  lastActivity: number;
  /** Every framework proved by at least one verified step, across all courses. */
  frameworksVerified: string[];
}

/** Roll per-course metrics into one profile. Sums, not averages: averaging
 *  percentages across courses of different sizes would flatter a student who
 *  verified two steps in a tiny course and none in a large one. */
export function portfolioSummary(all: CourseMetrics[]): PortfolioSummary {
  const sum = (pick: (m: CourseMetrics) => number) => all.reduce((n, m) => n + pick(m), 0);
  const verified = sum((m) => m.verified);
  const verifiable = sum((m) => m.verifiable);
  const firsts = all.map((m) => m.firstActivity).filter(Boolean);
  const frameworks = new Set<string>();
  all.forEach((m) => m.frameworksVerified.forEach((f) => frameworks.add(f)));

  return {
    courses: all.length,
    stepsDone: sum((m) => m.stepsDone),
    stepsTotal: sum((m) => m.stepsTotal),
    verified,
    verifiable,
    verificationRate: verifiable > 0 ? Math.round((verified / verifiable) * 100) : 0,
    artifacts: sum((m) => m.artifacts),
    attempts: sum((m) => m.attempts),
    // Active days are summed per course rather than de-duplicated across them:
    // the alternative needs every raw timestamp, and this figure is only ever
    // shown as "days worked", not as a calendar.
    activeDays: sum((m) => m.activeDays),
    firstActivity: firsts.length ? Math.min(...firsts) : 0,
    lastActivity: Math.max(0, ...all.map((m) => m.lastActivity)),
    frameworksVerified: [...frameworks].sort(),
  };
}

/** A short, honest description of how well-evidenced a capstone is. Deliberately
 *  never a grade or a score out of ten — it names what is true. */
export function evidenceQuality(m: CourseMetrics): {
  label: string;
  tone: 'strong' | 'partial' | 'none';
} {
  if (m.verifiable === 0) return { label: 'No verifiable steps in this course', tone: 'none' };
  if (m.verified === 0) return { label: 'Self-attested only', tone: 'none' };
  if (m.verified === m.verifiable) return { label: 'Every checkable step verified', tone: 'strong' };
  return { label: `${m.verified} of ${m.verifiable} steps verified`, tone: 'partial' };
}

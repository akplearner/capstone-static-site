import type { Course, Task } from './types';
import type { EvidenceArtifact, StepEvidence, VerificationReceipt } from './data/types';
import type { DeliverableDef } from './docs/types';
import type { DeliverableStatus } from './docs/lifecycle';
import type { ProfileRow, SkillProfile } from './skillProfile';
import type { SkillsContent } from './content/read';
import type { WorkRoleDef } from './docs/workRoles';
import { PROFESSIONAL_THRESHOLD, RECORD_CATEGORIES, categoryOf, formCategories, taskCategories, type RecordCategory } from './docs/recordCategories';
import { decisionBlocksOf, decisionKey } from './docs/types';
import { latestStatus } from './docs/lifecycle';
import { getTasksByRole, isGradedWeek } from './course-helpers';
import { verifiableSteps } from './evidenceLedger';
import { tierOf, type Tier } from './scores';

/**
 * R133 — "Your record" as fourteen professional categories, across every
 * course the member started. Each card carries the same seven figures: how
 * many times the thing was done (utilization), how many of those were verified
 * or resolved (verified uses), the success rate as a ratio of those two, the
 * last activity stamp, the courses and projects behind it, six monthly counts
 * of verified uses, the evidence behind it (receipts, hashed files, approved
 * forms) and the industry relevance (the share of the NICE work roles whose
 * competency areas the category serves). The tier is PROFESSIONAL at ten
 * verified uses across every course and retake, BUILDING below it with the
 * count. A pure projection: the page gathers the facts and hands them in with
 * its clock (`asOf`); nothing here reads a repository, a window or a clock.
 */

export const RECORD_CARD_SCHEMA = 'capstone-record-category/1';

export interface RecordCourseInput {
  course: Course;
  role: string;
  profile: SkillProfile;
  evidence: Record<string, StepEvidence>;
  receipts: Record<string, VerificationReceipt> | null;
  artifacts: EvidenceArtifact[];
  isStepDone: (taskId: string, stepId: string) => boolean;
  registry: Pick<SkillsContent, 'TOOL_OF' | 'SOP_OF_TASK' | 'WORK_ROLES'>;
  deliverables: Pick<DeliverableDef, 'id' | 'file' | 'title' | 'capstone' | 'sections'>[];
  /** The team's lifecycle rows and documents, where loaded; a form approved or issued is evidence. */
  status?: DeliverableStatus[];
  docs?: Record<string, { fields: Record<string, string> }>;
  capstoneFiled: boolean;
  clearedWeeks: readonly number[];
}

export interface RecordCategoryCard {
  id: RecordCategory;
  utilization: number;
  verifiedUses: number;
  successRate: { value: number; of: number };
  lastActivityAt?: number;
  /** Course titles with at least one use. */
  courses: string[];
  /** Of those, the courses whose capstone was filed. */
  projects: string[];
  /** Verified uses per month, oldest first, the last entry being the month of `asOf`. */
  trend: number[];
  evidenceCount: number;
  /** 0..100: the share of the work roles whose competency areas this category serves. */
  relevance: number;
  tier: Tier;
  threshold: number;
}

/** The tasks of a course that count toward each category, by the registries and the words. */
export function categoryTaskIds(input: Pick<RecordCourseInput, 'course' | 'role' | 'profile' | 'registry' | 'deliverables'>): Record<RecordCategory, string[]> {
  const { course, role, profile, registry } = input;
  const out = Object.fromEntries(RECORD_CATEGORIES.map((c) => [c, [] as string[]])) as Record<RecordCategory, string[]>;
  const byFile = new Map(input.deliverables.map((d) => [d.file, d]));
  const domainTasks = new Set(profile.rows.domains.flatMap((r) => r.tasks));
  const standardTasks = new Set(profile.rows.standards.flatMap((r) => r.tasks));
  const graded = getTasksByRole(course, role).filter((t) => isGradedWeek(course, t.week));
  for (const t of graded) {
    const cats = new Set<RecordCategory>(taskCategories(course, t, byFile));
    if ((registry.TOOL_OF[t.id] ?? []).length) cats.add('tools');
    if ((registry.SOP_OF_TASK[t.id] ?? []).length) cats.add('procedures');
    if (standardTasks.has(t.id)) cats.add('standards');
    if (domainTasks.has(t.id)) cats.add('exam-domains');
    if (t.handoff?.length) cats.add('collaboration');
    for (const c of cats) out[c].push(t.id);
  }
  return out;
}

/** The forms of a course that count toward each category, with whether the team approved or issued each. */
export function categoryForms(input: Pick<RecordCourseInput, 'deliverables' | 'status'>): { id: string; title: string; approved: boolean; categories: RecordCategory[] }[] {
  return input.deliverables.map((d) => {
    const last = input.status ? latestStatus(input.status, d.id) : undefined;
    return { id: d.id, title: d.title, approved: last?.status === 'approved' || last?.status === 'issued', categories: formCategories(d) };
  });
}

const key = (taskId: string, stepId: string) => `${taskId}::${stepId}`;
const MONTHS = 6;

/** `YYYY-MM` of a stamp, in the page's local time, as `localDay` does. */
function monthOf(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** The last six months ending at `asOf`, oldest first. */
export function monthsBefore(asOf: number, n = MONTHS): string[] {
  const d = new Date(asOf);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) out.push(monthOf(new Date(d.getFullYear(), d.getMonth() - i, 1).getTime()));
  return out;
}

/** The share of the work roles whose competency areas intersect the category's, 0..100. */
export function relevanceOf(category: RecordCategory, workRoles: Pick<WorkRoleDef, 'areas'>[]): number {
  if (!workRoles.length) return 0;
  const areas = new Set(categoryOf(category).areas);
  return Math.round((100 * workRoles.filter((w) => w.areas.some((a) => areas.has(a))).length) / workRoles.length);
}

interface Tally {
  utilization: number;
  verified: number;
  stamps: number[];
  evidence: number;
  used: boolean;
}

/** The fact rows (troubleshooting, decisions) a category folds. */
const FACT_ROWS: Partial<Record<RecordCategory, (p: SkillProfile) => ProfileRow[]>> = {
  troubleshooting: (p) => p.rows.troubleshooting,
  decisions: (p) => p.rows.decisions,
};

function tallyCourse(input: RecordCourseInput, category: RecordCategory, taskIds: string[], forms: ReturnType<typeof categoryForms>): Tally {
  const t: Tally = { utilization: 0, verified: 0, stamps: [], evidence: 0, used: false };
  const tasks = new Map(input.course.tasks.map((x) => [x.id, x]));
  const required = (task: Task) => task.steps.filter((s) => !s.optional);
  for (const id of taskIds) {
    const task = tasks.get(id);
    if (!task) continue;
    const checkable = new Set(verifiableSteps(required(task)).map((s) => s.id));
    for (const s of required(task)) {
      const rec = input.evidence[key(task.id, s.id)];
      const ticked = input.isStepDone(task.id, s.id);
      if (rec?.verified) {
        t.utilization += 1;
        t.verified += 1;
        if (typeof rec.verifiedAt === 'number') t.stamps.push(rec.verifiedAt);
        if (input.receipts?.[key(task.id, s.id)]) t.evidence += 1;
      } else if (ticked && checkable.has(s.id)) {
        t.utilization += 1;
        if (typeof rec?.firstAttemptAt === 'number') t.stamps.push(rec.firstAttemptAt);
      }
    }
  }
  const factRows = FACT_ROWS[category]?.(input.profile) ?? [];
  for (const r of factRows) {
    t.utilization += r.uses ?? 0;
    t.verified += r.successes ?? 0;
    if (r.lastVerifiedAt) t.stamps.push(r.lastVerifiedAt);
  }
  // Forms of the category: approved ones are evidence; a decision block chosen by this member is a use its row already counted.
  const mine = forms.filter((f) => f.categories.includes(category));
  t.evidence += mine.filter((f) => f.approved).length;
  if (category === 'documentation' || category === 'investigations') {
    t.evidence += input.artifacts.filter((a) => a.courseId === input.course.id).length;
    for (const a of input.artifacts) if (a.courseId === input.course.id) t.stamps.push(a.hashedAt);
  }
  if (category === 'decisions' && input.docs) {
    for (const d of input.deliverables) for (const b of decisionBlocksOf(d)) {
      const at = Number(input.docs[d.id]?.fields[`${decisionKey(b.id)}:at`]);
      if (Number.isFinite(at) && at > 0) t.stamps.push(at);
    }
  }
  if (category === 'projects') {
    t.utilization += input.clearedWeeks.length;
    t.verified += input.capstoneFiled ? 1 : 0;
    t.evidence += input.capstoneFiled ? 1 : 0;
  }
  if (category === 'collaboration') {
    const moves = input.profile.abilities.raciRespected;
    if (moves.loaded) {
      t.utilization += moves.of ?? 0;
      t.verified += moves.value;
    }
    t.utilization += input.profile.abilities.teammateStepsTicked.value;
  }
  t.used = t.utilization > 0 || t.verified > 0;
  return t;
}

/** The fourteen cards across the courses handed in, in registry order. */
export function recordCards(inputs: RecordCourseInput[], asOf: number): RecordCategoryCard[] {
  const months = monthsBefore(asOf);
  const workRoles = [...new Map(inputs.flatMap((i) => i.registry.WORK_ROLES.map((w) => [w.id, w]))).values()];
  const perCourse = inputs.map((i) => ({ input: i, tasks: categoryTaskIds(i), forms: categoryForms(i) }));
  return RECORD_CATEGORIES.map((id) => {
    let utilization = 0;
    let verified = 0;
    let evidence = 0;
    const stamps: number[] = [];
    const courses: string[] = [];
    const projects: string[] = [];
    for (const { input, tasks, forms } of perCourse) {
      const t = tallyCourse(input, id, tasks[id], forms);
      utilization += t.utilization;
      verified += t.verified;
      evidence += t.evidence;
      stamps.push(...t.stamps);
      if (t.used) {
        courses.push(input.course.title);
        if (input.capstoneFiled) projects.push(input.course.title);
      }
    }
    const byMonth = new Map(months.map((m) => [m, 0]));
    for (const s of stamps) {
      const m = monthOf(s);
      if (byMonth.has(m)) byMonth.set(m, (byMonth.get(m) ?? 0) + 1);
    }
    const last = stamps.length ? Math.max(...stamps) : undefined;
    return {
      id,
      utilization,
      verifiedUses: verified,
      successRate: { value: verified, of: utilization },
      ...(last !== undefined ? { lastActivityAt: last } : {}),
      courses,
      projects,
      trend: months.map((m) => byMonth.get(m) ?? 0),
      evidenceCount: evidence,
      relevance: relevanceOf(id, workRoles),
      tier: tierOf(verified, PROFESSIONAL_THRESHOLD),
      threshold: PROFESSIONAL_THRESHOLD,
    };
  });
}

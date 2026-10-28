import type { Course, Step, Task } from './types';
import type { DeliverableReview, DeliverableReviewMark, DeliverableSubmission, EvidenceArtifact, RehashCheck, StepEvidence, StepFlagEvent, StepNote, TaskReport, VerificationReceipt } from './data/types';
import type { DeliverableData, DeliverableDef } from './docs/types';
import type { DeliverableStatus } from './docs/lifecycle';
import type { CertContent, SkillsContent } from './content/read';
import type { Dimension } from './docs/metricCatalogue';
import type { SkillLevel } from './docs/skillsCopy';
import { getTasksByRole, isGradedWeek, isSetupWeek } from './course-helpers';
import { latestRehashes, verifiableSteps } from './evidenceLedger';
import { coverOf, latestStatus } from './docs/lifecycle';
import { dodProgress } from './docs/dod';
import { domainOf } from './docs/certs';
import { decisionBlocksOf, decisionKey } from './docs/types';
import { withoutSeedRows } from './docs/definitions';
import { formBase, isRationaleKey } from './docs/recordCategories';
import { localDay } from './localDate';

/**
 * R107 — the member profile: what one person has practised, verified and had
 * reviewed, per skill, tool, procedure, tactic, practice, standard and exam
 * domain, as a pure projection over the facts the platform already keeps.
 *
 * R132 — the workforce-readiness round added four dimensions read from the
 * same facts and the team's forms: `troubleshooting` (fault, incident and
 * triage rows with their outcome, retries that verified, stuck flags cleared),
 * `decisions` (decision blocks chosen, justified and approved by this member,
 * and reasons written on team rows), `retention` (a skill verified again seven
 * or more days after its first proof) and `execution` (the execution
 * indicators as rows: in order, first try, evidence named, checks met, control
 * complete, on time). It also reports TIMING: the minutes between two recorded
 * stamps of one step (the first paste and the verification) as a median, and
 * whether a task's last verification fell before the week's due date when the
 * page hands the cohort calendar in. Nothing here is a source of truth, nothing
 * ranks one member against another, and the module reads no clock: every
 * duration is the difference of two stamps the platform recorded, and the
 * currency window (R111) and the learning velocity read the `asOf` the page
 * passes. Composite scores are computed in `scores.ts` from the KPI board,
 * with their weights published in `docs/scoring.ts`.
 *
 * The denominator is the member's own ticks on required steps of the role's
 * tasks in graded and advanced weeks; the team's documents feed the
 * procedure, standard, documentation, collaboration, troubleshooting and
 * decision rows and the `reviewed` level, and the labels say so.
 *
 * The registries arrive as `SkillsContent` (the course document's section),
 * never as an import, and no repository is read here: the pages gather the
 * facts and hand them in.
 */

export interface ProfileRow {
  dimension: Dimension;
  id: string;
  label: string;
  /** Standards: the control codes the role's forms cite; procedures: the SOP's anchors. */
  standardRefs?: string[];
  /** The role's tasks mapped to this row, in course order. */
  tasks: string[];
  exercisedTasks: number;
  doneTasks: number;
  requiredSteps: number;
  tickedSteps: number;
  verifiableSteps: number;
  verifiedSteps: number;
  selfAttestedSteps: number;
  /** R108: tasks with at least one verified step, so a skill proved on two tasks can be told from one. */
  verifiedTasks: number;
  /** Tasks whose verifiable steps were verified in authored order, over tasks with two or more verification records. */
  inOrderTasks?: number;
  orderedTasks?: number;
  /** Hashed files on the mapped forms and weeks: approximate, counted per form and week. */
  artifacts: number;
  /** The forms mapped to this row, by id. */
  deliverables: string[];
  /** Forms whose Definition-of-Done checks due by the current week are all met. */
  deliverablesFilled: number;
  /** Forms whose document-control block is complete (or that have none). */
  deliverablesControlled: number;
  /** Forms the team approved or issued. */
  deliverablesApproved: number;
  /** Forms this member sent into review. */
  draftedByMember: number;
  /** R111: the latest verification on any of the row's tasks, if one exists. */
  lastVerifiedAt?: number;
  /** R111: that verification falls inside the currency window from the page's `asOf`; absent without `asOf` or a verification. */
  current?: boolean;
  /** R132: the earliest verification on any of the row's tasks, so retention can read the gap to the latest. */
  firstVerifiedAt?: number;
  /** R132: verified again seven or more days after the first verification. */
  retained?: boolean;
  /** R132, rows of the fact dimensions (troubleshooting, decisions, retention, execution): how many times the thing was done. */
  uses?: number;
  /** R132: how many of those uses ended as the category defines success. */
  successes?: number;
  level: SkillLevel;
  /** The first mapped task not yet done. */
  next?: { taskId: string; title: string; week: number };
}

export interface Indicator {
  value: number;
  of?: number;
  /** False when the facts behind it were not handed in (team and own facts load on the course page). */
  loaded: boolean;
  /** R111: the same count restricted to the forms the member's role drafts (the RACI drafter), where the indicator also folds shared forms. */
  own?: { value: number; of: number };
}

export interface AbilityIndicators {
  firstTry: Indicator;
  persistence: Indicator;
  partialProgress: Indicator;
  evidenceNaming: Indicator;
  activeDays: Indicator;
  activeWeeks: Indicator;
  reportsFiled: Indicator;
  reportsResolved: Indicator;
  notesWritten: Indicator;
  drafted: Indicator;
  reviewed: Indicator;
  issued: Indicator;
  submissionsFrozen: Indicator;
  rubricAllGreen: Indicator;
  dodMet: Indicator;
  teammateStepsTicked: Indicator;
  handoffsCompleted: Indicator;
  peerReviewsGiven: Indicator;
  /** R108, the board's own facts: tasks verified in authored order over tasks with two or more records; verified command steps over verifiable command steps. */
  inOrder: Indicator;
  commandSteps: Indicator;
  /** R108, team facts: distinct control codes on approved or issued forms the role drafts over the codes its forms cite; forms with data whose control block is complete; forms whose latest instructor review is approved. */
  controlsCited: Indicator;
  docControl: Indicator;
  instructorApproved: Indicator;
  /** R111, a team fact: the member's lifecycle transitions made in the role the RACI names for that move, over the member's transitions on forms with a RACI. */
  raciRespected: Indicator;
  /** R113: verified steps the platform receipted over verified steps; loaded only where receipts can exist (cloud mode). A receipt records the stamp, not the machine. */
  receipted: Indicator;
  /** R113: hashed files whose latest re-hash check matched, over hashed files; loaded when the checks were handed in. */
  rehashConfirmed: Indicator;
  /** R132, team facts: fault, incident and triage rows resolved over rows logged; change rows with a rollback over change rows. */
  faultsResolved: Indicator;
  changeRollback: Indicator;
  /** R132, team facts on the decision blocks of the role's forms: chosen by this member over offered; justified and approved over chosen; rationale fields filled over such fields. */
  decisionsRecorded: Indicator;
  decisionsJustified: Indicator;
  decisionsApproved: Indicator;
  rationaleWritten: Indicator;
  /** R132, team fact: instructor marks per rubric category that passed over marks given; loaded when the marks were handed in. */
  reviewMarks: Indicator;
  /** R132, own facts: stuck flags cleared over raised (loaded with the flag history); tasks verified by the week's due date over tasks verified (loaded with the cohort calendar). */
  flagsCleared: Indicator;
  onTime: Indicator;
  /** R132, own facts from the stamps: skills verified again a week or more later over skills verified; skills current over verified and verified steps this month over last (loaded with `asOf`). */
  retention: Indicator;
  skillsCurrent: Indicator;
  learningVelocity: Indicator;
}

/** R132: the minutes between the first paste and the verification of a step, as the board prints them. */
export interface TimingFacts {
  /** Verified steps with both stamps. */
  timedSteps: number;
  /** The median over the steps resolved within a day; null with none. */
  medianMinutes: number | null;
  /** Steps resolved within sixty minutes of the first paste. */
  withinHour: number;
  /** Steps whose gap exceeded a day, counted apart from the median. */
  over24h: number;
}

/**
 * R136 — the forms a role fills: the ones it owns, the shared ones, and the ones the RACI says it drafts.
 * The dimensions and the KPIs used to disagree (the dimensions also counted forms the role reviews or
 * approves), so a decision block could show a row on the board and read 0 of 0 on the tile. One rule.
 */
export function roleFormsOf<D extends Pick<DeliverableDef, 'owner' | 'shared' | 'raci'>>(deliverables: D[], role: string): D[] {
  return deliverables.filter((d) => d.owner === role || d.shared || d.raci?.drafts === role);
}

export interface TeamFacts {
  docs: Record<string, DeliverableData>;
  status: DeliverableStatus[];
  submissions: DeliverableSubmission[];
  reviews: DeliverableReview[];
  currentWeek: number;
  /** R132: the instructor's per-category marks, as history; absent where the table was not read. */
  marks?: DeliverableReviewMark[];
}

export interface OwnFacts {
  notes: StepNote[];
  reports: TaskReport[];
  /** R132: the member's own stuck-flag history (raised and cleared); absent where the table was not read. */
  flagEvents?: StepFlagEvent[];
  /** R132: the member's blind review queue, counted; absent until the page reads it. */
  peerReviews?: { done: number; assigned: number };
}

export interface SkillProfileInput {
  course: Course;
  role: string;
  memberId: string;
  /** The member's own tick on a step. */
  isStepDone: (taskId: string, stepId: string) => boolean;
  /** `${taskId}::${stepId}` → record. */
  evidence: Record<string, StepEvidence>;
  artifacts: EvidenceArtifact[];
  registry: SkillsContent;
  cert: CertContent;
  deliverables: DeliverableDef[];
  team?: TeamFacts;
  own?: OwnFacts;
  /** R111: the page's clock for the currency flag; the projection reads none. */
  asOf?: number;
  /** R113: the platform's receipts, `${taskId}::${stepId}` → receipt; null or absent where none can exist (offline). */
  receipts?: Record<string, VerificationReceipt> | null;
  /** R113: re-hash checks on this course's files; absent when not handed in. */
  rehashes?: RehashCheck[];
  /** R132: the cohort calendar, as the page derives it: the due stamp of a week, or undefined without a start date. */
  weekDue?: (week: number) => number | undefined;
}

export interface SkillProfile {
  courseId: string;
  role: string;
  denominator: string;
  rows: Record<Dimension, ProfileRow[]>;
  abilities: AbilityIndicators;
  gaps: { domains: ProfileRow[]; skills: ProfileRow[]; sops: ProfileRow[] };
  loaded: { team: boolean; own: boolean };
  /** R111: the forms the member's role drafts, by id, so the KPI board can attribute without a registry. */
  draftedForms: string[];
  /** R132: the minutes between two recorded stamps per verified step. */
  timing: TimingFacts;
}

export interface SkillPortfolio {
  skillsVerified: string[];
  skillsPractised: string[];
  toolsUsed: string[];
  sopsFollowed: string[];
  standardsPractised: string[];
  tacticsPractised: string[];
  practicesPractised: string[];
  domainsVerified: number;
  domainsTotal: number;
}

export const DENOMINATOR = 'own ticks · graded and advanced weeks · required steps';
const LEVELS: SkillLevel[] = ['not-started', 'practised', 'verified', 'reviewed'];
const CONTROL_FIELDS = ['doc_id', 'version', 'doc_owner', 'doc_date', 'doc_status'];

export const levelRank = (level: SkillLevel): number => LEVELS.indexOf(level);

/** R111: a verification counts as current inside this many days of the page's `asOf`. A recency predicate, never a duration shown. */
export const CURRENT_WINDOW_DAYS = 180;
/** R132: a skill verified again this many days after its first verification counts as retained. */
export const RETENTION_DAYS = 7;
/** R132: the learning-velocity window; this many days before the page clock against the same span before them. */
export const VELOCITY_DAYS = 28;
const DAY_MS = 24 * 60 * 60 * 1000;

/** R132: a row of a fact dimension, built from counts rather than steps. */
interface FactRowSpec {
  dimension: Dimension;
  id: string;
  label: string;
  uses: number;
  successes: number;
  tasks?: string[];
  deliverables?: string[];
  approved?: number;
  lastAt?: number;
  firstAt?: number;
}

function factRow(spec: FactRowSpec): ProfileRow {
  const partial: Omit<ProfileRow, 'level'> = {
    dimension: spec.dimension,
    id: spec.id,
    label: spec.label,
    tasks: spec.tasks ?? [],
    exercisedTasks: 0,
    doneTasks: 0,
    requiredSteps: 0,
    tickedSteps: 0,
    verifiableSteps: 0,
    verifiedSteps: 0,
    selfAttestedSteps: 0,
    verifiedTasks: 0,
    artifacts: 0,
    deliverables: spec.deliverables ?? [],
    deliverablesFilled: 0,
    deliverablesControlled: 0,
    deliverablesApproved: spec.approved ?? 0,
    draftedByMember: 0,
    uses: spec.uses,
    successes: spec.successes,
    ...(spec.lastAt !== undefined ? { lastVerifiedAt: spec.lastAt } : {}),
    ...(spec.firstAt !== undefined ? { firstVerifiedAt: spec.firstAt } : {}),
  };
  return { ...partial, level: levelOf(partial) };
}

/** R132: the member's own rows of a group (the worked example subtracted), with at least one cell filled. */
function ownRows(def: DeliverableDef, data: DeliverableData | undefined, group: string): Record<string, string>[] {
  if (!data) return [];
  const own = withoutSeedRows(def, data);
  return (own.groups[group] ?? []).filter((r) => Object.values(r).some((v) => (v ?? '').trim() !== ''));
}

const filled = (v: string | undefined) => (v ?? '').trim() !== '';

/** R132: the minutes between two stamps per step, folded for the board. */
export function timingOf(minutes: number[]): TimingFacts {
  const within = minutes.filter((m) => m <= 24 * 60).sort((a, b) => a - b);
  const over24h = minutes.length - within.length;
  const median = within.length ? (within.length % 2 ? within[(within.length - 1) / 2] : (within[within.length / 2 - 1] + within[within.length / 2]) / 2) : null;
  return { timedSteps: minutes.length, medianMinutes: median === null ? null : Math.round(median), withinHour: minutes.filter((m) => m <= 60).length, over24h };
}

const key = (taskId: string, stepId: string) => `${taskId}::${stepId}`;

interface TaskFacts {
  task: Task;
  required: Step[];
  ticked: number;
  verifiable: number;
  verified: number;
  selfAttested: number;
  /** Two or more verification records, so an order exists. */
  ordered: boolean;
  inOrder: boolean;
  /** R111: the latest `verifiedAt` among the task's verified records. */
  lastVerifiedAt?: number;
  /** R132: the earliest `verifiedAt`. */
  firstVerifiedAt?: number;
  /** R132: per verified step with both stamps, minutes from the first paste to the verification. */
  minutes: number[];
}

function taskFacts(task: Task, input: SkillProfileInput): TaskFacts {
  const required = task.steps.filter((s) => !s.optional);
  const ticked = required.filter((s) => input.isStepDone(task.id, s.id)).length;
  const checkable = verifiableSteps(required);
  let verified = 0;
  let selfAttested = 0;
  let lastVerifiedAt: number | undefined;
  let firstVerifiedAt: number | undefined;
  const stamps: number[] = [];
  const minutes: number[] = [];
  for (const s of checkable) {
    const rec = input.evidence[key(task.id, s.id)];
    if (rec?.verified) {
      verified += 1;
      const at = rec.verifiedAt ?? rec.firstAttemptAt;
      if (typeof at === 'number') stamps.push(at);
      if (typeof rec.verifiedAt === 'number') {
        lastVerifiedAt = Math.max(lastVerifiedAt ?? 0, rec.verifiedAt);
        firstVerifiedAt = Math.min(firstVerifiedAt ?? Number.MAX_SAFE_INTEGER, rec.verifiedAt);
        // R132: two recorded stamps of one step; a negative gap is a clock skew and is not a duration.
        if (typeof rec.firstAttemptAt === 'number' && rec.verifiedAt >= rec.firstAttemptAt) minutes.push((rec.verifiedAt - rec.firstAttemptAt) / 60_000);
      }
    } else if (input.isStepDone(task.id, s.id)) {
      selfAttested += 1;
    }
  }
  const ordered = stamps.length >= 2;
  const inOrder = ordered && stamps.every((t, i) => i === 0 || t >= stamps[i - 1]);
  return { task, required, ticked, verifiable: checkable.length, verified, selfAttested, ordered, inOrder, minutes, ...(lastVerifiedAt !== undefined ? { lastVerifiedAt, firstVerifiedAt } : {}) };
}

interface FormFacts {
  def: DeliverableDef;
  hasData: boolean;
  filled: boolean;
  controlled: boolean;
  approved: boolean;
  draftedByMember: boolean;
}

function hasOwnData(def: DeliverableDef, data: DeliverableData | undefined): boolean {
  if (!data) return false;
  if (Object.values(data.fields ?? {}).some((v) => (v ?? '').trim() !== '')) return true;
  for (const section of def.sections) {
    if (section.kind !== 'group') continue;
    const seed = section.group.seed ?? [];
    const rows = data.groups?.[section.group.group] ?? [];
    const own = rows.filter((r) => !seed.some((s) => Object.keys(s).every((k) => (s[k] ?? '') === (r[k] ?? ''))));
    if (own.some((r) => Object.values(r).some((v) => (v ?? '').trim() !== ''))) return true;
  }
  return false;
}

function controlComplete(def: DeliverableDef, data: DeliverableData | undefined): boolean {
  const declared = def.sections.flatMap((s) => (s.kind === 'fields' ? s.fields.map((f) => f.field) : [])).filter((f) => CONTROL_FIELDS.includes(f));
  if (!declared.length) return true;
  return declared.every((f) => (data?.fields?.[f] ?? '').trim() !== '');
}

function formFacts(def: DeliverableDef, input: SkillProfileInput): FormFacts {
  const team = input.team;
  const data = team?.docs[def.id];
  const week = team?.currentWeek ?? 0;
  const last = team ? latestStatus(team.status, def.id) : undefined;
  const dod = team ? dodProgress(def, data, week) : { met: 0, total: 0 };
  return {
    def,
    hasData: hasOwnData(def, data),
    filled: dod.total > 0 && dod.met === dod.total,
    controlled: !!data && controlComplete(def, data),
    approved: last?.status === 'approved' || last?.status === 'issued',
    draftedByMember: !!team && team.status.some((r) => r.deliverableId === def.id && r.status === 'in_review' && r.changedBy === input.memberId),
  };
}

/** The level rule, monotone by construction. Team facts raise a row to `reviewed` only once it is already earned. */
export function levelOf(row: Pick<ProfileRow, 'dimension' | 'tickedSteps' | 'verifiableSteps' | 'verifiedSteps' | 'deliverablesApproved' | 'deliverables' | 'deliverablesFilled' | 'deliverablesControlled'> & { formsWithData?: number; uses?: number; successes?: number }): SkillLevel {
  // R132: a fact row (troubleshooting, decisions, retention, execution) is levelled by its uses and successes.
  if (row.uses !== undefined) {
    if (row.uses <= 0) return 'not-started';
    if ((row.successes ?? 0) <= 0) return 'practised';
    return row.deliverablesApproved > 0 ? 'reviewed' : 'verified';
  }
  const started = row.tickedSteps > 0 || (row.formsWithData ?? 0) > 0;
  if (!started) return 'not-started';
  const documentationOnly = row.verifiableSteps === 0 && row.tickedSteps > 0;
  let earned: SkillLevel = 'practised';
  if (row.dimension === 'procedures') {
    const followed = row.deliverables.length > 0 ? (row.formsWithData ?? 0) > 0 && row.deliverablesFilled >= (row.formsWithData ?? 0) && row.deliverablesControlled >= (row.formsWithData ?? 0) : row.verifiedSteps > 0;
    if (followed) earned = 'verified';
  } else if (row.verifiedSteps > 0) {
    earned = 'verified';
  }
  if ((earned === 'verified' || documentationOnly) && row.deliverablesApproved > 0) return 'reviewed';
  return earned;
}

interface RowSpec {
  dimension: Dimension;
  id: string;
  label: string;
  taskIds: string[];
  formIds?: string[];
  standardRefs?: string[];
}

function buildRow(spec: RowSpec, facts: Map<string, TaskFacts>, forms: Map<string, FormFacts>, byFile: Map<string, string>, artifacts: EvidenceArtifact[], asOf?: number): ProfileRow {
  const tasks = spec.taskIds.map((id) => facts.get(id)).filter((f): f is TaskFacts => !!f);
  const formIds = new Set(spec.formIds ?? []);
  for (const f of tasks) for (const file of f.task.deliverables ?? []) {
    const id = byFile.get(file);
    if (id) formIds.add(id);
  }
  const mappedForms = [...formIds].map((id) => forms.get(id)).filter((f): f is FormFacts => !!f);
  const weeks = new Set(tasks.map((f) => f.task.week));
  const seen = new Set<string>();
  let artifactCount = 0;
  for (const a of artifacts) {
    if (seen.has(a.sha256)) continue;
    if ((a.deliverableId && formIds.has(a.deliverableId)) || (typeof a.week === 'number' && weeks.has(a.week))) {
      seen.add(a.sha256);
      artifactCount += 1;
    }
  }
  const sum = (pick: (f: TaskFacts) => number) => tasks.reduce((n, f) => n + pick(f), 0);
  const nextTask = tasks.find((f) => f.ticked < f.required.length)?.task;
  const verifiedStamps = tasks.map((f) => f.lastVerifiedAt).filter((t): t is number => typeof t === 'number');
  const lastVerifiedAt = verifiedStamps.length ? Math.max(...verifiedStamps) : undefined;
  const firstStamps = tasks.map((f) => f.firstVerifiedAt).filter((t): t is number => typeof t === 'number');
  const firstVerifiedAt = firstStamps.length ? Math.min(...firstStamps) : undefined;
  const partial: Omit<ProfileRow, 'level'> = {
    dimension: spec.dimension,
    id: spec.id,
    label: spec.label,
    ...(spec.standardRefs ? { standardRefs: spec.standardRefs } : {}),
    tasks: tasks.map((f) => f.task.id),
    exercisedTasks: tasks.filter((f) => f.ticked > 0).length,
    doneTasks: tasks.filter((f) => f.required.length > 0 && f.ticked === f.required.length).length,
    requiredSteps: sum((f) => f.required.length),
    tickedSteps: sum((f) => f.ticked),
    verifiableSteps: sum((f) => f.verifiable),
    verifiedSteps: sum((f) => f.verified),
    selfAttestedSteps: sum((f) => f.selfAttested),
    verifiedTasks: tasks.filter((f) => f.verified > 0).length,
    inOrderTasks: tasks.filter((f) => f.inOrder).length,
    orderedTasks: tasks.filter((f) => f.ordered).length,
    artifacts: artifactCount,
    deliverables: [...formIds],
    deliverablesFilled: mappedForms.filter((f) => f.filled).length,
    deliverablesControlled: mappedForms.filter((f) => f.controlled).length,
    deliverablesApproved: mappedForms.filter((f) => f.approved).length,
    draftedByMember: mappedForms.filter((f) => f.draftedByMember).length,
    ...(lastVerifiedAt !== undefined ? { lastVerifiedAt } : {}),
    ...(firstVerifiedAt !== undefined && lastVerifiedAt !== undefined ? { firstVerifiedAt, retained: lastVerifiedAt - firstVerifiedAt >= RETENTION_DAYS * DAY_MS } : {}),
    ...(lastVerifiedAt !== undefined && asOf !== undefined ? { current: asOf - lastVerifiedAt <= CURRENT_WINDOW_DAYS * DAY_MS } : {}),
    ...(nextTask ? { next: { taskId: nextTask.id, title: nextTask.title, week: nextTask.week } } : {}),
  };
  return { ...partial, level: levelOf({ ...partial, formsWithData: mappedForms.filter((f) => f.hasData).length }) };
}

const EMPTY_INDICATOR: Indicator = { value: 0, loaded: false };

export function skillProfile(input: SkillProfileInput): SkillProfile {
  const { course, role, registry, cert } = input;
  const own = getTasksByRole(course, role).filter((t) => !isSetupWeek(course, t.week));
  const facts = new Map(own.map((t) => [t.id, taskFacts(t, input)]));
  const forms = new Map(input.deliverables.map((d) => [d.id, formFacts(d, input)]));
  const byFile = new Map(input.deliverables.map((d) => [d.file, d.id]));
  const artifacts = input.artifacts.filter((a) => a.courseId === course.id);
  const row = (spec: RowSpec) => buildRow(spec, facts, forms, byFile, artifacts, input.asOf);
  const tasksMapped = (map: Record<string, string[]>, id: string) => own.filter((t) => (map[t.id] ?? []).includes(id)).map((t) => t.id);
  const idsOf = (map: Record<string, string[]>) => new Set(own.flatMap((t) => map[t.id] ?? []));

  const skillIds = idsOf(registry.SKILL_OF);
  const skills = registry.SKILLS.filter((n) => skillIds.has(n.id)).map((n) => row({ dimension: 'skills', id: n.id, label: n.label, taskIds: tasksMapped(registry.SKILL_OF, n.id), standardRefs: n.objectiveRefs }));
  const toolIds = idsOf(registry.TOOL_OF);
  const tools = registry.TOOLS.filter((t) => toolIds.has(t.id)).map((t) => row({ dimension: 'tools', id: t.id, label: t.label, taskIds: tasksMapped(registry.TOOL_OF, t.id) }));
  const tacticIds = idsOf(registry.TACTIC_OF);
  const tactics = registry.TACTICS.filter((t) => tacticIds.has(t.id)).map((t) => row({ dimension: 'tactics', id: t.id, label: t.label, taskIds: tasksMapped(registry.TACTIC_OF, t.id) }));
  const practiceIds = idsOf(registry.PRACTICE_OF);
  const practices = registry.PRACTICES.filter((p) => practiceIds.has(p.id)).map((p) => row({ dimension: 'practices', id: p.id, label: p.label, taskIds: tasksMapped(registry.PRACTICE_OF, p.id), standardRefs: [p.anchor] }));

  // Procedures: the SOP kinds the role's forms are instances of, and the tasks that execute them.
  const roleForms = roleFormsOf(input.deliverables, role);
  const sopIds = new Set([...idsOf(registry.SOP_OF_TASK), ...roleForms.flatMap((d) => registry.SOP_OF[d.id] ?? [])]);
  const procedures = registry.SOPS.filter((s) => sopIds.has(s.id)).map((s) =>
    row({ dimension: 'procedures', id: s.id, label: s.label, taskIds: tasksMapped(registry.SOP_OF_TASK, s.id), formIds: roleForms.filter((d) => (registry.SOP_OF[d.id] ?? []).includes(s.id)).map((d) => d.id), standardRefs: s.standardRefs })
  );

  // Standards: tagged on the role's tasks and steps, or cited by the role's forms.
  const standardOfCode = new Map(registry.CONTROLS.map((c) => [c.code, c.standard]));
  const taggedTasks = new Map<string, string[]>();
  for (const t of own) for (const fw of new Set([...t.frameworks, ...t.steps.flatMap((s) => s.frameworks ?? [])])) taggedTasks.set(fw, [...(taggedTasks.get(fw) ?? []), t.id]);
  const citing = new Map<string, { forms: string[]; codes: Set<string> }>();
  for (const d of roleForms) for (const code of registry.CONTROL_OF[d.id] ?? []) {
    const std = standardOfCode.get(code);
    if (!std) continue;
    const entry = citing.get(std) ?? { forms: [], codes: new Set<string>() };
    if (!entry.forms.includes(d.id)) entry.forms.push(d.id);
    entry.codes.add(code);
    citing.set(std, entry);
  }
  const standards = registry.STANDARDS.filter((s) => taggedTasks.has(s.id) || citing.has(s.id)).map((s) =>
    row({ dimension: 'standards', id: s.id, label: s.label, taskIds: taggedTasks.get(s.id) ?? [], formIds: citing.get(s.id)?.forms ?? [], standardRefs: [...(citing.get(s.id)?.codes ?? [])] })
  );

  // Exam domains: the registry's map for the self-authored courses, `learn[0]` for the cloud ones.
  const domains = cert.CERT
    ? cert.CERT.domains.map((d) => row({ dimension: 'domains', id: d.id, label: d.name, taskIds: own.filter((t) => domainOf(cert.CERT!, cert.DOMAIN_OF, t)?.id === d.id).map((t) => t.id) }))
    : [];

  const abilities = abilityIndicators(input, own, facts, forms, skills);
  const timing = timingOf([...facts.values()].flatMap((f) => f.minutes));
  const taskIdsOfForm = (id: string) => own.filter((t) => (t.deliverables ?? []).some((file) => byFile.get(file) === id)).map((t) => t.id);

  // R132 — troubleshooting: the fault, incident and triage tables of the role's forms, retries that verified, flags cleared.
  const troubleshooting: ProfileRow[] = [];
  if (input.team) {
    for (const d of roleForms) for (const g of registry.TROUBLE_GROUPS.filter((x) => x.form === d.id || x.form === formBase(d.id))) {
      const section = d.sections.find((sec) => sec.kind === 'group' && sec.group.group === g.group);
      const rows = ownRows(d, input.team.docs[d.id], g.group);
      const re = new RegExp(g.resolved, 'i');
      troubleshooting.push(factRow({ dimension: 'troubleshooting', id: `trouble.${d.id}.${g.group}`, label: section?.kind === 'group' ? section.group.label : g.group, uses: rows.length, successes: rows.filter((r) => filled(r[g.outcome]) && re.test(r[g.outcome] ?? '')).length, deliverables: [d.id], tasks: taskIdsOfForm(d.id), approved: forms.get(d.id)?.approved ? 1 : 0 }));
    }
  }
  troubleshooting.push(factRow({ dimension: 'troubleshooting', id: 'trouble.retries', label: 'Verified after a failed paste', uses: abilities.persistence.value + abilities.partialProgress.value, successes: abilities.persistence.value, tasks: own.map((t) => t.id) }));
  if (abilities.flagsCleared.loaded) troubleshooting.push(factRow({ dimension: 'troubleshooting', id: 'trouble.flags', label: 'Stuck flags raised and cleared', uses: abilities.flagsCleared.of ?? 0, successes: abilities.flagsCleared.value }));

  // R132 — decisions: the decision blocks of the role's forms, and the reasons written on their rows.
  const decisions: ProfileRow[] = [];
  if (input.team) {
    for (const d of roleForms) {
      const data = input.team.docs[d.id];
      const approved = forms.get(d.id)?.approved ? 1 : 0;
      for (const b of decisionBlocksOf(d)) {
        const k = decisionKey(b.id);
        const chosen = filled(data?.fields[k]) && data?.fields[`${k}:by`] === input.memberId;
        const justified = chosen && b.questions.filter((q) => q.required).every((q) => filled(data?.fields[q.field]));
        const at = Number(data?.fields[`${k}:at`]);
        decisions.push(factRow({ dimension: 'decisions', id: `decision.${d.id}.${b.id}`, label: b.title, uses: chosen ? 1 : 0, successes: justified ? 1 : 0, deliverables: [d.id], tasks: taskIdsOfForm(d.id), approved: chosen ? approved : 0, ...(chosen && Number.isFinite(at) && at > 0 ? { lastAt: at, firstAt: at } : {}) }));
      }
      const keys: { key: string; group?: string }[] = d.sections.flatMap((sec) => (sec.kind === 'fields' ? sec.fields.filter((f) => isRationaleKey(f.field)).map((f) => ({ key: f.field })) : sec.kind === 'group' ? sec.group.columns.filter((c) => isRationaleKey(c.field)).map((c) => ({ key: c.field, group: sec.group.group })) : []));
      if (!keys.length) continue;
      let offered = 0;
      let written = 0;
      for (const { key: fieldKey, group } of keys) {
        if (!group) {
          offered += 1;
          if (filled(data?.fields[fieldKey])) written += 1;
        } else {
          const rows = ownRows(d, data, group);
          offered += rows.length;
          written += rows.filter((r) => filled(r[fieldKey])).length;
        }
      }
      decisions.push(factRow({ dimension: 'decisions', id: `reasons.${d.id}`, label: `${d.title}: reasons written`, uses: offered, successes: written, deliverables: [d.id], tasks: taskIdsOfForm(d.id), approved: written ? approved : 0 }));
    }
  }

  // R132 — retention: every verified skill, with the gap between its first and last verification.
  const retention: ProfileRow[] = skills
    .filter((r) => r.verifiedSteps > 0 && r.firstVerifiedAt !== undefined)
    .map((r) => factRow({ dimension: 'retention', id: r.id, label: r.label, uses: r.verifiedTasks, successes: r.retained ? 1 : 0, tasks: r.tasks, firstAt: r.firstVerifiedAt, lastAt: r.lastVerifiedAt }));

  // R132 — execution: the execution indicators as rows, only those whose facts were handed in.
  const exec = (id: string, label: string, i: Indicator) => (i.loaded ? [factRow({ dimension: 'execution', id, label, uses: i.of ?? 0, successes: i.value })] : []);
  const execution: ProfileRow[] = [
    ...exec('exec.in-order', 'Steps verified in order', abilities.inOrder),
    ...exec('exec.first-try', 'First-try verifications', abilities.firstTry),
    ...exec('exec.evidence-named', 'Files named to convention', abilities.evidenceNaming),
    ...exec('exec.dod-met', 'Definition-of-Done checks met', abilities.dodMet),
    ...exec('exec.doc-control', 'Document control complete', abilities.docControl),
    ...exec('exec.on-time', 'Tasks verified by the due date', abilities.onTime),
  ];

  const rows: Record<Dimension, ProfileRow[]> = { skills, tools, procedures, tactics, practices, standards, domains, evidence: [], documentation: [], collaboration: [], ability: [], execution, troubleshooting, decisions, retention };
  const notStarted = (list: ProfileRow[]) => list.filter((r) => r.level === 'not-started');
  return {
    courseId: course.id,
    role,
    denominator: DENOMINATOR,
    rows,
    abilities,
    gaps: { domains: notStarted(domains), skills: notStarted(skills), sops: notStarted(procedures) },
    loaded: { team: !!input.team, own: !!input.own },
    draftedForms: draftedFormsOf(input).map((d) => d.id),
    timing,
  };
}

/** The forms the member's role drafts: its own lane (the owner is the RACI drafter by content invariant). */
function draftedFormsOf(input: SkillProfileInput): DeliverableDef[] {
  return input.deliverables.filter((d) => d.owner === input.role || d.raci?.drafts === input.role);
}

function abilityIndicators(input: SkillProfileInput, own: Task[], facts: Map<string, TaskFacts>, forms: Map<string, FormFacts>, skillRows: ProfileRow[]): AbilityIndicators {
  const { course, role, memberId, evidence, team, own: mine, registry } = input;
  const ownIds = new Set(own.map((t) => t.id));
  let verified = 0;
  let firstTry = 0;
  let persistence = 0;
  let verifiable = 0;
  let partial = 0;
  let commandVerifiable = 0;
  let commandVerified = 0;
  let receipted = 0;
  const days = new Set<string>();
  const weeks = new Set<number>();
  for (const t of own) {
    for (const s of verifiableSteps(t.steps.filter((x) => !x.optional))) {
      verifiable += 1;
      const runsCommand = !!(s.command || s.commands?.length);
      if (runsCommand) commandVerifiable += 1;
      const rec = evidence[key(t.id, s.id)];
      if (!rec) continue;
      if (rec.verified) {
        verified += 1;
        if (runsCommand) commandVerified += 1;
        if (input.receipts?.[key(t.id, s.id)]) receipted += 1;
        if (rec.attempts <= 1) firstTry += 1;
        else persistence += 1;
      } else if (rec.matchedTokens > 0) {
        partial += 1;
      }
      for (const at of [rec.firstAttemptAt, rec.verifiedAt]) if (typeof at === 'number') days.add(localDay(at));
    }
    if ((facts.get(t.id)?.ticked ?? 0) > 0) weeks.add(t.week);
  }
  const artifacts = input.artifacts.filter((a) => a.courseId === course.id);
  for (const a of artifacts) if (a.hashedAt) days.add(localDay(a.hashedAt));
  const gradedWeeks = course.weeks.filter((w) => isGradedWeek(course, w.number)).length;

  let teammateSteps = 0;
  for (const t of course.tasks) {
    if (ownIds.has(t.id) || isSetupWeek(course, t.week)) continue;
    teammateSteps += t.steps.filter((s) => !s.optional && input.isStepDone(t.id, s.id)).length;
  }

  const teamOr = (compute: () => Indicator): Indicator => (team ? { ...compute(), loaded: true } : EMPTY_INDICATOR);
  const ownOr = (compute: () => Indicator): Indicator => (mine ? { ...compute(), loaded: true } : EMPTY_INDICATOR);
  const byMe = (status: DeliverableStatus['status'][]) => (team?.status ?? []).filter((r) => r.changedBy === memberId && status.includes(r.status)).length;
  const roleForms = roleFormsOf(input.deliverables, role);
  const handoffs = own.flatMap((t) => (t.handoff ?? []).filter((h) => h.deliverable).map((h) => h.deliverable!));
  // R108: the forms the role drafts, the control codes they cite, and the latest instructor review per form.
  const draftForms = draftedFormsOf(input);
  // R111: the share of a team fold that sits on the forms the role drafts.
  const dodOver = (defs: DeliverableDef[]) => defs.reduce((acc, d) => {
    const p = dodProgress(d, team!.docs[d.id], team!.currentWeek);
    return { value: acc.value + p.met, of: acc.of + p.total };
  }, { value: 0, of: 0 });
  const controlOver = (defs: DeliverableDef[]) => {
    const withData = defs.filter((d) => forms.get(d.id)?.hasData);
    return { value: withData.filter((d) => forms.get(d.id)?.controlled).length, of: withData.length };
  };
  const approvedOver = (defs: DeliverableDef[]) => ({ value: defs.filter((d) => latestReview(d.id)?.status === 'approved').length, of: defs.length });
  // R111: the RACI role each move belongs to; a move back to draft is a reviewer's return or a drafter's reopen.
  const raciOf = new Map(input.deliverables.filter((d) => d.raci).map((d) => [d.id, d.raci!]));
  const expectedRoles = (status: DeliverableStatus['status'], r: NonNullable<DeliverableDef['raci']>): string[] =>
    status === 'in_review' ? [r.drafts] : status === 'approved' || status === 'issued' ? [r.approves] : [r.reviews, r.drafts];
  const codesOf = (defs: DeliverableDef[]) => new Set(defs.flatMap((d) => input.registry.CONTROL_OF[d.id] ?? []));
  const latestReview = (deliverableId: string) => (team?.reviews ?? []).filter((r) => r.deliverableId === deliverableId).sort((a, b) => b.at - a.at)[0];
  const allFacts = [...facts.values()];

  // R132 — the troubleshooting, change and decision reads over the role's forms (team facts).
  const groupRead = (list: { form: string; group: string }[], success: (row: Record<string, string>, g: never) => boolean) => {
    let value = 0;
    let of = 0;
    for (const d of roleForms) for (const g of list.filter((x) => x.form === d.id || x.form === formBase(d.id))) {
      const rows = ownRows(d, team!.docs[d.id], g.group);
      of += rows.length;
      value += rows.filter((r) => success(r, g as never)).length;
    }
    return { value, of };
  };
  const faults = () => groupRead(registry.TROUBLE_GROUPS, (r, g: { outcome: string; resolved: string }) => filled(r[g.outcome]) && new RegExp(g.resolved, 'i').test(r[g.outcome] ?? ''));
  const rollbacks = () => groupRead(registry.CHANGE_GROUPS, (r, g: { rollback: string }) => filled(r[g.rollback]));
  const decisionRead = () => {
    let offered = 0;
    let chosen = 0;
    let justified = 0;
    let approved = 0;
    for (const d of roleForms) for (const b of decisionBlocksOf(d)) {
      offered += 1;
      const data = team!.docs[d.id];
      const k = decisionKey(b.id);
      if (!filled(data?.fields[k]) || data?.fields[`${k}:by`] !== memberId) continue;
      chosen += 1;
      if (b.questions.filter((q) => q.required).every((q) => filled(data?.fields[q.field]))) justified += 1;
      if (forms.get(d.id)?.approved) approved += 1;
    }
    return { offered, chosen, justified, approved };
  };
  const rationale = () => {
    let offered = 0;
    let written = 0;
    for (const d of roleForms) {
      const data = team!.docs[d.id];
      for (const sec of d.sections) {
        if (sec.kind === 'fields') for (const f of sec.fields) if (isRationaleKey(f.field)) {
          offered += 1;
          if (filled(data?.fields[f.field])) written += 1;
        }
        if (sec.kind === 'group') {
          const cols = sec.group.columns.filter((c) => isRationaleKey(c.field));
          if (!cols.length) continue;
          const rows = ownRows(d, data, sec.group.group);
          offered += rows.length * cols.length;
          written += rows.reduce((n, r) => n + cols.filter((c) => filled(r[c.field])).length, 0);
        }
      }
    }
    return { value: written, of: offered };
  };
  // R132 — own facts from stamps and the cohort calendar.
  const onTime = () => {
    let value = 0;
    let of = 0;
    for (const f of allFacts) {
      if (f.lastVerifiedAt === undefined) continue;
      const due = input.weekDue!(f.task.week);
      if (due === undefined) continue;
      of += 1;
      if (f.lastVerifiedAt <= due) value += 1;
    }
    return { value, of };
  };
  const velocity = () => {
    const asOf = input.asOf!;
    let recent = 0;
    let prior = 0;
    for (const t of own) for (const s of verifiableSteps(t.steps.filter((x) => !x.optional))) {
      const rec = evidence[key(t.id, s.id)];
      if (!rec?.verified || typeof rec.verifiedAt !== 'number') continue;
      const age = asOf - rec.verifiedAt;
      if (age < 0) continue;
      if (age <= VELOCITY_DAYS * DAY_MS) recent += 1;
      else if (age <= 2 * VELOCITY_DAYS * DAY_MS) prior += 1;
    }
    return { value: recent, of: prior };
  };
  const verifiedSkills = skillRows.filter((r) => r.verifiedSteps > 0);
  const flagEvents = mine?.flagEvents;
  const marks = team?.marks;
  const roleFormIds = new Set(roleForms.map((d) => d.id));

  return {
    firstTry: { value: firstTry, of: verified, loaded: true },
    persistence: { value: persistence, of: verified, loaded: true },
    partialProgress: { value: partial, of: verifiable, loaded: true },
    evidenceNaming: { value: artifacts.filter((a) => a.nameOk).length, of: artifacts.length, loaded: true },
    activeDays: { value: days.size, loaded: true },
    activeWeeks: { value: [...weeks].filter((w) => isGradedWeek(course, w)).length, of: gradedWeeks, loaded: true },
    reportsFiled: ownOr(() => ({ value: mine!.reports.filter((r) => r.memberId === memberId && r.courseId === course.id).length, loaded: true })),
    reportsResolved: ownOr(() => ({ value: mine!.reports.filter((r) => r.memberId === memberId && r.courseId === course.id && r.status === 'resolved').length, loaded: true })),
    notesWritten: ownOr(() => ({ value: mine!.notes.filter((n) => n.courseId === course.id && n.note.trim() !== '').length, loaded: true })),
    drafted: teamOr(() => ({ value: byMe(['in_review']), loaded: true })),
    reviewed: teamOr(() => ({ value: byMe(['approved', 'draft']), loaded: true })),
    issued: teamOr(() => ({ value: byMe(['issued']), loaded: true })),
    submissionsFrozen: teamOr(() => ({ value: team!.submissions.filter((s) => s.submittedBy === memberId).length, loaded: true })),
    rubricAllGreen: teamOr(() => {
      const minePacks = team!.submissions.filter((s) => s.submittedBy === memberId);
      return { value: minePacks.filter((s) => Object.values(s.snapshot?.categories ?? {}).length > 0 && Object.values(s.snapshot.categories).every(Boolean)).length, of: minePacks.length, loaded: true };
    }),
    dodMet: teamOr(() => ({ ...dodOver(roleForms), loaded: true, own: dodOver(draftForms) })),
    teammateStepsTicked: { value: teammateSteps, loaded: true },
    handoffsCompleted: teamOr(() => ({ value: handoffs.filter((id) => forms.get(id)?.approved).length, of: handoffs.length, loaded: true })),
    peerReviewsGiven: mine?.peerReviews ? { value: mine.peerReviews.done, of: mine.peerReviews.assigned, loaded: true } : EMPTY_INDICATOR,
    inOrder: { value: allFacts.filter((f) => f.inOrder).length, of: allFacts.filter((f) => f.ordered).length, loaded: true },
    commandSteps: { value: commandVerified, of: commandVerifiable, loaded: true },
    controlsCited: teamOr(() => ({ value: codesOf(draftForms.filter((d) => forms.get(d.id)?.approved)).size, of: codesOf(draftForms).size, loaded: true })),
    docControl: teamOr(() => ({ ...controlOver(roleForms), loaded: true, own: controlOver(draftForms) })),
    instructorApproved: teamOr(() => ({ ...approvedOver(roleForms), loaded: true, own: approvedOver(draftForms) })),
    raciRespected: teamOr(() => {
      // R117: a move made as cover for an empty role is neither respected nor broken, so it is not counted.
      const moves = team!.status.filter((r) => r.changedBy === memberId && raciOf.has(r.deliverableId) && coverOf(r.note) === null);
      return { value: moves.filter((r) => expectedRoles(r.status, raciOf.get(r.deliverableId)!).includes(r.role)).length, of: moves.length, loaded: true };
    }),
    receipted: input.receipts ? { value: receipted, of: verified, loaded: true } : EMPTY_INDICATOR,
    faultsResolved: teamOr(() => ({ ...faults(), loaded: true })),
    changeRollback: teamOr(() => ({ ...rollbacks(), loaded: true })),
    decisionsRecorded: teamOr(() => {
      const d = decisionRead();
      return { value: d.chosen, of: d.offered, loaded: true };
    }),
    decisionsJustified: teamOr(() => {
      const d = decisionRead();
      return { value: d.justified, of: d.chosen, loaded: true };
    }),
    decisionsApproved: teamOr(() => {
      const d = decisionRead();
      return { value: d.approved, of: d.chosen, loaded: true };
    }),
    rationaleWritten: teamOr(() => ({ ...rationale(), loaded: true })),
    reviewMarks: marks ? { value: marks.filter((m) => roleFormIds.has(m.deliverableId) && m.ok).length, of: marks.filter((m) => roleFormIds.has(m.deliverableId)).length, loaded: true } : EMPTY_INDICATOR,
    flagsCleared: flagEvents
      ? (() => {
          const mineEvents = flagEvents.filter((e) => e.courseId === course.id && e.memberId === memberId);
          const raised = mineEvents.filter((e) => e.kind === 'raised').length;
          return { value: Math.min(raised, mineEvents.filter((e) => e.kind === 'cleared').length), of: raised, loaded: true };
        })()
      : EMPTY_INDICATOR,
    onTime: input.weekDue ? { ...onTime(), loaded: true } : EMPTY_INDICATOR,
    retention: { value: verifiedSkills.filter((r) => r.retained).length, of: verifiedSkills.length, loaded: true },
    skillsCurrent: input.asOf !== undefined ? { value: verifiedSkills.filter((r) => r.current).length, of: verifiedSkills.length, loaded: true } : EMPTY_INDICATOR,
    learningVelocity: input.asOf !== undefined ? { ...velocity(), loaded: true } : EMPTY_INDICATOR,
    rehashConfirmed: input.rehashes
      ? (() => {
          const latest = latestRehashes(input.rehashes!);
          return { value: artifacts.filter((a) => latest.get(a.sha256)?.ok).length, of: artifacts.length, loaded: true };
        })()
      : EMPTY_INDICATOR,
  };
}

/** One member across courses: distinct ids by the best level reached anywhere. */
export function skillPortfolio(profiles: SkillProfile[]): SkillPortfolio {
  const best = new Map<string, SkillLevel>();
  const consider = (rows: ProfileRow[]) => {
    for (const r of rows) {
      const k = `${r.dimension}:${r.id}`;
      const prev = best.get(k);
      if (!prev || levelRank(r.level) > levelRank(prev)) best.set(k, r.level);
    }
  };
  for (const p of profiles) for (const d of ['skills', 'tools', 'procedures', 'tactics', 'practices', 'standards'] as const) consider(p.rows[d]);
  const ids = (dimension: Dimension, atLeast: SkillLevel) => [...best].filter(([k, l]) => k.startsWith(`${dimension}:`) && levelRank(l) >= levelRank(atLeast)).map(([k]) => k.slice(dimension.length + 1)).sort();
  let domainsVerified = 0;
  let domainsTotal = 0;
  for (const p of profiles) {
    domainsTotal += p.rows.domains.length;
    domainsVerified += p.rows.domains.filter((r) => levelRank(r.level) >= levelRank('verified')).length;
  }
  return {
    skillsVerified: ids('skills', 'verified'),
    skillsPractised: ids('skills', 'practised'),
    toolsUsed: ids('tools', 'practised'),
    sopsFollowed: ids('procedures', 'verified'),
    standardsPractised: ids('standards', 'practised'),
    tacticsPractised: ids('tactics', 'practised'),
    practicesPractised: ids('practices', 'practised'),
    domainsVerified,
    domainsTotal,
  };
}

import type { Course, Step, Task } from './types';
import type { DeliverableReview, DeliverableSubmission, EvidenceArtifact, StepEvidence, StepNote, TaskReport } from './data/types';
import type { DeliverableData, DeliverableDef } from './docs/types';
import type { DeliverableStatus } from './docs/lifecycle';
import type { CertContent, SkillsContent } from './content/read';
import type { Dimension } from './docs/metricCatalogue';
import type { SkillLevel } from './docs/skillsCopy';
import { getTasksByRole, isGradedWeek, isSetupWeek } from './course-helpers';
import { verifiableSteps } from './evidenceLedger';
import { latestStatus } from './docs/lifecycle';
import { dodProgress } from './docs/dod';
import { domainOf } from './docs/certs';
import { localDay } from './localDate';

/**
 * R107 — the member profile: what one person has practised, verified and had
 * reviewed, per skill, tool, procedure, tactic, practice, standard and exam
 * domain, as a pure projection over the facts the platform already keeps.
 *
 * It follows `metrics.ts` to the letter: nothing here is a source of truth,
 * nothing is scored, ranked or badged, and speed is not measured. Timestamps
 * are read for one purpose only, the ORDER steps were verified in; no
 * duration is ever computed. The denominator is the member's own ticks on
 * required steps of the role's tasks in graded and advanced weeks; the team's
 * documents feed only the procedure, standard, documentation and
 * collaboration rows and the `reviewed` level, and the labels say so.
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
  level: SkillLevel;
  /** The first mapped task not yet done. */
  next?: { taskId: string; title: string; week: number };
}

export interface Indicator {
  value: number;
  of?: number;
  /** False when the facts behind it were not handed in (team and own facts load on the course page). */
  loaded: boolean;
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
}

export interface TeamFacts {
  docs: Record<string, DeliverableData>;
  status: DeliverableStatus[];
  submissions: DeliverableSubmission[];
  reviews: DeliverableReview[];
  currentWeek: number;
}

export interface OwnFacts {
  notes: StepNote[];
  reports: TaskReport[];
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
}

export interface SkillProfile {
  courseId: string;
  role: string;
  denominator: string;
  rows: Record<Dimension, ProfileRow[]>;
  abilities: AbilityIndicators;
  gaps: { domains: ProfileRow[]; skills: ProfileRow[]; sops: ProfileRow[] };
  loaded: { team: boolean; own: boolean };
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
}

function taskFacts(task: Task, input: SkillProfileInput): TaskFacts {
  const required = task.steps.filter((s) => !s.optional);
  const ticked = required.filter((s) => input.isStepDone(task.id, s.id)).length;
  const checkable = verifiableSteps(required);
  let verified = 0;
  let selfAttested = 0;
  const stamps: number[] = [];
  for (const s of checkable) {
    const rec = input.evidence[key(task.id, s.id)];
    if (rec?.verified) {
      verified += 1;
      const at = rec.verifiedAt ?? rec.firstAttemptAt;
      if (typeof at === 'number') stamps.push(at);
    } else if (input.isStepDone(task.id, s.id)) {
      selfAttested += 1;
    }
  }
  const ordered = stamps.length >= 2;
  const inOrder = ordered && stamps.every((t, i) => i === 0 || t >= stamps[i - 1]);
  return { task, required, ticked, verifiable: checkable.length, verified, selfAttested, ordered, inOrder };
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
export function levelOf(row: Pick<ProfileRow, 'dimension' | 'tickedSteps' | 'verifiableSteps' | 'verifiedSteps' | 'deliverablesApproved' | 'deliverables' | 'deliverablesFilled' | 'deliverablesControlled'> & { formsWithData?: number }): SkillLevel {
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

function buildRow(spec: RowSpec, facts: Map<string, TaskFacts>, forms: Map<string, FormFacts>, byFile: Map<string, string>, artifacts: EvidenceArtifact[]): ProfileRow {
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
    inOrderTasks: tasks.filter((f) => f.inOrder).length,
    orderedTasks: tasks.filter((f) => f.ordered).length,
    artifacts: artifactCount,
    deliverables: [...formIds],
    deliverablesFilled: mappedForms.filter((f) => f.filled).length,
    deliverablesControlled: mappedForms.filter((f) => f.controlled).length,
    deliverablesApproved: mappedForms.filter((f) => f.approved).length,
    draftedByMember: mappedForms.filter((f) => f.draftedByMember).length,
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
  const row = (spec: RowSpec) => buildRow(spec, facts, forms, byFile, artifacts);
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
  const roleForms = input.deliverables.filter((d) => d.owner === role || d.shared || d.raci?.drafts === role || d.raci?.reviews === role || d.raci?.approves === role);
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

  const rows: Record<Dimension, ProfileRow[]> = { skills, tools, procedures, tactics, practices, standards, domains, evidence: [], documentation: [], collaboration: [], ability: [] };
  const notStarted = (list: ProfileRow[]) => list.filter((r) => r.level === 'not-started');
  return {
    courseId: course.id,
    role,
    denominator: DENOMINATOR,
    rows,
    abilities: abilityIndicators(input, own, facts, forms),
    gaps: { domains: notStarted(domains), skills: notStarted(skills), sops: notStarted(procedures) },
    loaded: { team: !!input.team, own: !!input.own },
  };
}

function abilityIndicators(input: SkillProfileInput, own: Task[], facts: Map<string, TaskFacts>, forms: Map<string, FormFacts>): AbilityIndicators {
  const { course, role, memberId, evidence, team, own: mine } = input;
  const ownIds = new Set(own.map((t) => t.id));
  let verified = 0;
  let firstTry = 0;
  let persistence = 0;
  let verifiable = 0;
  let partial = 0;
  const days = new Set<string>();
  const weeks = new Set<number>();
  for (const t of own) {
    for (const s of verifiableSteps(t.steps.filter((x) => !x.optional))) {
      verifiable += 1;
      const rec = evidence[key(t.id, s.id)];
      if (!rec) continue;
      if (rec.verified) {
        verified += 1;
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
  const roleForms = input.deliverables.filter((d) => d.owner === role || d.shared);
  const handoffs = own.flatMap((t) => (t.handoff ?? []).filter((h) => h.deliverable).map((h) => h.deliverable!));

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
    dodMet: teamOr(() => {
      let met = 0;
      let total = 0;
      for (const d of roleForms) {
        const p = dodProgress(d, team!.docs[d.id], team!.currentWeek);
        met += p.met;
        total += p.total;
      }
      return { value: met, of: total, loaded: true };
    }),
    teammateStepsTicked: { value: teammateSteps, loaded: true },
    handoffsCompleted: teamOr(() => ({ value: handoffs.filter((id) => forms.get(id)?.approved).length, of: handoffs.length, loaded: true })),
    peerReviewsGiven: EMPTY_INDICATOR,
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

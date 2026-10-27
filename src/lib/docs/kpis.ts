import type { MetricAudience } from './metricCatalogue';

/**
 * R108 — the KPI board: the numbers a course keeps per member, each a ratio of
 * counts the metric catalogue already defines (`metricId`) with its numerator
 * and denominator in words, the kind of fact it reads, and one line for the
 * student and one for a hiring reader.
 *
 * R132 — the workforce-readiness board: seven families of four, twenty-eight
 * KPIs, asking one question of the record: can this member perform at a
 * professional level in a real work environment? Technical capability,
 * problem solving, execution, decision making, teamwork, professionalism and
 * growth. A KPI may be `scored` (a published score in `scoring.ts` reads it)
 * and may carry a `unit` of minutes (two recorded stamps, never a clock the
 * projection reads). The sixteen rows of the R108 board stay in
 * `DEPRECATED_KPIS` with the row that replaced each, because the ontology
 * deprecates and never removes an id.
 *
 * The rows are the contract the board page, the dashboard, the portfolio
 * export, the cohort report, `content/ontology/kpis.json` and the per-course
 * skills sheet share; `src/lib/kpiBoard.ts` computes them and no others.
 */

export type KpiFamily = 'technical' | 'problem-solving' | 'execution' | 'decision-making' | 'teamwork' | 'professionalism' | 'growth';
/** own = the member's own ticks, pastes and hashes; team = a team document fact; content = read from the registries and the course. */
export type KpiFact = 'own' | 'team' | 'content';
/** ratio = value of a denominator; count = a value with no denominator; minutes = a median between two recorded stamps. */
export type KpiUnit = 'ratio' | 'count' | 'minutes';

export interface KpiFamilyDef {
  id: KpiFamily;
  /** Five words or fewer. */
  label: string;
  /** Twenty-five words or fewer. */
  definition: string;
  /** The question a hiring reader asks of this family; twenty-five words or fewer. */
  asks: string;
}

export interface KpiDef {
  /** 'kpi.<family>.<slug>' */
  id: string;
  family: KpiFamily;
  /** Five words or fewer. */
  label: string;
  /** The catalogue row it reads. */
  metricId: string;
  /** Twenty-five words or fewer. */
  numerator: string;
  /** Twenty-five words or fewer. */
  denominator: string;
  fact: KpiFact;
  unit: KpiUnit;
  valueTo: MetricAudience[];
  /** Twenty-five words or fewer; third person. */
  whyMember: string;
  /** Twenty-five words or fewer; third person. */
  whyCompany: string;
  /** A JSON pointer into the `capstone-kpi-board/2` DTO. */
  agentField: string;
  /** First-try is never shown alone. */
  beside?: 'persistence';
  /** R132: a published score reads this row. */
  scored: boolean;
}

export interface DeprecatedKpi {
  id: string;
  /** The R132 row that carries the same count, or null when the count left the board. */
  replacedBy: string | null;
  deprecatedIn: string;
}

const ALL: MetricAudience[] = ['member', 'company', 'platform'];
const MC: MetricAudience[] = ['member', 'company'];

export const KPI_FAMILIES: KpiFamilyDef[] = [
  { id: 'technical', label: 'Technical capability', definition: 'What the member can do: skills, commands and procedures proven by output against the exam and the role.', asks: 'Can this member operate the tools and run the procedures the job needs?' },
  { id: 'problem-solving', label: 'Problem solving', definition: 'Faults logged and resolved, verifications reached after a failed paste, stuck flags cleared, and the minutes between first paste and proof.', asks: 'When something breaks, does this member find and fix it, and how long does it take?' },
  { id: 'execution', label: 'Professional execution', definition: 'How the work was done: steps in order, first pastes, evidence named to convention, every check due met.', asks: 'Does this member follow the runbook as written and leave evidence an auditor can find?' },
  { id: 'decision-making', label: 'Decision making', definition: 'Decisions recorded against at least three options, justified, approved by the team, and changes with a rollback written.', asks: 'Does this member weigh options, say why, and plan the way back?' },
  { id: 'teamwork', label: 'Teamwork', definition: 'Hand-offs closed, RACI respected, peer reviews given and steps ticked on teammates’ tasks.', asks: 'Does this member hand work on cleanly and hold their lane in a team?' },
  { id: 'professionalism', label: 'Professionalism', definition: 'On time against the cohort calendar, documents controlled, controls cited, instructor approval earned.', asks: 'Does this member deliver on time, to standard, and to the reviewer’s satisfaction?' },
  { id: 'growth', label: 'Growth', definition: 'Skills proved twice, retained across weeks, verified faster week on week, and the gap to a work role closing.', asks: 'Is this member still learning, and keeping what was learned?' },
];

const k = (family: KpiFamily, slug: string, label: string, metricId: string, numerator: string, denominator: string, fact: KpiFact, unit: KpiUnit, scored: boolean, valueTo: MetricAudience[], whyMember: string, whyCompany: string, index: number, beside?: 'persistence'): KpiDef => ({
  id: `kpi.${family}.${slug}`, family, label, metricId, numerator, denominator, fact, unit, valueTo, whyMember, whyCompany, agentField: `/kpis/${index}`, ...(beside ? { beside } : {}), scored,
});

export const KPIS: KpiDef[] = [
  // ── Technical capability ─────────────────────────────────────────────────
  k('technical', 'skills-verified', 'Skills verified', 'metric.skill-verified',
    'Skills with at least one step verified from pasted output.',
    'Skills the role practises that carry a verifiable step.',
    'own', 'ratio', true, ALL,
    'Each verified skill names a task where the pasted output held every expected token.',
    'Skills backed by matched output rather than a tick, with the task behind each one named.', 0),
  k('technical', 'exam-weight-verified', 'Exam weight verified', 'metric.domain-weight-verified',
    'The published exam weight of every domain with a verified step, summed.',
    'The published exam weight of every domain the role practises, summed.',
    'own', 'ratio', true, ALL,
    'Shows which share of the exam blueprint the verified work already touches.',
    'Reads the verified work against the published exam domains and their weights.', 1),
  k('technical', 'commands-verified', 'Commands verified', 'metric.tool-commands-verified',
    'Verified required steps that run a command.',
    'Verifiable required steps that run a command.',
    'own', 'ratio', true, MC,
    'Command steps proven by their output; the table below splits them by tool.',
    'Tool use proven by output, per command step, split by tool in the table.', 2),
  k('technical', 'procedures-to-standard', 'Procedures to standard', 'metric.procedure-to-standard',
    'Followed procedures whose form cites a control code and was approved or issued.',
    'Procedures followed: every check due met and document control complete.',
    'team', 'ratio', false, ALL,
    'A runbook followed to a named control and approved by the team; a team fact.',
    'Procedures run to a cited NIST, ISO or SOC 2 control and approved by the team.', 3),
  // ── Problem solving ──────────────────────────────────────────────────────
  k('problem-solving', 'faults-resolved', 'Faults resolved', 'metric.trouble-resolved',
    'Fault, incident and triage rows whose outcome column reads resolved.',
    'Fault, incident and triage rows the team filled on the forms of the role.',
    'team', 'ratio', true, ALL,
    'Every fault the team logged, and how many ended resolved; a team fact.',
    'Troubleshooting success read from the fault and incident records the team kept.', 4),
  k('problem-solving', 'persistence', 'Verified after retry', 'metric.ability-persistence',
    'Verified steps that took more than one paste.',
    'Verified steps.',
    'own', 'ratio', true, MC,
    'A step that failed once and was then proven: the fault was found and fixed.',
    'How often a failed first paste was followed by a verified fix.', 5),
  k('problem-solving', 'flags-cleared', 'Stuck flags cleared', 'metric.ability-flags-cleared',
    'Stuck flags the member raised and later cleared.',
    'Stuck flags the member raised.',
    'own', 'ratio', true, MC,
    'Asking for help and then getting past it both count; a flag never cleared says so.',
    'Blockers raised and worked through, from the append-only flag history.', 6),
  k('problem-solving', 'time-to-resolution', 'Time to resolution', 'metric.time-to-verify',
    'The median minutes from the first paste to the verification, per verified step with both stamps.',
    'Verified steps with both stamps; the share within the hour is the percentage.',
    'own', 'minutes', true, MC,
    'The median, so one long gap moves nothing; a step left over a day is counted apart.',
    'Minutes from first attempt to proof, read from two recorded stamps, never a clock.', 7),
  // ── Professional execution ───────────────────────────────────────────────
  k('execution', 'steps-in-order', 'Steps verified in order', 'metric.procedure-in-order',
    'Tasks whose verifiable steps were verified in the authored order.',
    'Tasks with two or more verification records, so an order exists.',
    'own', 'ratio', true, MC,
    'The procedure was run as written, step after step.',
    'Runbooks followed in order, read from the sequence of verification records.', 8),
  k('execution', 'first-try', 'First-try verifications', 'metric.ability-first-try',
    'Verified steps whose first paste held every expected token.',
    'Verified steps.',
    'own', 'ratio', false, MC,
    'Shown beside retries: a step verified after several pastes counts for as much.',
    'How often the first paste matched, printed beside how often it took more than one.', 9, 'persistence'),
  k('execution', 'evidence-named', 'Files named to convention', 'metric.evidence-naming',
    'Hashed files named to the evidence convention.',
    'Hashed files.',
    'own', 'ratio', false, MC,
    'Evidence an auditor can find: date, team, tool and subject in every file name.',
    'Chain-of-custody hygiene: hashed files that follow the naming convention.', 10),
  k('execution', 'dod-met', 'Definition-of-Done met', 'metric.doc-dod-met',
    'Definition-of-Done checks met on the forms of the role.',
    'Checks due on those forms through the current week.',
    'team', 'ratio', false, ALL,
    'Every check a form must pass this week, met or not, counted for the team.',
    'Work products measured against their own acceptance checks, week by week.', 11),
  // ── Decision making ──────────────────────────────────────────────────────
  k('decision-making', 'decisions-recorded', 'Decisions recorded', 'metric.decision-recorded',
    'Decision blocks with an option chosen by this member.',
    'Decision blocks on the forms of the role, each with at least three options.',
    'team', 'ratio', true, ALL,
    'Each decision names the options weighed, the one chosen, who chose and when.',
    'Component, configuration and architecture choices made against named alternatives.', 12),
  k('decision-making', 'decisions-justified', 'Decisions justified', 'metric.decision-justified',
    'Recorded decisions with every required supporting question answered.',
    'Decisions recorded by this member.',
    'team', 'ratio', true, ALL,
    'A choice with its reason, the rejected options and the risk accepted.',
    'Judgment shown in writing: rationale, rejected options, risk and rollback per decision.', 13),
  k('decision-making', 'decisions-approved', 'Decisions approved', 'metric.decision-approved',
    'Recorded decisions on a form the team approved or issued.',
    'Decisions recorded by this member.',
    'team', 'ratio', true, ALL,
    'The team stood behind the choice; a team fact.',
    'Decisions that passed the team’s review and were issued.', 14),
  k('decision-making', 'change-rollback', 'Changes with rollback', 'metric.procedure-change-recorded',
    'Change-record rows with a rollback or back-out written.',
    'Change-record rows on the forms of the role.',
    'team', 'ratio', true, MC,
    'Every change the team logged, and how many had a way back written down first.',
    'Change discipline: a rollback plan on every recorded change.', 15),
  // ── Teamwork ─────────────────────────────────────────────────────────────
  k('teamwork', 'handoffs', 'Hand-offs completed', 'metric.collab-handoffs',
    'Hand-offs whose named deliverable reached approved or issued.',
    'Hand-offs of the tasks of the role.',
    'team', 'ratio', true, MC,
    'Work handed to another role that the team then approved or issued.',
    'Cross-role hand-offs closed by an approved document.', 16),
  k('teamwork', 'raci-respected', 'RACI respected', 'metric.collab-raci-respected',
    'Lifecycle moves the member made in the role the RACI names for that move.',
    'Lifecycle moves the member made on forms with a RACI.',
    'team', 'ratio', true, MC,
    'Submitting as the drafter, approving as the approver: the lane was held.',
    'Role discipline on documents, read from who moved what.', 17),
  k('teamwork', 'peer-reviews-given', 'Peer reviews given', 'metric.collab-peer-reviews-given',
    'Blind peer reviews the member completed.',
    'Peer reviews assigned to the member.',
    'own', 'ratio', true, MC,
    'Reviews of other teams’ frozen work, answered question by question.',
    'Review work done for others, from the blind review queue.', 18),
  k('teamwork', 'teammate-steps', 'Teammate steps ticked', 'metric.collab-teammate-steps',
    'Required steps the member ticked on another role’s tasks.',
    'No denominator: a count.',
    'own', 'count', false, MC,
    'Steps done on a teammate’s task, so a lane short of hands still finished.',
    'Help given across roles, counted in steps.', 19),
  // ── Professionalism ──────────────────────────────────────────────────────
  k('professionalism', 'on-time', 'On time', 'metric.ability-deadline-adherence',
    'Tasks whose last verification fell on or before the week due date.',
    'Tasks with a verification; needs the cohort start date.',
    'own', 'ratio', true, MC,
    'The due date comes from the cohort calendar; without one the row says so.',
    'Reliability against a calendar, read from the verification stamps and the cohort start.', 20),
  k('professionalism', 'document-control', 'Document control complete', 'metric.doc-control-complete',
    'Forms with data whose document-control block is complete.',
    'Forms of the role with data.',
    'team', 'ratio', true, MC,
    'Id, version, owner, date and status on every document the team filled.',
    'Document control kept on every filled form: id, version, owner, date, status.', 21),
  k('professionalism', 'controls-cited', 'Controls cited', 'metric.standard-controls-cited',
    'Distinct control codes on approved or issued forms the role drafts.',
    'Distinct control codes the forms of the role cite.',
    'team', 'ratio', true, MC,
    'The published controls the approved documents cite, by code.',
    'Control codes practised through approved documents, by standard.', 22),
  k('professionalism', 'instructor-approved', 'Instructor approved', 'metric.doc-instructor-approved',
    'Forms of the role whose latest instructor review is approved.',
    'Forms of the role.',
    'team', 'ratio', true, MC,
    'Forms an instructor reviewed and approved; the latest review per form counts.',
    'Forms with an instructor verdict of approved, the latest review per form.', 23),
  // ── Growth ───────────────────────────────────────────────────────────────
  k('growth', 'skills-transferred', 'Skills proved twice', 'metric.skill-transfer',
    'Skills with verified steps on two or more distinct tasks.',
    'Skills with at least one verified step.',
    'own', 'ratio', true, ALL,
    'A skill verified on two different tasks was carried from one context to another.',
    'Verification repeated on a second task is harder to reach by luck or by copying.', 24),
  k('growth', 'retention', 'Skills retained', 'metric.ability-recall',
    'Skills verified again seven or more days after their first verification.',
    'Skills with at least one verified step.',
    'own', 'ratio', true, MC,
    'Proof a week or more apart: the skill stayed.',
    'Retention read from the gap between two verification stamps on the same skill.', 25),
  k('growth', 'learning-velocity', 'Learning velocity', 'metric.time-learning-velocity',
    'Verified steps in the twenty-eight days before the page clock.',
    'Verified steps in the twenty-eight days before those; the percentage caps at one hundred.',
    'own', 'ratio', false, MC,
    'This month against last: rising, level or slowing, from the verification stamps.',
    'Pace of verified work, month on month, from recorded stamps.', 26),
  k('growth', 'profile-coverage', 'Profile coverage', 'metric.profile-coverage',
    'Required competencies of the selected work role or environment profile at verified or better.',
    'Required competencies the selected work role or environment profile names.',
    'own', 'ratio', true, ALL,
    'Measures the verified skills against a job role or a published company profile, with the untaught gap named.',
    'Coverage of the competencies a work role or an environment profile requires, read from verified steps.', 27),
];

/** R108's sixteen, deprecated in R132 with the row that carries each count now. */
export const DEPRECATED_KPIS: DeprecatedKpi[] = [
  { id: 'kpi.ability.skills-verified', replacedBy: 'kpi.technical.skills-verified', deprecatedIn: '2.0.0' },
  { id: 'kpi.ability.exam-weight-verified', replacedBy: 'kpi.technical.exam-weight-verified', deprecatedIn: '2.0.0' },
  { id: 'kpi.ability.profile-coverage', replacedBy: 'kpi.growth.profile-coverage', deprecatedIn: '2.0.0' },
  { id: 'kpi.ability.skills-transferred', replacedBy: 'kpi.growth.skills-transferred', deprecatedIn: '2.0.0' },
  { id: 'kpi.execution.steps-in-order', replacedBy: 'kpi.execution.steps-in-order', deprecatedIn: '2.0.0' },
  { id: 'kpi.execution.first-try', replacedBy: 'kpi.execution.first-try', deprecatedIn: '2.0.0' },
  { id: 'kpi.execution.commands-verified', replacedBy: 'kpi.technical.commands-verified', deprecatedIn: '2.0.0' },
  { id: 'kpi.execution.evidence-named', replacedBy: 'kpi.execution.evidence-named', deprecatedIn: '2.0.0' },
  { id: 'kpi.procedure.followed-to-standard', replacedBy: 'kpi.technical.procedures-to-standard', deprecatedIn: '2.0.0' },
  { id: 'kpi.procedure.dod-met', replacedBy: 'kpi.execution.dod-met', deprecatedIn: '2.0.0' },
  { id: 'kpi.procedure.controls-cited', replacedBy: 'kpi.professionalism.controls-cited', deprecatedIn: '2.0.0' },
  { id: 'kpi.procedure.document-control', replacedBy: 'kpi.professionalism.document-control', deprecatedIn: '2.0.0' },
  { id: 'kpi.outcome.rubric-green', replacedBy: null, deprecatedIn: '2.0.0' },
  { id: 'kpi.outcome.handoffs', replacedBy: 'kpi.teamwork.handoffs', deprecatedIn: '2.0.0' },
  { id: 'kpi.outcome.instructor-approved', replacedBy: 'kpi.professionalism.instructor-approved', deprecatedIn: '2.0.0' },
  { id: 'kpi.outcome.capstone-filed', replacedBy: null, deprecatedIn: '2.0.0' },
];

/* ── helpers (lowercase: never written to a document) ───────────────────── */

const byId = new Map(KPIS.map((x) => [x.id, x]));

export function kpiOf(id: string): KpiDef | undefined {
  return byId.get(id);
}

export function kpisOf(family: KpiFamily): KpiDef[] {
  return KPIS.filter((x) => x.family === family);
}

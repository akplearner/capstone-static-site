import type { MetricAudience } from './metricCatalogue';

/**
 * R108 — the KPI board: the sixteen numbers a course keeps per member, four
 * families of four, each a ratio of counts the metric catalogue already
 * defines (`metricId`) with its numerator and denominator in words, the kind
 * of fact it reads, and one line for the student and one for a hiring
 * reader. Nothing here is scored, ranked or badged, and nothing reads a
 * clock: the catalogue's Time rows are excluded by rule and no KPI may name
 * one.
 *
 * The rows are the contract the board page, the dashboard, the portfolio
 * export, the cohort report, `content/ontology/kpis.json` and the per-course
 * skills sheet share; `src/lib/kpiBoard.ts` computes them and no others.
 */

export type KpiFamily = 'ability' | 'execution' | 'procedure' | 'outcome';
/** own = the member's own ticks, pastes and hashes; team = a team document fact; content = read from the registries and the course. */
export type KpiFact = 'own' | 'team' | 'content';

export interface KpiFamilyDef {
  id: KpiFamily;
  /** Five words or fewer. */
  label: string;
  /** Twenty-five words or fewer. */
  definition: string;
}

export interface KpiDef {
  /** 'kpi.<family>.<slug>' */
  id: string;
  family: KpiFamily;
  /** Five words or fewer. */
  label: string;
  /** The catalogue row it reads; never a Time row. */
  metricId: string;
  /** Twenty-five words or fewer. */
  numerator: string;
  /** Twenty-five words or fewer. */
  denominator: string;
  fact: KpiFact;
  valueTo: MetricAudience[];
  /** Twenty-five words or fewer; third person. */
  whyMember: string;
  /** Twenty-five words or fewer; third person. */
  whyCompany: string;
  /** A JSON pointer into the `capstone-kpi-board/1` DTO. */
  agentField: string;
  /** First-try is never shown alone. */
  beside?: 'persistence';
  scored: false;
}

const ALL: MetricAudience[] = ['member', 'company', 'platform'];
const MC: MetricAudience[] = ['member', 'company'];

export const KPI_FAMILIES: KpiFamilyDef[] = [
  { id: 'ability', label: 'Ability', definition: 'What the member can do, read from verified steps against the exam, a work role or a published profile.' },
  { id: 'execution', label: 'Execution', definition: 'How the work was done: steps in order, first pastes, commands proven by output, evidence hygiene.' },
  { id: 'procedure', label: 'Procedure and standards', definition: 'Runbooks followed to a cited standard, checks met, controls cited, documents controlled; team facts, labelled as such.' },
  { id: 'outcome', label: 'Outcome', definition: 'What the team delivered: rubric categories met, hand-offs closed, instructor approval and the capstone filed.' },
];

const k = (family: KpiFamily, slug: string, label: string, metricId: string, numerator: string, denominator: string, fact: KpiFact, valueTo: MetricAudience[], whyMember: string, whyCompany: string, index: number, beside?: 'persistence'): KpiDef => ({
  id: `kpi.${family}.${slug}`, family, label, metricId, numerator, denominator, fact, valueTo, whyMember, whyCompany, agentField: `/kpis/${index}`, ...(beside ? { beside } : {}), scored: false,
});

export const KPIS: KpiDef[] = [
  // ── Ability ──────────────────────────────────────────────────────────────
  k('ability', 'skills-verified', 'Skills verified', 'metric.skill-verified',
    'Skills with at least one step verified from pasted output.',
    'Skills the role practises that carry a verifiable step.',
    'own', ALL,
    'Each verified skill names a task where the pasted output held every expected token.',
    'Skills backed by matched output rather than a tick, with the task behind each one named.', 0),
  k('ability', 'exam-weight-verified', 'Exam weight verified', 'metric.domain-weight-verified',
    'The published exam weight of every domain with a verified step, summed.',
    'The published exam weight of every domain the role practises, summed.',
    'own', ALL,
    'Shows which share of the exam blueprint the verified work already touches.',
    'Reads the verified work against the published exam domains and their weights.', 1),
  k('ability', 'profile-coverage', 'Profile coverage', 'metric.profile-coverage',
    'Required competencies of the selected work role or environment profile at verified or better.',
    'Required competencies the selected work role or environment profile names.',
    'own', ALL,
    'Measures the verified skills against a job role or a published company profile, with the untaught gap named.',
    'Coverage of the competencies a work role or an environment profile requires, read from verified steps.', 2),
  k('ability', 'skills-transferred', 'Skills proved twice', 'metric.skill-transfer',
    'Skills with verified steps on two or more distinct tasks.',
    'Skills with at least one verified step.',
    'own', ALL,
    'A skill verified on two different tasks was carried from one context to another.',
    'Verification repeated on a second task is harder to reach by luck or by copying.', 3),
  // ── Execution ────────────────────────────────────────────────────────────
  k('execution', 'steps-in-order', 'Steps verified in order', 'metric.procedure-in-order',
    'Tasks whose verifiable steps were verified in the authored order.',
    'Tasks with two or more verification records, so an order exists.',
    'own', MC,
    'The procedure was run as written, step after step: a sequence fact, never a duration.',
    'Runbooks followed in order, read from the sequence of verification records alone.', 4),
  k('execution', 'first-try', 'First-try verifications', 'metric.ability-first-try',
    'Verified steps whose first paste held every expected token.',
    'Verified steps.',
    'own', MC,
    'Shown beside persistence: a step verified after several pastes counts for as much.',
    'How often the first paste matched, printed beside how often it took more than one.', 5, 'persistence'),
  k('execution', 'commands-verified', 'Commands verified', 'metric.tool-commands-verified',
    'Verified required steps that run a command.',
    'Verifiable required steps that run a command.',
    'own', MC,
    'Command steps proven by their output; the table below splits them by tool.',
    'Tool use proven by output, per command step, split by tool in the table.', 6),
  k('execution', 'evidence-named', 'Files named to convention', 'metric.evidence-naming',
    'Hashed files named to the evidence convention.',
    'Hashed files.',
    'own', MC,
    'Evidence an auditor can find: date, team, tool and subject in every file name.',
    'Chain-of-custody hygiene: hashed files that follow the naming convention.', 7),
  // ── Procedure and standards ──────────────────────────────────────────────
  k('procedure', 'followed-to-standard', 'Procedures to standard', 'metric.procedure-to-standard',
    'Followed procedures whose form cites a control code and was approved or issued.',
    'Procedures followed: every check due met and document control complete.',
    'team', ALL,
    'A runbook followed to a named control and approved by the team; a team fact.',
    'Procedures run to a cited NIST, ISO or SOC 2 control and approved by the team.', 8),
  k('procedure', 'dod-met', 'Definition-of-Done met', 'metric.doc-dod-met',
    'Definition-of-Done checks met on the forms of the role.',
    'Checks due on those forms through the current week.',
    'team', ALL,
    'Every check a form must pass this week, met or not, counted for the team.',
    'Work products measured against their own acceptance checks, week by week.', 9),
  k('procedure', 'controls-cited', 'Controls cited', 'metric.standard-controls-cited',
    'Distinct control codes on approved or issued forms the role drafts.',
    'Distinct control codes the forms of the role cite.',
    'team', MC,
    'The published controls the approved documents cite, by code.',
    'Control codes practised through approved documents, by standard.', 10),
  k('procedure', 'document-control', 'Document control complete', 'metric.doc-control-complete',
    'Forms with data whose document-control block is complete.',
    'Forms of the role with data.',
    'team', MC,
    'Id, version, owner, date and status on every document the team filled.',
    'Document control kept on every filled form: id, version, owner, date, status.', 11),
  // ── Outcome ──────────────────────────────────────────────────────────────
  k('outcome', 'rubric-green', 'Submissions rubric-green', 'metric.doc-rubric-green',
    'Frozen submissions by the member with all four rubric categories true.',
    'Frozen submissions by the member.',
    'team', MC,
    'A frozen submission that met all four rubric categories at once.',
    'Submissions that met every rubric category when frozen.', 12),
  k('outcome', 'handoffs', 'Hand-offs completed', 'metric.collab-handoffs',
    'Hand-offs whose named deliverable reached approved or issued.',
    'Hand-offs of the tasks of the role.',
    'team', MC,
    'Work handed to another role that the team then approved or issued.',
    'Cross-role hand-offs closed by an approved document.', 13),
  k('outcome', 'instructor-approved', 'Instructor approved', 'metric.doc-instructor-approved',
    'Forms of the role whose latest instructor review is approved.',
    'Forms of the role.',
    'team', MC,
    'Forms an instructor reviewed and approved; the latest review per form counts.',
    'Forms with an instructor verdict of approved, the latest review per form.', 14),
  k('outcome', 'capstone-filed', 'Capstone filed', 'metric.outcome-capstone-filed',
    'The capstone document, issued.',
    'One capstone per course.',
    'team', ALL,
    'The final document issued; the weeks cleared are printed beside it.',
    'The course capstone filed by the team, with the weeks cleared beside it.', 15),
];

/* ── helpers (lowercase: never written to a document) ───────────────────── */

const byId = new Map(KPIS.map((x) => [x.id, x]));

export function kpiOf(id: string): KpiDef | undefined {
  return byId.get(id);
}

export function kpisOf(family: KpiFamily): KpiDef[] {
  return KPIS.filter((x) => x.family === family);
}

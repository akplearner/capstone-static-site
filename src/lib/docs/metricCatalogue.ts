/**
 * R107 — the metric catalogue: every number the platform keeps, or could
 * keep, per member as they gain skills, with its definition (numerator and
 * denominator), the facts it reads, who it is worth something to, and an
 * honest status. Nothing here is scored, ranked or badged; effort is measured,
 * never rewarded, and speed is not measured at all.
 *
 *   computed          read today from the facts that exist (`(course)` in the
 *                     note: needs the course page's team facts)
 *   deferred          the fact exists and is not wired this round
 *   needs-events      needs a fact the platform does not record (an event log)
 *   needs-validators  needs a check that reads real state, not pasted text
 *   needs-consent     needs a consent the member has not been asked for
 *   excluded          will not be built
 *
 * The rows are the contract the member profile, the dashboard, the portfolio
 * export and `content/ontology/metrics.json` share; the projection in
 * `src/lib/skillProfile.ts` computes the `computed` ones and no others.
 */

export type Dimension = 'skills' | 'tools' | 'procedures' | 'tactics' | 'practices' | 'standards' | 'domains' | 'evidence' | 'documentation' | 'collaboration' | 'ability';
export type MetricStatus = 'computed' | 'deferred' | 'needs-events' | 'needs-validators' | 'needs-consent' | 'excluded';
export type MetricAudience = 'member' | 'company' | 'platform';

export interface MetricDef {
  /** 'metric.<slug>' */
  id: string;
  /** Five words or fewer. */
  label: string;
  dimension: Dimension;
  /** Thirty words or fewer; names the numerator and the denominator. */
  definition: string;
  /** Fact names from `METRIC_INPUTS`. */
  inputs: string[];
  valueTo: MetricAudience[];
  status: MetricStatus;
  scored: false;
  /** Twenty-five words or fewer. */
  note?: string;
}

/** The facts a metric may read. A metric that names anything else is a bug. */
export const METRIC_INPUTS = [
  'course', 'registry', 'cert', 'controls',
  'step_completions', 'step_evidence', 'evidence_artifacts',
  'deliverables', 'deliverable_status', 'deliverable_submissions', 'deliverable_reviews', 'peer_review_assignments',
  'task_reports', 'step_notes', 'step_flags', 'cohorts',
  'environment_profile', 'work_roles',
  'learner_outcomes', 'memberships',
  'verification_receipts', 'rehash_checks',
] as const;

const ALL: MetricAudience[] = ['member', 'company', 'platform'];
const MC: MetricAudience[] = ['member', 'company'];
const MP: MetricAudience[] = ['member', 'platform'];
const PL: MetricAudience[] = ['platform'];
const CP: MetricAudience[] = ['company', 'platform'];

const m = (slug: string, label: string, dimension: Dimension, definition: string, inputs: string[], valueTo: MetricAudience[], status: MetricStatus, note?: string): MetricDef => ({
  id: `metric.${slug}`, label, dimension, definition, inputs, valueTo, status, scored: false, ...(note ? { note } : {}),
});

export const METRICS: MetricDef[] = [
  // ── Skills ───────────────────────────────────────────────────────────────
  m('skill-exercised', 'Skills exercised', 'skills', 'Mapped graded tasks with at least one required step ticked, over mapped tasks.', ['step_completions', 'registry', 'course'], ALL, 'computed'),
  m('skill-practised', 'Skills practised', 'skills', 'Skills with at least one ticked required step, over the skills the course maps.', ['step_completions', 'registry'], ALL, 'computed'),
  m('skill-verified', 'Skills verified', 'skills', 'Skills with at least one verifiable step verified from pasted output, over skills with a verifiable step.', ['step_evidence', 'registry'], ALL, 'computed'),
  m('skill-fully-verified', 'Skills fully verified', 'skills', 'Skills whose every verifiable step is verified, over skills with a verifiable step.', ['step_evidence', 'registry'], MC, 'computed'),
  m('skill-reviewed', 'Skills reviewed', 'skills', 'Verified skills whose mapped deliverable the team had approved or issued, over verified skills.', ['step_evidence', 'deliverable_status', 'registry'], MC, 'computed', 'A team fact: the document was approved, not the member alone. Loads on the course page.'),
  m('skill-next-gap', 'Next task per gap', 'skills', 'For each skill not started, the first mapped task not done, in course order.', ['step_completions', 'registry', 'course'], ['member'], 'computed'),
  m('skill-state-proven', 'Skills state-proven', 'skills', 'Skills confirmed by a validator that read the real system state, over skills.', [], ALL, 'needs-validators', 'A first validator parses pasted ufw output as state in the browser; results are not yet recorded, and a lab agent is Phase 2.'),
  m('skill-attested', 'Skills attested', 'skills', 'Skills carried by a signed attestation with an environment hash, over skills.', [], ['company', 'platform'], 'needs-validators'),
  // ── Tools ────────────────────────────────────────────────────────────────
  m('tool-used', 'Tools used', 'tools', 'Tools of tasks with at least one ticked required step, over the tools the course derives.', ['step_completions', 'registry'], ALL, 'computed'),
  m('tool-verified', 'Tools verified', 'tools', 'Tools of tasks with at least one verified step, over tools used.', ['step_evidence', 'registry'], ALL, 'computed'),
  m('tool-commands-verified', 'Commands verified per tool', 'tools', 'Verified steps whose command belongs to the tool, over verifiable steps with such a command.', ['step_evidence', 'course', 'registry'], MC, 'computed'),
  m('tool-evidenced', 'Tools evidenced by file', 'tools', 'Hashed artifacts whose filename tool segment resolves to the tool, over hashed artifacts.', ['evidence_artifacts', 'registry'], MC, 'computed'),
  m('tool-command-copied', 'Commands copied per tool', 'tools', 'Copy or paste events per tool.', [], MP, 'needs-events'),
  // ── Procedures ───────────────────────────────────────────────────────────
  m('procedure-started', 'Procedures started', 'procedures', 'SOP kinds with a mapped form holding data or a mapped task ticked, over the SOP kinds the course maps.', ['deliverables', 'step_completions', 'registry'], ALL, 'computed', 'Form data is a team fact; loads on the course page.'),
  m('procedure-followed', 'Procedures followed', 'procedures', 'SOP kinds whose mapped forms meet every Definition-of-Done check due and have document control complete, over started.', ['deliverables', 'course', 'registry'], ALL, 'computed', 'Loads on the course page.'),
  m('procedure-evidenced', 'Procedures evidenced', 'procedures', 'Followed SOP kinds whose evidence fields point at a hashed artifact, over followed.', ['deliverables', 'evidence_artifacts', 'registry'], MC, 'computed', 'Loads on the course page.'),
  m('procedure-to-standard', 'Procedures to standard', 'procedures', 'Followed SOP kinds whose form cites a parsed control code and was approved or issued, over followed.', ['deliverables', 'deliverable_status', 'controls', 'registry'], ALL, 'computed', 'Loads on the course page.'),
  m('procedure-in-order', 'Steps verified in order', 'procedures', 'Tasks whose verifiable steps were verified in authored order, over tasks with two or more verification records. A sequence fact only.', ['step_evidence', 'course'], MC, 'computed'),
  m('procedure-change-recorded', 'Change rows complete', 'procedures', 'Change-record rows with what, where, backup, approval and rollback filled, over change rows on the role’s forms.', ['deliverables', 'course'], MC, 'computed', 'Loads on the course page.'),
  m('procedure-custody-kept', 'Custody rows hashed', 'procedures', 'Custody-log rows whose digest matches a hashed artifact, over custody rows.', ['deliverables', 'evidence_artifacts'], MC, 'computed', 'Loads on the course page.'),
  m('procedure-drilled', 'Drills completed', 'procedures', 'Recovery and incident SOP kinds with the drill task verified and the record approved, over such SOP kinds.', ['step_evidence', 'deliverable_status', 'registry'], MC, 'computed', 'Loads on the course page.'),
  m('procedure-guide-followed', 'Guide procedures followed', 'procedures', 'Server+ guide procedures referenced by a ticked step, over guide procedures the role’s tasks reference.', ['step_completions', 'course'], ['member'], 'computed', 'Server+ only.'),
  m('procedure-backup-before-write', 'Backup before write', 'procedures', 'Config writes preceded by their backup command, over config writes.', [], MC, 'needs-events', 'Steps are ticked as a whole; commands are not.'),
  m('procedure-state-proven', 'Procedures state-proven', 'procedures', 'SOP outcomes read from system state by a validator, over followed.', [], ALL, 'needs-validators'),
  // ── Tactics and practices ────────────────────────────────────────────────
  m('tactic-practised', 'Tactics practised', 'tactics', 'ATT&CK or ATLAS tactics of tasks with at least one ticked step, over the tactics the course maps.', ['step_completions', 'registry'], ALL, 'computed'),
  m('tactic-verified', 'Tactics verified', 'tactics', 'Tactics of tasks with at least one verified step, over tactics practised.', ['step_evidence', 'registry'], ALL, 'computed'),
  m('tactic-cited', 'Technique ids cited', 'tactics', 'Technique ids typed into forms that resolve to the matrices, over technique fields.', ['deliverables'], MC, 'deferred', 'Team rows carry no author.'),
  m('practice-practised', 'Practices practised', 'practices', 'Engineering practices of tasks with at least one ticked step, over the practices the course maps.', ['step_completions', 'registry'], ALL, 'computed'),
  m('practice-verified', 'Practices verified', 'practices', 'Practices of tasks with at least one verified step, over practices practised.', ['step_evidence', 'registry'], ALL, 'computed'),
  // ── Standards ────────────────────────────────────────────────────────────
  m('standard-practised', 'Standards practised', 'standards', 'Standards tagged on tasks or steps the member ticked, over standards the course tags.', ['step_completions', 'course'], ALL, 'computed'),
  m('standard-verified', 'Standards verified', 'standards', 'Standards tagged on a verified step, over standards practised.', ['step_evidence', 'course'], ALL, 'computed'),
  m('standard-effectiveness-steps', 'Effectiveness: steps', 'standards', 'Per standard: verified steps over verifiable steps tagged with it.', ['step_evidence', 'course'], ALL, 'computed'),
  m('standard-effectiveness-forms', 'Effectiveness: forms', 'standards', 'Per standard: forms citing it approved with all four rubric categories true, over forms citing it.', ['controls', 'deliverable_submissions', 'deliverable_status'], ALL, 'computed', 'Loads on the course page.'),
  m('standard-effectiveness-sops', 'Effectiveness: procedures', 'standards', 'Per standard: SOP kinds anchored to it followed, over SOP kinds anchored to it.', ['registry', 'deliverables'], ALL, 'computed', 'Loads on the course page.'),
  m('standard-controls-cited', 'Controls cited', 'standards', 'Distinct control codes on approved forms the member’s role drafted.', ['controls', 'deliverable_status', 'course'], MC, 'computed', 'Loads on the course page.'),
  m('standard-control-mapped-by-member', 'Controls typed by member', 'standards', 'Control codes the member typed into form fields that parse, over such fields.', ['deliverables', 'controls'], MC, 'deferred', 'Team rows carry no author.'),
  // ── Exam domains ─────────────────────────────────────────────────────────
  m('domain-practised', 'Domains practised', 'domains', 'Exam domains with at least one ticked task of the role, over domains the course practises.', ['step_completions', 'cert', 'course'], ALL, 'computed'),
  m('domain-verified', 'Domains verified', 'domains', 'Exam domains with at least one verified step, over domains the course practises.', ['step_evidence', 'cert', 'course'], ALL, 'computed'),
  m('domain-weight-verified', 'Exam weight verified', 'domains', 'Sum of the weights of verified domains over the weights the course practises.', ['step_evidence', 'cert'], ALL, 'computed'),
  m('domain-gap-next', 'Next task per domain gap', 'domains', 'The next task of the role that practises a domain not yet practised.', ['step_completions', 'cert', 'course'], ['member'], 'computed'),
  m('domain-recall', 'Domain recall', 'domains', 'A domain re-verified after a gap, over domains verified.', [], MC, 'needs-events'),
  // ── Evidence ─────────────────────────────────────────────────────────────
  m('evidence-steps-verified', 'Steps verified', 'evidence', 'Verified steps over verifiable required steps in graded weeks.', ['step_evidence', 'course'], ALL, 'computed'),
  m('evidence-self-attested', 'Steps self-attested', 'evidence', 'Verifiable required steps ticked without matching output, over verifiable required steps.', ['step_evidence', 'step_completions', 'course'], ALL, 'computed'),
  m('evidence-artifacts', 'Files hashed', 'evidence', 'Distinct hashed files the member saved.', ['evidence_artifacts'], ALL, 'computed'),
  m('evidence-naming', 'Files named to convention', 'evidence', 'Hashed files named to the evidence convention, over hashed files.', ['evidence_artifacts'], MC, 'computed'),
  m('evidence-rehash-confirmed', 'Files re-hashed', 'evidence', 'Files re-hashed later with the same digest, over hashed files.', ['rehash_checks', 'evidence_artifacts'], MC, 'computed', 'The latest check per file counts. The file never leaves the browser.'),
  m('verified-receipted', 'Verified steps receipted', 'evidence', 'Verified steps with a server receipt for a server-issued stamp, over verified steps.', ['verification_receipts', 'step_evidence'], ALL, 'computed', 'Cloud mode only. A receipt records the stamp, not the machine.'),
  m('evidence-hardware-proven', 'Output proven on the lab', 'evidence', 'Steps whose output was verified on the lab, not in the browser, over verified steps.', [], ALL, 'needs-validators'),
  // ── Documentation ────────────────────────────────────────────────────────
  m('doc-drafted', 'Forms drafted', 'documentation', 'Lifecycle rows by the member moving a form to in review.', ['deliverable_status'], MC, 'computed', 'Loads on the course page.'),
  m('doc-reviewed', 'Forms reviewed', 'documentation', 'Lifecycle rows by the member approving or returning a form.', ['deliverable_status'], MC, 'computed', 'Loads on the course page.'),
  m('doc-issued', 'Forms issued', 'documentation', 'Lifecycle rows by the member issuing a form.', ['deliverable_status'], MC, 'computed', 'Loads on the course page.'),
  m('doc-submissions', 'Submissions frozen', 'documentation', 'Frozen submissions by the member.', ['deliverable_submissions'], MC, 'computed', 'Loads on the course page.'),
  m('doc-rubric-green', 'Submissions rubric-green', 'documentation', 'The member’s frozen submissions with all four rubric categories true, over the member’s submissions.', ['deliverable_submissions'], MC, 'computed', 'Loads on the course page.'),
  m('doc-dod-met', 'Definition-of-Done met', 'documentation', 'Definition-of-Done checks met over checks due on the role’s forms through the current week.', ['deliverables', 'course'], ALL, 'computed', 'A team fact; loads on the course page.'),
  m('doc-control-complete', 'Document control complete', 'documentation', 'Forms with the document-control block complete, over the role’s forms.', ['deliverables'], MC, 'computed', 'A team fact; loads on the course page.'),
  m('doc-instructor-approved', 'Instructor approved', 'documentation', 'The role’s forms with an instructor verdict of approved, over the role’s forms.', ['deliverable_reviews'], MC, 'computed', 'Loads on the course page.'),
  // ── Collaboration ────────────────────────────────────────────────────────
  m('collab-teammate-steps', 'Teammate steps ticked', 'collaboration', 'Required steps the member ticked on another role’s tasks.', ['step_completions', 'course'], MC, 'computed'),
  m('collab-handoffs', 'Hand-offs completed', 'collaboration', 'Hand-offs whose named deliverable reached approved or issued, over hand-offs of the role’s tasks.', ['course', 'deliverable_status'], MC, 'computed', 'Loads on the course page.'),
  m('collab-raci-respected', 'RACI respected', 'collaboration', 'Lifecycle transitions the member made in the role the RACI names, over the member’s transitions.', ['deliverable_status', 'course'], MC, 'computed', 'Loads on the course page.'),
  m('collab-peer-reviews-given', 'Peer reviews given', 'collaboration', 'Blind peer reviews the member completed.', ['peer_review_assignments'], MC, 'deferred', 'Read asynchronously by the review bench today.'),
  m('collab-stuck-helped', 'Stuck flags helped', 'collaboration', 'Teammate stuck flags on steps the member had verified.', ['step_flags', 'step_evidence'], ['member'], 'computed', 'Current flags only; loads on the course page.'),
  // ── Ability ──────────────────────────────────────────────────────────────
  m('ability-first-try', 'First-try verifications', 'ability', 'Verified steps with exactly one paste, over verified steps. Shown beside persistence, never alone.', ['step_evidence'], MC, 'computed'),
  m('ability-persistence', 'Persistence', 'ability', 'Verified steps that took more than one paste, over verified steps.', ['step_evidence'], MC, 'computed'),
  m('ability-partial-progress', 'Partial progress', 'ability', 'Verifiable steps with some tokens matched and not verified, over verifiable steps.', ['step_evidence'], ['member'], 'computed'),
  m('ability-investigation-reports', 'Reports filed', 'ability', 'Task reports the member filed, and how many were resolved.', ['task_reports'], MP, 'computed', 'Loads on the course page.'),
  m('ability-investigation-notes', 'Notes written', 'ability', 'Steps the member wrote a note on.', ['step_notes'], ['member'], 'computed', 'Loads on the course page.'),
  m('ability-independence', 'Independence', 'ability', 'Steps verified with no stuck flag ever raised, over verified steps.', [], MC, 'needs-events', 'A cleared flag leaves no trace.'),
  m('ability-consistency-days', 'Active days', 'ability', 'Distinct local days with recorded activity.', ['step_evidence', 'evidence_artifacts'], ['member'], 'computed'),
  m('ability-consistency-weeks', 'Active weeks', 'ability', 'Course weeks with any recorded activity, over graded weeks.', ['step_completions', 'course'], ['member'], 'computed'),
  m('ability-recall', 'Recall', 'ability', 'A verified step re-verified after seven or more days, over verified steps.', [], MC, 'needs-events'),
  m('ability-calibration', 'Calibration', 'ability', 'Stated confidence that matched the outcome, over stated confidences.', [], MC, 'needs-validators'),
  m('ability-fixes-consulted', 'Fixes consulted', 'ability', '"If it does not work" rows opened before a verification, over verifications.', [], ['member'], 'needs-events'),
  m('ability-docs-read', 'Documentation opened', 'ability', 'Documentation links opened per task.', [], ['member'], 'needs-events'),
  m('ability-deadline-adherence', 'Deadline adherence', 'ability', 'Weeks cleared on or before the cohort due date, over graded weeks.', ['cohorts', 'step_completions'], MC, 'deferred', 'No clock is read this round.'),
  m('time-on-task', 'Time on task', 'ability', 'Minutes spent per task.', [], [], 'excluded', 'Speed is not measured.'),
  m('time-to-verify', 'Time to verify', 'ability', 'Minutes from first attempt to verification.', [], [], 'excluded', 'Speed is not measured.'),
  m('time-vs-estimate', 'Time against estimate', 'ability', 'Minutes spent against the authored estimate.', [], [], 'excluded', 'Speed is not measured.'),
  m('rank-any', 'Ranking', 'ability', 'Any ordering of members against each other.', [], [], 'excluded', 'Nothing is ranked.'),
  // ── Platform ─────────────────────────────────────────────────────────────
  m('platform-cohort-domain-coverage', 'Cohort domain coverage', 'domains', 'Per cohort, members with at least one verified step per domain, over members. Instructor aggregate.', ['step_evidence', 'cert', 'cohorts'], PL, 'computed'),
  m('platform-funnel-stage', 'Funnel stages', 'evidence', 'Members who reached each stage in turn, from enrolled to capstone filed, over members enrolled. Instructor aggregate.', ['memberships', 'step_completions', 'step_evidence', 'deliverables'], PL, 'computed', 'Counts per cohort; nobody named.'),
  m('platform-retention-weeks', 'Active weeks bands', 'ability', 'Members per band of graded weeks with any tick: none, one, two or three, four or more. Instructor aggregate.', ['memberships', 'step_completions', 'course'], PL, 'computed'),
  m('content-step-friction', 'Step friction', 'evidence', 'Per verifiable step, members ticked without verification, stuck, or stopped before it, over members with the task.', ['step_completions', 'step_evidence', 'step_flags', 'memberships'], PL, 'computed', 'Steps are ordered, never people.'),
  m('platform-course-verifiability', 'Course verifiability', 'evidence', 'Verifiable required steps over required steps per course. Content only.', ['course'], PL, 'computed'),
  m('platform-skill-coverage', 'Course skill coverage', 'skills', 'Skills, tools, procedures, standards, tactics and practices per course. Content only.', ['registry', 'course'], PL, 'computed'),
  m('platform-cross-platform-signal', 'Cross-platform signal', 'skills', 'A competency-level statement shared with another platform.', [], PL, 'needs-consent'),
  // ── R108: the board, the profiles and the signals the pasted plan named ──
  m('profile-coverage', 'Profile coverage', 'skills', 'Required competencies of a work role or an environment profile at verified or better, over required; the untaught remainder is named.', ['registry', 'step_evidence', 'environment_profile', 'work_roles'], ALL, 'computed'),
  m('skill-transfer', 'Skills proved twice', 'skills', 'Skills with verified steps on two or more distinct tasks, over skills with a verified step.', ['step_evidence', 'registry', 'course'], ALL, 'computed'),
  m('skill-currency', 'Skills current', 'skills', 'Skills whose last verification falls inside the currency window, over skills verified.', ['step_evidence', 'registry'], MC, 'computed', 'A window of days the page supplies; never a duration shown.'),
  m('outcome-capstone-filed', 'Capstone filed', 'documentation', 'The course capstone document issued by the team, one per course, with the weeks cleared beside it.', ['deliverables', 'course'], ALL, 'computed', 'A team fact; loads on the course page.'),
  m('ability-estimate', 'Ability estimate', 'ability', 'A latent ability per objective estimated from item responses on a practice platform.', [], MC, 'needs-consent', 'The practice platform’s side; only a competency-level conclusion may cross, with consent.'),
  m('readiness-band', 'Readiness band', 'ability', 'A pass-likelihood band per exam, validated against reported outcomes.', [], MC, 'needs-consent', 'The practice platform’s side; needs reported outcomes and consent.'),
  m('transfer-unseen', 'Transfer to unseen scenarios', 'skills', 'Verified work on a scenario never practised before, over such scenarios.', [], MC, 'needs-events', 'Needs scenario provenance per event.'),
  m('ability-unassisted', 'Unassisted verifications', 'ability', 'Steps verified with no hint, tutor or agent assistance, over verified steps.', [], MC, 'needs-events', 'Needs the assist level recorded per event.'),
  m('doc-rubric-events', 'Rubric verdicts as events', 'documentation', 'The four category verdicts of each frozen submission, appended as events.', [], PL, 'needs-events', 'The verdicts exist as rows today.'),
  m('outcome-placement', 'Placement reported', 'ability', 'Members who reported a role after a course, over members who answered with the outcome grant on.', ['learner_outcomes'], CP, 'computed', 'Counts only, shown from five answers; the employer name stays with the member.'),
  m('outcome-on-the-job', 'Used at work', 'ability', 'Members who reported using a course at work, over members who answered with the outcome grant on.', ['learner_outcomes'], CP, 'computed', 'Self-reported by the member; an employer report needs a data agreement.'),
  m('platform-roi', 'Platform return', 'ability', 'Cost per verified competency, and employer ramp saved, as the parties report them.', [], CP, 'needs-consent', 'Needs cost and employer data nobody has handed in.'),
  m('time-to-competency', 'Time to competency', 'ability', 'Hours to proficiency per objective.', [], [], 'excluded', 'Speed is not measured.'),
  m('time-task-vs-benchmark', 'Task time against benchmark', 'ability', 'Minutes to resolve a task against an expert or service-level baseline.', [], [], 'excluded', 'Speed is not measured.'),
  m('time-learning-velocity', 'Learning velocity', 'ability', 'Ability gained per study hour.', [], [], 'excluded', 'Speed is not measured.'),
];

/* ── helpers (lowercase: never written to a document) ───────────────────── */

const byId = new Map(METRICS.map((x) => [x.id, x]));

export function metricOf(id: string): MetricDef | undefined {
  return byId.get(id);
}

export function metricsOf(dimension: Dimension): MetricDef[] {
  return METRICS.filter((x) => x.dimension === dimension);
}

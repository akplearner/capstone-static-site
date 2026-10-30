import type { Course, Task } from '../types';
import type { DeliverableDef, FieldGroup } from './types';
import type { Dimension } from './metricCatalogue';

/**
 * R132 — the fourteen categories of "Your record", as DATA.
 *
 * The record used to be twelve figures in the order a course is lived. A hiring
 * reader asks a different question of it: what has this person done, how often,
 * how recently, how well, and does it matter for the job. So the record is
 * fourteen professional categories, each a subcard with the same seven figures
 * (utilization, recent activity, success rate, courses and projects, the trend,
 * the evidence count, industry relevance) and a tier: PROFESSIONAL at ten or
 * more verified uses across every course and retake, BUILDING below it with
 * the count shown. Nothing is hidden for being small.
 *
 * Every form and every graded task of every course lands in at least one
 * category. Forms are tagged here by id (the cloud quarters share their base
 * forms, so a cloud id is read without its quarter prefix); tasks are tagged by
 * the registries they already map to (tools, SOPs, standards, domains) and by
 * their words for the categories no registry names, with `TASK_CATEGORY` for
 * the exceptions. `recordCategories.test.ts` fails when a form or a task falls
 * into no category, so a new course cannot ship without a place on the record.
 *
 * The fault, incident and triage groups the Problem Solving domain reads, the
 * change groups with a rollback the Decision Making family reads, and the
 * free-text rationale columns the Thought Process domain reads are named here
 * too, so the projection never guesses at a column.
 */

export type RecordCategory =
  | 'tools' | 'commands' | 'procedures' | 'standards'
  | 'troubleshooting' | 'investigations' | 'documentation' | 'architectures' | 'configurations'
  | 'communication' | 'collaboration' | 'decisions' | 'projects' | 'exam-domains';

export const RECORD_CATEGORIES: readonly RecordCategory[] = ['tools', 'commands', 'procedures', 'standards', 'troubleshooting', 'investigations', 'documentation', 'architectures', 'configurations', 'communication', 'collaboration', 'decisions', 'projects', 'exam-domains'];

export interface RecordCategoryDef {
  id: RecordCategory;
  /** Three words or fewer. */
  label: string;
  /** What one "use" is; twenty-five words or fewer. */
  unit: string;
  /** What a success is; twenty-five words or fewer. */
  success: string;
  /** The profile dimensions this category folds, if any. */
  dimensions: Dimension[];
  /** The competency areas (`AREA_LABEL` keys) a work role must expect for this category to count toward it. */
  areas: string[];
}

export const PROFESSIONAL_THRESHOLD = 10;

export const CATEGORY_DEFS: RecordCategoryDef[] = [
  { id: 'tools', label: 'Tools', unit: 'A verified step on a task that uses the tool.', success: 'The pasted output held every expected token.', dimensions: ['tools'], areas: ['sysadmin', 'network', 'detect', 'recon', 'vuln', 'cloud', 'automation', 'observe'] },
  { id: 'commands', label: 'Commands', unit: 'A verified required step that runs a command.', success: 'The output matched on the first or a later paste.', dimensions: [], areas: ['sysadmin', 'network', 'detect', 'recon', 'exploit', 'cloud', 'automation', 'virt'] },
  { id: 'procedures', label: 'Procedures', unit: 'A procedure started: a mapped form with data or a mapped task ticked.', success: 'Followed: every check due met and document control complete.', dimensions: ['procedures'], areas: ['ops', 'continuity', 'respond', 'sysadmin', 'docs'] },
  { id: 'standards', label: 'Standards', unit: 'A standard tagged on ticked work or cited by a form of the role.', success: 'Tagged on verified output or cited by an approved form.', dimensions: ['standards'], areas: ['grc', 'audit', 'risk', 'harden', 'docs'] },
  { id: 'troubleshooting', label: 'Troubleshooting', unit: 'A fault, incident or triage row the team logged, or a step verified after a failed paste.', success: 'The outcome column reads resolved, or the retry verified.', dimensions: ['troubleshooting'], areas: ['ops', 'respond', 'sysadmin', 'network', 'observe', 'hardware'] },
  { id: 'investigations', label: 'Investigations', unit: 'A row on an investigation, triage, assessment or audit form, or a hashed evidence file.', success: 'A verdict, a fix or a transfer recorded on the row.', dimensions: ['evidence'], areas: ['forensics', 'detect', 'respond', 'vuln', 'audit', 'recon'] },
  { id: 'documentation', label: 'Documentation', unit: 'A form the member drafted, submitted, reviewed or issued.', success: 'Approved by the team or by an instructor, or every check due met.', dimensions: ['documentation'], areas: ['docs', 'report', 'grc'] },
  { id: 'architectures', label: 'Architectures', unit: 'A row on a design, topology, plan or architecture form of the role.', success: 'The form reached approved or issued.', dimensions: [], areas: ['arch', 'network', 'cloud', 'data', 'continuity'] },
  { id: 'configurations', label: 'Configurations', unit: 'A row on a configuration, baseline or hardening form, or a verified configuration step.', success: 'Verified from output or approved by the team.', dimensions: [], areas: ['harden', 'sysadmin', 'network', 'identity', 'cloud', 'virt'] },
  { id: 'communication', label: 'Communication', unit: 'A hand-off, a report filed, a note written, a peer review given or a handover form.', success: 'The hand-off closed, the report resolved, the review sent.', dimensions: ['collaboration'], areas: ['report', 'docs', 'ops'] },
  { id: 'collaboration', label: 'Collaboration', unit: 'A lifecycle move on a team form, or a step ticked on a teammate’s task.', success: 'The move was made in the role the RACI names.', dimensions: ['collaboration'], areas: ['ops', 'docs', 'grc'] },
  { id: 'decisions', label: 'Decisions', unit: 'A decision block chosen by this member, or a change row with its reason written.', success: 'Justified: every required supporting question answered; approved by the team.', dimensions: ['decisions'], areas: ['arch', 'risk', 'grc', 'continuity', 'ops'] },
  { id: 'projects', label: 'Projects', unit: 'A graded week sealed on a capstone.', success: 'The capstone document issued.', dimensions: [], areas: ['docs', 'ops', 'arch'] },
  { id: 'exam-domains', label: 'Exam domains', unit: 'A verified step on a task that practises the domain.', success: 'Verified; weighted by the published blueprint.', dimensions: ['domains'], areas: ['grc', 'harden', 'network', 'sysadmin', 'cloud', 'detect', 'respond', 'arch'] },
];

const byId = new Map(CATEGORY_DEFS.map((c) => [c.id, c]));
export function categoryOf(id: RecordCategory): RecordCategoryDef {
  return byId.get(id)!;
}

/* ── forms ───────────────────────────────────────────────────────────────── */

/** The cloud quarters share their base forms: `azf_sad`, `awsa_network` read as `sad`, `network`. */
export function formBase(id: string): string {
  return id.replace(/^(azf|aza|azd|awsf|awsa|awsd)_/, '');
}

const A = 'architectures', C = 'configurations', I = 'investigations', T = 'troubleshooting', M = 'communication', D = 'decisions', P = 'projects';
type Cat = RecordCategory;

/**
 * Every form beyond `documentation`, which every form is. A handover, report,
 * briefing or release note is communication; a design, plan or map is an
 * architecture; a baseline, standard, matrix of access or configuration record
 * is a configuration; an incident, triage, assessment, audit or evidence form
 * is an investigation; a fault or change log is troubleshooting; the capstone
 * is the project.
 */
export const FORM_CATEGORY: Record<string, Cat[]> = {
  // security-plus
  scope_roe: [D], asset_inventory: [A, I], risk_register: [D, I], hardening_baseline: [C], change_log: [T, C], pentest_report: [I, M], incident_report: [I, T, M], final_report: [M, P], framework_mapping: [I], security_policy: [D, C], hardening_standard: [C], vm_sop: [C], ir_runbook: [T], evidence_log: [I],
  // mssp
  mssp_engagement: [D, M], mssp_soa: [D, C], mssp_control_matrix: [C], mssp_retest: [I, T], mssp_gap_assessment: [I, D], mssp_detection_rules: [C, I], mssp_metrics: [M], mssp_internal_audit: [I, M], mssp_evidence_packet: [I, P, M],
  // cysa-plus
  cysa_soc_monitoring: [I], cysa_threat_investigation: [I, T], cysa_vulnerability_assessment: [I, D], cysa_incident_response: [I, T, M], cysa_ioc_database: [I], cysa_coverage_validation: [I, C], cysa_alert_triage: [I, T, D], cysa_detection_record: [C, I], cysa_exec_debrief: [M, P], cysa_sensor_deployment: [C], cysa_soc_findings: [I, T], cysa_scan_validation: [I],
  // server-plus
  srv_business_reqs: [A, D], srv_hardware: [A, T, D], srv_bringup: [T, C, D], srv_rack_assets: [A], srv_ip_plan: [A, C, T], srv_standards: [C, D], srv_operations: [T, D, C], srv_as_built: [A, M, P],
  // ccna
  ccna_kit: [A, D], ccna_requirements: [A], ccna_hld: [A, D], ccna_lld: [A, C], ccna_build_log: [C], ccna_validation: [T, I], ccna_security: [C], ccna_ops: [T, D, C], ccna_monitoring: [T, I], ccna_handover: [A, M, P],
  // a-plus
  ap_intake: [C], ap_asset: [A, D], ap_fault: [T], ap_os: [C, D], ap_backup: [C, T], ap_tickets: [T, M], ap_security: [C], ap_handover: [M, P],
  aif_setup: [C], aif_capabilities: [A], aif_responsible: [D, I], aif_eval: [T, I], aif_build: [C], aif_services: [C], aif_governance: [I, M], aif_handover: [M, P],
  dca_setup: [C], dca_image: [C], dca_orchestration: [C, A], dca_network: [C], dca_troubleshoot: [T, I], dca_security: [D, I, M], dca_handover: [M, P],
  awsai_setup: [C], awsai_capabilities: [A], awsai_responsible: [D, I], awsai_eval: [T, I], awsai_build: [C], awsai_services: [C], awsai_governance: [I, M], awsai_handover: [M, P],
  scs_setup: [C], scs_identity: [A, C], scs_baseline: [C], scs_network: [A, C], scs_data: [D, C], scs_detect: [I], scs_incident: [T, I], scs_handover: [M, P],
  ccsp_setup: [C], ccsp_architecture: [A], ccsp_legal: [I, M], ccsp_data: [D, C], ccsp_platform: [A, C], ccsp_appsec: [C], ccsp_operations: [T, I], ccsp_handover: [M, P],
  cka_setup: [C], cka_cluster: [A, C], cka_workloads: [C, A], cka_network: [C], cka_troubleshoot: [T, I], cka_backup: [D, C], cka_handover: [M, P],
  nca_setup: [C], nca_knowledge: [A, C], nca_hardware: [A, D], nca_datacenter: [A, C], nca_operations: [T], nca_troubleshoot: [T, I], nca_handover: [M, P],
  // network-plus
  np_lab: [C], np_design: [A, D], np_ports: [A, C], np_config: [C], np_verify: [T, I], np_changes: [T, D], np_bom: [A, D], np_handover: [A, M, P, D],
  // secai-plus
  secai_lab_rule: [D], secai_system_map: [A], secai_attack_casebook: [I, T], secai_control_set: [C, D], secai_watch_plan: [I, C], secai_governance_pack: [D, I], secai_release_note: [M], secai_release_package: [M, P],
  // cissp
  cissp_d1: [D, I], cissp_d2: [A], cissp_d3: [A, D], cissp_d4: [A, C], cissp_d5: [C], cissp_d6: [I], cissp_d7: [T, D], cissp_d8: [C, D], cissp_release_note: [M], cissp_questionnaire: [M, I], cissp_controls: [C, I], cissp_ssp: [A, M, P, D],
  // cloud quarters, by base
  foundation: [A, C, D], sad: [A, D], api: [A, C], incident: [I, T, M, P], access: [C, I], network: [A, C, T], server: [C, T, D], dr: [T, D, P, A], iac: [C, A, D], change: [D, T], governance: [I, D, M], handover: [M, P, T],
};

/** Every category a form lands in: documentation always, the tagged ones, the project for the capstone, communication and the project for the Portfolio (R142). */
export function formCategories(def: Pick<DeliverableDef, 'id' | 'capstone' | 'portfolio'>): Cat[] {
  const out = new Set<Cat>(['documentation']);
  for (const c of FORM_CATEGORY[def.id] ?? FORM_CATEGORY[formBase(def.id)] ?? []) out.add(c);
  if (def.capstone) out.add('projects');
  if (def.portfolio) {
    out.add('communication');
    out.add('projects');
  }
  return [...out];
}

/* ── the groups the projection reads ────────────────────────────────────── */

/** A fault, incident or triage table: a row is a case; the outcome column read against `resolved` says it closed. */
export interface TroubleGroup {
  form: string;
  group: string;
  /** The column that says how the case ended. */
  outcome: string;
  /** A regex source; a value matching it closes the case. */
  resolved: string;
}

export const TROUBLE_GROUPS: TroubleGroup[] = [
  // R138: a fault table on a form of EVERY role, with a column that says how the case ended.
  { form: 'aif_eval', group: 'attempts', outcome: 'result', resolved: 'Grounded' },
  { form: 'dca_troubleshoot', group: 'attempts', outcome: 'result', resolved: 'Fixed it' },
  { form: 'cka_troubleshoot', group: 'attempts', outcome: 'result', resolved: 'Fixed it' },
  { form: 'nca_troubleshoot', group: 'attempts', outcome: 'result', resolved: 'Fixed it' },
  { form: 'awsai_eval', group: 'attempts', outcome: 'result', resolved: 'Grounded' },
  { form: 'scs_incident', group: 'actions', outcome: 'result', resolved: 'Contained it' },
  { form: 'ccsp_operations', group: 'actions', outcome: 'result', resolved: 'Contained it' },
  { form: 'incident_report', group: 'iocs', outcome: 'attack_type', resolved: '.' },
  { form: 'pentest_report', group: 'findings', outcome: 'remediation', resolved: '.' },
  { form: 'risk_register', group: 'risks', outcome: 'status', resolved: 'closed' },
  { form: 'mssp_detection_rules', group: 'rules', outcome: 'validated', resolved: 'fired' },
  { form: 'mssp_internal_audit', group: 'findings', outcome: 'result', resolved: 'conformity|opportunity' },
  { form: 'cysa_scan_validation', group: 'comparison', outcome: 'agree', resolved: 'yes' },
  { form: 'cysa_coverage_validation', group: 'sources', outcome: 'present', resolved: 'yes' },
  { form: 'secai_control_set', group: 'controls', outcome: 'result', resolved: 'pass|ok|blocked|contained|closed|held|green' },
  { form: 'secai_governance_pack', group: 'weaknesses', outcome: 'status', resolved: 'handled|accepted' },
  { form: 'cissp_d4', group: 'flows', outcome: 'review', resolved: 'approved|accepted|ok|pass|allow|closed|kept' },
  { form: 'cissp_d7', group: 'drills', outcome: 'result', resolved: 'met' },
  { form: 'mssp_retest', group: 'findings', outcome: 'retest', resolved: 'pass|fixed|closed|resolved|remediated' },
  { form: 'cysa_alert_triage', group: 'alerts', outcome: 'verdict', resolved: '.' },
  { form: 'cysa_soc_findings', group: 'known', outcome: 'remediation', resolved: '.' },
  { form: 'cysa_vulnerability_assessment', group: 'findings', outcome: 'fix', resolved: '.' },
  { form: 'cysa_incident_response', group: 'timeline', outcome: 'note', resolved: 'contain|eradicat|recover|closed|resolved|blocked|isolated' },
  { form: 'srv_bringup', group: 'post', outcome: 'result', resolved: 'fixed|resolved|boots|pass|ok|clear|works|green' },
  { form: 'srv_ip_plan', group: 'proof', outcome: 'verdict', resolved: 'pass|match|ok|yes' },
  { form: 'srv_operations', group: 'changes', outcome: 'result', resolved: 'ok|done|success|pass|complete|applied' },
  { form: 'ccna_validation', group: 'tests', outcome: 'result', resolved: 'pass|ok|yes' },
  { form: 'ccna_ops', group: 'changes', outcome: 'result', resolved: 'ok|done|success|pass|complete|applied' },
  { form: 'ap_fault', group: 'attempts', outcome: 'result', resolved: 'fixed|resolved|works|pass|boots|ok|yes|solved' },
  { form: 'ap_tickets', group: 'tickets', outcome: 'closed', resolved: '.' },
  { form: 'np_changes', group: 'faults', outcome: 'fix', resolved: '.' },
  { form: 'np_verify', group: 'matrix', outcome: 'ok', resolved: 'yes|true|ok|pass' },
  { form: 'secai_attack_casebook', group: 'cases', outcome: 'status', resolved: 'closed|mitigated|blocked|fixed|controlled' },
  { form: 'cissp_d1', group: 'weaknesses', outcome: 'status', resolved: 'closed|fixed|resolved' },
  { form: 'sad', group: 'ssh_tests', outcome: 'result', resolved: 'pass|ok|yes|refused|denied|timed out|reached' },
  { form: 'incident', group: 'signals', outcome: 'action', resolved: '.' },
  { form: 'access', group: 'denials', outcome: 'result', resolved: 'denied|403|refused|forbidden|blocked|no' },
  { form: 'network', group: 'paths', outcome: 'result', resolved: 'pass|ok|200|reach|yes' },
  { form: 'handover', group: 'scenarios', outcome: 'result', resolved: 'pass|met|restored|ok|recovered' },
];

/** A change table with a rollback column: a row is a change; a rollback written is the success. */
export interface ChangeGroup {
  form: string;
  group: string;
  rollback: string;
}

export const CHANGE_GROUPS: ChangeGroup[] = [
  // R138: a change table with a rollback column in every course, on a shared form so every role reads it.
  { form: 'aif_build', group: 'changes', rollback: 'rollback' },
  { form: 'dca_orchestration', group: 'changes', rollback: 'rollback' },
  { form: 'cka_workloads', group: 'changes', rollback: 'rollback' },
  { form: 'nca_datacenter', group: 'changes', rollback: 'rollback' },
  { form: 'awsai_build', group: 'changes', rollback: 'rollback' },
  { form: 'scs_network', group: 'changes', rollback: 'rollback' },
  { form: 'ccsp_platform', group: 'changes', rollback: 'rollback' },
  { form: 'ccsp_operations', group: 'changes', rollback: 'rollback' },
  { form: 'change_log', group: 'changes', rollback: 'rollback' },
  { form: 'mssp_control_matrix', group: 'changes', rollback: 'rollback' },
  { form: 'cysa_soc_monitoring', group: 'changes', rollback: 'rollback' },
  { form: 'srv_operations', group: 'changes', rollback: 'rollback' },
  { form: 'srv_operations', group: 'sops', rollback: 'rollback' },
  { form: 'ccna_ops', group: 'changes', rollback: 'rollback' },
  { form: 'ap_os', group: 'fw_changes', rollback: 'rollback' },
  { form: 'np_handover', group: 'risks', rollback: 'rollback' },
  { form: 'secai_control_set', group: 'changes', rollback: 'rollback' },
  { form: 'cissp_d8', group: 'changes', rollback: 'rollback' },
  // The cloud courses by base id: the incident report (Fundamentals), the runbook (Administrator), the pipeline runs (DevOps).
  { form: 'incident', group: 'changes', rollback: 'rollback' },
  { form: 'server', group: 'changes', rollback: 'rollback' },
  { form: 'change', group: 'runs', rollback: 'rollback' },
];

/** A column or field whose words are a reason: the unstructured decisions the Thought Process domain counts. */
export const RATIONALE_PATTERN = '(^|_)(why|because|rationale|reason|justification|rejected|decision|treatment)($|_)';

export function isRationaleKey(key: string): boolean {
  return new RegExp(RATIONALE_PATTERN, 'i').test(key);
}

/** The rationale columns of a group, if any. */
export function rationaleColumns(group: Pick<FieldGroup, 'columns'>): string[] {
  return group.columns.map((c) => c.field).filter(isRationaleKey);
}

export function troubleGroupsOf(def: Pick<DeliverableDef, 'id'>): TroubleGroup[] {
  const base = formBase(def.id);
  return TROUBLE_GROUPS.filter((g) => g.form === def.id || g.form === base);
}

export function changeGroupsOf(def: Pick<DeliverableDef, 'id'>): ChangeGroup[] {
  const base = formBase(def.id);
  return CHANGE_GROUPS.filter((g) => g.form === def.id || g.form === base);
}

/* ── tasks ───────────────────────────────────────────────────────────────── */

const WORDS: Partial<Record<Cat, RegExp>> = {
  troubleshooting: /troubleshoot|fault|break|broken|incident|triage|debug|diagnos|repair|restore|recover|fix|drill|outage|symptom/i,
  configurations: /configur|harden|baseline|set up|setup|enable|install|provision|patch|firewall|vlan|trunk|dhcp|nat|acl|policy|rotate|encrypt|lock down|deploy/i,
  architectures: /design|topology|plan\b|diagram|architect|address(ing)? plan|bill of materials|bom|blueprint|requirements|survey|map the/i,
  investigations: /investigat|hunt|analy|evidence|forens|scan|triage|enumerate|recon|audit|assess|detect|alert|ioc|log review/i,
  decisions: /decide|decision|choose|chose|option|trade-?off|justify|why|select|recommend|risk/i,
};

/** Exceptions and additions by course and task id, when the words alone miss a category. */
export const TASK_CATEGORY: Record<string, Record<string, Cat[]>> = {};

/** Every category a graded task lands in: its words, its registries (filled by the projection), its forms and its hand-offs. */
export function taskCategories(course: Pick<Course, 'id'>, task: Pick<Task, 'id' | 'title' | 'objective' | 'deliverables' | 'handoff' | 'steps'>, formsByFile: Map<string, Pick<DeliverableDef, 'id' | 'capstone' | 'portfolio'>>): Cat[] {
  const out = new Set<Cat>();
  const text = `${task.title} ${task.objective}`;
  for (const [cat, re] of Object.entries(WORDS) as [Cat, RegExp][]) if (re.test(text)) out.add(cat);
  if (task.steps.some((s) => s.command || s.commands?.length)) out.add('commands');
  if (task.deliverables.length || task.steps.some((s) => s.usesForm || s.producesDeliverable)) out.add('documentation');
  for (const file of task.deliverables) {
    const def = formsByFile.get(file);
    if (def) for (const c of formCategories(def)) out.add(c);
  }
  if (task.handoff?.length) out.add('communication');
  for (const c of TASK_CATEGORY[course.id]?.[task.id] ?? []) out.add(c);
  return [...out];
}

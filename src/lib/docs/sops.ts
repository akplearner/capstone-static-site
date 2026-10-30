/**
 * R107 — procedures: the runbooks and standard operating procedures a
 * course asks a team to write and follow, each anchored to the standard that
 * names it (NIST CSF, ISO 27001, SOC 2, NIST SP 800-61, ITIL, …).
 *
 * A "procedure" here is a kind of record with a discipline behind it, not a
 * page of the Server+ configuration guide (those are `procedures[]` in the
 * document and stay by name). Every form a course fills maps to the SOP kinds
 * it is an instance of (`DELIVERABLE_SOPS`, zero to three), and every task that
 * EXECUTES a procedure (a drill, a patch run, a restore, a containment, a
 * change) maps to the kinds it executes (`TASK_SOPS`).
 *
 * Adherence is never typed in. The member projection reads it from facts that
 * already exist: the form's Definition-of-Done checks, its document-control
 * block, the evidence hashes its fields point at, the lifecycle (drafted,
 * reviewed, approved, issued) and the order the task's steps were verified
 * in. "Standard effectiveness" per standard is read off the same rows via
 * `standardRefs`.
 */

export type SopKind =
  | 'runbook' | 'change' | 'release' | 'incident' | 'recovery' | 'custody' | 'scope' | 'baseline' | 'patching' | 'handover'
  | 'risk' | 'policy' | 'access' | 'monitoring' | 'inventory' | 'governance' | 'audit' | 'assessment' | 'design' | 'build';

export interface SopDef {
  /** 'sop.<slug>' */
  id: string;
  /** Six words or fewer. */
  label: string;
  kind: SopKind;
  /** Twenty-five words or fewer: what the record holds. */
  definition: string;
  /** `ControlRef.code` or `StandardDef.id` values from `standards.ts`. */
  standardRefs: string[];
}

const s = (slug: string, label: string, kind: SopKind, definition: string, standardRefs: string[]): SopDef => ({ id: `sop.${slug}`, label, kind, definition, standardRefs });

export const SOPS: SopDef[] = [
  s('runbook', 'Operational runbook', 'runbook', 'Step-by-step instructions for a routine operation, written so a colleague can follow them and kept current.', ['ISO27001.A.5.37', 'NIST.CSF.PR.PS']),
  s('incident-response-plan', 'Incident response plan', 'incident', 'The written plan for handling an incident: roles, the first hour, containment, communication and the notice deadline.', ['NIST.800-61', 'ISO27001.A.5.24', 'NIST.CSF.RS.MA', 'SOC2.CC7.4']),
  s('incident-record', 'Incident record', 'incident', 'The record of one incident: first alert, attacker, timeline, containment time, evidence and the hand-offs.', ['NIST.800-61.DETECT', 'ISO27001.A.5.26', 'NIST.CSF.RS.AN']),
  s('post-mortem', 'Post-incident review', 'incident', 'What happened, what worked, what did not, and the improvements with an owner each.', ['NIST.800-61.POST', 'ISO27001.A.5.27', 'NIST.CSF.ID.IM']),
  s('change-record', 'Change record', 'change', 'A change written before it is made: what, where, the backup, the approval, the rollback and the result.', ['ITIL.change', 'ISO27001.A.8.32', 'NIST.800-53.CM-3', 'SOC2.CC8.1']),
  s('release-record', 'Release record', 'release', 'What a release contains, what blocked, what was tested and who approved it going out.', ['ITIL.release', 'NIST.800-218', 'SOC2.CC8.1']),
  s('recovery-drill', 'Recovery drill', 'recovery', 'A timed restore or failover against the written targets, with the hashes compared and the gap recorded.', ['NIST.800-34', 'NIST.CSF.RC.RP', 'ISO27001.A.5.30', 'NIST.800-53.CP-4']),
  s('backup-plan', 'Backup plan', 'recovery', 'What is backed up, how often, where it goes, how long it is kept and how a restore is tested.', ['ISO27001.A.8.13', 'NIST.800-53.CP-9', 'CIS.11']),
  s('chain-of-custody', 'Chain of custody', 'custody', 'Every evidence item logged with its hash, who held it, when, and where it is stored.', ['ISO27037', 'ISO27001.A.5.28', 'NIST.800-61']),
  s('scope-and-roe', 'Scope and rules of engagement', 'scope', 'What may be tested, when, how, by whom, and the signatures that authorise it.', ['NIST.800-115', 'PTES']),
  s('lab-rule', 'Lab rule and evidence ledger', 'scope', 'The authorisation a team works under and the ledger every piece of evidence is hashed into.', ['NIST.800-115', 'ISO27037']),
  s('hardening-baseline', 'Hardening baseline', 'baseline', 'The settings a host must have, the benchmark they come from, and the proof each host meets them.', ['CIS.BENCHMARK', 'NIST.800-53.CM-6', 'ISO27001.A.8.9', 'NIST.CSF.PR.PS']),
  s('patch-management', 'Patch management', 'patching', 'How updates are found, prioritised, tested, applied and verified, on what cadence, by whom.', ['NIST.800-40', 'NIST.800-53.SI-2', 'ISO27001.A.8.8', 'CIS.7']),
  s('vulnerability-management', 'Vulnerability management', 'patching', 'How findings are scored, ranked, assigned an owner and a date, fixed and retested.', ['NIST.800-53.RA-5', 'CIS.7', 'ISO27001.A.8.8', 'NIST.CSF.ID.RA']),
  s('handover', 'Operational handover', 'handover', 'What was built, how it is run, who owns it and what is still open, handed to the next team.', ['ITIL.transition', 'ISO27001.A.5.37', 'ITIL.knowledge']),
  s('risk-register', 'Risk register', 'risk', 'Each risk with its likelihood, impact, score, owner and treatment, reviewed on a schedule.', ['NIST.800-30', 'ISO27005', 'ISO27001.6.1.2', 'NIST.CSF.GV.RM']),
  s('supplier-review', 'Supplier review', 'risk', 'Suppliers tiered by access and data, with terms for the top tier and a review date.', ['ISO27001.A.5.19', 'NIST.CSF.GV.SC', 'NIST.800-53.SR-6']),
  s('policy', 'Security policy', 'policy', 'Shall statements with an owner, a review date and the standard each one implements.', ['ISO27001.5.2', 'ISO27001.A.5.1', 'NIST.CSF.GV.PO', 'NIST.800-53.PM-1']),
  s('data-handling', 'Data handling standard', 'policy', 'How data is classified, where it may live, how it is redacted and how media is sanitised.', ['NIST.CSF.PR.DS', 'ISO27001.A.5.12', 'NIST.800-88']),
  s('access-review', 'Access review', 'access', 'Accounts and rights checked against the access matrix, orphans disabled, the review recorded.', ['ISO27001.A.5.18', 'NIST.800-53.AC-2', 'SOC2.CC6.3', 'NIST.CSF.PR.AA']),
  s('identity-standard', 'Identity and access standard', 'access', 'Roles against systems, the MFA rule, joiner and leaver timing, separation of duties.', ['NIST.800-63', 'NIST.800-53.IA-2', 'ISO27001.A.5.15', 'NIST.CSF.PR.AA']),
  s('monitoring-plan', 'Monitoring plan', 'monitoring', 'What is watched, from which sources, who is alerted, and what a page means.', ['NIST.CSF.DE.CM', 'ISO27001.A.8.16', 'SOC2.CC7.2', 'ITIL.monitoring']),
  s('detection-rules', 'Detection rules', 'monitoring', 'Detections as versioned rules with the technique id and the test that proved each fires.', ['NIST.CSF.DE.AE', 'MITRE.ATTACK', 'SOC2.CC7.2']),
  s('sensor-deployment', 'Sensor deployment record', 'monitoring', 'Which sensor runs on which host, pointing at which collector, and the proof it reports.', ['NIST.CSF.DE.CM-01', 'ISO27001.A.8.15']),
  s('ioc-database', 'Indicator database', 'monitoring', 'Indicators with their source alert or packet, the technique id and the confidence.', ['MITRE.ATTACK', 'NIST.CSF.DE.AE']),
  s('asset-inventory', 'Asset inventory', 'inventory', 'Every asset with an owner, a location, a classification and its place in the picture.', ['NIST.CSF.ID.AM', 'CIS.1', 'ISO27001.A.5.9', 'ITIL.asset']),
  s('ai-system-map', 'AI system map', 'inventory', 'Every model, prompt structure, data writer and data flow of the AI system, with owners.', ['NIST.AI-RMF.MAP', 'ISO42001']),
  s('control-mapping', 'Control mapping', 'governance', 'Each control mapped to the criteria it meets, with an owner and the evidence that proves it.', ['ISO27001.6.1.3', 'SOC2', 'NIST.CSF']),
  s('cost-review', 'Cost review', 'governance', 'What the environment costs, what the budget is, and what was switched off.', ['WAF.cost']),
  s('governance-report', 'Governance report', 'governance', 'What leadership must decide, the risks accepted, the metrics and the open items.', ['NIST.CSF.GV', 'ISO27001.9.3']),
  s('customer-assurance', 'Customer assurance response', 'governance', 'A customer questionnaire answered with evidence or an honest gap per question.', ['SOC2', 'ISO27001', 'ISO42001']),
  s('system-security-plan', 'System security plan', 'governance', 'Every requirement with its implementation, its evidence or its dated plan, and the boundary.', ['NIST.800-171', 'NIST.800-53.PL-2', 'FAR.52.204-21']),
  s('internal-audit', 'Internal audit', 'audit', 'A planned audit against the standard with findings, nonconformities and corrective actions.', ['ISO27001.9.2', 'ISO27001.9.3', 'SOC2.CC4.1']),
  s('evidence-packet', 'Audit evidence packet', 'audit', 'The evidence an examiner samples, tied to controls, each item with an owner and a location.', ['SOC2', 'ISO27001.7.5', 'ISO27001.9.2']),
  s('assessment-report', 'Assessment report', 'assessment', 'Findings with severity, evidence and a fix, from a test that was scoped and authorised.', ['NIST.800-115', 'PTES', 'CVSS']),
  s('retest-record', 'Retest and validation record', 'assessment', 'Every finding retested and closed, left open or risk-accepted with a named owner.', ['NIST.800-115', 'SOC2.CC4.1']),
  s('threat-model', 'Threat model', 'assessment', 'Threats per component with a method, each tied to a control or an accepted risk.', ['STRIDE', 'OWASP', 'NIST.CSF.ID.RA']),
  s('architecture-record', 'Architecture record', 'design', 'The components, the trust boundaries, the flows and the decisions, with the reasons for each.', ['ISO42010', 'WAF', 'NIST.800-53.PL-8']),
  s('network-design', 'Network design', 'design', 'Zones, allowed flows, the addressing plan and the default-deny statement.', ['NIST.800-53.SC-7', 'ISO27001.A.8.22', 'NIST.CSF.PR.IR']),
  s('requirements', 'Requirements record', 'design', 'What the system must do and must not, with the constraints and the acceptance criteria.', ['ISO42010', 'WAF']),
  s('build-record', 'Build record', 'build', 'The build as it was made: firmware, versions, settings and the problems met, in order.', ['ITIL.configuration', 'NIST.800-53.CM-2', 'ISO27001.A.8.9']),
  s('pipeline-record', 'Pipeline record', 'build', 'The stages, the gates, what each blocks on, and the deployment that went through.', ['NIST.800-218', 'WAF.operational-excellence', 'ITIL.deployment']),
  s('test-and-acceptance', 'Test and acceptance record', 'build', 'The tests a build must pass, who ran them, and the recorded results.', ['ITIL.transition', 'NIST.800-53.CA-2', 'ISO27001.A.8.29']),
  // R142: the Portfolio — what the team can show for the project, handed to the member's own record.
  s('portfolio', 'Portfolio record', 'handover', 'The repository, a case study, three resume bullets, the architecture diagram and the skills demonstrated, for one project.', ['ISO42010', 'NIST.800-53.PL-2', 'ITIL.knowledge']),
];

import { CLOUD_COURSES, cloudMap } from './skills';
import { PORTFOLIO_PLAN, portfolioId } from './portfolioPlan';

/** The cloud forms, one table for both platforms: `{ foundation: ids }` → `azf_foundation`, `awsf_foundation`, … */
function cloudForms(table: Record<string, Record<string, string[]>>): Record<string, Record<string, string[]>> {
  const out: Record<string, Record<string, string[]>> = {};
  const tier = (weeks: [number, number]) => (weeks[0] === 1 ? 'f' : weeks[0] === 5 ? 'a' : 'd');
  for (const [courseId, [prefix, weeks]] of Object.entries(CLOUD_COURSES)) {
    out[courseId] = Object.fromEntries(Object.entries(table[tier(weeks)]).map(([form, ids]) => [`${prefix}${tier(weeks)}_${form}`, ids]));
  }
  return out;
}

const CLOUD_FORM_SOPS: Record<string, Record<string, string[]>> = {
  f: { foundation: ['sop.policy', 'sop.cost-review'], sad: ['sop.architecture-record'], api: ['sop.requirements'], incident: ['sop.monitoring-plan', 'sop.incident-record'] },
  a: { access: ['sop.identity-standard', 'sop.access-review'], network: ['sop.network-design'], server: ['sop.runbook', 'sop.architecture-record'], dr: ['sop.backup-plan', 'sop.recovery-drill'] },
  d: { iac: ['sop.pipeline-record', 'sop.build-record'], change: ['sop.change-record', 'sop.release-record'], governance: ['sop.cost-review', 'sop.governance-report'], handover: ['sop.handover', 'sop.risk-register'] },
};

const CLOUD_TASK_SOPS: Record<string, string[]> = {
  'w2-infra': ['sop.cost-review'],
  'w4-secops': ['sop.incident-record'],
  'w5-secops': ['sop.access-review'],
  'w8-dev': ['sop.backup-plan'],
  'w8-secops': ['sop.recovery-drill'],
  'w9-dev': ['sop.pipeline-record'],
  'w10-arch': ['sop.change-record'],
  'w10-dev': ['sop.pipeline-record'],
  'w11-infra': ['sop.release-record'],
  'w11-dev': ['sop.release-record'],
  'w12-arch': ['sop.handover'],
  'w12-infra': ['sop.recovery-drill'],
  'w12-secops': ['sop.incident-record'],
};

/** Every form → the SOP kinds it is an instance of (one to three). */
export const DELIVERABLE_SOPS: Record<string, Record<string, string[]>> = {
  'network-plus': {
    np_lab: ['sop.asset-inventory'],
    np_design: ['sop.requirements', 'sop.network-design'],
    np_ports: ['sop.network-design'],
    np_config: ['sop.build-record'],
    np_verify: ['sop.test-and-acceptance'],
    np_changes: ['sop.change-record', 'sop.incident-record', 'sop.backup-plan'],
    np_bom: ['sop.asset-inventory'],
    np_handover: ['sop.handover', 'sop.chain-of-custody'],
  },
  'ai-foundations': {
    aif_setup: ['sop.asset-inventory'],
    aif_capabilities: ['sop.ai-system-map'],
    aif_responsible: ['sop.governance-report'],
    aif_eval: ['sop.test-and-acceptance'],
    aif_build: ['sop.build-record'],
    aif_services: ['sop.build-record'],
    aif_governance: ['sop.risk-register', 'sop.governance-report'],
    aif_handover: ['sop.handover', 'sop.chain-of-custody'],
  },
  'docker-dca': {
    dca_setup: ['sop.asset-inventory'],
    dca_image: ['sop.build-record'],
    dca_orchestration: ['sop.build-record'],
    dca_network: ['sop.build-record'],
    dca_troubleshoot: ['sop.test-and-acceptance'],
    dca_security: ['sop.risk-register', 'sop.governance-report'],
    dca_handover: ['sop.handover', 'sop.chain-of-custody'],
  },
  'kubernetes-cka': {
    cka_setup: ['sop.asset-inventory'],
    cka_cluster: ['sop.build-record'],
    cka_workloads: ['sop.build-record'],
    cka_network: ['sop.build-record'],
    cka_troubleshoot: ['sop.test-and-acceptance'],
    cka_backup: ['sop.risk-register', 'sop.governance-report'],
    cka_handover: ['sop.handover', 'sop.chain-of-custody'],
  },
  'aws-ai-practitioner': {
    awsai_setup: ['sop.asset-inventory'],
    awsai_capabilities: ['sop.ai-system-map'],
    awsai_responsible: ['sop.governance-report'],
    awsai_eval: ['sop.test-and-acceptance'],
    awsai_build: ['sop.build-record'],
    awsai_services: ['sop.build-record'],
    awsai_governance: ['sop.risk-register', 'sop.governance-report'],
    awsai_handover: ['sop.handover', 'sop.chain-of-custody'],
  },
  'a-plus': {
    ap_intake: ['sop.asset-inventory'],
    ap_asset: ['sop.asset-inventory', 'sop.build-record'],
    ap_fault: ['sop.incident-record'],
    ap_os: ['sop.build-record', 'sop.hardening-baseline'],
    ap_backup: ['sop.backup-plan', 'sop.recovery-drill'],
    ap_tickets: ['sop.incident-record', 'sop.runbook'],
    ap_security: ['sop.hardening-baseline'],
    ap_handover: ['sop.handover', 'sop.chain-of-custody'],
  },
  'security-plus': {
    scope_roe: ['sop.scope-and-roe'],
    asset_inventory: ['sop.asset-inventory'],
    risk_register: ['sop.risk-register'],
    hardening_baseline: ['sop.hardening-baseline'],
    change_log: ['sop.change-record'],
    pentest_report: ['sop.assessment-report'],
    incident_report: ['sop.incident-record', 'sop.post-mortem'],
    final_report: ['sop.governance-report'],
    framework_mapping: ['sop.control-mapping'],
    security_policy: ['sop.policy'],
    hardening_standard: ['sop.hardening-baseline', 'sop.runbook'],
    vm_sop: ['sop.vulnerability-management', 'sop.runbook'],
    ir_runbook: ['sop.incident-response-plan', 'sop.runbook'],
    evidence_log: ['sop.chain-of-custody'],
  },
  'cysa-plus': {
    cysa_soc_monitoring: ['sop.monitoring-plan'],
    cysa_threat_investigation: ['sop.incident-record'],
    cysa_vulnerability_assessment: ['sop.assessment-report', 'sop.vulnerability-management'],
    cysa_incident_response: ['sop.incident-record', 'sop.post-mortem'],
    cysa_ioc_database: ['sop.ioc-database'],
    cysa_coverage_validation: ['sop.monitoring-plan', 'sop.sensor-deployment'],
    cysa_alert_triage: ['sop.monitoring-plan', 'sop.runbook'],
    cysa_detection_record: ['sop.incident-record'],
    cysa_exec_debrief: ['sop.post-mortem', 'sop.governance-report'],
    cysa_sensor_deployment: ['sop.sensor-deployment'],
    cysa_soc_findings: ['sop.vulnerability-management'],
    cysa_scan_validation: ['sop.assessment-report'],
  },
  mssp: {
    mssp_engagement: ['sop.scope-and-roe'],
    mssp_soa: ['sop.control-mapping', 'sop.risk-register'],
    mssp_control_matrix: ['sop.control-mapping'],
    mssp_retest: ['sop.retest-record'],
    mssp_gap_assessment: ['sop.assessment-report', 'sop.hardening-baseline'],
    mssp_detection_rules: ['sop.detection-rules'],
    mssp_metrics: ['sop.monitoring-plan', 'sop.governance-report'],
    mssp_internal_audit: ['sop.internal-audit'],
    mssp_evidence_packet: ['sop.evidence-packet'],
  },
  'secai-plus': {
    secai_lab_rule: ['sop.lab-rule', 'sop.chain-of-custody'],
    secai_system_map: ['sop.ai-system-map', 'sop.asset-inventory'],
    secai_attack_casebook: ['sop.assessment-report', 'sop.threat-model'],
    secai_control_set: ['sop.hardening-baseline', 'sop.control-mapping'],
    secai_watch_plan: ['sop.monitoring-plan', 'sop.incident-response-plan'],
    secai_governance_pack: ['sop.risk-register', 'sop.policy', 'sop.governance-report'],
    secai_release_note: ['sop.release-record'],
    secai_release_package: ['sop.customer-assurance', 'sop.release-record'],
  },
  cissp: {
    cissp_d1: ['sop.policy', 'sop.risk-register', 'sop.supplier-review'],
    cissp_d2: ['sop.asset-inventory', 'sop.data-handling'],
    cissp_d3: ['sop.architecture-record'],
    cissp_d4: ['sop.network-design'],
    cissp_d5: ['sop.identity-standard', 'sop.access-review'],
    cissp_d6: ['sop.internal-audit', 'sop.retest-record'],
    cissp_d7: ['sop.incident-response-plan', 'sop.backup-plan', 'sop.recovery-drill'],
    cissp_d8: ['sop.pipeline-record', 'sop.change-record'],
    cissp_release_note: ['sop.release-record'],
    cissp_questionnaire: ['sop.customer-assurance'],
    cissp_controls: ['sop.control-mapping'],
    cissp_ssp: ['sop.system-security-plan'],
  },
  'server-plus': {
    srv_business_reqs: ['sop.requirements', 'sop.architecture-record'],
    srv_hardware: ['sop.asset-inventory', 'sop.build-record'],
    srv_bringup: ['sop.build-record'],
    srv_rack_assets: ['sop.asset-inventory'],
    srv_ip_plan: ['sop.network-design', 'sop.test-and-acceptance'],
    srv_standards: ['sop.hardening-baseline', 'sop.policy'],
    srv_operations: ['sop.runbook', 'sop.change-record', 'sop.patch-management'],
    srv_as_built: ['sop.recovery-drill', 'sop.backup-plan', 'sop.handover'],
  },
  ccna: {
    ccna_kit: ['sop.asset-inventory'],
    ccna_requirements: ['sop.requirements'],
    ccna_hld: ['sop.architecture-record'],
    ccna_lld: ['sop.network-design'],
    ccna_build_log: ['sop.build-record'],
    ccna_validation: ['sop.test-and-acceptance'],
    ccna_security: ['sop.hardening-baseline', 'sop.policy'],
    ccna_ops: ['sop.change-record', 'sop.backup-plan'],
    ccna_monitoring: ['sop.monitoring-plan', 'sop.incident-record'],
    ccna_handover: ['sop.handover'],
  },
  ...cloudForms(CLOUD_FORM_SOPS),
};

// R142: every course's Portfolio is an instance of the portfolio record.
for (const p of PORTFOLIO_PLAN) (DELIVERABLE_SOPS[p.courseId] ??= {})[portfolioId(p)] = ['sop.portfolio'];

/** Tasks that execute a procedure → the SOP kinds they execute. */
export const TASK_SOPS: Record<string, Record<string, string[]>> = {
  'network-plus': {
    'np-w2-services': ['sop.test-and-acceptance'],
    'np-w3-monitor': ['sop.backup-plan'],
    'np-w3-secure': ['sop.hardening-baseline'],
    'np-w3-change': ['sop.change-record', 'sop.backup-plan'],
    'np-w3-faults': ['sop.incident-record'],
    'np-w4-handover': ['sop.handover', 'sop.chain-of-custody'],
  },
  'ai-foundations': {
    'aif-w1-workloads': ['sop.ai-system-map'],
    'aif-w2-responsible': ['sop.governance-report'],
    'aif-w2-eval': ['sop.test-and-acceptance'],
    'aif-w3-deploy': ['sop.build-record'],
    'aif-w4-govern': ['sop.risk-register'],
    'aif-w4-handover': ['sop.handover', 'sop.chain-of-custody'],
  },
  'docker-dca': {
    'dca-w1-build': ['sop.build-record'],
    'dca-w2-compose': ['sop.build-record'],
    'dca-w3-ports': ['sop.test-and-acceptance'],
    'dca-w4-scan': ['sop.risk-register'],
    'dca-w4-harden': ['sop.governance-report'],
    'dca-w4-handover': ['sop.handover', 'sop.chain-of-custody'],
  },
  'kubernetes-cka': {
    'cka-w1-cluster': ['sop.build-record'],
    'cka-w2-deploy': ['sop.build-record'],
    'cka-w4-troubleshoot': ['sop.test-and-acceptance'],
    'cka-w4-backup': ['sop.risk-register'],
    'cka-w4-handover': ['sop.handover', 'sop.chain-of-custody'],
  },
  'aws-ai-practitioner': {
    'awsai-w1-workloads': ['sop.ai-system-map'],
    'awsai-w2-responsible': ['sop.governance-report'],
    'awsai-w2-eval': ['sop.test-and-acceptance'],
    'awsai-w3-deploy': ['sop.build-record'],
    'awsai-w4-govern': ['sop.risk-register'],
    'awsai-w4-handover': ['sop.handover', 'sop.chain-of-custody'],
  },
  'a-plus': {
    'ap-w1-fault': ['sop.incident-record'],
    'ap-w2-image': ['sop.backup-plan'],
    'ap-w2-restore': ['sop.recovery-drill'],
    'ap-w3-tickets': ['sop.incident-record'],
    'ap-w4-secure': ['sop.hardening-baseline'],
    'ap-w4-restore': ['sop.recovery-drill', 'sop.backup-plan'],
    'ap-w4-handover': ['sop.handover', 'sop.chain-of-custody'],
  },
  'security-plus': {
    'red-w1-osint': ['sop.scope-and-roe'],
    'red-w2-enumeration': ['sop.scope-and-roe'],
    'red-w3-attacks': ['sop.scope-and-roe'],
    'blue-w1-hardening': ['sop.hardening-baseline', 'sop.change-record'],
    'blue-w3-detection': ['sop.incident-response-plan'],
    'grc-w3-custody': ['sop.chain-of-custody'],
  },
  'cysa-plus': {
    'cr-w1': ['sop.sensor-deployment'],
    'cb-w1': ['sop.sensor-deployment'],
    'cg-w1': ['sop.sensor-deployment'],
    'cb-w2': ['sop.runbook'],
    'cg-w2': ['sop.scope-and-roe', 'sop.chain-of-custody'],
    'cg-w3': ['sop.scope-and-roe'],
    'cr-w4': ['sop.incident-response-plan', 'sop.chain-of-custody'],
  },
  mssp: {
    'mr-w1': ['sop.scope-and-roe'],
    'mb-w1': ['sop.hardening-baseline'],
    'mb-w2': ['sop.change-record', 'sop.hardening-baseline'],
    'mr-w3': ['sop.scope-and-roe', 'sop.retest-record'],
    'mr-w4': ['sop.retest-record'],
    'mg-w4a': ['sop.internal-audit'],
  },
  'secai-plus': {
    'sa-w1-red': ['sop.lab-rule'],
    'sa-w1-def': ['sop.hardening-baseline'],
    'sa-w2-red': ['sop.lab-rule'],
    'sa-w3-def': ['sop.pipeline-record'],
    'sa-w3-red': ['sop.lab-rule'],
    'sa-w4-def': ['sop.recovery-drill', 'sop.release-record'],
    'sa-w4-red': ['sop.lab-rule', 'sop.recovery-drill'],
  },
  cissp: {
    'ci-w3-arch': ['sop.pipeline-record'],
    'ci-w3-idops': ['sop.identity-standard'],
    'ci-w3-gov': ['sop.data-handling'],
    'ci-w4-idops': ['sop.recovery-drill', 'sop.backup-plan'],
    'ci-w4-gov': ['sop.data-handling'],
    'ci-w5-gov': ['sop.internal-audit'],
    'ci-w5-arch': ['sop.change-record', 'sop.retest-record'],
    'ci-w5-idops': ['sop.access-review', 'sop.incident-response-plan'],
  },
  'server-plus': {
    'sp-w1-raid': ['sop.build-record'],
    'sp-w3-connect': ['sop.test-and-acceptance'],
    'sp-w3-sops': ['sop.runbook', 'sop.change-record'],
    'sp-w4-secure': ['sop.hardening-baseline', 'sop.patch-management'],
    'sp-w4-dr': ['sop.recovery-drill', 'sop.backup-plan'],
    'sp-w4-handover': ['sop.handover'],
    'sp-w5-glpi': ['sop.change-record'],
    'sp-w6-vault': ['sop.backup-plan'],
    'sp-w6-rebuild': ['sop.recovery-drill'],
    'sp-w3-mgmt': ['sop.change-record'],
    'sp-w6-mgmt': ['sop.change-record'],
    'sp-w4-win': ['sop.patch-management', 'sop.recovery-drill'],
    'sp-w4-lnx': ['sop.recovery-drill'],
    'sp-w8-mgmt': ['sop.runbook'],
  },
  ccna: {
    'ccna-w1-bringup': ['sop.build-record'],
    'ccna-w2-route': ['sop.test-and-acceptance'],
    'ccna-w3-wan': ['sop.test-and-acceptance'],
    'ccna-w4-policy': ['sop.test-and-acceptance'],
    'ccna-w4-harden': ['sop.hardening-baseline'],
    'ccna-w5-change': ['sop.change-record', 'sop.backup-plan'],
    'ccna-w6-ticket': ['sop.incident-record'],
    'ccna-w8-incident': ['sop.incident-record', 'sop.change-record'],
    'ccna-w8-handover': ['sop.handover'],
  },
  ...cloudMap(CLOUD_TASK_SOPS),
};

/* ── helpers (lowercase: never written to a document) ───────────────────── */

const byId = new Map(SOPS.map((x) => [x.id, x]));

export function sopOf(id: string): SopDef | undefined {
  return byId.get(id);
}

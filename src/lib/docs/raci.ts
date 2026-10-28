/**
 * R103 — who drafts, reviews and approves each document, per course.
 *
 * The flows an organisation actually runs: the role that does the work
 * drafts, a second role reviews (never the drafter), and the accountable
 * role approves and, for the capstone, issues. `definitions.ts` stamps these
 * onto the registry; the cloud factory sets its own per document key.
 * Content-integrity asserts every form has one and that `owner` is the
 * drafting role.
 */
import type { Raci } from './types';

const r = (drafts: string, reviews: string, approves: string, informed?: string[]): Raci => (informed ? { drafts, reviews, approves, informed } : { drafts, reviews, approves });

export const RACI: Record<string, Raci> = {
  // Security+ — red · blue · grc. GRC runs the paperwork; Red and Blue review
  // what touches them (Red reviews the baseline it will test); GRC approves;
  // the final report is issued by GRC after Red's review.
  scope_roe: r('grc', 'red', 'grc'),
  asset_inventory: r('grc', 'blue', 'grc'),
  framework_mapping: r('grc', 'blue', 'grc'),
  security_policy: r('grc', 'blue', 'grc'),
  hardening_standard: r('grc', 'blue', 'grc'),
  hardening_baseline: r('blue', 'red', 'grc'),
  change_log: r('blue', 'grc', 'blue'),
  risk_register: r('grc', 'red', 'grc'),
  vm_sop: r('grc', 'blue', 'grc'),
  pentest_report: r('red', 'blue', 'grc'),
  ir_runbook: r('grc', 'blue', 'grc'),
  incident_report: r('blue', 'red', 'grc'),
  evidence_log: r('grc', 'blue', 'grc'),
  final_report: r('grc', 'red', 'grc', ['blue']),

  // MSSP — red · blue · grc. GRC holds the contract documents, Blue the
  // operations, Red the testing; GRC approves everything the auditor reads.
  mssp_engagement: r('grc', 'blue', 'grc'),
  mssp_soa: r('grc', 'blue', 'grc'),
  mssp_gap_assessment: r('red', 'blue', 'grc'),
  mssp_control_matrix: r('grc', 'blue', 'grc'),
  mssp_detection_rules: r('blue', 'red', 'grc'),
  mssp_retest: r('red', 'blue', 'grc'),
  mssp_metrics: r('blue', 'red', 'grc'),
  mssp_internal_audit: r('grc', 'red', 'grc'),
  mssp_evidence_packet: r('grc', 'blue', 'grc', ['red']),

  // CySA+ — blue = SOC Analyst, grc = Threat Hunter, red = Incident Responder.
  // Each role's record is reviewed by the role that consumes it next.
  cysa_soc_monitoring: r('blue', 'grc', 'red'),
  cysa_alert_triage: r('blue', 'grc', 'red'),
  cysa_soc_findings: r('blue', 'grc', 'red'),
  cysa_detection_record: r('blue', 'grc', 'red'),
  cysa_coverage_validation: r('grc', 'blue', 'red'),
  cysa_threat_investigation: r('grc', 'blue', 'red'),
  cysa_scan_validation: r('grc', 'blue', 'red'),
  cysa_sensor_deployment: r('red', 'blue', 'grc'),
  cysa_ioc_database: r('red', 'blue', 'grc'),
  cysa_vulnerability_assessment: r('red', 'blue', 'grc'),
  cysa_incident_response: r('red', 'blue', 'grc'),
  cysa_exec_debrief: r('grc', 'red', 'blue'),

  // Server+ — net · win · lnx · mgmt, shared track. The specialist drafts,
  // a neighbouring specialist reviews, management approves and issues.
  srv_hardware: r('lnx', 'net', 'mgmt'),
  srv_standards: r('lnx', 'net', 'mgmt'),
  srv_bringup: r('win', 'lnx', 'mgmt'),
  srv_operations: r('win', 'lnx', 'mgmt'),
  srv_business_reqs: r('net', 'win', 'mgmt'),
  srv_rack_assets: r('net', 'win', 'mgmt'),
  srv_ip_plan: r('net', 'win', 'mgmt'),
  srv_as_built: r('mgmt', 'net', 'mgmt', ['win', 'lnx']),

  // CCNA — arch · impl · ops · auto. Designs are reviewed by the people who
  // build them and approved by the people who run them; the handover is
  // issued by automation, which owns it from then on.
  ccna_kit: r('arch', 'impl', 'ops'),
  ccna_requirements: r('arch', 'impl', 'ops'),
  ccna_hld: r('arch', 'impl', 'ops'),
  ccna_lld: r('arch', 'impl', 'ops'),
  ccna_build_log: r('impl', 'ops', 'arch'),
  ccna_validation: r('ops', 'impl', 'arch'),
  ccna_ops: r('ops', 'impl', 'arch'),
  ccna_monitoring: r('ops', 'impl', 'arch'),
  ccna_security: r('auto', 'ops', 'arch'),
  ccna_handover: r('arch', 'ops', 'auto', ['impl']),

  // A+ — hw · os · support · records. The focus that does the work drafts,
  // the focus that depends on it reviews, Records approves most; the
  // handover is drafted by Records, reviewed by Systems and approved by the
  // Help Desk, which runs the machine from then on.
  ap_intake: r('records', 'hw', 'os'),
  ap_asset: r('hw', 'os', 'records'),
  ap_fault: r('hw', 'support', 'records'),
  ap_os: r('os', 'hw', 'records'),
  ap_backup: r('records', 'os', 'hw'),
  ap_tickets: r('support', 'hw', 'records'),
  ap_security: r('os', 'support', 'records'),
  ap_handover: r('records', 'os', 'support', ['hw']),

  // Network+ — design · sw · rt · ops. Designs are reviewed by the people who
  // build them and approved by the people who run them; the handover is
  // drafted by Design, reviewed by Operations and approved by Routing.
  np_lab: r('ops', 'sw', 'design'),
  np_design: r('design', 'rt', 'ops'),
  np_ports: r('sw', 'design', 'ops'),
  np_config: r('rt', 'sw', 'ops'),
  np_verify: r('rt', 'ops', 'design'),
  np_changes: r('ops', 'rt', 'design'),
  np_bom: r('design', 'ops', 'rt'),
  np_handover: r('design', 'ops', 'rt', ['sw']),

  // SecAI+ — redteam · defender · governance.
  secai_lab_rule: r('governance', 'defender', 'governance'),
  secai_system_map: r('governance', 'defender', 'governance'),
  secai_attack_casebook: r('redteam', 'defender', 'governance'),
  secai_control_set: r('defender', 'redteam', 'governance'),
  secai_watch_plan: r('defender', 'redteam', 'governance'),
  secai_governance_pack: r('governance', 'defender', 'governance'),
  secai_release_note: r('governance', 'defender', 'governance'),
  secai_release_package: r('governance', 'redteam', 'governance', ['defender']),

  // CISSP — govrisk · archnet · idops. The domain owner drafts, the role that
  // operates or builds on it reviews, Governance approves as the CEO's proxy;
  // the SSP is issued after D6.
  cissp_d1: r('govrisk', 'archnet', 'govrisk'),
  cissp_d2: r('govrisk', 'archnet', 'govrisk'),
  cissp_d6: r('govrisk', 'archnet', 'govrisk'),
  cissp_controls: r('govrisk', 'archnet', 'govrisk'),
  cissp_questionnaire: r('govrisk', 'archnet', 'govrisk'),
  cissp_release_note: r('govrisk', 'archnet', 'govrisk'),
  cissp_d3: r('archnet', 'idops', 'govrisk'),
  cissp_d4: r('archnet', 'idops', 'govrisk'),
  cissp_d8: r('archnet', 'idops', 'govrisk'),
  cissp_d5: r('idops', 'archnet', 'govrisk'),
  cissp_d7: r('idops', 'archnet', 'govrisk'),
  cissp_ssp: r('govrisk', 'archnet', 'govrisk', ['idops']),
};

/**
 * The cloud documents, by their factory slug (the id after the platform
 * prefix): the Architect drafts every document, Security & Ops reviews, and
 * the role whose work the document records approves it.
 */
// R138: the four roles each draft one document per course (the Architect drafted all twelve before, so
// the other three roles had nothing to be measured on: controls cited, decisions, the drafted share).
export const CLOUD_RACI: Record<string, Raci> = {
  foundation: r('infra', 'secops', 'arch'),
  sad: r('arch', 'secops', 'dev'),
  api: r('dev', 'secops', 'arch'),
  incident: r('secops', 'infra', 'arch'),
  access: r('secops', 'dev', 'arch'),
  network: r('infra', 'secops', 'arch'),
  server: r('dev', 'secops', 'arch'),
  dr: r('arch', 'secops', 'infra'),
  iac: r('infra', 'secops', 'arch'),
  change: r('dev', 'secops', 'arch'),
  governance: r('secops', 'infra', 'arch'),
  handover: r('arch', 'secops', 'dev', ['infra']),
};

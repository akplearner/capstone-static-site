/**
 * The MSSP course's picture, as DATA (R99, R103).
 *
 * The MSSP course has no machine lab of its own — the ENGAGEMENT is the
 * topology: a client estate (endpoints, servers, identity, EDR, the edge,
 * backups and the scanner that measures it) feeding one managed SOC (SIEM,
 * detections, threat intel, the ticket queue, the analysts and the evidence
 * vault), with the pentester and the auditor around it and the nine records
 * along the bottom. `ArchDiagram` draws `ARCH`, the form kit preset is a
 * projection of it, and every part says the week it arrives.
 *
 * Plain data, so the whole module ships in the course document (`content.mssp`
 * and `content.arch`).
 */
import { archBuildModel, type ArchPicture } from './archPicture';

export const ARCH: ArchPicture = {
  copy: {
    title: 'The engagement — one client estate feeding one managed SOC',
    howToRead:
      'Top left: the client estate your documents govern. Top right: the MSSP SOC your team runs. Under them: the people who test and audit the arrangement, and the nine records. Dashed lines carry logs, backups or trust; every control, SLA and report in your forms names one of these boxes.',
    footer: 'No lab VMs here on purpose: the deliverables govern process and evidence, and this is the process.',
  },
  view: { w: 960, h: 550 },
  zones: [
    { id: 'client', label: 'Client A — the estate under contract', note: 'what the contract covers', x: 20, y: 40, w: 520, h: 270, tone: 2 },
    { id: 'mssp', label: 'MSSP SOC — your team', note: 'what the contract promises', x: 560, y: 40, w: 380, h: 270, tone: 3 },
    { id: 'around', label: 'Around the contract', note: 'who tests and audits it', x: 20, y: 350, w: 920, h: 80, tone: 4 },
    { id: 'records', label: 'Records — the deliverables', note: 'nine forms', x: 20, y: 460, w: 920, h: 70, tone: 6, lane: true },
  ],
  nodes: [
    { id: 'endpoints', label: 'Endpoints', sub: '80 laptops · phones', kind: 'endpoint', zone: 'client', x: 105, y: 100, arrives: 0, records: 'mssp_soa', purpose: 'What staff work on; where phishing and malware land' },
    { id: 'servers', label: 'Servers', sub: 'file · ERP · web', kind: 'server', zone: 'client', x: 275, y: 100, arrives: 0, records: 'mssp_soa', purpose: 'The systems the contract protects and the pentest targets' },
    { id: 'idp', label: 'Client identity', sub: 'Entra ID · MFA', kind: 'idp', zone: 'client', x: 445, y: 100, arrives: 2, records: 'mssp_control_matrix', role: 'blue', purpose: 'One account per person; MFA is the first control implemented' },
    { id: 'edr', label: 'EDR agents', sub: 'every endpoint and server', kind: 'monitor', zone: 'client', x: 105, y: 170, arrives: 2, records: 'mssp_control_matrix', role: 'blue', purpose: 'Sees process activity on every host and feeds the SIEM' },
    { id: 'client-edge', label: 'Client edge', sub: 'firewall · log forwarder', kind: 'firewall', zone: 'client', x: 275, y: 170, arrives: 0, records: 'mssp_control_matrix', role: 'blue', purpose: 'The boundary, and the one path the client’s logs take out' },
    { id: 'backup', label: 'Backup target', sub: 'offline copy · restore test', kind: 'backup', zone: 'client', x: 445, y: 170, arrives: 2, records: 'mssp_control_matrix', role: 'blue', purpose: 'The copy the recovery promise in the contract rests on' },
    { id: 'scanner', label: 'Vulnerability scanner', sub: 'CIS gap · monthly scan', kind: 'scanner', zone: 'client', x: 105, y: 240, arrives: 1, records: 'mssp_gap_assessment', role: 'red', purpose: 'Measures the estate against the baseline, scored' },
    { id: 'siem', label: 'SIEM / log platform', sub: 'collection · retention', kind: 'siem', zone: 'mssp', x: 645, y: 100, arrives: 2, records: 'mssp_detection_rules', role: 'blue', purpose: 'Collects the client’s logs and keeps them for the contract term' },
    { id: 'detections', label: 'Detection rules', sub: 'tuned to the client', kind: 'control', zone: 'mssp', x: 815, y: 100, arrives: 3, records: 'mssp_detection_rules', role: 'blue', purpose: 'Turns the client’s logs into alerts worth a ticket' },
    { id: 'analysts', label: 'Analyst bench', sub: 'triage · escalation · reporting', kind: 'people', zone: 'mssp', x: 645, y: 170, arrives: 0, records: 'mssp_metrics', purpose: 'Your team: works the queue and reports to the client' },
    { id: 'tickets', label: 'Ticket queue', sub: 'SLA clock on every alert', kind: 'ticket', zone: 'mssp', x: 815, y: 170, arrives: 3, records: 'mssp_metrics', role: 'blue', purpose: 'Every alert timed from raise to close: MTTD and MTTR' },
    { id: 'evidence', label: 'Evidence vault', sub: 'what the audit will ask for', kind: 'evidence', zone: 'mssp', x: 645, y: 240, arrives: 4, records: 'mssp_evidence_packet', role: 'grc', purpose: 'Hashed copies of every artefact the packet cites' },
    { id: 'ti', label: 'Threat-intel feeds', sub: 'IOCs tuned to the client', kind: 'data', zone: 'mssp', x: 815, y: 240, arrives: 3, records: 'mssp_detection_rules', role: 'blue', purpose: 'Indicators the rules match against' },
    { id: 'pentester', label: 'Pentester', sub: 'tests what the controls claim', kind: 'people', zone: 'around', x: 275, y: 390, external: true, arrives: 1, records: 'mssp_retest', role: 'red', purpose: 'Proves the gaps, then proves the fixes on retest' },
    { id: 'auditor', label: 'Auditor', sub: 'SOC 2 Type I · ISO 27001 Stage 1', kind: 'people', zone: 'around', x: 645, y: 390, external: true, arrives: 4, records: 'mssp_internal_audit', role: 'grc', purpose: 'Reads the evidence packet and decides' },
    { id: 'r_engagement', label: 'Engagement & scope', sub: '', kind: 'record', zone: 'records', x: 112, y: 478, arrives: 0, records: 'mssp_engagement', role: 'grc', purpose: 'Records the signed scope, RoE and the boundary' },
    { id: 'r_soa', label: 'SoA', sub: '', kind: 'record', zone: 'records', x: 296, y: 478, arrives: 1, records: 'mssp_soa', role: 'grc', purpose: 'Records which controls apply and why' },
    { id: 'r_gap', label: 'Gap assessment', sub: '', kind: 'record', zone: 'records', x: 480, y: 478, arrives: 1, records: 'mssp_gap_assessment', role: 'red', purpose: 'Records the attack surface and the baseline gaps, scored' },
    { id: 'r_matrix', label: 'Control matrix', sub: '', kind: 'record', zone: 'records', x: 664, y: 478, arrives: 2, records: 'mssp_control_matrix', role: 'grc', purpose: 'Records each control, its owner and its evidence' },
    { id: 'r_rules', label: 'Detection rules', sub: '', kind: 'record', zone: 'records', x: 848, y: 478, arrives: 3, records: 'mssp_detection_rules', role: 'blue', purpose: 'Records every rule, what it catches and its test' },
    { id: 'r_retest', label: 'Retest report', sub: '', kind: 'record', zone: 'records', x: 112, y: 512, arrives: 3, records: 'mssp_retest', role: 'red', purpose: 'Records each finding, the fix and the retest result' },
    { id: 'r_metrics', label: 'D&R metrics', sub: '', kind: 'record', zone: 'records', x: 296, y: 512, arrives: 4, records: 'mssp_metrics', role: 'blue', purpose: 'Records MTTD, MTTR and the SLA results' },
    { id: 'r_audit', label: 'Internal audit', sub: '', kind: 'record', zone: 'records', x: 480, y: 512, arrives: 4, records: 'mssp_internal_audit', role: 'grc', purpose: 'Records the audit findings before the auditor arrives' },
    { id: 'r_packet', label: 'Evidence packet', sub: '', kind: 'record', zone: 'records', x: 664, y: 512, arrives: 4, records: 'mssp_evidence_packet', role: 'grc', purpose: 'The capstone: everything the auditor will ask for' },
  ],
  /** The standing data paths, drawn every week once both ends exist. */
  edges: [
    { from: 'endpoints', to: 'client-edge', label: 'telemetry', kind: 'log' },
    { from: 'servers', to: 'client-edge', label: 'telemetry', kind: 'log' },
    { from: 'edr', to: 'siem', label: 'endpoint events', kind: 'log' },
    { from: 'client-edge', to: 'siem', label: 'encrypted log stream', kind: 'log' },
    { from: 'siem', to: 'analysts', label: 'alerts → tickets → reports' },
    { from: 'servers', to: 'backup', label: 'nightly', kind: 'backup' },
    { from: 'idp', to: 'endpoints', label: 'MFA', kind: 'trust' },
  ],
};

export const ARCH_BUILD = archBuildModel(ARCH, {
  processes: {
    0: { title: 'Onboarding & scoping', steps: [
      { from: 'analysts', to: 'r_engagement', label: 'sign the scope and RoE' },
      { from: 'r_engagement', to: 'servers', label: 'what the contract covers' },
    ] },
    1: { title: 'Gap assessment', steps: [
      { from: 'pentester', to: 'client-edge', label: 'external attack surface' },
      { from: 'scanner', to: 'servers', label: 'CIS gap scan, scored' },
      { from: 'analysts', to: 'r_soa', label: 'statement of applicability' },
    ] },
    2: { title: 'Control implementation', steps: [
      { from: 'r_matrix', to: 'servers', label: 'hardening · MFA · logging' },
      { from: 'idp', to: 'endpoints', label: 'MFA everywhere' },
      { from: 'client-edge', to: 'siem', label: 'encrypted log stream' },
    ] },
    3: { title: 'Validation & testing', steps: [
      { from: 'pentester', to: 'servers', label: 'pentest' },
      { from: 'siem', to: 'tickets', label: 'alert → ticket, on the clock' },
      { from: 'analysts', to: 'pentester', label: 'fix and retest' },
    ] },
    4: { title: 'Audit readiness', steps: [
      { from: 'tickets', to: 'analysts', label: 'MTTD · MTTR' },
      { from: 'analysts', to: 'evidence', label: 'the evidence packet' },
      { from: 'evidence', to: 'auditor', label: 'Type I · Stage 1' },
    ] },
  },
  captions: {
    0: 'The engagement at signing: the client’s endpoints and servers, the edge that will forward their logs, your analysts and the signed scope.',
    1: 'New: the pentester, the vulnerability scanner, the SoA and the gap assessment. The gap says what the client has and lacks.',
    2: 'New: client identity with MFA, EDR, the backup target and the SIEM. The client’s logs reach your SOC; the control matrix is live.',
    3: 'New: detection rules, the ticket queue and threat-intel feeds. The pentest proves the controls; every alert runs on an SLA clock.',
    4: 'New: the evidence vault and the auditor. MTTD and MTTR are measured and the audit packet is handed over.',
  },
});

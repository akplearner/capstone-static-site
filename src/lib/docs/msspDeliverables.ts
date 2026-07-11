import { Column } from '../grc/templates';
import { DeliverableDef } from './types';

// Deliverable forms for the MSSP / SOC 2 + ISO 27001 engagement course.
// These are course-scoped (`courseId: 'mssp'`) so they never surface on the
// Security+ course's pages, ZIP, or gate panels. See docs/MSSP_MODEL.md for the
// engagement model these map onto (P0 scope → P4 audit readiness).

// Local column helper (mirrors the one in definitions.ts; kept local to avoid a
// circular import, since definitions.ts imports this file).
const c = (
  field: string,
  label: string,
  type: Column['type'],
  extra: Partial<Column> = {}
): Column => ({ field, label, type, ...extra });

const STATUS = ['Not started', 'In progress', 'Implemented', 'Operating'];

export const MSSP_DELIVERABLES: DeliverableDef[] = [
  // 1 — Engagement agreement & system boundary (P0) ─────────────────────────
  {
    id: 'mssp_engagement',
    courseId: 'mssp',
    num: 1,
    file: '01_Engagement_and_Scope.md',
    title: 'Engagement Agreement & Scope',
    owner: 'grc',
    folder: '01_Engagement_and_Scope',
    standard: 'MSA / SOW / NDA',
    framework: 'SOC_2',
    weeks: [0],
    gate: 1,
    kind: 'template',
    exportFormat: 'md',
    purpose:
      'Define the client, the system boundary, and the terms of the engagement — the equivalent of the SOC 2 “system description” scope and the ISO 27001 Clause 4 scope statement.',
    howTo:
      'Fill every field. The in-scope systems/data boundary drives every later control, test, and evidence item. Nothing is assessed until the agreement is signed off.',
    sections: [
      {
        kind: 'fields',
        fields: [
          { field: 'client', label: 'Client / organisation', type: 'text', required: true, placeholder: 'Acme SaaS Ltd' },
          { field: 'engagement_type', label: 'Engagement', type: 'select', options: ['SOC 2 Type I readiness', 'SOC 2 Type II', 'ISO 27001 Stage 1', 'ISO 27001 certification', 'Combined SOC 2 + ISO 27001'] },
          { field: 'trust_categories', label: 'SOC 2 categories in scope', type: 'text', placeholder: 'Security (required) + Availability, Confidentiality' },
          { field: 'system_boundary', label: 'System / ISMS boundary', type: 'area', required: true, help: 'The systems, services, data and locations the attestation covers.', placeholder: 'Production AWS account, the customer web app + API, the supporting CI/CD, the corporate identity provider.' },
          { field: 'out_of_scope', label: 'Explicitly out of scope', type: 'area', placeholder: 'Marketing website, internal HR systems.' },
          { field: 'start_date', label: 'Engagement start', type: 'date', required: true },
          { field: 'observation_window', label: 'Type II observation window', type: 'text', placeholder: '3 months (Type I first, then observe)' },
          { field: 'nda', label: 'NDA / confidentiality', type: 'select', options: ['Signed', 'Pending'] },
          { field: 'authorization', label: 'Authorization / sign-off', type: 'text', required: true, placeholder: 'Client CISO approved — [name], [date]' },
        ],
      },
    ],
    dod: [
      { label: 'Client, system boundary and sign-off are filled in', test: (d) => !!(d.fields.client && d.fields.system_boundary && d.fields.authorization) },
      { label: 'Engagement type and start date are set', test: (d) => !!(d.fields.engagement_type && d.fields.start_date) },
    ],
  },

  // 2 — Statement of Applicability (P1) ─────────────────────────────────────
  {
    id: 'mssp_soa',
    courseId: 'mssp',
    num: 2,
    file: '02_Statement_of_Applicability.csv',
    title: 'Statement of Applicability (SoA)',
    owner: 'grc',
    folder: '01_Engagement_and_Scope',
    standard: 'ISO 27001:2022 Clause 6.1.3',
    framework: 'ISO_27001',
    weeks: [1],
    gate: 1,
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'The centrepiece ISO 27001 document — for each Annex A control, state whether it applies, why, and its implementation status. The auditor reads this first.',
    howTo:
      'Add a row per Annex A control you are addressing. Justify inclusion/exclusion. “Status” tracks design → operation.',
    source: 'Risk assessment (which controls treat which risks)',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'controls',
          label: 'Annex A controls',
          help: 'ISO/IEC 27001:2022 Annex A has 93 controls across 4 themes (Organizational, People, Physical, Technological).',
          columns: [
            c('annex', 'Annex A ref', 'text', { placeholder: 'A.8.9' }),
            c('control', 'Control', 'text', { placeholder: 'Configuration management' }),
            c('theme', 'Theme', 'select', { options: ['Organizational', 'People', 'Physical', 'Technological'] }),
            c('applicable', 'Applicable?', 'select', { options: ['Yes', 'No'] }),
            c('justification', 'Justification', 'text', { placeholder: 'Treats the “insecure default config” risk (R-03).' }),
            c('status', 'Status', 'select', { options: STATUS }),
          ],
          seed: [
            { annex: 'A.8.9', control: 'Configuration management', theme: 'Technological', applicable: 'Yes', justification: 'Hardened baselines treat R-03 (insecure defaults).', status: 'Implemented' },
            { annex: 'A.8.15', control: 'Logging', theme: 'Technological', applicable: 'Yes', justification: 'Central logging supports detection (SOC 2 CC7).', status: 'Operating' },
            { annex: 'A.7.4', control: 'Physical security monitoring', theme: 'Physical', applicable: 'No', justification: 'Cloud-hosted; inherited from AWS (CSP responsibility).', status: 'Not started' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least three Annex A controls with an applicability decision', test: (d) => (d.groups.controls ?? []).filter((r) => !!r.annex && !!r.applicable).length >= 3 },
      { label: 'Every applicable control has a justification', test: (d) => (d.groups.controls ?? []).filter((r) => r.applicable === 'Yes').every((r) => !!r.justification) },
    ],
  },

  // 3 — Control Matrix (P2) ─────────────────────────────────────────────────
  {
    id: 'mssp_control_matrix',
    courseId: 'mssp',
    num: 3,
    file: '03_Control_Matrix.csv',
    title: 'Control Matrix',
    owner: 'grc',
    folder: '02_Risk_and_Controls',
    standard: 'SOC 2 TSC ↔ ISO 27001',
    framework: 'SOC_2',
    weeks: [2],
    gate: 2,
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'The working crosswalk — each control mapped to its SOC 2 Common Criteria and ISO Annex A references, with an owner, its implementation status, and the evidence that proves it operates.',
    howTo:
      'One row per control. “Evidence” names the artifact an auditor would sample (a config, a log, a ticket, a report).',
    source: 'SoA + the hardening/detection work Blue implements',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'controls',
          label: 'Controls',
          columns: [
            c('control', 'Control', 'text', { placeholder: 'MFA enforced on all admin access' }),
            c('soc2', 'SOC 2 (CC)', 'text', { placeholder: 'CC6.1' }),
            c('iso', 'ISO Annex A', 'text', { placeholder: 'A.8.5' }),
            c('owner', 'Owner', 'select', { options: ['Red', 'Blue', 'GRC', 'Client'] }),
            c('status', 'Status', 'select', { options: STATUS }),
            c('evidence', 'Evidence', 'text', { placeholder: 'IdP MFA policy export + access review log' }),
          ],
          seed: [
            { control: 'MFA on all administrative access', soc2: 'CC6.1', iso: 'A.8.5', owner: 'Blue', status: 'Operating', evidence: 'IdP policy export + Q2 access review' },
            { control: 'Centralised logging & alerting', soc2: 'CC7.2', iso: 'A.8.15/A.8.16', owner: 'Blue', status: 'Operating', evidence: 'SIEM rule pack + sample alert ticket' },
            { control: 'Annual penetration test', soc2: 'CC4.1', iso: 'A.8.8', owner: 'Red', status: 'Implemented', evidence: 'Pentest report + retest' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least three controls, each with a SOC 2 or ISO reference', test: (d) => (d.groups.controls ?? []).filter((r) => !!r.control && (!!r.soc2 || !!r.iso)).length >= 3 },
      { label: 'Every control names an owner and evidence', test: (d) => (d.groups.controls ?? []).length > 0 && (d.groups.controls ?? []).every((r) => !!r.owner && !!r.evidence) },
    ],
  },

  // 4 — Retest & Remediation-Validation Report (P3) ─────────────────────────
  {
    id: 'mssp_retest',
    courseId: 'mssp',
    num: 4,
    file: '04_Retest_and_Validation.md',
    title: 'Retest & Remediation-Validation Report',
    owner: 'red',
    folder: '03_Validation',
    standard: 'NIST SP 800-115 · PTES',
    framework: 'NIST_800_115',
    weeks: [3, 4],
    gate: 3,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'Prove the controls actually work: for each finding from the assessment, record the fix and the retest result. This is the “operating effectiveness” evidence a Type II / Stage 2 auditor wants.',
    howTo:
      'One row per finding. Retest each after remediation and record Closed / Open / Risk-accepted with the retest date.',
    source: 'The engagement’s penetration test findings',
    sections: [
      {
        kind: 'fields',
        fields: [
          { field: 'methodology', label: 'Methodology', type: 'area', help: 'How you tested and retested.', placeholder: 'PTES + OWASP WSTG; authenticated + unauthenticated; retest of every high/critical after remediation.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'findings',
          label: 'Findings & retest',
          columns: [
            c('finding', 'Finding', 'text', { placeholder: 'SQL injection on /login' }),
            c('severity', 'Severity', 'select', { options: ['Critical', 'High', 'Medium', 'Low'] }),
            c('remediation', 'Remediation', 'text', { placeholder: 'Parameterised queries + WAF rule' }),
            c('retest', 'Retest result', 'select', { options: ['Closed', 'Open', 'Risk accepted'] }),
            c('retest_date', 'Retest date', 'text', { placeholder: '2026-07-05' }),
          ],
          seed: [
            { finding: 'SQL injection — auth bypass on /login', severity: 'Critical', remediation: 'Parameterised queries; WAF signature; input validation', retest: 'Closed', retest_date: '2026-07-05' },
            { finding: 'Verbose error stack traces', severity: 'Low', remediation: 'Disable debug in prod', retest: 'Closed', retest_date: '2026-07-05' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least one finding with a retest result', test: (d) => (d.groups.findings ?? []).some((r) => !!r.finding && !!r.retest) },
      { label: 'Every critical/high finding has a remediation recorded', test: (d) => (d.groups.findings ?? []).filter((r) => r.severity === 'Critical' || r.severity === 'High').every((r) => !!r.remediation) },
    ],
  },

  // 5 — Detection Rules (P3) ────────────────────────────────────────────────
  {
    id: 'mssp_detection_rules',
    courseId: 'mssp',
    num: 5,
    file: '05_Detection_Rules.csv',
    title: 'Detection Rules',
    owner: 'blue',
    folder: '03_Validation',
    standard: 'Sigma · MITRE ATT&CK',
    framework: 'NIST_CSF',
    weeks: [3],
    gate: 3,
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'The MDR detection content that satisfies SOC 2 CC7.2/CC7.3 (“monitoring for anomalies”) and ISO A.8.16 — each rule mapped to the ATT&CK technique it detects and validated against the Red team’s activity.',
    howTo:
      'One row per detection. Map to an ATT&CK technique and note whether it fired during the validation test.',
    source: 'The Red team’s test activity (detections must catch it)',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'rules',
          label: 'Detections',
          columns: [
            c('name', 'Rule', 'text', { placeholder: 'SQLi UNION in web logs' }),
            c('logsource', 'Log source', 'text', { placeholder: 'Apache access log' }),
            c('attack', 'ATT&CK technique', 'text', { placeholder: 'T1190 Exploit Public-Facing App' }),
            c('logic', 'Detection logic', 'text', { placeholder: "grep -Ei 'union.*select' access.log → alert" }),
            c('validated', 'Validated?', 'select', { options: ['Fired', 'Missed', 'Not tested'] }),
          ],
          seed: [
            { name: 'SQLi UNION/SELECT in web logs', logsource: 'Apache access log', attack: 'T1190', logic: "regex 'union.*select|or 1=1' on URI → high alert", validated: 'Fired' },
            { name: 'SSH brute force', logsource: 'auth.log', attack: 'T1110', logic: '>10 failed logins / 1 min from one IP → alert', validated: 'Fired' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least two detections mapped to an ATT&CK technique', test: (d) => (d.groups.rules ?? []).filter((r) => !!r.name && !!r.attack).length >= 2 },
      { label: 'At least one detection validated as “Fired”', test: (d) => (d.groups.rules ?? []).some((r) => r.validated === 'Fired') },
    ],
  },

  // 6 — Detection & Response Metrics (P4) ───────────────────────────────────
  {
    id: 'mssp_metrics',
    courseId: 'mssp',
    num: 6,
    file: '06_Detection_and_Response_Metrics.md',
    title: 'Detection & Response Metrics',
    owner: 'blue',
    folder: '04_Audit_Readiness',
    standard: 'SOC 2 CC7 · ISO 9.1',
    framework: 'SOC_2',
    weeks: [4],
    gate: 3,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'Operating-effectiveness metrics for the monitoring & response controls — MTTD/MTTR and detection coverage over the observation window, the numbers a Type II auditor samples for CC7.',
    howTo: 'Fill the metric fields from the SIEM/IR tickets over the observation window.',
    source: 'SIEM dashboards + incident tickets',
    sections: [
      {
        kind: 'fields',
        fields: [
          { field: 'window', label: 'Observation window', type: 'text', placeholder: 'Apr–Jun 2026' },
          { field: 'incidents', label: 'Incidents handled', type: 'text', placeholder: '7' },
          { field: 'mttd', label: 'Mean time to detect (MTTD)', type: 'text', placeholder: '18 min' },
          { field: 'mttr', label: 'Mean time to respond (MTTR)', type: 'text', placeholder: '2h 40m' },
          { field: 'coverage', label: 'ATT&CK detection coverage', type: 'text', placeholder: '62% of in-scope techniques' },
          { field: 'false_positive', label: 'False-positive rate', type: 'text', placeholder: '11%' },
          { field: 'commentary', label: 'Commentary / trend', type: 'area', placeholder: 'MTTR down 30% after the IR runbook rollout; coverage gap on lateral-movement techniques.' },
        ],
      },
    ],
    dod: [
      { label: 'MTTD and MTTR are recorded', test: (d) => !!(d.fields.mttd && d.fields.mttr) },
      { label: 'Observation window and coverage are set', test: (d) => !!(d.fields.window && d.fields.coverage) },
    ],
  },

  // 7 — Internal Audit Report (P4) ──────────────────────────────────────────
  {
    id: 'mssp_internal_audit',
    courseId: 'mssp',
    num: 7,
    file: '07_Internal_Audit_Report.md',
    title: 'Internal Audit Report',
    owner: 'grc',
    folder: '04_Audit_Readiness',
    standard: 'ISO 27001 Clause 9.2 · 9.3',
    framework: 'ISO_27001',
    weeks: [4],
    gate: 3,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'The mandatory ISO internal audit (Clause 9.2) run before the external auditor — find your own nonconformities and fix them first. Feeds the management review (9.3).',
    howTo:
      'Record findings against controls: conformity, minor or major nonconformity, with the corrective action and owner.',
    source: 'The Control Matrix + evidence review',
    sections: [
      {
        kind: 'fields',
        fields: [
          { field: 'auditor', label: 'Internal auditor', type: 'text', placeholder: 'GRC lead (independent of the control owner)' },
          { field: 'scope', label: 'Audit scope', type: 'area', placeholder: 'All applicable Annex A controls + SOC 2 CC1–CC9.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'findings',
          label: 'Audit findings',
          columns: [
            c('control', 'Control', 'text', { placeholder: 'A.8.8 Vulnerability management' }),
            c('result', 'Result', 'select', { options: ['Conformity', 'Minor NC', 'Major NC', 'Opportunity'] }),
            c('finding', 'Finding', 'text', { placeholder: 'Two highs open past SLA' }),
            c('action', 'Corrective action', 'text', { placeholder: 'Patch + tighten SLA; re-audit in 2 weeks' }),
            c('owner', 'Owner', 'text', { placeholder: 'Blue lead' }),
          ],
          seed: [
            { control: 'A.8.8 Vulnerability management', result: 'Minor NC', finding: 'Two high findings open past the 30-day SLA', action: 'Remediate + add SLA alerting; re-audit in 2 weeks', owner: 'Blue lead' },
            { control: 'CC1.4 Competence', result: 'Conformity', finding: 'Security training records complete', action: '—', owner: 'GRC' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least one audit finding with a result and corrective action', test: (d) => (d.groups.findings ?? []).some((r) => !!r.control && !!r.result) },
      { label: 'Every nonconformity has a corrective action', test: (d) => (d.groups.findings ?? []).filter((r) => r.result === 'Minor NC' || r.result === 'Major NC').every((r) => !!r.action) },
    ],
  },

  // 8 — Audit Evidence Packet (P4) ──────────────────────────────────────────
  {
    id: 'mssp_evidence_packet',
    courseId: 'mssp',
    num: 8,
    file: '08_Audit_Evidence_Packet.csv',
    title: 'Audit Evidence Packet',
    owner: 'grc',
    folder: '04_Audit_Readiness',
    standard: 'SOC 2 Type I/II · ISO Stage 1/2',
    framework: 'SOC_2',
    weeks: [4],
    gate: 3,
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'The index the auditor works from — every control mapped to the concrete evidence artifact, who owns it, and where it lives. Turns a pile of files into a defensible audit trail.',
    howTo:
      'One row per evidence item. Reference the control (SOC 2 CC / ISO Annex A) and the exact artifact + location.',
    source: 'The Control Matrix + all role deliverables',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'evidence',
          label: 'Evidence index',
          columns: [
            c('control', 'Control', 'text', { placeholder: 'CC6.1 / A.8.5 — MFA' }),
            c('artifact', 'Evidence artifact', 'text', { placeholder: 'IdP MFA policy export (PDF)' }),
            c('type', 'Type', 'select', { options: ['Config', 'Log', 'Report', 'Ticket', 'Policy', 'Screenshot'] }),
            c('owner', 'Owner', 'select', { options: ['Red', 'Blue', 'GRC'] }),
            c('location', 'Location', 'text', { placeholder: '04_Audit_Readiness/Evidence/' }),
            c('period', 'Covers period', 'text', { placeholder: 'Apr–Jun 2026' }),
          ],
          seed: [
            { control: 'CC6.1 / A.8.5 — MFA', artifact: 'IdP MFA policy export + access review', type: 'Config', owner: 'Blue', location: '04_Audit_Readiness/Evidence/', period: 'Apr–Jun 2026' },
            { control: 'CC4.1 / A.8.8 — Pentest', artifact: 'Retest & Validation report', type: 'Report', owner: 'Red', location: '03_Validation/', period: 'Jun 2026' },
            { control: 'CC7.3 — Detection', artifact: 'SIEM rule pack + sample alert ticket', type: 'Log', owner: 'Blue', location: '03_Validation/', period: 'Apr–Jun 2026' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least three evidence items, each tied to a control', test: (d) => (d.groups.evidence ?? []).filter((r) => !!r.control && !!r.artifact).length >= 3 },
      { label: 'Every evidence item names an owner and location', test: (d) => (d.groups.evidence ?? []).length > 0 && (d.groups.evidence ?? []).every((r) => !!r.owner && !!r.location) },
    ],
  },
];

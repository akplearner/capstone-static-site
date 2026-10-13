/**
 * R107 — the competency ontology: what a graded task teaches a person to DO,
 * as a node with a stable id, anchored to the exam objective or the control
 * it serves. The ids are the join key everything else uses: the member
 * profile, the course sheet, the published `content/ontology/competencies.json`
 * and, later, any statement that crosses to another platform.
 *
 *   comp.<area>.<slug>   semver per node; additive; deprecate, never remove.
 *
 * `objectiveRefs` are `'<examCode>.<domainId>'` (the exam code slugged:
 * `SY0-701.d2`, `SOC-2-ISO-27001.c4`), a `ControlRef.code` or a
 * `StandardDef.id` from `standards.ts`. Every graded task of every course maps
 * to one to three nodes (`TASK_SKILLS`); a node nobody maps to is a node that
 * does not exist. Labels are imperative, eight words or fewer: what the
 * person can now do.
 */

export interface SkillNode {
  id: string;
  version: string;
  /** Eight words or fewer, imperative. */
  label: string;
  area: string;
  objectiveRefs: string[];
  parents?: string[];
  deprecated?: boolean;
}

export const AREA_LABEL: Record<string, string> = {
  recon: 'Reconnaissance',
  vuln: 'Vulnerability management',
  exploit: 'Exploitation and testing',
  report: 'Reporting',
  harden: 'Hardening and defence',
  detect: 'Detection and monitoring',
  respond: 'Incident response',
  forensics: 'Evidence and forensics',
  grc: 'Governance and compliance',
  risk: 'Risk',
  audit: 'Audit and assessment',
  identity: 'Identity and access',
  crypto: 'Cryptography',
  arch: 'Architecture and network design',
  data: 'Data security',
  ops: 'Security operations',
  'ai-attack': 'AI attack and evaluation',
};

const n = (id: string, label: string, objectiveRefs: string[], parents?: string[]): SkillNode => ({
  id: `comp.${id}`, version: '1.0.0', label, area: id.split('.')[0], objectiveRefs, ...(parents ? { parents } : {}),
});

export const SKILLS: SkillNode[] = [
  // ── Reconnaissance ───────────────────────────────────────────────────────
  n('recon.osint', 'Gather open-source intelligence on a target', ['SY0-701.d2', 'NIST.800-115']),
  n('recon.dns-whois', 'Enumerate DNS and WHOIS records', ['SY0-701.d2']),
  n('recon.fingerprint-web', 'Fingerprint web technologies', ['SY0-701.d2']),
  n('recon.port-scan', 'Scan ports and services with nmap', ['SY0-701.d2', 'CS0-003.d2', 'NIST.800-115']),
  n('recon.web-scan', 'Scan a web server for known weaknesses', ['SY0-701.d2', 'CS0-003.d2', 'OWASP']),
  n('recon.attack-surface', 'Enumerate an external attack surface', ['SOC-2-ISO-27001.c2', 'NIST.800-115']),
  n('recon.tls-hygiene', 'Assess TLS configuration and exposure', ['SOC-2-ISO-27001.c2', 'NIST.800-53.SC-8']),
  // ── Vulnerability management ─────────────────────────────────────────────
  n('vuln.summarise-findings', 'Summarise vulnerabilities for a non-attacker reader', ['SY0-701.d2', 'CS0-003.d4']),
  n('vuln.cvss-score', 'Score a vulnerability with CVSS', ['SY0-701.d5', 'CS0-003.d2', 'CVSS']),
  n('vuln.risk-rank', 'Rank findings on a risk matrix', ['CS0-003.d2', 'NIST_800_30']),
  n('vuln.remediation-plan', 'Write a fix plan with owners and dates', ['CS0-003.d2', 'NIST_800_40']),
  n('vuln.read-scanner-output', 'Read vulnerability and configuration assessment results', ['CS0-003.d2', 'CIS.BENCHMARK']),
  n('vuln.validate-scan', 'Validate scanner findings from the attacker side', ['CS0-003.d2', 'NIST.800-115']),
  n('vuln.config-scan', 'Scan configuration against a benchmark', ['CISSP.d6', 'CIS.BENCHMARK']),
  n('vuln.cis-gap-scan', 'Run a CIS baseline gap scan', ['SOC-2-ISO-27001.c2', 'CIS.BENCHMARK']),
  // ── Exploitation and testing ─────────────────────────────────────────────
  n('exploit.sql-injection', 'Exploit SQL injection with evidence', ['SY0-701.d2', 'OWASP']),
  n('exploit.brute-force', 'Brute-force authentication in scope', ['SY0-701.d2', 'MITRE_ATTACK']),
  n('exploit.exploit-chain', 'Prove a full exploit chain with evidence', ['SY0-701.d2', 'NIST.800-115']),
  n('exploit.web-pentest', 'Test a web application to WSTG', ['SOC-2-ISO-27001.c4', 'OWASP', 'PTES']),
  n('exploit.retest', 'Retest findings to closure', ['SOC-2-ISO-27001.c5', 'NIST.800-115']),
  n('exploit.tester-attestation', 'Attest a test methodology', ['SOC-2-ISO-27001.c5', 'PTES']),
  // ── Reporting ────────────────────────────────────────────────────────────
  n('report.technical-briefing', 'Explain exploits to non-technical stakeholders', ['SY0-701.d5', 'CS0-003.d4']),
  n('report.incident-findings', 'Summarise detection work and build an incident timeline', ['SY0-701.d4', 'NIST.800-61.POST']),
  n('report.final-report', 'Compile a professional security report', ['SY0-701.d5', 'ISO27001.9.3']),
  n('report.executive-debrief', 'Write an executive debrief with metrics and lessons', ['CS0-003.d4', 'NIST.800-61.POST']),
  n('report.detection-metrics', 'Report MTTD, MTTR and ATT&CK coverage', ['SOC-2-ISO-27001.c4', 'SOC2.CC7', 'ISO27001.9.1']),
  n('report.security-metrics', 'Define metrics with a formula and a target', ['CISSP.d1', 'CY0-001.d4', 'ISO27001.9.1']),
  n('report.federal-incident-reporting', 'Write federal incident reporting', ['CISSP.d7', 'NIST.800-171.3.6']),
  // ── Hardening and defence ────────────────────────────────────────────────
  n('harden.linux-baseline', 'Harden Linux with ufw, fail2ban and Lynis', ['SY0-701.d3', 'CIS.BENCHMARK']),
  n('harden.windows-baseline', 'Harden Windows with Firewall and Defender', ['SY0-701.d3', 'CIS.BENCHMARK']),
  n('harden.host-firewall', 'Implement host firewall and access controls', ['SOC-2-ISO-27001.c3', 'NIST.800-53.SC-7']),
  n('harden.change-discipline', 'Record each change for the evidence trail', ['SOC-2-ISO-27001.c3', 'ITIL.change']),
  n('harden.tls-and-rule-base', 'Re-test TLS and review the rule base', ['CISSP.d6', 'NIST.800-53.SC-8']),
  n('harden.secrets-and-gateway', 'Store secrets and limit through a gateway', ['CY0-001.d2', 'NIST.800-53.IA-5']),
  n('harden.guardrails', 'Guard model inputs and outputs', ['CY0-001.d2', 'OWASP_LLM']),
  n('harden.agent-scope', 'Scope an agent to least privilege', ['CY0-001.d2', 'OWASP_LLM']),
  n('harden.redaction', 'Redact personal data before it is written', ['CY0-001.d2', 'NIST_AI_RMF']),
  n('harden.pipeline-gates', 'Gate a pipeline on scans and tests', ['CY0-001.d3', 'CISSP.d8', 'NIST_800_218']),
  n('harden.guardrail-tests', 'Turn guardrails into regression tests', ['CY0-001.d3', 'NIST_800_218']),
  n('harden.clean-rebuild', 'Rebuild a system clean and prove it', ['CY0-001.d2', 'WAF.reliability']),
  n('harden.model-scanning', 'Scan model files for unsafe code', ['CY0-001.d2', 'OWASP_LLM']),
  n('harden.ai-gateway-zone', 'Make an AI gateway the sole path', ['CISSP.d4', 'NIST_800_207']),
  // ── Detection and monitoring ─────────────────────────────────────────────
  n('detect.deploy-endpoint-sensor', 'Deploy an endpoint sensor to the SOC', ['CS0-003.d1', 'NIST.CSF.DE.CM-01']),
  n('detect.deploy-network-sensor', 'Deploy a network IDS and confirm its feed', ['CS0-003.d1', 'NIST.CSF.DE.CM-01']),
  n('detect.coverage-validation', 'Validate data-source coverage', ['CS0-003.d1', 'NIST.CSF.DE']),
  n('detect.capture-baseline', 'Capture and baseline traffic and logs', ['SY0-701.d4', 'CS0-003.d1', 'NIST.CSF.DE.CM']),
  n('detect.write-detection', 'Write a detection filter or rule', ['SY0-701.d4', 'NIST.CSF.DE.AE']),
  n('detect.windows-event-logs', 'Read Windows event logs for an attack', ['SY0-701.d4']),
  n('detect.triage-alerts', 'Triage alerts with a verdict and a reason', ['CS0-003.d1', 'NIST.800-61.DETECT']),
  n('detect.live-triage', 'Triage live from packets and logs', ['SY0-701.d4', 'NIST.800-61.DETECT']),
  n('detect.sigma-rules', 'Write Sigma detections mapped to ATT&CK', ['SOC-2-ISO-27001.c3', 'MITRE_ATTACK']),
  n('detect.validate-detection', 'Validate a detection against a test attack', ['SOC-2-ISO-27001.c3', 'NIST.CSF.DE.AE']),
  n('detect.alert-to-ticket', 'Route an alert to a ticket', ['CY0-001.d3', 'ITIL.incident']),
  n('detect.shadow-ai', 'Find unsanctioned AI tools on the network', ['CY0-001.d4', 'NIST_AI_RMF']),
  // ── Incident response ────────────────────────────────────────────────────
  n('respond.find-the-incident', 'Scope an incident from the first alert', ['CS0-003.d3', 'NIST.800-61.DETECT']),
  n('respond.contain', 'Contain an attacker with a timestamped block', ['SY0-701.d4', 'CS0-003.d3', 'NIST.800-61.CONTAIN']),
  n('respond.timeline', 'Rebuild an attack timeline from logs', ['SY0-701.d4', 'CS0-003.d3', 'NIST.800-61.DETECT']),
  n('respond.incident-report', 'Write an incident report', ['CS0-003.d3', 'NIST.800-61']),
  n('respond.ir-runbook', 'Write an incident-response runbook', ['SY0-701.d4', 'NIST.800-61', 'ISO27001.A.5.24']),
  n('respond.seven-step-plan', 'Specify the seven-step incident life cycle', ['CISSP.d7', 'NIST.800-61']),
  n('respond.tabletop', 'Run a tabletop with injects', ['CISSP.d6', 'NIST.800-53.CP-4']),
  n('respond.restore-test', 'Restore from backup and compare hashes', ['CISSP.d7', 'NIST.800-53.CP-4']),
  n('respond.recovery-targets', 'Set MTD, RTO, RPO and WRT', ['CISSP.d7', 'NIST_800_34']),
  // ── Evidence and forensics ───────────────────────────────────────────────
  n('forensics.hash-evidence', 'Hash and log evidence', ['SY0-701.d4', 'CS0-003.d3', 'CY0-001.d2', 'ISO_27037']),
  n('forensics.chain-of-custody', 'Keep a chain of custody', ['SY0-701.d4', 'ISO_27037']),
  n('forensics.packet-capture', 'Capture packets and quote the attacker request', ['CS0-003.d1', 'NIST.800-61.DETECT']),
  n('forensics.log-pivoting', 'Pivot across logs to prove an attack', ['CS0-003.d1']),
  n('forensics.iocs', 'Turn findings into indicators with ATT&CK ids', ['CS0-003.d3', 'MITRE_ATTACK']),
  // ── Governance and compliance ────────────────────────────────────────────
  n('grc.framework-mapping', 'Map findings to NIST CSF and CIS', ['SY0-701.d5', 'NIST.CSF', 'CIS.CONTROLS']),
  n('grc.hardening-standard', 'Write a hardening standard as an SOP', ['SY0-701.d5', 'CIS.BENCHMARK']),
  n('grc.vm-sop', 'Write a vulnerability-management SOP', ['SY0-701.d5', 'NIST_800_40']),
  n('grc.policy-shall', 'Write policy as shall statements with an owner', ['CISSP.d1', 'CY0-001.d4', 'NIST.CSF.GV.PO']),
  n('grc.classification', 'Classify assets with one owner each', ['CISSP.d2', 'ISO27001.A.5.12']),
  n('grc.maturity', 'Score maturity on a 0 to 4 scale', ['CISSP.d1']),
  n('grc.supplier-tiering', 'Tier suppliers with top-tier terms', ['CISSP.d1', 'NIST.CSF.GV.SC']),
  n('grc.ai-lifecycle', 'Map the AI life cycle with checkpoints', ['CY0-001.d1', 'NIST.AI-RMF.MAP']),
  n('grc.data-lineage', 'Map data types and lineage', ['CY0-001.d1', 'NIST.AI-RMF.MAP']),
  n('grc.applicability', 'Decide which rules apply, with a reason', ['CY0-001.d4', 'ISO42001']),
  n('grc.model-cards', 'Write a model card per model', ['CY0-001.d4', 'NIST_AI_RMF']),
  n('grc.responsible-ai', 'Assess responsible-AI principles with evidence', ['CY0-001.d4', 'ISO42001']),
  n('grc.system-map', 'Map an AI system: models, prompts, writers', ['CY0-001.d4', 'NIST.AI-RMF.MAP']),
  n('grc.ai-act-decision', 'Decide EU AI Act applicability', ['CISSP.d2', 'NIST_AI_RMF']),
  n('grc.categorise-system', 'Categorise a system by high-water mark', ['CISSP.d2', 'NIST.800-53.RA-3']),
  n('grc.ethics-canons', 'Apply the ISC2 canons in order', ['CISSP.d1']),
  // ── Risk ─────────────────────────────────────────────────────────────────
  n('risk.likelihood-impact', 'Score risk as likelihood times impact', ['SY0-701.d5', 'NIST_800_30']),
  n('risk.register', 'Keep a risk register with owners', ['CISSP.d1', 'SOC-2-ISO-27001.c2', 'ISO27001.6.1.2']),
  n('risk.quantitative', 'Quantify a risk with SLE and ALE', ['CISSP.d1']),
  n('risk.iso-27005', 'Assess risk to ISO 27005', ['SOC-2-ISO-27001.c2', 'ISO27005']),
  n('risk.soa', 'Write a Statement of Applicability', ['SOC-2-ISO-27001.c2', 'ISO27001.6.1.3']),
  n('risk.threat-model', 'Threat-model with STRIDE', ['CISSP.d3', 'CY0-001.d2', 'STRIDE']),
  n('risk.threat-model-controls', 'Threat-model a proposed control set', ['SOC-2-ISO-27001.c2', 'NIST.800-115']),
  n('risk.accept', 'Accept a risk with a named owner', ['SOC-2-ISO-27001.c5', 'CY0-001.d4', 'ISO27001.6.1.3']),
  // ── Audit and assessment ─────────────────────────────────────────────────
  n('audit.control-matrix', 'Build a cross-framework control matrix', ['SOC-2-ISO-27001.c3', 'SOC2', 'ISO27001']),
  n('audit.evidence-collection', 'Collect evidence per implemented control', ['SOC-2-ISO-27001.c4', 'SOC2.CC4.1']),
  n('audit.remediation-tracking', 'Track findings to closure', ['SOC-2-ISO-27001.c4', 'SOC2.CC4.1']),
  n('audit.internal-audit', 'Run an ISO 27001 internal audit', ['SOC-2-ISO-27001.c4', 'ISO27001.9.2']),
  n('audit.corrective-action', 'Raise corrective actions for nonconformities', ['SOC-2-ISO-27001.c5', 'ISO27001.10.2']),
  n('audit.evidence-packet', 'Assemble an audit evidence packet', ['SOC-2-ISO-27001.c4', 'SOC2']),
  n('audit.assess-controls', 'Assess controls by examine, interview, test', ['CISSP.d6', 'NIST.800-53.CA-2']),
  n('audit.questionnaire', 'Answer a customer questionnaire with evidence', ['CISSP.d6', 'CY0-001.d4', 'SOC2']),
  n('audit.self-assess-171', 'Self-assess against SP 800-171', ['CISSP.d1', 'NIST.800-171']),
  n('audit.ssp', 'Assemble a System Security Plan', ['CISSP.d1', 'NIST.800-53.PL-2']),
  n('audit.map-to-federal', 'Map controls to federal requirements', ['CISSP.d4', 'CISSP.d7', 'NIST.800-171']),
  // ── Identity and access ──────────────────────────────────────────────────
  n('identity.rbac', 'Design role-based access with MFA rules', ['CISSP.d5', 'NIST.800-53.AC-6']),
  n('identity.joiner-leaver', 'Specify joiner and leaver with timed disablement', ['CISSP.d5', 'ISO27001.A.5.18']),
  n('identity.access-matrix', 'Specify an access matrix with separation of duties', ['CISSP.d5', 'NIST.800-53.AC-5']),
  n('identity.mfa-console', 'Prove MFA on the console', ['CISSP.d5', 'NIST_800_63']),
  n('identity.orphan-accounts', 'Find and disable orphan accounts', ['CISSP.d5', 'NIST.800-53.AC-2']),
  n('identity.federation', 'Federate with SAML and OIDC', ['CISSP.d5', 'NIST_800_63']),
  n('identity.access-review', 'Repeat an access review on schedule', ['CISSP.d6', 'NIST.800-53.AC-2']),
  n('identity.machine-identities', 'Register machine identities with rotation', ['CISSP.d4', 'NIST.800-53.IA-5']),
  // ── Cryptography ─────────────────────────────────────────────────────────
  n('crypto.standard', 'Write a cryptography standard: key sizes and rotation', ['CISSP.d3', 'NIST.800-53.SC-12']),
  n('crypto.tls-versions', 'Prove TLS versions and ciphers', ['CISSP.d8', 'NIST.800-53.SC-8']),
  n('crypto.key-rotation', 'Rotate a key and record it', ['CISSP.d6', 'NIST.800-53.SC-12']),
  // ── Architecture and network design ──────────────────────────────────────
  n('arch.trust-boundaries', 'Draw architecture with trust boundaries', ['CISSP.d3', 'ISO42010']),
  n('arch.shared-responsibility', 'Write shared-responsibility rows', ['CISSP.d3']),
  n('arch.default-deny-zones', 'Design zones with default deny', ['CISSP.d4', 'NIST.800-53.SC-7']),
  n('arch.rule-base', 'Specify a rule base with approved protocols', ['CISSP.d4', 'NIST.800-53.SC-7']),
  n('arch.sdlc-gates', 'Place a security gate per development phase', ['CISSP.d8', 'NIST_800_218']),
  n('arch.component-list', 'Produce a component list (CycloneDX)', ['CISSP.d8', 'NIST_800_218']),
  n('arch.segmentation-proof', 'Prove default-deny segmentation', ['CISSP.d4', 'NIST.800-53.SC-7']),
  // ── Data security ────────────────────────────────────────────────────────
  n('data.discovery', 'Find personal data and prove it is gone', ['CISSP.d2', 'NIST.CSF.ID.AM']),
  n('data.sanitisation', 'Clear, purge or destroy media', ['CISSP.d2', 'NIST_800_88']),
  // ── Security operations ──────────────────────────────────────────────────
  n('ops.logging-first-hour', 'Write logging, the incident first hour and backups', ['CISSP.d7', 'NIST.800-61.PREPARE']),
  n('ops.detection-fires', 'Prove a detection fires with timings', ['CISSP.d7', 'NIST.CSF.DE.AE']),
  n('ops.contingency-phases', 'Specify activation, recovery, reconstitution', ['CISSP.d7', 'NIST_800_34']),
  // ── AI attack and evaluation ─────────────────────────────────────────────
  n('ai-attack.prompt-injection', 'Prove prompt injection with evidence', ['CY0-001.d2', 'OWASP.LLM']),
  n('ai-attack.sensitive-disclosure', 'Prove sensitive information disclosure', ['CY0-001.d2', 'OWASP.LLM']),
  n('ai-attack.indirect-injection', 'Prove indirect injection through documents', ['CY0-001.d2', 'OWASP.LLM']),
  n('ai-attack.excessive-agency', 'Prove excessive agency and insecure output', ['CY0-001.d2', 'OWASP.LLM']),
  n('ai-attack.map-to-atlas', 'Map AI threats to OWASP and ATLAS', ['CY0-001.d2', 'MITRE.ATLAS']),
  n('ai-attack.automate-suite', 'Automate an attack suite with a pass line', ['CY0-001.d3', 'NIST_AI_RMF']),
  n('ai-attack.ai-assisted-check', 'Check AI-assisted work with a human', ['CY0-001.d3', 'NIST_AI_RMF']),
  n('ai-attack.reproduce', 'Reproduce a suite on a rebuilt copy', ['CY0-001.d3', 'NIST_800_218']),
  n('ai-attack.paper-cases', 'Write paper cases: poisoning, theft, inference', ['CY0-001.d3', 'MITRE.ATLAS']),
];

/** Every graded task → one to three nodes. Setup weeks are not mapped. */
export const TASK_SKILLS: Record<string, Record<string, string[]>> = {
  'security-plus': {
    'red-w1-osint': ['comp.recon.osint', 'comp.recon.dns-whois', 'comp.recon.fingerprint-web'],
    'red-w2-enumeration': ['comp.recon.port-scan', 'comp.recon.web-scan', 'comp.vuln.summarise-findings'],
    'red-w3-attacks': ['comp.exploit.sql-injection', 'comp.exploit.brute-force', 'comp.exploit.exploit-chain'],
    'red-w4-briefing': ['comp.report.technical-briefing'],
    'blue-w1-hardening': ['comp.harden.linux-baseline', 'comp.harden.windows-baseline'],
    'blue-w2-baseline': ['comp.detect.capture-baseline', 'comp.detect.write-detection', 'comp.detect.windows-event-logs'],
    'blue-w3-detection': ['comp.detect.live-triage', 'comp.respond.contain', 'comp.detect.windows-event-logs'],
    'blue-w4-response': ['comp.report.incident-findings', 'comp.respond.timeline'],
    'grc-w1-framework': ['comp.grc.framework-mapping', 'comp.grc.hardening-standard', 'comp.forensics.hash-evidence'],
    'grc-w2-risk': ['comp.risk.likelihood-impact', 'comp.vuln.cvss-score', 'comp.grc.vm-sop'],
    'grc-w3-custody': ['comp.respond.ir-runbook', 'comp.forensics.chain-of-custody', 'comp.forensics.hash-evidence'],
    'grc-w4-report': ['comp.report.final-report'],
  },
  'cysa-plus': {
    'cr-w1': ['comp.detect.deploy-endpoint-sensor'],
    'cb-w1': ['comp.detect.deploy-endpoint-sensor', 'comp.detect.capture-baseline'],
    'cg-w1': ['comp.detect.deploy-network-sensor', 'comp.detect.coverage-validation'],
    'cb-w2': ['comp.detect.triage-alerts'],
    'cg-w2': ['comp.forensics.packet-capture', 'comp.forensics.log-pivoting', 'comp.forensics.hash-evidence'],
    'cr-w2': ['comp.forensics.iocs'],
    'cb-w3': ['comp.vuln.read-scanner-output'],
    'cg-w3': ['comp.recon.port-scan', 'comp.recon.web-scan', 'comp.vuln.validate-scan'],
    'cr-w3': ['comp.vuln.cvss-score', 'comp.vuln.risk-rank', 'comp.vuln.remediation-plan'],
    'cb-w4': ['comp.respond.find-the-incident'],
    'cg-w4': ['comp.respond.timeline'],
    'cg-w4b': ['comp.report.executive-debrief'],
    'cr-w4': ['comp.respond.contain', 'comp.forensics.hash-evidence', 'comp.respond.incident-report'],
  },
  mssp: {
    'mg-w1': ['comp.risk.iso-27005', 'comp.risk.soa'],
    'mr-w1': ['comp.recon.attack-surface', 'comp.recon.tls-hygiene'],
    'mb-w1': ['comp.vuln.cis-gap-scan'],
    'mg-w2': ['comp.audit.control-matrix'],
    'mb-w2': ['comp.harden.host-firewall', 'comp.harden.change-discipline'],
    'mr-w2': ['comp.risk.threat-model-controls'],
    'mr-w3': ['comp.exploit.web-pentest', 'comp.exploit.retest'],
    'mb-w3': ['comp.detect.sigma-rules', 'comp.detect.validate-detection'],
    'mg-w3': ['comp.audit.remediation-tracking', 'comp.audit.evidence-collection'],
    'mr-w4': ['comp.exploit.retest', 'comp.risk.accept', 'comp.exploit.tester-attestation'],
    'mb-w4': ['comp.report.detection-metrics'],
    'mg-w4a': ['comp.audit.internal-audit', 'comp.audit.corrective-action'],
    'mg-w4b': ['comp.audit.evidence-packet'],
  },
  'secai-plus': {
    'sa-w1-gov': ['comp.grc.system-map', 'comp.grc.policy-shall'],
    'sa-w1-red': ['comp.ai-attack.prompt-injection', 'comp.ai-attack.sensitive-disclosure', 'comp.forensics.hash-evidence'],
    'sa-w1-def': ['comp.harden.secrets-and-gateway'],
    'sa-w2-red': ['comp.ai-attack.indirect-injection', 'comp.ai-attack.excessive-agency', 'comp.ai-attack.map-to-atlas'],
    'sa-w2-def': ['comp.harden.guardrails', 'comp.harden.agent-scope', 'comp.harden.redaction'],
    'sa-w2-gov': ['comp.grc.data-lineage', 'comp.grc.ai-lifecycle', 'comp.grc.applicability'],
    'sa-w3-def': ['comp.harden.pipeline-gates', 'comp.harden.guardrail-tests', 'comp.detect.alert-to-ticket'],
    'sa-w3-red': ['comp.ai-attack.automate-suite', 'comp.ai-attack.ai-assisted-check'],
    'sa-w3-gov': ['comp.detect.shadow-ai', 'comp.report.security-metrics'],
    'sa-w4-def': ['comp.harden.clean-rebuild', 'comp.harden.model-scanning'],
    'sa-w4-red': ['comp.ai-attack.reproduce', 'comp.ai-attack.paper-cases'],
    'sa-w4-gov': ['comp.grc.model-cards', 'comp.grc.responsible-ai', 'comp.audit.questionnaire'],
  },
  cissp: {
    'ci-w1-gov': ['comp.grc.policy-shall', 'comp.grc.classification', 'comp.grc.maturity'],
    'ci-w1-arch': ['comp.arch.trust-boundaries', 'comp.arch.shared-responsibility', 'comp.arch.default-deny-zones'],
    'ci-w1-idops': ['comp.identity.rbac', 'comp.identity.joiner-leaver', 'comp.ops.logging-first-hour'],
    'ci-w2-gov': ['comp.risk.register', 'comp.risk.quantitative', 'comp.report.security-metrics'],
    'ci-w2-arch': ['comp.crypto.standard', 'comp.arch.rule-base', 'comp.arch.sdlc-gates'],
    'ci-w2-idops': ['comp.identity.access-matrix', 'comp.respond.recovery-targets', 'comp.respond.seven-step-plan'],
    'ci-w3-arch': ['comp.harden.pipeline-gates', 'comp.crypto.tls-versions', 'comp.arch.component-list'],
    'ci-w3-idops': ['comp.identity.mfa-console', 'comp.identity.orphan-accounts', 'comp.identity.federation'],
    'ci-w3-gov': ['comp.grc.supplier-tiering', 'comp.risk.threat-model', 'comp.data.sanitisation'],
    'ci-w4-idops': ['comp.ops.detection-fires', 'comp.respond.restore-test', 'comp.ops.contingency-phases'],
    'ci-w4-gov': ['comp.data.discovery', 'comp.grc.categorise-system', 'comp.grc.ai-act-decision'],
    'ci-w4-arch': ['comp.harden.ai-gateway-zone', 'comp.identity.machine-identities', 'comp.vuln.config-scan'],
    'ci-w5-gov': ['comp.audit.assess-controls', 'comp.audit.questionnaire', 'comp.grc.ethics-canons'],
    'ci-w5-arch': ['comp.harden.tls-and-rule-base', 'comp.crypto.key-rotation', 'comp.arch.segmentation-proof'],
    'ci-w5-idops': ['comp.identity.access-review', 'comp.respond.tabletop'],
    'ci-w6-gov': ['comp.audit.self-assess-171', 'comp.audit.ssp'],
    'ci-w6-arch': ['comp.audit.map-to-federal'],
    'ci-w6-idops': ['comp.audit.map-to-federal', 'comp.report.federal-incident-reporting'],
  },
};

/* ── helpers (lowercase: never written to a document) ───────────────────── */

const byId = new Map(SKILLS.map((x) => [x.id, x]));

export function skillOf(id: string): SkillNode | undefined {
  return byId.get(id);
}

/** The objective reference for an exam domain: the exam code slugged, then the domain id. */
export function objectiveRef(examCode: string, domainId: string): string {
  return `${examCode.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')}.${domainId}`;
}

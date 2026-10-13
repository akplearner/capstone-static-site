/**
 * R107 — tactics and practices.
 *
 * Tactics are MITRE's: the fourteen ATT&CK Enterprise tactics and the ATLAS
 * tactics for attacks on AI systems, by their published ids. A security
 * course's attack tasks practise them and its detection tasks defend against
 * them; `TASK_TACTICS` says which. Ids are tactics only (TA…, AML.TA…), never
 * techniques: a technique id a student types into a form stays free text.
 * The ids and names were taken from the matrices as published through
 * `checkedYear`; no test can reach the matrices, so a change there is a
 * registry edit.
 *
 * Practices are the engineering habits every course asks for, anchored to
 * the standard that names them (`anchor` is a `ControlRef.code` or a
 * `StandardDef.id` from `standards.ts`): least privilege, backup before
 * change, tear down after use, write for leadership. Every graded task
 * practises at least one. A course with no adversary tactics says so in its
 * sheet and its card rather than printing an empty table.
 */

export interface TacticDef {
  /** 'TA0001' or 'AML.TA0004'. */
  id: string;
  matrix: 'attack-enterprise' | 'atlas';
  label: string;
  url: string;
  checkedYear: number;
}

export interface PracticeDef {
  /** 'practice.<slug>' */
  id: string;
  /** Six words or fewer. */
  label: string;
  /** A control code or a standard id that names the practice. */
  anchor: string;
  /** Twenty-five words or fewer. */
  definition: string;
}

const attack = (id: string, label: string): TacticDef => ({ id, matrix: 'attack-enterprise', label, url: `https://attack.mitre.org/tactics/${id}/`, checkedYear: 2025 });
const atlas = (id: string, label: string): TacticDef => ({ id, matrix: 'atlas', label, url: `https://atlas.mitre.org/tactics/${id}`, checkedYear: 2025 });

export const TACTICS: TacticDef[] = [
  attack('TA0043', 'Reconnaissance'),
  attack('TA0042', 'Resource Development'),
  attack('TA0001', 'Initial Access'),
  attack('TA0002', 'Execution'),
  attack('TA0003', 'Persistence'),
  attack('TA0004', 'Privilege Escalation'),
  attack('TA0005', 'Defense Evasion'),
  attack('TA0006', 'Credential Access'),
  attack('TA0007', 'Discovery'),
  attack('TA0008', 'Lateral Movement'),
  attack('TA0009', 'Collection'),
  attack('TA0011', 'Command and Control'),
  attack('TA0010', 'Exfiltration'),
  attack('TA0040', 'Impact'),
  atlas('AML.TA0002', 'Reconnaissance'),
  atlas('AML.TA0003', 'Resource Development'),
  atlas('AML.TA0004', 'Initial Access'),
  atlas('AML.TA0000', 'AI Model Access'),
  atlas('AML.TA0005', 'Execution'),
  atlas('AML.TA0006', 'Persistence'),
  atlas('AML.TA0012', 'Privilege Escalation'),
  atlas('AML.TA0007', 'Defense Evasion'),
  atlas('AML.TA0013', 'Credential Access'),
  atlas('AML.TA0008', 'Discovery'),
  atlas('AML.TA0009', 'Collection'),
  atlas('AML.TA0001', 'AI Attack Staging'),
  atlas('AML.TA0010', 'Exfiltration'),
  atlas('AML.TA0011', 'Impact'),
];

const p = (slug: string, label: string, anchor: string, definition: string): PracticeDef => ({ id: `practice.${slug}`, label, anchor, definition });

export const PRACTICES: PracticeDef[] = [
  // ── Access, trust and secrets ────────────────────────────────────────────
  p('least-privilege', 'Least privilege', 'NIST.800-53.AC-6', 'Every account, role and agent holds only the rights its task needs, and nothing it might need later.'),
  p('defence-in-depth', 'Defence in depth', 'NIST.CSF.PR', 'More than one control stands between an attacker and the asset, so one failure is not a breach.'),
  p('default-deny', 'Default deny', 'NIST.800-53.SC-7', 'Nothing passes a boundary unless a rule allows it; the allow list is the policy.'),
  p('segmentation', 'Network segmentation', 'ISO27001.A.8.22', 'Zones with distinct trust levels are separated, and the flows between them are named and limited.'),
  p('zero-trust', 'Zero trust access', 'NIST_800_207', 'No request is trusted for where it comes from; identity, device and context decide every access.'),
  p('mfa-everywhere', 'Multi-factor authentication', 'NIST_800_63', 'Every console and privileged login asks for a second factor; a password alone is refused.'),
  p('federation', 'Federated identity', 'NIST_800_63', 'Applications trust one identity provider over SAML or OIDC instead of keeping their own passwords.'),
  p('secrets-in-a-store', 'Secrets in a store', 'NIST.800-53.IA-5', 'Keys and passwords live in a secret store and never in a prompt, a repository or a config file.'),
  p('machine-identities', 'Machine identity register', 'NIST.800-53.IA-5', 'Every service account, key and certificate has an owner and a rotation date in one register.'),
  p('separation-of-duties', 'Separation of duties', 'NIST.800-53.AC-5', 'The person who requests, the person who approves and the person who applies a change are not the same.'),
  p('access-reviews', 'Periodic access review', 'NIST.800-53.AC-2', 'Accounts and rights are reviewed on a schedule; orphans are disabled and the review is recorded.'),
  p('joiner-leaver', 'Joiner and leaver process', 'ISO27001.A.5.18', 'Access is granted on a documented request and removed within a stated time of leaving.'),
  p('encryption-in-transit', 'Encryption in transit', 'NIST.800-53.SC-8', 'Traffic crosses a boundary only over approved TLS versions, and the weak ones are refused.'),
  p('key-rotation', 'Key rotation', 'NIST.800-53.SC-12', 'Keys and certificates have an owner and a rotation date, and a rotation is recorded when it happens.'),
  // ── Evidence, scope and testing ──────────────────────────────────────────
  p('evidence-hashing', 'Hash evidence at capture', 'ISO_27037', 'Every artifact is hashed when it is saved and the digest is recorded, so later copies can be checked.'),
  p('authorised-testing', 'Authorised testing only', 'NIST_800_115', 'Scanning and attacks happen inside a signed scope and rules of engagement, against the pod the team owns.'),
  p('engagement-agreement', 'Agreed scope and terms', 'PTES', 'The work starts from a written agreement: what is in scope, what is out, and who signs.'),
  p('passive-before-active', 'Passive before active', 'PTES', 'Open sources and passive lookups come before any packet reaches the target.'),
  p('retest-to-closure', 'Retest to closure', 'NIST_800_115', 'A finding is closed only by a retest that shows the fix, and every finding ends Closed, Open or Risk accepted.'),
  p('cvss-severity', 'CVSS severity', 'CVSS', 'Each finding carries a CVSS score, so severity is a number that can be ranked and defended.'),
  p('risk-scoring', 'Likelihood-times-impact scoring', 'NIST_800_30', 'Each risk is scored on a stated scale for likelihood and impact, and the score decides the order.'),
  p('threat-modelling', 'Threat modelling', 'STRIDE', 'Threats are enumerated per component with a method, and each is tied to a control or an accepted risk.'),
  p('compensating-controls', 'Compensating controls', 'ISO27001.6.1.3', 'Where a control cannot be applied, another control covering the same risk is named and justified.'),
  p('tabletop-exercise', 'Tabletop exercise', 'NIST.800-53.CP-4', 'The team walks through an incident on paper with injects, and the after-action report names improvements.'),
  // ── Change, configuration and patching ───────────────────────────────────
  p('backup-before-change', 'Backup before change', 'ITIL.change', 'A configuration is copied before it is edited, so the change can be reversed in one step.'),
  p('change-control', 'Change control', 'ITIL.change', 'Every change is requested, reviewed, reversible and recorded before it reaches a system.'),
  p('rollback-plan', 'Rollback plan', 'ITIL.change', 'A change carries the steps that undo it, written before it is made.'),
  p('patch-management', 'Managed patching', 'NIST_800_40', 'Updates are inventoried, prioritised, tested, applied and verified on a cadence, not when something breaks.'),
  p('hardening-baseline', 'Hardening baseline', 'CIS.BENCHMARK', 'Hosts are configured to a written benchmark and checked against it, so drift from the baseline is visible.'),
  p('config-scanning', 'Configuration scanning', 'CIS.BENCHMARK', 'Hosts are scanned against a benchmark on a schedule, and the failed checks become findings.'),
  p('configuration-record', 'Configuration record', 'ITIL.configuration', 'Every device configuration is saved, versioned and compared after a change.'),
  p('build-record', 'Build record', 'ITIL.configuration', 'A build is recorded step by step with firmware, versions and settings as it is made.'),
  p('media-sanitisation', 'Media sanitisation', 'NIST_800_88', 'Storage is cleared, purged or destroyed to the written level before it leaves, and the action is recorded.'),
  // ── Infrastructure as code, pipelines and releases ───────────────────────
  p('infrastructure-as-code', 'Infrastructure as code', 'WAF.operational-excellence', 'Resources are declared in versioned templates and deployed from them, not clicked into being.'),
  p('drift-detection', 'Drift detection', 'WAF.operational-excellence', 'The running environment is compared with its template and any difference is treated as a finding.'),
  p('immutable-rebuild', 'Rebuild, do not repair', 'WAF.reliability', 'A compromised or drifted system is replaced from a known-good image rather than patched in place.'),
  p('reproducible-builds', 'Reproducible builds', 'NIST_800_218', 'A system or a test suite can be rebuilt from its record and produce the same result.'),
  p('blue-green', 'Blue-green deployment', 'WAF.operational-excellence', 'Two identical environments take turns serving traffic, so a release switches over and can switch back.'),
  p('canary-release', 'Canary release', 'WAF.operational-excellence', 'A change reaches a small share of traffic first and is watched before it reaches everyone.'),
  p('automated-rollback', 'Automated rollback', 'WAF.reliability', 'A release that fails its health check is reverted by the pipeline without a person deciding.'),
  p('pipeline-gates', 'Pipeline gates', 'NIST_800_218', 'A build cannot proceed past a scan, a test or an approval that failed; a gate that blocks is a control.'),
  p('dependency-scanning', 'Dependency and image scanning', 'NIST_800_218', 'Third-party packages and container images are scanned for known vulnerabilities before release.'),
  p('secret-scanning', 'Secret scanning', 'NIST_800_218', 'Repositories and prompts are scanned for credentials, and a finding blocks the build.'),
  p('component-inventory', 'Software bill of materials', 'NIST_800_218', 'A release lists its components (CycloneDX or SPDX), so a vulnerable dependency can be found.'),
  p('regression-tests-for-guardrails', 'Guardrail regression tests', 'NIST_800_218', 'Every blocked attack case becomes a test the pipeline runs, so a removed guardrail fails the build.'),
  p('policy-as-code', 'Policy as code', 'WAF.security', 'Guardrails are written as rules the platform enforces, so a non-compliant resource is denied or flagged.'),
  p('api-contract', 'Interface contract', 'WAF.operational-excellence', 'Endpoints, requests and responses are specified before they are built, and the build is checked against the spec.'),
  // ── Cost and reliability in the cloud ────────────────────────────────────
  p('naming-and-tagging', 'Naming and tagging', 'WAF.cost', 'Every resource carries the agreed name and tags, so cost, ownership and environment can be read from it.'),
  p('budget-guardrails', 'Budget guardrails', 'WAF.cost', 'A budget with alerts is set before the first resource, and the alert is tested.'),
  p('tear-down-after-use', 'Tear down after use', 'WAF.cost', 'Billable resources are stopped or deleted in the same task that created them, and the record says so.'),
  p('right-sizing', 'Right-sizing', 'WAF.cost', 'Resources are sized from measured use, reviewed and shrunk when the measurement says so.'),
  p('multi-zone-redundancy', 'Multi-zone redundancy', 'WAF.reliability', 'Services run across availability zones so the loss of one zone does not stop them.'),
  p('health-checks', 'Health checks', 'WAF.reliability', 'A load balancer or scaler routes only to instances that answer a health probe, and replaces the ones that do not.'),
  p('backups-tested', 'Backups tested by restore', 'NIST.800-53.CP-4', 'A backup counts only after a restore from it has been performed and its hashes compared.'),
  p('recovery-objectives', 'Recovery objectives', 'NIST_800_34', 'Recovery time and recovery point targets are written per service, and a drill is timed against them.'),
  // ── Detection, response and monitoring ───────────────────────────────────
  p('centralised-logging', 'Centralised logging', 'NIST.CSF.DE.CM', 'Every host ships its logs to one place where they are kept, searched and alerted on.'),
  p('capture-and-baseline', 'Capture a baseline', 'NIST.CSF.DE.CM', 'Normal traffic and logs are captured before an attack, so the attack can be told from normal.'),
  p('alert-to-ticket', 'Alert to ticket', 'ITIL.incident', 'A detection opens a ticket with an owner and a due time, so nothing fires into silence.'),
  p('detection-as-code', 'Detection as code', 'MITRE_ATTACK', 'Detections are written as versioned rules, mapped to a technique id and validated against a test attack.'),
  p('attack-mapped-reporting', 'ATT&CK-mapped reporting', 'MITRE_ATTACK', 'Findings, indicators and detections carry the technique id, so they can be compared across teams.'),
  p('ioc-extraction', 'Indicators from evidence', 'MITRE_ATTACK', 'Indicators are extracted from alerts and packets, each traceable to its source and technique.'),
  p('containment-first', 'Contain before analysing', 'NIST.800-61.CONTAIN', 'An active attacker is blocked and the block is timestamped before the deeper analysis begins.'),
  p('timeline-reconstruction', 'Evidence-backed timeline', 'NIST.800-61.DETECT', 'Every row of an incident timeline points at the log line or capture it came from.'),
  p('lessons-learned', 'Lessons learned', 'NIST.800-61.POST', 'After an incident or a drill, what worked and what did not is written down with an owner for each change.'),
  // ── Governance, documentation and assurance ──────────────────────────────
  p('written-policy', 'Written policy', 'NIST.CSF.GV.PO', 'Rules are written as shall statements with an owner, a review date and the standard they implement.'),
  p('runbooks-written', 'Written runbooks', 'ISO27001.A.5.37', 'Routine operations are written as steps a colleague could follow, and the steps are kept current.'),
  p('sign-and-version', 'Sign and version documents', 'ISO27001.7.5', 'A document carries an id, a version, an owner, a date and a status, and a change makes a new version.'),
  p('as-built-documentation', 'As-built documentation', 'ITIL.transition', 'What was actually built is recorded, with addresses, versions and owners, and handed over with the system.'),
  p('architecture-decision-records', 'Architecture decision records', 'ISO_42010', 'Each significant design choice is recorded with its context, options and consequences.'),
  p('requirements-first', 'Requirements before design', 'ISO_42010', 'The design starts from written requirements and constraints, and each design element traces to one.'),
  p('addressing-plan', 'Addressing plan', 'NIST.CSF.ID.AM', 'Subnets, addresses and names are planned on paper before any device is configured.'),
  p('test-and-acceptance', 'Test and acceptance', 'ITIL.transition', 'A build is accepted against written tests with recorded results, not against a feeling that it works.'),
  p('troubleshooting-method', 'Structured troubleshooting', 'ITIL.problem', 'Identify the problem, establish a theory, test it, plan and act, verify, document: in that order.'),
  p('asset-inventory', 'Asset inventory', 'NIST.CSF.ID.AM', 'Every asset is listed with an owner, a location and a classification before it is protected.'),
  p('data-classification', 'Data classification', 'ISO27001.A.5.12', 'Information is classified on a written scale, and handling rules follow the class.'),
  p('data-discovery', 'Personal data discovery', 'NIST.CSF.ID.AM', 'Stores are scanned for personal data before and after a clean-up, and the counts are recorded.'),
  p('control-mapping', 'Control mapping', 'ISO27001.6.1.3', 'Each control is mapped to the criteria it satisfies across frameworks, with an owner and an evidence source.'),
  p('evidence-by-design', 'Evidence by design', 'SOC2', 'Every control names the evidence that proves it operates, and the evidence is collected as the work happens.'),
  p('corrective-action', 'Corrective action', 'ISO27001.10.2', 'Every nonconformity gets a cause, a corrective action, an owner and a date, and the action is checked.'),
  p('supplier-tiering', 'Supplier tiering', 'NIST.CSF.GV.SC', 'Suppliers are tiered by the access and data they hold, and the top tier carries written terms.'),
  p('write-for-leadership', 'Write for leadership', 'NIST.CSF.RS.CO', 'A report opens with what a non-technical reader must decide, and the technical detail follows.'),
  p('metrics-with-targets', 'Metrics with targets', 'ISO27001.9.1', 'Each metric has a formula, a source and a target, so a number can be read as good or bad.'),
  p('customer-assurance', 'Customer assurance', 'SOC2', 'A customer question is answered with evidence or an honest gap, never with a promise.'),
  // ── AI systems ───────────────────────────────────────────────────────────
  p('input-guardrails', 'Input and output guardrails', 'OWASP_LLM', 'Prompts and model outputs pass through filters that block or contain the listed attack cases.'),
  p('agent-least-privilege', 'Least privilege for agents', 'OWASP_LLM', 'An agent or tool call holds a scoped credential and no admin right, and its actions are logged.'),
  p('redaction-before-write', 'Redact before write', 'NIST_AI_RMF', 'Personal data is detected and removed before a prompt, a log or a dataset is stored.'),
  p('model-scanning', 'Model file scanning', 'OWASP_LLM', 'Serialised models are scanned for unsafe code before they are loaded, and the result is recorded.'),
  p('human-in-the-loop', 'Human checkpoint', 'NIST_AI_RMF', 'AI-assisted work passes a named human check before it is acted on, and the check is recorded.'),
  p('model-cards', 'Model cards', 'NIST_AI_RMF', 'Every model in use has a card: purpose, data, limits, owner and evaluation results.'),
  p('shadow-ai-discovery', 'Shadow AI discovery', 'NIST_AI_RMF', 'Unsanctioned AI tools are found from network and usage data, and each gets a decision.'),
  p('pass-line-suites', 'Suites with a pass line', 'NIST_AI_RMF', 'An attack or evaluation suite states what passing means before it runs.'),
];

/** Attack tasks → the tactics they practise; detection tasks → the tactics they defend against. */
export const TASK_TACTICS: Record<string, Record<string, string[]>> = {
  'security-plus': {
    'red-w1-osint': ['TA0043'],
    'red-w2-enumeration': ['TA0043', 'TA0007'],
    'red-w3-attacks': ['TA0001', 'TA0006', 'TA0002'],
    'blue-w3-detection': ['TA0006', 'TA0001'],
  },
  'cysa-plus': {
    'cg-w2': ['TA0043', 'TA0006'],
    'cr-w2': ['TA0006', 'TA0001'],
    'cg-w3': ['TA0043', 'TA0007'],
    'cb-w4': ['TA0001'],
    'cg-w4': ['TA0001', 'TA0002'],
    'cr-w4': ['TA0001'],
  },
  mssp: {
    'mr-w1': ['TA0043'],
    'mr-w2': ['TA0001'],
    'mr-w3': ['TA0001', 'TA0002'],
    'mb-w3': ['TA0006', 'TA0001'],
    'mr-w4': ['TA0001'],
  },
  'secai-plus': {
    'sa-w1-red': ['AML.TA0004', 'AML.TA0009'],
    'sa-w2-red': ['AML.TA0004', 'AML.TA0005', 'AML.TA0007'],
    'sa-w2-def': ['AML.TA0004', 'AML.TA0007'],
    'sa-w3-red': ['AML.TA0004'],
    'sa-w4-red': ['AML.TA0003', 'AML.TA0006', 'AML.TA0010'],
  },
  cissp: {
    'ci-w3-gov': ['TA0001'],
    'ci-w4-idops': ['TA0006'],
    'ci-w5-arch': ['TA0043', 'TA0007'],
  },
};

/** Every graded task → the practices it asks for (one to three). */
export const TASK_PRACTICES: Record<string, Record<string, string[]>> = {
  'security-plus': {
    'red-w1-osint': ['practice.passive-before-active', 'practice.authorised-testing', 'practice.evidence-hashing'],
    'red-w2-enumeration': ['practice.authorised-testing', 'practice.evidence-hashing'],
    'red-w3-attacks': ['practice.authorised-testing', 'practice.evidence-hashing'],
    'red-w4-briefing': ['practice.write-for-leadership'],
    'blue-w1-hardening': ['practice.hardening-baseline', 'practice.default-deny', 'practice.backup-before-change'],
    'blue-w2-baseline': ['practice.capture-and-baseline', 'practice.detection-as-code'],
    'blue-w3-detection': ['practice.containment-first', 'practice.capture-and-baseline'],
    'blue-w4-response': ['practice.timeline-reconstruction', 'practice.lessons-learned'],
    'grc-w1-framework': ['practice.control-mapping', 'practice.written-policy', 'practice.evidence-hashing'],
    'grc-w2-risk': ['practice.risk-scoring', 'practice.cvss-severity', 'practice.runbooks-written'],
    'grc-w3-custody': ['practice.runbooks-written', 'practice.evidence-hashing'],
    'grc-w4-report': ['practice.write-for-leadership', 'practice.evidence-by-design'],
  },
  'cysa-plus': {
    'cr-w1': ['practice.centralised-logging'],
    'cb-w1': ['practice.centralised-logging', 'practice.capture-and-baseline'],
    'cg-w1': ['practice.centralised-logging', 'practice.evidence-by-design'],
    'cb-w2': ['practice.alert-to-ticket'],
    'cg-w2': ['practice.authorised-testing', 'practice.evidence-hashing'],
    'cr-w2': ['practice.ioc-extraction', 'practice.attack-mapped-reporting'],
    'cb-w3': ['practice.config-scanning'],
    'cg-w3': ['practice.authorised-testing', 'practice.evidence-hashing'],
    'cr-w3': ['practice.cvss-severity', 'practice.risk-scoring', 'practice.patch-management'],
    'cb-w4': ['practice.alert-to-ticket', 'practice.timeline-reconstruction'],
    'cg-w4': ['practice.timeline-reconstruction'],
    'cg-w4b': ['practice.write-for-leadership', 'practice.metrics-with-targets', 'practice.lessons-learned'],
    'cr-w4': ['practice.containment-first', 'practice.evidence-hashing'],
  },
  mssp: {
    'mg-w1': ['practice.risk-scoring', 'practice.control-mapping'],
    'mr-w1': ['practice.authorised-testing', 'practice.encryption-in-transit'],
    'mb-w1': ['practice.hardening-baseline', 'practice.config-scanning'],
    'mg-w2': ['practice.control-mapping', 'practice.evidence-by-design'],
    'mb-w2': ['practice.default-deny', 'practice.change-control', 'practice.hardening-baseline'],
    'mr-w2': ['practice.threat-modelling', 'practice.compensating-controls'],
    'mr-w3': ['practice.authorised-testing', 'practice.retest-to-closure'],
    'mb-w3': ['practice.detection-as-code', 'practice.attack-mapped-reporting'],
    'mg-w3': ['practice.evidence-by-design'],
    'mr-w4': ['practice.retest-to-closure'],
    'mb-w4': ['practice.metrics-with-targets', 'practice.attack-mapped-reporting'],
    'mg-w4a': ['practice.corrective-action'],
    'mg-w4b': ['practice.evidence-by-design', 'practice.sign-and-version'],
  },
  'secai-plus': {
    'sa-w1-gov': ['practice.written-policy', 'practice.asset-inventory', 'practice.sign-and-version'],
    'sa-w1-red': ['practice.authorised-testing', 'practice.evidence-hashing'],
    'sa-w1-def': ['practice.secrets-in-a-store', 'practice.secret-scanning'],
    'sa-w2-red': ['practice.threat-modelling', 'practice.attack-mapped-reporting'],
    'sa-w2-def': ['practice.input-guardrails', 'practice.agent-least-privilege', 'practice.redaction-before-write'],
    'sa-w2-gov': ['practice.data-classification', 'practice.risk-scoring'],
    'sa-w3-def': ['practice.pipeline-gates', 'practice.regression-tests-for-guardrails', 'practice.alert-to-ticket'],
    'sa-w3-red': ['practice.pass-line-suites', 'practice.human-in-the-loop'],
    'sa-w3-gov': ['practice.shadow-ai-discovery', 'practice.metrics-with-targets'],
    'sa-w4-def': ['practice.immutable-rebuild', 'practice.model-scanning', 'practice.reproducible-builds'],
    'sa-w4-red': ['practice.reproducible-builds', 'practice.compensating-controls'],
    'sa-w4-gov': ['practice.model-cards', 'practice.customer-assurance'],
  },
  cissp: {
    'ci-w1-gov': ['practice.written-policy', 'practice.data-classification', 'practice.asset-inventory'],
    'ci-w1-arch': ['practice.defence-in-depth', 'practice.default-deny', 'practice.segmentation'],
    'ci-w1-idops': ['practice.least-privilege', 'practice.joiner-leaver', 'practice.centralised-logging'],
    'ci-w2-gov': ['practice.risk-scoring', 'practice.metrics-with-targets'],
    'ci-w2-arch': ['practice.encryption-in-transit', 'practice.key-rotation', 'practice.pipeline-gates'],
    'ci-w2-idops': ['practice.separation-of-duties', 'practice.recovery-objectives', 'practice.runbooks-written'],
    'ci-w3-arch': ['practice.pipeline-gates', 'practice.component-inventory', 'practice.encryption-in-transit'],
    'ci-w3-idops': ['practice.mfa-everywhere', 'practice.access-reviews', 'practice.federation'],
    'ci-w3-gov': ['practice.supplier-tiering', 'practice.threat-modelling', 'practice.media-sanitisation'],
    'ci-w4-idops': ['practice.centralised-logging', 'practice.backups-tested', 'practice.recovery-objectives'],
    'ci-w4-gov': ['practice.data-discovery', 'practice.data-classification'],
    'ci-w4-arch': ['practice.zero-trust', 'practice.machine-identities', 'practice.config-scanning'],
    'ci-w5-gov': ['practice.evidence-by-design', 'practice.control-mapping', 'practice.corrective-action'],
    'ci-w5-arch': ['practice.retest-to-closure', 'practice.key-rotation', 'practice.change-control'],
    'ci-w5-idops': ['practice.access-reviews', 'practice.joiner-leaver', 'practice.tabletop-exercise'],
    'ci-w6-gov': ['practice.control-mapping', 'practice.sign-and-version'],
    'ci-w6-arch': ['practice.control-mapping', 'practice.encryption-in-transit'],
    'ci-w6-idops': ['practice.control-mapping', 'practice.write-for-leadership'],
  },
};

/* ── helpers (lowercase: never written to a document) ───────────────────── */

const tacticById = new Map(TACTICS.map((x) => [x.id, x]));
const practiceById = new Map(PRACTICES.map((x) => [x.id, x]));

export function tacticOf(id: string): TacticDef | undefined {
  return tacticById.get(id);
}

export function practiceOf(id: string): PracticeDef | undefined {
  return practiceById.get(id);
}

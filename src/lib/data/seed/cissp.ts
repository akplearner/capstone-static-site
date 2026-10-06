import { Course, Gate, RoleDef, Task, WeekDef } from '../../types';

// CISSP capstone (ISC2): "Six Releases" (R101).
//
// The team is the security function for Ridgeline's migration to the cloud
// Service Hub. Every week ships a complete program as eight domain sheets
// (D1–D8), raising a 0–32 maturity score, adding control statements and
// closing planted weaknesses, and ending federal-ready. The spec is written
// for one learner; the platform's three-role shape splits the eight sheets:
//
//   Governance & Risk      D1 Governance · D2 Assets · D6 Assessment
//   Architecture & Network D3 Architecture · D4 Network · D8 Software
//   Identity & Operations  D5 Identity · D7 Operations
//
// No gatekeeping: every week is open from the start. The gates still mark each
// release, and each names one task per role, so the Home tab can say which
// release is signed. Forms live in docs/cisspDeliverables.ts; the picture in
// docs/cisspContent.ts. The lab the spec names is not built yet, so weeks 3–4
// use containers on one Linux machine as the cloud account; each lab step says
// so.

const roles: RoleDef[] = [
  { id: 'govrisk', name: 'Governance & Risk', mission: 'Policy, assets, risk and the maturity score — the program’s spine.', color: '#16a34a', icon: 'ClipboardList', label: '📋 Governance & Risk' },
  { id: 'archnet', name: 'Architecture & Network', mission: 'The cloud design, the network zones and the change pipeline.', color: '#7c3aed', icon: 'Network', label: '🏛️ Architecture & Network' },
  { id: 'idops', name: 'Identity & Operations', mission: 'Identity, access, logging, incident response and recovery.', color: '#2563eb', icon: 'ShieldCheck', label: '🔑 Identity & Operations' },
];

const weeks: WeekDef[] = [
  { number: 0, title: 'Scope and ledger', theme: 'Set up', objective: 'Agree the company facts, open the evidence ledger, and claim your domain sheets.',
    setup: true, stage: 0, phase: 'Set up', difficulty: 1,
    objectives: [
      { id: 'open-the-ledger-and-scope', label: 'Open the ledger and scope the program', tasks: ['ci-w0-gov'] },
      { id: 'claim-the-architecture-sheets', label: 'Claim the architecture and network sheets', tasks: ['ci-w0-arch'] },
      { id: 'claim-the-identity-sheets', label: 'Claim the identity and operations sheets', tasks: ['ci-w0-idops'] },
    ],
    milestone: 'The company facts are agreed, the ledger is open, and each role has claimed its domain sheets.' },
  { number: 1, title: 'Release v1', theme: 'Documented', objective: 'One page per domain: every sheet written down with an owner. Score 8 of 32.',
    stage: 1, phase: 'Documented', difficulty: 2,
    objectives: [
      { id: 'write-governance-assets-assessment', label: 'Write governance, assets and the first score', tasks: ['ci-w1-gov'] },
      { id: 'write-architecture-and-network', label: 'Write architecture and network', tasks: ['ci-w1-arch'] },
      { id: 'write-identity-and-operations', label: 'Write identity and operations', tasks: ['ci-w1-idops'] },
    ],
    milestone: 'Eight sheets at v1, one page each. Every asset has one owner, no settings in the policy. Score 8 or better. S-1 closed. CEO signed.' },
  { number: 2, title: 'Release v2', theme: 'Specified', objective: 'Numbers, owners and time limits replace every vague word. Score 16, eight control statements.',
    stage: 1, phase: 'Specified', difficulty: 2,
    objectives: [
      { id: 'specify-risk-and-assets', label: 'Specify risk, assets and the metrics', tasks: ['ci-w2-gov'] },
      { id: 'specify-crypto-and-rules', label: 'Specify cryptography and the rule base', tasks: ['ci-w2-arch'] },
      { id: 'specify-access-and-recovery', label: 'Specify access, recovery and incident response', tasks: ['ci-w2-idops'] },
    ],
    milestone: 'Eight sheets at v2, no vague time word left. Recovery time plus work recovery within tolerable downtime. Score 16, eight control statements. S-8 closed.' },
  { number: 3, title: 'Release v3', theme: 'Proven in software and cloud', objective: 'Prove the rules in the lab: a blocking pipeline, TLS, segmentation and real identity. Score 20.',
    stage: 2, phase: 'Proven: cloud', difficulty: 3,
    objectives: [
      { id: 'prove-the-pipeline-and-components', label: 'Prove the pipeline and list the components', tasks: ['ci-w3-arch'] },
      { id: 'prove-mfa-and-federation', label: 'Prove MFA, accounts and federation', tasks: ['ci-w3-idops'] },
      { id: 'prove-suppliers-and-migration', label: 'Prove suppliers and the server migration', tasks: ['ci-w3-gov'] },
    ],
    milestone: 'Eight sheets at v3; D3, D4, D5, D8 at level 3. One blocked release, TLS 1.2 refused, one open port, two orphan accounts disabled. Score 20. S-2, S-3, S-4, S-6, S-9, S-10 closed.' },
  { number: 4, title: 'Release v4', theme: 'Proven in data, operations and AI', objective: 'Prove detection, restore and AI controls, and categorize the system. Score 24, all weaknesses closed.',
    stage: 3, phase: 'Proven: operations', difficulty: 3,
    objectives: [
      { id: 'prove-detection-and-recovery', label: 'Prove detection, restore and contingency', tasks: ['ci-w4-idops'] },
      { id: 'prove-data-and-categorization', label: 'Prove data discovery and categorization', tasks: ['ci-w4-gov'] },
      { id: 'prove-ai-controls-and-scan', label: 'Prove AI controls and the config scan', tasks: ['ci-w4-arch'] },
    ],
    milestone: 'Eight sheets at v4, every domain at level 3. Restore hashes match, personal data count zero after, five scan findings dated. Score 24. All ten weaknesses closed.' },
  { number: 5, title: 'Release v5', theme: 'Tested', objective: 'An independent assessment and the customer questionnaire, every answer with evidence. Score 32.',
    stage: 3, phase: 'Tested', difficulty: 3,
    objectives: [
      { id: 'assess-and-close-findings', label: 'Assess all sixteen controls and close findings', tasks: ['ci-w5-gov'] },
      { id: 'retest-architecture-and-network', label: 'Re-test architecture, network and change', tasks: ['ci-w5-arch'] },
      { id: 'retest-access-and-run-tabletop', label: 'Re-test access and run the tabletop', tasks: ['ci-w5-idops'] },
    ],
    milestone: 'Eight sheets at v5, every finding closed or accepted. Sixteen questions answered, no yes without a ledger entry. Score 32.' },
  { number: 6, title: 'Release v6', theme: 'Federal-ready', objective: 'Map the program to federal requirements and assemble the System Security Plan.',
    stage: 4, phase: 'Federal-ready', difficulty: 3,
    objectives: [
      { id: 'self-assess-and-assemble-ssp', label: 'Self-assess the basics and assemble the SSP', tasks: ['ci-w6-gov'] },
      { id: 'map-architecture-to-federal', label: 'Map architecture and network to federal rules', tasks: ['ci-w6-arch'] },
      { id: 'map-identity-and-incident-reporting', label: 'Map identity and federal incident reporting', tasks: ['ci-w6-idops'] },
    ],
    milestone: 'All 15 basic requirements have evidence or a dated plan. The SSP is assembled, the traceability table has no empty cell, and the decision memo is signed.' },
];

const gates: Gate[] = [
  { id: 1, week: 1, title: 'Release v1 signed', description: 'Eight sheets at v1, score 8 or better, the CEO has signed.', requiredArtifactTypes: ['09_Release_Note.md'], requiredTasks: ['ci-w1-gov', 'ci-w1-arch', 'ci-w1-idops'] },
  { id: 2, week: 2, title: 'Release v2 signed', description: 'Every sheet specified with numbers and owners, score 16, eight control statements.', requiredArtifactTypes: ['06_Assessment.md'], requiredTasks: ['ci-w2-gov', 'ci-w2-arch', 'ci-w2-idops'] },
  { id: 3, week: 3, title: 'Release v3 signed', description: 'The rules proven in the lab, score 20, six weaknesses closed.', requiredArtifactTypes: ['03_Architecture.md'], requiredTasks: ['ci-w3-gov', 'ci-w3-arch', 'ci-w3-idops'] },
  { id: 4, week: 4, title: 'Release v4 signed', description: 'Detection, restore and AI controls proven, score 24, every weakness closed.', requiredArtifactTypes: ['07_Operations.md'], requiredTasks: ['ci-w4-gov', 'ci-w4-arch', 'ci-w4-idops'] },
  { id: 5, week: 5, title: 'Release v5 signed', description: 'The assessment done, the questionnaire answered with evidence, score 32.', requiredArtifactTypes: ['10_Questionnaire_Response.md'], requiredTasks: ['ci-w5-gov', 'ci-w5-arch', 'ci-w5-idops'] },
];

const DOCS = {
  csf: { title: 'NIST Cybersecurity Framework 2.0', url: 'https://www.nist.gov/cyberframework', lookFor: 'the functions and the Current and Target Profiles' },
  ethics: { title: 'ISC2 Code of Ethics', url: 'https://www.isc2.org/ethics', lookFor: 'the four canons, in order' },
  iso: { title: 'ISO/IEC 27001:2022', url: 'https://www.iso.org/standard/27001', lookFor: 'the Annex A control themes' },
  c53: { title: 'NIST SP 800-53 Rev. 5', url: 'https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final', lookFor: 'the control families and identifiers (PM, SC, AC…)' },
  c30: { title: 'NIST SP 800-30 Rev. 1', url: 'https://csrc.nist.gov/pubs/sp/800/30/r1/final', lookFor: 'the likelihood and impact scales' },
  c88: { title: 'NIST SP 800-88', url: 'https://csrc.nist.gov/pubs/sp/800/88/r1/final', lookFor: 'clear, purge and destroy' },
  openssl: { title: 'OpenSSL s_client', url: 'https://docs.openssl.org/master/man1/openssl-s_client/', lookFor: '-tls1_2 and -tls1_3' },
  nmap: { title: 'Nmap port scanning', url: 'https://nmap.org/book/man-port-scanning-basics.html', lookFor: 'open, closed and filtered' },
  keycloak: { title: 'Keycloak OTP policy', url: 'https://www.keycloak.org/docs/latest/server_admin/#one-time-password-otp-policies', lookFor: 'requiring OTP for a realm' },
  restic: { title: 'restic', url: 'https://restic.readthedocs.io/en/stable/', lookFor: 'backup, restore and check' },
  openvas: { title: 'Greenbone / OpenVAS', url: 'https://greenbone.github.io/docs/latest/', lookFor: 'running a full and fast scan' },
  lynis: { title: 'Lynis', url: 'https://cisofy.com/documentation/lynis/', lookFor: 'the hardening index and suggestions' },
  trivy: { title: 'Trivy and SBOMs', url: 'https://trivy.dev/latest/docs/', lookFor: '--format cyclonedx and --exit-code' },
  gitleaks: { title: 'Gitleaks', url: 'https://github.com/gitleaks/gitleaks', lookFor: 'detect and the exit code on a leak' },
  c171: { title: 'NIST SP 800-171', url: 'https://csrc.nist.gov/pubs/sp/800/171/r3/final', lookFor: 'the requirement families and basic safeguarding' },
  far: { title: 'FAR 52.204-21', url: 'https://www.acquisition.gov/far/52.204-21', lookFor: 'the fifteen basic safeguarding requirements' },
  c34: { title: 'NIST SP 800-34 Rev. 1', url: 'https://csrc.nist.gov/pubs/sp/800/34/r1/final', lookFor: 'activation, recovery and reconstitution' },
};

const tasks: Task[] = [
  // ── Week 0 — Scope and ledger ─────────────────────────────────────────────
  {
    id: 'ci-w0-gov', role: 'govrisk', week: 0,
    title: 'Open the ledger and scope the program',
    objective: 'Record the company facts and contract terms, and open the evidence ledger every artifact is hashed into.',
    frameworks: ['CISSP', 'NIST_CSF'], deliverables: ['01_Governance_and_Risk.md'], estimatedTime: '45 min',
    learn: ['Why scope drives everything', 'A hash plus a timestamp is evidence'],
    tools: ['Git', 'sha256sum'], docs: [DOCS.csf],
    definitionOfDone: ['Company facts and contract terms recorded', 'Ledger repository opened (R1)'],
    steps: [
      {
        id: 'ci-w0-gov-s1', title: 'Record the company and its obligations', description: 'The facts every sheet rests on.',
        instruction: 'In the D1 sheet, record the company, the migration, the private and federal customers, and the three legal or contract obligations.',
        usesForm: 'D1 Governance & Risk',
        whatItMeans: 'A security program that does not name what it protects or who it answers to has nothing to measure itself against.',
        frameworks: ['CISSP'],
      },
      {
        id: 'ci-w0-gov-s2', title: 'Open the evidence ledger', description: 'A Git repository is the time-stamped record.',
        commands: [{
          cmd: 'git init ridgeline-program && cd ridgeline-program && git commit --allow-empty -m "ledger opened"',
          explain: 'Creates the repository the ledger lives in and makes its first commit, so every later sheet has a dated place in history.',
          sample: 'Initialized empty Git repository in /home/student/ridgeline-program/.git/\n[main (root-commit) a1b2c3d] ledger opened',
        }],
        whatItMeans: 'Every “yes” on the v5 questionnaire has to point to a ledger entry. The ledger is where that evidence accrues from week zero.',
        frameworks: ['NIST_CSF'],
        verify: ['Initialized empty Git repository', 'ledger opened'],
      },
    ],
  },
  {
    id: 'ci-w0-arch', role: 'archnet', week: 0,
    title: 'Claim the architecture and network sheets',
    objective: 'List the systems and where customer data is stored, so the architecture and network sheets have a starting point.',
    frameworks: ['CISSP'], deliverables: [], estimatedTime: '30 min',
    learn: ['Trust boundaries', 'Where data lives decides where controls go'],
    tools: ['draw.io or Mermaid'], docs: [DOCS.csf],
    definitionOfDone: ['Systems listed', 'Customer data locations written down'],
    steps: [
      {
        id: 'ci-w0-arch-s1', title: 'List the systems and data locations', description: 'What exists, and where the data sits.',
        instruction: 'List every system in the move and write down each place customer data is stored, old and new.',
        whatItMeans: 'You cannot draw a trust boundary around data you have not located. This list is what week 1’s architecture sheet is built from.',
        frameworks: ['CISSP'],
      },
    ],
  },
  {
    id: 'ci-w0-idops', role: 'idops', week: 0,
    title: 'Claim the identity and operations sheets',
    objective: 'Record how administrators log in today and the current logging and backup practice, warts included.',
    frameworks: ['CISSP'], deliverables: [], estimatedTime: '30 min',
    learn: ['A baseline is what normal looks like', 'Name the weaknesses before fixing them'],
    tools: ['Notes'], docs: [DOCS.csf],
    definitionOfDone: ['Current admin login method recorded', 'Current logging and backup practice recorded'],
    steps: [
      {
        id: 'ci-w0-idops-s1', title: 'Record how things stand', description: 'The as-found identity and operations.',
        instructionList: ['Record how administrators log in to the cloud and email today.', 'Record how long logs are kept and whether they are reviewed.', 'Record whether backups exist and were ever restore-tested.'],
        whatItMeans: 'The planted weaknesses S-2, S-3, S-5 and S-7 live here. Writing the as-found state down is what lets you prove you closed them later.',
        frameworks: ['CISSP'],
      },
    ],
  },

  // ── Week 1 — Release v1, documented ───────────────────────────────────────
  {
    id: 'ci-w1-gov', role: 'govrisk', week: 1,
    title: 'Write governance, assets and the first score',
    objective: 'Write D1, D2 and D6 at v1 and sign the release: policy, assets, the first maturity score, and the release note.',
    frameworks: ['CISSP', 'NIST_CSF', 'ISO_27001'], deliverables: ['01_Governance_and_Risk.md', '02_Assets_and_Data.md', '06_Assessment.md', '09_Release_Note.md'], estimatedTime: '2.5 hours',
    learn: ['Policy, standard, procedure, guideline, baseline', 'Four-level classification', 'The 0–4 maturity scale'],
    tools: ['eramba or a spreadsheet', 'Git'], docs: [DOCS.csf, DOCS.iso],
    definitionOfDone: ['D1 has ten shall statements, an owner and five risks', 'D2 has fifteen assets with one owner each and four classification levels', 'D6 has the CSF Current Profile and a score per domain', 'S-1 closed', 'Release note v1 signed'],
    steps: [
      {
        id: 'ci-w1-gov-s1', title: 'Write the security policy (D1 v1)', description: 'One page: rules, owner, risks.',
        instructionList: ['Write ten “shall” statements and name the approver and owner.', 'List the top five risks, each with an owner.', 'Record three legal or contract obligations with the reason each applies.', 'Replace the 2019 “IT rules” — that closes S-1.'],
        usesForm: 'D1 Governance & Risk',
        whatItMeans: 'The policy is the top of the hierarchy every standard and procedure hangs from. No product names belong in it, so it survives the tools changing.',
        frameworks: ['CISSP', 'NIST_CSF'],
      },
      {
        id: 'ci-w1-gov-s2', title: 'Inventory the assets (D2 v1)', description: 'Fifteen assets, one owner each.',
        instructionList: ['List fifteen assets, each with exactly one owner.', 'Define four classification levels with one handling rule each.', 'Record every location of customer data.'],
        usesForm: 'D2 Assets & Data',
        whatItMeans: 'An asset with two owners has none in practice. The inventory is what every later control, scan and migration is measured against.',
        frameworks: ['CISSP'],
      },
      {
        id: 'ci-w1-gov-s3', title: 'Score the program and sign v1 (D6)', description: 'The first number, and the release note.',
        instruction: 'Write the CSF Current Profile, score each domain with a reason, list the three largest gaps, then sign Release Note v1.',
        commands: [{
          cmd: 'sha256sum 0*.md > ledger.sha256 && wc -l ledger.sha256',
          explain: 'Hashes every sheet into the ledger and counts the lines, one per sheet, so the release has a verifiable manifest.',
          sample: '8 ledger.sha256',
        }],
        usesForm: 'D6 Assessment',
        whatItMeans: 'The score is the one number the CEO and the customer both read. Starting at 8 of 32 is honest, and it is what every later release is measured against.',
        frameworks: ['NIST_CSF'],
        verify: ['ledger.sha256'],
      },
    ],
  },
  {
    id: 'ci-w1-arch', role: 'archnet', week: 1,
    title: 'Write architecture and network',
    objective: 'Write D3 and D4 at v1: the architecture with trust boundaries, shared responsibility, and the network zones.',
    frameworks: ['CISSP', 'NIST_CSF'], deliverables: ['03_Architecture.md', '04_Network.md'], estimatedTime: '2 hours',
    learn: ['Trust boundaries', 'Shared responsibility', 'Default deny'],
    tools: ['draw.io or Mermaid'], docs: [DOCS.csf],
    definitionOfDone: ['D3 has an architecture with trust boundaries and five shared-responsibility rows', 'D4 has zones, ten or fewer allowed flows, and a default-deny statement'],
    steps: [
      {
        id: 'ci-w1-arch-s1', title: 'Draw the architecture (D3 v1)', description: 'Boundaries and who owns what.',
        instructionList: ['Draw the architecture with trust boundaries.', 'Write five rows of shared responsibility.', 'State encryption in transit and at rest, and what the office protects versus the cloud.'],
        usesForm: 'D3 Architecture',
        whatItMeans: 'Shared responsibility is where most cloud breaches start: a control each side assumed the other owned. Writing five rows makes the seam visible.',
        frameworks: ['CISSP'],
      },
      {
        id: 'ci-w1-arch-s2', title: 'Draw the network zones (D4 v1)', description: 'Zones, flows, default deny.',
        instructionList: ['Define the network zones.', 'List the allowed flows, ten rows or fewer.', 'State default deny, and the remote administration path.'],
        usesForm: 'D4 Network',
        whatItMeans: 'S-4 is that everything can reach everything. Default deny with a short allowed-flows list is the rule that closes it in week 3.',
        frameworks: ['CISSP', 'NIST_CSF'],
      },
    ],
  },
  {
    id: 'ci-w1-idops', role: 'idops', week: 1,
    title: 'Write identity and operations',
    objective: 'Write D5 and D7 at v1: roles against systems, the MFA rule, logging, the incident first hour, and backups.',
    frameworks: ['CISSP', 'NIST_CSF'], deliverables: ['05_Identity.md', '07_Operations.md'], estimatedTime: '2 hours',
    learn: ['Role-based access control', 'Joiner and leaver', 'The 72-hour customer notice'],
    tools: ['Notes'], docs: [DOCS.csf],
    definitionOfDone: ['D5 has six roles against systems, an MFA rule and no-shared-accounts rule', 'D7 has logging, the incident first hour with the 72-hour notice, and backups'],
    steps: [
      {
        id: 'ci-w1-idops-s1', title: 'Write the access rules (D5 v1)', description: 'Who reaches what, and how.',
        instructionList: ['Map six roles against systems.', 'State the MFA rule and the rule against shared accounts.', 'Write the joiner and leaver steps with time limits.'],
        usesForm: 'D5 Identity',
        whatItMeans: 'S-2 and S-3 are a shared admin login and optional MFA. The rule written here is what you prove in the lab in week 3.',
        frameworks: ['CISSP'],
      },
      {
        id: 'ci-w1-idops-s2', title: 'Write operations (D7 v1)', description: 'Logging, incident, backup.',
        instructionList: ['State what is logged and for how long.', 'Write the first hour of an incident, including the 72-hour customer notice.', 'State backup frequency and location, and office entry and visitors.'],
        usesForm: 'D7 Operations',
        whatItMeans: 'The customer contract promises notice within 72 hours. An incident plan that names the hour-one steps is what keeps that promise under pressure.',
        frameworks: ['NIST_CSF', 'CISSP'],
      },
    ],
  },

  // ── Week 2 — Release v2, specified ────────────────────────────────────────
  {
    id: 'ci-w2-gov', role: 'govrisk', week: 2,
    title: 'Specify risk, assets and the metrics',
    objective: 'Put numbers on D1, D2 and D6: a scored risk register, a 25-asset inventory, six metrics, and the control statements.',
    frameworks: ['CISSP', 'NIST_800_53'], deliverables: ['01_Governance_and_Risk.md', '02_Assets_and_Data.md', '06_Assessment.md', '11_Control_Statements.md'], estimatedTime: '3 hours',
    learn: ['The 5×5 risk matrix', 'Quantitative risk: SLE, ALE', 'Metrics with a formula and a target'],
    tools: ['eramba', 'Snipe-IT or a spreadsheet'], docs: [DOCS.c30, DOCS.c53],
    definitionOfDone: ['Ten scored risks including every planted weakness, with treatment and residual score', 'One quantified risk', 'Inventory of 25 with custodian and end-of-support date', 'Six metrics with formula and target', 'Eight control statements'],
    steps: [
      {
        id: 'ci-w2-gov-s1', title: 'Score the risks (D1 v2)', description: 'Likelihood × impact, with treatment.',
        instructionList: ['Define five likelihood and five impact levels.', 'Score ten risks, including every planted weakness, with a treatment and a residual score.', 'Quantify one risk with single and annual loss expectancy.'],
        usesForm: 'D1 Governance & Risk',
        whatItMeans: 'A risk with no score cannot be ranked against another. The residual score is what the CEO accepts or sends back for more treatment.',
        frameworks: ['CISSP'],
      },
      {
        id: 'ci-w2-gov-s2', title: 'Metrics and control statements (D6)', description: 'Numbers to watch; controls to prove.',
        instructionList: ['Write the CSF Target Profile with the gap per category.', 'Write six metrics, each with a formula, a source and a target.', 'Write the eight v2 control statements: who does what, how often, with what, record kept.'],
        usesForm: 'D6 Assessment',
        whatItMeans: 'A control statement is the sentence an assessor tests in week 5. Written as who-what-how often-record, it can be examined, not just admired.',
        frameworks: ['NIST_800_53'],
      },
    ],
  },
  {
    id: 'ci-w2-arch', role: 'archnet', week: 2,
    title: 'Specify cryptography and the rule base',
    objective: 'Put numbers on D3, D4 and D8: a cryptography standard, a rule base, baselines and a secure-coding checklist.',
    frameworks: ['CISSP', 'NIST_800_53'], deliverables: ['03_Architecture.md', '04_Network.md', '08_Software_and_Change.md'], estimatedTime: '2.5 hours',
    learn: ['Key sizes and rotation', 'Bell-LaPadula, Biba, Clark-Wilson', 'A security gate per development phase'],
    tools: ['draw.io'], docs: [DOCS.c53],
    definitionOfDone: ['D3 has a cryptography standard and six secure design principles on the diagram', 'D4 has a rule base and approved and banned protocols', 'D8 has a gate per phase and a ten-item coding checklist'],
    steps: [
      {
        id: 'ci-w2-arch-s1', title: 'Cryptography and design (D3 v2)', description: 'Algorithms, keys, principles.',
        instructionList: ['Write the cryptography standard: algorithms, key sizes, owner, rotation, destruction.', 'Match three cryptanalytic attacks to a control each.', 'Place six secure design principles on the diagram and justify the security model.'],
        usesForm: 'D3 Architecture',
        whatItMeans: 'A cryptography standard that names key sizes and rotation is what turns “we encrypt” into something an auditor can sample in week 5.',
        frameworks: ['CISSP'],
      },
      {
        id: 'ci-w2-arch-s2', title: 'Rule base and change (D4, D8 v2)', description: 'Firewall rules; development gates.',
        instructionList: ['Write the rule base with an owner and review date per rule.', 'List approved and banned protocols, and the wireless standard.', 'Write a security gate per development phase and a ten-item secure-coding checklist.'],
        usesForm: 'D4 Network',
        whatItMeans: 'S-6 is deploying straight to production. A gate per phase is the rule you prove with a blocked build in week 3.',
        frameworks: ['CISSP', 'NIST_800_53'],
      },
    ],
  },
  {
    id: 'ci-w2-idops', role: 'idops', week: 2,
    title: 'Specify access, recovery and incident response',
    objective: 'Put numbers on D5 and D7: an access matrix, recovery targets, the seven-step incident plan and offline backups.',
    frameworks: ['CISSP', 'NIST_800_53'], deliverables: ['05_Identity.md', '07_Operations.md', '11_Control_Statements.md'], estimatedTime: '2.5 hours',
    learn: ['Separation of duties', 'Maximum tolerable downtime, recovery time, recovery point', 'The seven-step incident life cycle'],
    tools: ['Notes'], docs: [DOCS.c53, DOCS.c34],
    definitionOfDone: ['D5 has an access matrix, a separation-of-duties table and quarterly review', 'D7 has recovery targets for four processes and the seven-step plan', 'Recovery time plus work recovery within tolerable downtime'],
    steps: [
      {
        id: 'ci-w2-idops-s1', title: 'Access and privilege (D5 v2)', description: 'A matrix, with separation of duties.',
        instructionList: ['Build the access matrix with a separation-of-duties table.', 'Write the authentication strategy and privileged access rules.', 'Set a quarterly access review with a reviewer and a record.'],
        usesForm: 'D5 Identity',
        whatItMeans: 'Separation of duties is what stops one person approving their own change. The matrix is where a conflict becomes visible before it is abused.',
        frameworks: ['CISSP'],
      },
      {
        id: 'ci-w2-idops-s2', title: 'Recovery and incident (D7 v2)', description: 'Targets, seven steps, offline copy.',
        instructionList: ['Write a business impact analysis for four processes with recovery targets.', 'Write the incident plan in seven steps with roles.', 'Set 12-month log retention and a backup with an offline copy.'],
        usesForm: 'D7 Operations',
        whatItMeans: 'Recovery time plus work recovery time has to fit inside the maximum tolerable downtime, or the plan promises a recovery the business cannot survive.',
        frameworks: ['CISSP', 'NIST_800_53'],
      },
    ],
  },

  // ── Week 3 — Release v3, proven in software and cloud ─────────────────────
  {
    id: 'ci-w3-arch', role: 'archnet', week: 3,
    title: 'Prove the pipeline and list the components',
    objective: 'Prove the gates: a blocking pipeline, a component list, a TLS 1.3 endpoint that refuses 1.2, and segmentation.',
    frameworks: ['CISSP', 'NIST_800_53'], deliverables: ['03_Architecture.md', '04_Network.md', '08_Software_and_Change.md'], estimatedTime: '3 hours',
    learn: ['A gate that blocks is a control', 'TLS versions', 'Default-deny segmentation'],
    tools: ['Jenkins or GitLab CI', 'Semgrep', 'Trivy', 'Gitleaks', 'OpenSSL', 'nmap'], docs: [DOCS.trivy, DOCS.openssl, DOCS.nmap],
    definitionOfDone: ['One blocked release recorded', 'A component list exists (CycloneDX)', 'TLS 1.2 refused, 1.3 served', 'Segmentation scan shows one open port', 'S-6, S-9, S-10 closed'],
    steps: [
      {
        id: 'ci-w3-arch-s1', title: 'A component list from the repo', description: 'S-9: an inventory of open-source parts.',
        instruction: 'On the sample repository (the lab stand-in until the Hub ships), generate a CycloneDX component list and scan it.',
        commands: [{
          cmd: 'trivy fs --format cyclonedx --output sbom.json . && trivy sbom --exit-code 1 --severity CRITICAL sbom.json',
          explain: 'Writes a CycloneDX component list, then fails the build if any component carries a critical vulnerability.',
          sample: 'Total: 0 (CRITICAL: 0)\n',
        }],
        whatItMeans: 'You cannot patch what you have not listed. The component list closes S-9 and is a question on the v5 customer form.',
        frameworks: ['CISSP'],
        verify: ['CRITICAL: 0'],
      },
      {
        id: 'ci-w3-arch-s2', title: 'Prove TLS 1.2 is refused', description: 'A P-384 endpoint, old versions rejected.',
        instruction: 'Stand up the TLS 1.3 endpoint (containers play the cloud account), then try to connect with TLS 1.2.',
        commands: [{
          cmd: 'echo | openssl s_client -connect hub.lab:443 -tls1_2 2>&1 | grep -E "no protocols|handshake failure|Cipher is"',
          explain: 'Forces a TLS 1.2 handshake against the endpoint; a hardened server refuses it rather than negotiating.',
          sample: '140735.. :SSL alert number 70\nno protocols available',
        }],
        whatItMeans: 'A standard that says “TLS 1.3 only” is a promise; a refused 1.2 handshake is the evidence. The two are not the same.',
        frameworks: ['CISSP', 'NIST_800_53'],
        verify: ['no protocols available'],
      },
      {
        id: 'ci-w3-arch-s3', title: 'Prove the segmentation', description: 'One open port, the rest closed.',
        commands: [{
          cmd: 'nmap -p- --open hub.lab | grep -E "open|scanned"',
          explain: 'Scans every port on the segmented host and lists only the ones that are open, proving default-deny holds.',
          sample: '443/tcp open  https\nNmap done: 1 IP address (1 host up) scanned in 2.14 seconds',
        }],
        whatItMeans: 'S-4 is a flat network where everything reaches everything. A scan that finds one open port is the before-and-after that proves segmentation.',
        frameworks: ['CISSP'],
        verify: ['443/tcp open'],
      },
    ],
  },
  {
    id: 'ci-w3-idops', role: 'idops', week: 3,
    title: 'Prove MFA, accounts and federation',
    objective: 'Prove identity in the lab: MFA on admin login, individual accounts, orphans disabled, and federation with a customer.',
    frameworks: ['CISSP', 'NIST_800_53'], deliverables: ['05_Identity.md', '07_Operations.md'], estimatedTime: '2.5 hours',
    learn: ['Why MFA on the console matters', 'Orphan accounts', 'SAML and OIDC'],
    tools: ['Keycloak'], docs: [DOCS.keycloak],
    definitionOfDone: ['Login without a second factor refused', 'Individual admin accounts, two orphans disabled', 'Federation with a customer identity provider', 'S-2, S-3 closed'],
    steps: [
      {
        id: 'ci-w3-idops-s1', title: 'Require MFA, prove a refusal', description: 'S-3: optional MFA becomes required.',
        instruction: 'In Keycloak (the lab identity provider), require OTP for the admin realm, then try a password-only login.',
        commands: [{
          cmd: 'curl -s -d "client_id=admin-cli" -d "username=admin" -d "password=$PW" -d "grant_type=password" https://idp.lab/realms/ridgeline/protocol/openid-connect/token | jq -r .error_description',
          explain: 'Attempts a password-only token request against the realm; with OTP required the realm refuses it.',
          sample: 'Account is not fully set up',
        }],
        whatItMeans: 'Optional MFA protects only the careful. A refused password-only login is the evidence that it is now required, closing S-3.',
        frameworks: ['CISSP', 'NIST_800_53'],
        verify: ['not fully set up'],
      },
      {
        id: 'ci-w3-idops-s2', title: 'Individual accounts, orphans disabled', description: 'S-2: the shared login goes.',
        instructionList: ['Replace the shared admin login with individual accounts.', 'Disable the two orphan accounts from the lab host.', 'Record the access review result in D5, and federate with the customer identity provider.'],
        usesForm: 'D5 Identity',
        whatItMeans: 'A shared login means no action can be tied to a person. Individual accounts are what make the audit log mean anything.',
        frameworks: ['CISSP'],
      },
    ],
  },
  {
    id: 'ci-w3-gov', role: 'govrisk', week: 3,
    title: 'Prove suppliers and the server migration',
    objective: 'Tier the suppliers, threat-model with STRIDE, and migrate and sanitize the old end-of-support server.',
    frameworks: ['CISSP', 'STRIDE'], deliverables: ['01_Governance_and_Risk.md', '02_Assets_and_Data.md', '06_Assessment.md'], estimatedTime: '2.5 hours',
    learn: ['Supplier tiering', 'STRIDE', 'Media sanitization (clear, purge, destroy)'],
    tools: ['OWASP Threat Dragon', 'shred'], docs: [DOCS.c88],
    definitionOfDone: ['Eight suppliers in tiers with tier-1 terms', 'STRIDE threat model, top six linked to risks', 'Old server data migrated, server sanitized and recorded', 'S-10 closed', 'Rescore to 20'],
    steps: [
      {
        id: 'ci-w3-gov-s1', title: 'Tier suppliers and threat-model', description: 'D1 v3: suppliers and STRIDE.',
        instructionList: ['Put eight suppliers in tiers and set tier-1 terms on training use, retention and region.', 'Build a STRIDE threat model and link the top six threats to risks.', 'Update the register with the week’s lab results.'],
        usesForm: 'D1 Governance & Risk',
        whatItMeans: 'The model provider is a tier-1 supplier that sees customer prompts. Its terms on retention and training are a contract question, not a technical one.',
        frameworks: ['STRIDE', 'CISSP'],
      },
      {
        id: 'ci-w3-gov-s2', title: 'Migrate and sanitize the old server', description: 'S-10: the end-of-support box.',
        instruction: 'Move the old server’s data, then sanitize the disk and record it (the lab image stands in for the server).',
        commands: [{
          cmd: 'sha256sum migrated/*.db && shred -vn 3 -z /dev/sdX 2>&1 | tail -n 1',
          explain: 'Confirms the migrated data by hash, then overwrites the old disk three times and zeroes it, per NIST 800-88 purge.',
          sample: 'e3b0c44298fc1c149afbf4c8996fb924  migrated/scheduling.db\nshred: /dev/sdX: pass 4/4 (000000)...done',
        }],
        whatItMeans: 'An operating system past end of support cannot be patched. Sanitizing the disk after migration closes S-10 and leaves a record for the audit.',
        frameworks: ['CISSP'],
        verify: ['migrated/scheduling.db', 'done'],
      },
    ],
  },

  // ── Week 4 — Release v4, data, operations and AI ──────────────────────────
  {
    id: 'ci-w4-idops', role: 'idops', week: 4,
    title: 'Prove detection, restore and contingency',
    objective: 'Fire a detection and time it, restore a backup and match hashes, and write the contingency plan. Close S-5, S-7.',
    frameworks: ['CISSP', 'NIST_800_53'], deliverables: ['07_Operations.md'], estimatedTime: '3 hours',
    learn: ['Time to detect and resolve', 'Restore testing', 'Activation, recovery, reconstitution'],
    tools: ['Wazuh', 'restic'], docs: [DOCS.restic, DOCS.c34],
    definitionOfDone: ['A detection fires with time to detect and resolve', 'Restore hashes match, time compared to target', 'Logs kept 12 months and reviewed', 'Contingency plan written', 'S-5, S-7 closed'],
    steps: [
      {
        id: 'ci-w4-idops-s1', title: 'Back up and restore, hashes matching', description: 'S-5: backups that are restore-tested.',
        instruction: 'Back up the sample data with restic, restore it elsewhere, and compare hashes (containers stand in for the cloud).',
        commands: [{
          cmd: 'restic -r /srv/backups restore latest --target /tmp/r && sha256sum -c baseline.sha256 --quiet && echo RESTORE_OK',
          explain: 'Restores the latest snapshot to a scratch directory, checks every file against its original hash, and prints a marker on success.',
          sample: 'restored 128 files\nRESTORE_OK',
        }],
        whatItMeans: 'A backup never restore-tested is a guess. Matching hashes after a restore is the only proof the data would actually come back.',
        frameworks: ['CISSP'],
        verify: ['RESTORE_OK'],
      },
      {
        id: 'ci-w4-idops-s2', title: 'Fire a detection, time it', description: 'S-7: logs reviewed, alerts acted on.',
        instruction: 'Trigger the lab security event, confirm the detection fires in Wazuh, and record time to detect and to resolve.',
        commands: [{
          cmd: 'grep -c "rule.level\\": 10" /var/ossec/logs/alerts/alerts.json',
          explain: 'Counts the high-severity alerts the triggered event raised, confirming the detection fired rather than passing silently.',
          sample: '1',
        }],
        whatItMeans: 'Logs kept but never reviewed (S-7) catch nothing. A detection with a measured time to detect and resolve is a control that works.',
        frameworks: ['CISSP', 'NIST_800_53'],
        verify: ['1'],
      },
      {
        id: 'ci-w4-idops-s3', title: 'Write the contingency plan', description: 'Three phases, and the AI playbook.',
        instructionList: ['Write the contingency plan: activation, recovery, reconstitution.', 'Write the model-provider outage fallback and the AI incident playbook.', 'Record investigation types and the chain-of-custody form.'],
        usesForm: 'D7 Operations',
        whatItMeans: 'When the model provider was down six hours, dispatch stopped. A fallback written in advance is the difference between a pause and a crisis.',
        frameworks: ['CISSP'],
      },
    ],
  },
  {
    id: 'ci-w4-gov', role: 'govrisk', week: 4,
    title: 'Prove data discovery and categorization',
    objective: 'Find and sanitize personal data, categorize the system by high-water mark, and record the AI rules in the register.',
    frameworks: ['CISSP', 'NIST_AI_RMF'], deliverables: ['02_Assets_and_Data.md', '01_Governance_and_Risk.md', '06_Assessment.md'], estimatedTime: '2.5 hours',
    learn: ['Finding personal data', 'High-water mark categorization', 'The EU AI Act applicability decision'],
    tools: ['Microsoft Presidio'], docs: [DOCS.c53],
    definitionOfDone: ['Personal data count above zero before, zero after', 'System categorized with high-water mark and baseline', 'AI rules in the register, EU AI Act recorded', 'Five scan findings dated'],
    steps: [
      {
        id: 'ci-w4-gov-s1', title: 'Find and sanitize personal data', description: 'Count before, count after.',
        instruction: 'Scan the planted dataset for personal data with Presidio, sanitize it, and re-count (the dataset is supplied for the lab).',
        commands: [{
          cmd: 'python scan_pii.py dataset/ --before && python sanitize.py dataset/ && python scan_pii.py dataset/ --after',
          explain: 'Counts personal-data hits, redacts them, then re-counts, so the before and after numbers are the evidence.',
          sample: 'before: 42 PII entities\nsanitized 42 entities\nafter: 0 PII entities',
        }],
        whatItMeans: 'A count above zero before and zero after is proof the discovery and the sanitization both worked, not just that a tool ran.',
        frameworks: ['CISSP'],
        verify: ['after: 0 PII entities'],
      },
      {
        id: 'ci-w4-gov-s2', title: 'Categorize and record AI rules', description: 'High-water mark; the AI register.',
        instructionList: ['Categorize the system by high-water mark and name the control baseline.', 'Add the models, training data and prompts as assets.', 'Record the Texas act, NIST AI RMF, and whether the EU AI Act applies and why.'],
        usesForm: 'D2 Assets & Data',
        whatItMeans: 'High-water mark means the whole system inherits the impact of its most sensitive data. It is what sets the control baseline for everything.',
        frameworks: ['CISSP', 'NIST_AI_RMF'],
      },
    ],
  },
  {
    id: 'ci-w4-arch', role: 'archnet', week: 4,
    title: 'Prove AI controls and the config scan',
    objective: 'Put the AI gateway on its own zone, register machine identities, run a config scan, and write the assessment plan.',
    frameworks: ['CISSP', 'NIST_800_53'], deliverables: ['03_Architecture.md', '04_Network.md', '08_Software_and_Change.md', '06_Assessment.md'], estimatedTime: '2.5 hours',
    learn: ['An AI gateway as the sole path', 'Machine identities', 'Configuration scanning against a benchmark'],
    tools: ['Lynis', 'OpenVAS'], docs: [DOCS.lynis, DOCS.openvas],
    definitionOfDone: ['AI gateway zone is the sole path to the model API', 'Machine identity register with owner and rotation', 'Five configuration findings in the remediation plan', 'Model tests and rollback in the pipeline'],
    steps: [
      {
        id: 'ci-w4-arch-s1', title: 'Scan the configuration', description: 'Five findings into the plan.',
        instruction: 'Run a hardening scan on the lab host and take the top findings into the remediation plan.',
        commands: [{
          cmd: 'lynis audit system --quick 2>/dev/null | grep -E "Hardening index|Warnings|Suggestions"',
          explain: 'Audits the host against hardening checks and prints the index and the counts you triage into the plan.',
          sample: 'Hardening index : 67 [#############       ]\nWarnings:  3\nSuggestions:  28',
        }],
        whatItMeans: 'A hardening index turns “is it configured well?” into a number you can track release to release, and the warnings are the findings to date.',
        frameworks: ['CISSP'],
        verify: ['Hardening index'],
      },
      {
        id: 'ci-w4-arch-s2', title: 'Gateway zone and machine identities', description: 'D3, D4, D5 v4.',
        instructionList: ['Put the AI gateway in its own zone as the sole path to the model API.', 'Add a control separating one customer’s data from another’s.', 'Register machine identities with owner, least privilege and rotation.', 'Add model tests and rollback to the pipeline.'],
        usesForm: 'D3 Architecture',
        whatItMeans: 'When the assistant showed one customer’s records to another, the fix was one path to the model with tenant separation on it. The gateway zone is that path.',
        frameworks: ['CISSP', 'NIST_800_53'],
      },
    ],
  },

  // ── Week 5 — Release v5, tested ───────────────────────────────────────────
  {
    id: 'ci-w5-gov', role: 'govrisk', week: 5,
    title: 'Assess all sixteen controls and close findings',
    objective: 'Assess every control with evidence, write the report, and accept or close each finding. Reach score 32.',
    frameworks: ['CISSP', 'SOC_2'], deliverables: ['06_Assessment.md', '01_Governance_and_Risk.md', '10_Questionnaire_Response.md'], estimatedTime: '3 hours',
    learn: ['Examine, interview, test', 'Satisfied and other-than-satisfied', 'The four ISC2 canons, in order'],
    tools: ['OpenCRE', 'eramba'], docs: [DOCS.ethics],
    definitionOfDone: ['All 16 controls assessed with result, evidence and a SOC 2 criterion', 'Three or more findings', 'The 16 questions answered, no yes without a ledger entry', 'Score 32'],
    steps: [
      {
        id: 'ci-w5-gov-s1', title: 'Assess the controls, write the report', description: 'Result, evidence, criterion.',
        instructionList: ['Assess all 16 controls by examine, interview and test.', 'Record result, ledger evidence and the SOC 2 criterion for each.', 'Raise three or more findings and apply the four canons to a request to answer “yes” without evidence.'],
        usesForm: 'D6 Assessment',
        whatItMeans: 'The first canon — protect society — is why you refuse to answer “yes” to a customer without evidence. The assessment is where that refusal is tested.',
        frameworks: ['CISSP', 'SOC_2'],
      },
      {
        id: 'ci-w5-gov-s2', title: 'Answer the questionnaire', description: 'Sixteen answers, each with a citation.',
        instruction: 'Answer the 16 customer questions, each citing a ledger entry; the form refuses a “yes” with no evidence.',
        usesForm: 'Customer Questionnaire Response',
        whatItMeans: 'The customer renews only if every answer has evidence. A “yes” with a ledger hash behind it is the whole point of five weeks of work.',
        frameworks: ['SOC_2'],
      },
    ],
  },
  {
    id: 'ci-w5-arch', role: 'archnet', week: 5,
    title: 'Re-test architecture, network and change',
    objective: 'Re-test TLS, rotate a key, re-scan the network, and record a release blocked when a gate is removed.',
    frameworks: ['CISSP', 'NIST_800_53'], deliverables: ['03_Architecture.md', '04_Network.md', '08_Software_and_Change.md'], estimatedTime: '2 hours',
    learn: ['Re-testing is evidence of durability', 'Key rotation', 'A gate that still blocks'],
    tools: ['OpenSSL', 'nmap', 'OWASP ZAP'], docs: [DOCS.openssl],
    definitionOfDone: ['TLS re-tested, one key rotation recorded', 'Re-scan result, rule review dates checked', 'A release blocked when a gate is removed'],
    steps: [
      {
        id: 'ci-w5-arch-s1', title: 'Re-test TLS and the gate', description: 'The controls still hold.',
        instruction: 'Re-run the TLS check, record a key rotation, and remove a pipeline gate to confirm the release is blocked.',
        commands: [{
          cmd: 'echo | openssl s_client -connect hub.lab:443 -tls1_3 2>&1 | grep -E "Protocol|Cipher is"',
          explain: 'Confirms the endpoint still negotiates TLS 1.3 after the week’s changes, so the control has not regressed.',
          sample: 'Protocol  : TLSv1.3\nCipher is TLS_AES_256_GCM_SHA384',
        }],
        whatItMeans: 'A control that passed once can regress. Re-testing at assessment time is what lets you write “still satisfied” honestly.',
        frameworks: ['CISSP', 'NIST_800_53'],
        verify: ['TLSv1.3'],
      },
    ],
  },
  {
    id: 'ci-w5-idops', role: 'idops', week: 5,
    title: 'Re-test access and run the tabletop',
    objective: 'Repeat the access review, time an account disablement, and run a four-inject tabletop with an after-action report.',
    frameworks: ['CISSP', 'NIST_800_53'], deliverables: ['05_Identity.md', '07_Operations.md'], estimatedTime: '2.5 hours',
    learn: ['Timed account disablement', 'Tabletop injects', 'The five recovery test types'],
    tools: ['Keycloak', 'Notes'], docs: [DOCS.keycloak],
    definitionOfDone: ['Access review repeated, disablement timed against the leaver limit', 'Tabletop after-action report with three improvements', 'The five recovery test types compared'],
    steps: [
      {
        id: 'ci-w5-idops-s1', title: 'Time an account disablement', description: 'Against the leaver limit.',
        commands: [{
          cmd: 'T0=$(date +%s); kcadm.sh update users/$UID -s enabled=false -r ridgeline && echo "disabled in $(( $(date +%s) - T0 ))s"',
          explain: 'Disables a leaver’s account and prints how long it took, so it can be compared to the one-business-day limit.',
          sample: 'disabled in 7s',
        }],
        whatItMeans: 'The leaver rule promises removal within one business day. A timed disablement is the evidence it happens, not just that it is written down.',
        frameworks: ['CISSP'],
        verify: ['disabled in'],
      },
      {
        id: 'ci-w5-idops-s2', title: 'Run the tabletop', description: 'Four injects, three improvements.',
        instruction: 'Run the ransomware-during-an-outage tabletop with four injects, and write the after-action report.',
        usesForm: 'D7 Operations',
        whatItMeans: 'A plan never exercised fails on the day. The after-action report, with three owned improvements, is what turns a drill into a better plan.',
        frameworks: ['CISSP', 'NIST_800_53'],
      },
    ],
  },

  // ── Week 6 — Release v6, federal-ready ────────────────────────────────────
  {
    id: 'ci-w6-gov', role: 'govrisk', week: 6,
    title: 'Self-assess the basics and assemble the SSP',
    objective: 'Self-assess the 15 basic requirements, analyse the SP 800-171 gaps, and assemble the System Security Plan.',
    frameworks: ['CISSP', 'NIST_800_171'], deliverables: ['06_Assessment.md', '01_Governance_and_Risk.md', '12_System_Security_Plan.md'], estimatedTime: '3.5 hours',
    learn: ['FCI and CUI', 'The two federal routes', 'SP 800-171 scoring'],
    tools: ['OSCAL Compass', 'Git'], docs: [DOCS.far, DOCS.c171],
    definitionOfDone: ['All 15 basic requirements have evidence or a dated plan', 'SP 800-171 gap analysis by family', 'SSP assembled, traceability table has no empty cell', 'Decision memo signed'],
    consumes: [{ from: 'archnet', artifact: 'Federal mappings', note: 'The SSP cites them.' }, { from: 'idops', artifact: 'Incident reporting', note: 'The SSP cites it.' }],
    steps: [
      {
        id: 'ci-w6-gov-s1', title: 'Self-assess basic safeguarding', description: 'Fifteen requirements, met or not.',
        instructionList: ['Self-assess the 15 FAR 52.204-21 requirements, each met or not with a ledger entry.', 'Analyse the SP 800-171 gaps by family with an estimated score.', 'Write the federal route brief: the two routes and which applies now.'],
        usesForm: 'D6 Assessment',
        whatItMeans: 'Basic safeguarding is the floor a federal contract already requires. The gap analysis is the map from that floor to the SP 800-171 the renewal cites.',
        frameworks: ['NIST_800_171'],
      },
      {
        id: 'ci-w6-gov-s2', title: 'Assemble the SSP and traceability', description: 'The capstone package.',
        instruction: 'Assemble the System Security Plan and the traceability table, then write the decision memo and check the ledger.',
        commands: [{
          cmd: 'sha256sum -c ledger.sha256 | grep -c OK && grep -c "," traceability.csv',
          explain: 'Confirms every ledger entry still matches and counts the filled rows of the traceability table.',
          sample: '58\n16',
        }],
        usesForm: 'System Security Plan & Traceability',
        whatItMeans: 'The SSP is the one document a federal assessor reads first. The traceability table with no empty cell is what proves every control connects to evidence.',
        frameworks: ['CISSP', 'NIST_800_171'],
        verify: ['58'],
      },
    ],
  },
  {
    id: 'ci-w6-arch', role: 'archnet', week: 6,
    title: 'Map architecture and network to federal rules',
    objective: 'Map encryption, boundary and network controls to the federal requirements, and confirm the authorized cloud services.',
    frameworks: ['CISSP', 'NIST_800_171'], deliverables: ['03_Architecture.md', '04_Network.md', '08_Software_and_Change.md'], estimatedTime: '2 hours',
    learn: ['FedRAMP authorization levels', 'Mapping a control to a requirement', 'The federal information boundary'],
    tools: ['draw.io'], docs: [DOCS.c171],
    definitionOfDone: ['Encryption and boundary controls mapped, with gaps', 'Authorized cloud services confirmed at the required level', 'Change control for the federal part of the system'],
    handoff: [{ to: 'govrisk', artifact: 'Federal mappings', note: 'Governance folds them into the SSP.' }],
    steps: [
      {
        id: 'ci-w6-arch-s1', title: 'Map the controls to federal rules', description: 'Where they meet, and the gaps.',
        instructionList: ['Map encryption and boundary controls to the federal requirements, noting gaps.', 'Confirm the cloud services holding federal information are authorized at the required level.', 'Draw the federal information boundary.'],
        usesForm: 'D3 Architecture',
        whatItMeans: 'Federal information may only sit on authorized services. Drawing the boundary is what shows, at a glance, that it does not leak outside them.',
        frameworks: ['CISSP', 'NIST_800_171'],
      },
    ],
  },
  {
    id: 'ci-w6-idops', role: 'idops', week: 6,
    title: 'Map identity and federal incident reporting',
    objective: 'Map identity and access controls to the federal requirements, and write the federal incident reporting procedure.',
    frameworks: ['CISSP', 'NIST_800_171'], deliverables: ['05_Identity.md', '07_Operations.md'], estimatedTime: '2 hours',
    learn: ['Mapping identity controls', 'Federal incident reporting', 'Media and physical protection'],
    tools: ['Notes'], docs: [DOCS.c171],
    definitionOfDone: ['Identity, authentication and access controls mapped, with gaps', 'Incident reporting to the contracting officer written', 'Media and physical protection mapped'],
    handoff: [{ to: 'govrisk', artifact: 'Incident reporting', note: 'Governance folds it into the SSP.' }],
    steps: [
      {
        id: 'ci-w6-idops-s1', title: 'Map identity and write federal reporting', description: 'Controls mapped; who reports, how, when.',
        instructionList: ['Map identification, authentication and access controls to the federal requirements, noting gaps.', 'Write federal incident reporting: who reports, to whom, how, and the time limit.', 'Map media and physical protection.'],
        usesForm: 'D7 Operations',
        whatItMeans: 'Federal reporting has its own clock and its own recipient, separate from the customer’s 72 hours. Writing it down is what keeps the two from being confused under pressure.',
        frameworks: ['CISSP', 'NIST_800_171'],
      },
    ],
  },
];

export const CISSP: Course = {
  id: 'cissp',
  title: 'CISSP Capstone: Six Releases',
  slug: 'cissp',
  vendor: 'ISC2',
  certification: 'CISSP',
  level: 'expert',
  audience: 'Build a whole security program across all eight domains, release by release, to federal-ready.',
  description:
    'Build a security program for a company moving to the cloud. Eight domain sheets, six releases: documented, specified, proven, tested and federal-ready, each raising the maturity score.',
  roles,
  weeks,
  gates,
  tasks,
  noGatekeeping: true,
  isSeed: true,
  version: 1,
  locked: false,
  topologyPicture: 'hub',
  teamCount: 18,
  teamCapacity: 6,
};

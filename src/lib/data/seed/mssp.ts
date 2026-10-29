import { Course, Gate, RoleDef, Task, WeekDef } from '../../types';
import { withPortfolioStep } from '../../docs/portfolioPlan';

// MSSP / SOC 2 + ISO 27001 engagement course.
//
// This reuses the red/blue/grc role ids (so all role colour/icon/guide maps work
// unchanged) but reframes them as the three functions of a real Managed Security
// Service Provider running a compliance engagement for a client: Offensive
// Security (Red), Managed Detection & Response (Blue), and GRC / vCISO (GRC).
// The weeks are the engagement lifecycle phases (P0 scope → P4 audit readiness)
// and the gates are the audit milestones. Its deliverable forms live in
// docs/msspDeliverables.ts (course-scoped `courseId: 'mssp'`). See docs/MSSP_MODEL.md.

const roles: RoleDef[] = [
  {
    id: 'red',
    name: 'Offensive Security (Penetration Tester)',
    mission: 'Penetration testing and control validation for the client.',
    color: '#dc2626',
    icon: 'Target',
  },
  {
    id: 'blue',
    name: 'Detection & Response (MDR Analyst)',
    mission: 'Hardening, detection engineering and incident response for the client.',
    color: '#2563eb',
    icon: 'Shield',
  },
  {
    id: 'grc',
    name: 'Governance & Audit (vCISO)',
    mission: 'Scope, risk, controls and the audit evidence spine.',
    color: '#16a34a',
    icon: 'ClipboardList',
  },
];

/**
 * The engagement arc. `stage` is the cut of the Capstone Stone each phase
 * produces; `phase` names the work in this engagement's own terms — an audit
 * readiness engagement tests and packages rather than integrating services, so
 * the default build-shaped verbs would misdescribe phases P3 and P4.
 */
const weeks: WeekDef[] = [
  { number: 0, title: 'Onboarding & Scoping', theme: 'Agree the boundary', objective: 'Sign the engagement and define the system / ISMS scope.', runs: 'Phase P0',
    setup: true, stage: 0, phase: 'Scope & Agree', difficulty: 1,
    objectives: [
      { id: 'kick-off-and-scope-the-engagement', label: 'Kick off and scope the engagement', tasks: ['mg-w0'] },
      { id: 'confirm-the-rules-of-engagement', label: 'Confirm the rules of engagement', tasks: ['mr-w0'] },
      { id: 'stand-up-logging-and-sensors', label: 'Stand up logging and sensors', tasks: ['mb-w0'] },
    ],
    milestone: 'The engagement letter is signed and the system / ISMS boundary is written down and agreed.' },
  { number: 1, title: 'Gap Assessment', theme: 'Know the gaps', objective: 'Assess current state vs SOC 2 + ISO 27001 and pick the controls.', runs: 'Phase P1',
    stage: 1, phase: 'Survey & Assess', difficulty: 2,
    objectives: [
      { id: 'assess-the-risk-and-write-the-soa', label: 'Assess the risk and write the SoA', tasks: ['mg-w1'] },
      { id: 'assess-the-external-attack-surface', label: 'Assess the external attack surface', tasks: ['mr-w1'] },
      { id: 'scan-the-cis-baseline-gaps', label: 'Scan the CIS baseline gaps', tasks: ['mb-w1'] },
    ],
    milestone: 'Every SOC 2 and ISO 27001 requirement is marked met or gap, and the SoA names the selected controls.' },
  { number: 2, title: 'Control Implementation', theme: 'Build the controls', objective: 'Stand up the missing controls and write the control matrix.', runs: 'Phase P2',
    stage: 2, phase: 'Build & Establish', difficulty: 3,
    objectives: [
      { id: 'build-the-control-matrix', label: 'Build the control matrix', tasks: ['mg-w2'] },
      { id: 'implement-the-technical-controls', label: 'Implement the technical controls', tasks: ['mb-w2'] },
      { id: 'threat-model-the-proposed-controls', label: 'Threat-model the proposed controls', tasks: ['mr-w2'] },
    ],
    milestone: 'Each gap has a control in place, and the matrix says which requirement it satisfies and who owns it.' },
  { number: 3, title: 'Validation & Testing', theme: 'Prove it works', objective: 'Pentest, detect, and evidence that the controls operate.', runs: 'Phase P3',
    stage: 3, phase: 'Test & Prove', difficulty: 3,
    objectives: [
      { id: 'pentest-and-retest', label: 'Pentest and retest', tasks: ['mr-w3'] },
      { id: 'engineer-the-detections', label: 'Engineer the detections', tasks: ['mb-w3'] },
      { id: 'coordinate-validation-and-collect-evidence', label: 'Coordinate validation and collect evidence', tasks: ['mg-w3'] },
    ],
    milestone: 'Testing is complete and every control has evidence that it actually operates, not just that it exists.' },
  { number: 4, title: 'Audit Readiness', theme: 'Get audit-ready', objective: 'Internal audit and assemble the evidence package (Type I / Stage 1).', runs: 'Phase P4',
    stage: 4, phase: 'Audit & Package', difficulty: 2,
    objectives: [
      { id: 'close-out-the-retest-and-attest', label: 'Close out the retest and attest', tasks: ['mr-w4'] },
      { id: 'report-detection-and-response-metrics', label: 'Report detection and response metrics', tasks: ['mb-w4'] },
      { id: 'run-the-internal-audit', label: 'Run the internal audit', tasks: ['mg-w4a'] },
      { id: 'assemble-the-audit-evidence-packet', label: 'Assemble the audit evidence packet', tasks: ['mg-w4b'] },
    ],
    milestone: 'The Type I readiness package is assembled and the client has the findings report.' },
];

/**
 * The gates.
 *
 * `deriveGateStatus` is per-ROLE: it looks at the required tasks that belong to
 * you and asks whether you have finished them. A gate that lists no task of
 * yours therefore says nothing about you — and `weekLocked` used to read that
 * silence as "not passed", which barred Red and Blue from week 2 onward with
 * nothing they could do about it, for the whole life of this seed.
 *
 * That reading is fixed in the repo (a gate that asks nothing of you does not
 * hold you up), but the content bug it exposed is here: a gate meant to hold the
 * team at a checkpoint has to name work from every role, or it holds nobody.
 * Each gate below now requires one task per role, and there is a gate at week 3
 * so week 4 is gated like every other week — `priorGateForWeek(4)` used to be
 * undefined, so the final week opened with nothing required at all.
 */
const gates: Gate[] = [
  {
    id: 1,
    week: 1,
    title: 'Scope & SoA signed',
    description: 'The engagement agreement is signed and the Statement of Applicability defines which controls are in scope. Nothing is implemented before this.',
    requiredArtifactTypes: ['01_Engagement_and_Scope.md', '02_Statement_of_Applicability.csv'],
    requiredTasks: ['mg-w0', 'mg-w1', 'mr-w1', 'mb-w1'],
  },
  {
    id: 2,
    week: 2,
    title: 'Controls implemented',
    description: 'Every applicable control is implemented and mapped in the Control Matrix with an owner and its evidence source.',
    requiredArtifactTypes: ['03_Control_Matrix.csv'],
    requiredTasks: ['mg-w2', 'mb-w2', 'mr-w2'],
  },
  {
    id: 3,
    week: 3,
    title: 'Validation complete',
    description:
      'The controls have been tested rather than merely built: findings recorded with remediations, detections written and shown to fire against the test, and evidence collection under way.',
    requiredArtifactTypes: ['04_Retest_and_Validation.md', '05_Detection_Rules.csv'],
    requiredTasks: ['mr-w3', 'mb-w3', 'mg-w3'],
  },
  {
    id: 4,
    week: 4,
    title: 'Type I readiness / operating effectiveness',
    description: 'Controls are tested, detections validated, metrics reported, an internal audit is complete, and the evidence packet is assembled — ready for the external Type I / Stage 1 auditor.',
    requiredArtifactTypes: ['04_Retest_and_Validation.md', '06_Detection_and_Response_Metrics.md', '07_Internal_Audit_Report.md', '08_Audit_Evidence_Packet.csv'],
    requiredTasks: ['mr-w3', 'mr-w4', 'mb-w3', 'mb-w4', 'mg-w4a', 'mg-w4b'],
  },
];

const tasks: Task[] = [
  // ── Week 0 — P0 Onboarding & Scoping ───────────────────────────────────────
  {
    id: 'mg-w0',
    role: 'grc',
    week: 0,
    title: 'Kick-off & scope the engagement',
    objective: 'Sign the engagement paperwork and define exactly what the SOC 2 / ISO 27001 attestation covers.',
    frameworks: ['SOC_2', 'ISO_27001'],
    deliverables: ['01_Engagement_and_Scope.md'],
    estimatedTime: '90 min',
    learn: ['SOC 2 system description vs ISO 27001 Clause 4 scope', 'Type I vs Type II', 'Why the boundary drives everything'],
    tools: ['Engagement Agreement form', 'GRC platform (Vanta/Drata)'],
    definitionOfDone: ['MSA/SOW/NDA recorded', 'System / ISMS boundary written', 'Sign-off captured'],
    handoff: [
      { to: 'red', artifact: 'Engagement scope', note: 'Red tests only what is in scope.' },
      { to: 'blue', artifact: 'System boundary', note: 'Blue instruments only in-scope systems.' },
    ],
    steps: [
      {
        id: 'mg-w0-s1',
        title: 'Record the engagement agreement',
        description: 'Capture the client, engagement type, and terms.',
        instruction: 'Fill the Engagement Agreement & Scope form: client, engagement type (SOC 2 / ISO / combined), NDA, and sign-off.',
        usesForm: 'Engagement Agreement & Scope',
        whatItMeans: 'This is the contractual and ethical anchor — like the Scope & RoE in a pentest, nothing proceeds until it is signed.',
        frameworks: ['SOC_2', 'ISO_27001'],
      },
      {
        id: 'mg-w0-s2',
        title: 'Define the system / ISMS boundary',
        description: 'Draw the exact boundary the attestation covers.',
        instruction: 'In the same form, write the in-scope systems, data and locations, plus what is explicitly out of scope.',
        usesForm: 'Engagement Agreement & Scope',
        whatItMeans: 'The boundary determines which controls apply, what Red may test, and what evidence the auditor samples. Too wide wastes effort; too narrow fails the audit.',
        frameworks: ['ISO_27001'],
      },
    ],
  },
  {
    id: 'mr-w0',
    role: 'red',
    week: 0,
    title: 'Confirm rules of engagement',
    objective: 'Agree the testing targets, windows, and written authorization before any scanning.',
    frameworks: ['NIST_800_115'],
    deliverables: [],
    estimatedTime: '30 min',
    prerequisites: ['GRC has recorded the engagement scope'],
    learn: ['PTES pre-engagement', 'Written authorization / get-out-of-jail'],
    tools: ['Engagement scope'],
    definitionOfDone: ['Targets + windows confirmed against scope', 'Authorization in writing'],
    steps: [
      {
        id: 'mr-w0-s1',
        title: 'Confirm targets and authorization',
        description: 'Cross-check the in-scope hosts and get written testing authorization.',
        instruction: 'Read GRC’s engagement scope; confirm the exact hosts/URLs, allowed test windows, and that you have written authorization to test them.',
        whatItMeans: 'Testing outside the authorized scope is illegal and voids the engagement — the PTES pre-engagement step exists to prevent exactly that.',
        frameworks: ['NIST_800_115'],
      },
    ],
  },
  {
    id: 'mb-w0',
    role: 'blue',
    week: 0,
    title: 'Stand up logging & sensors',
    objective: 'Centralize logs and baseline “normal” so later detections and evidence have data to work with.',
    frameworks: ['SOC_2', 'ISO_27001'],
    deliverables: [],
    estimatedTime: '60 min',
    prerequisites: ['GRC has defined the system boundary'],
    learn: ['SOC 2 CC7.2 monitoring', 'ISO A.8.15 logging', 'Baselining normal'],
    tools: ['auditd', 'journalctl', 'SIEM'],
    definitionOfDone: ['Logs centralized for in-scope systems', 'A baseline of normal activity captured'],
    steps: [
      {
        id: 'mb-w0-s1',
        title: 'Enable and centralize auditing',
        description: 'Turn on host auditing and confirm logs flow.',
        command: 'sudo systemctl enable --now auditd && sudo ausearch -m USER_LOGIN -ts today',
        expectedOutput: `$ sudo ausearch -m USER_LOGIN -ts today
----
time->Mon Aug  5 09:12:44 2026
type=USER_LOGIN msg=audit(1754384: pid=1442 uid=0 auid=1000
 msg='op=login id=1000 exe="/usr/sbin/sshd" hostname=10.10.100.5
 res=success'`,
        outputHighlights: [
          { text: 'type=USER_LOGIN', label: 'a real audit record. Its presence proves auditd is not just running but actually recording — an active service with no events is a silent gap.' },
          { text: 'res=success', label: 'the outcome field. Auditing both success and failure is what SOC 2 CC7 and ISO A.8.15 expect — a failed-login record would read res=failed here.' },
          { text: 'exe="/usr/sbin/sshd"', label: 'what caused the event. Tying an event to the program behind it is the difference between a log and evidence an auditor will accept.' },
        ],
        whatItMeans: 'Central, tamper-evident logging is the foundation of SOC 2 CC7 monitoring and ISO A.8.15 — you cannot detect or evidence what you do not log.',
        frameworks: ['SOC_2', 'ISO_27001'],
        troubleshooting: 'No output → auditd may not be installed: `sudo apt install auditd`. On a container, use journald: `journalctl -u ssh --since today`.',
        verify: ['USER_LOGIN'],
      },
    ],
  },

  // ── Week 1 — P1 Gap Assessment ─────────────────────────────────────────────
  {
    id: 'mg-w1',
    role: 'grc',
    week: 1,
    title: 'Risk assessment & Statement of Applicability',
    objective: 'Assess the client against the frameworks and decide which controls apply (the SoA).',
    frameworks: ['ISO_27001', 'SOC_2'],
    deliverables: ['02_Statement_of_Applicability.csv'],
    estimatedTime: '2 hours',
    prerequisites: ['Engagement scope signed (Gate 1 depends on this)'],
    learn: ['ISO 27005 risk assessment', 'Annex A 93 controls / 4 themes', 'Statement of Applicability'],
    tools: ['Statement of Applicability form', 'Risk register'],
    definitionOfDone: ['≥3 Annex A controls with applicability decisions', 'Every applicable control justified'],
    handoff: [{ to: 'blue', artifact: 'Applicable controls', note: 'Blue implements the technical controls the SoA marks applicable.' }],
    steps: [
      {
        id: 'mg-w1-s1',
        title: 'Assess risk and decide applicability',
        description: 'For each Annex A control, decide whether it applies and why.',
        instruction: 'Fill the Statement of Applicability form: add each Annex A control in scope, its applicability (Yes/No), the justification, and its status.',
        usesForm: 'Statement of Applicability (SoA)',
        whatItMeans: 'The SoA is the ISO 27001 centrepiece — the auditor reads it first to see what you claim and why. It also feeds the SOC 2 control set.',
        frameworks: ['ISO_27001'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mg-w1-s2',
        title: 'Export the SoA and hash it',
        description: 'The export, fingerprinted before anyone edits it.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'sha256sum 02_Statement_of_Applicability.csv | tee -a Evidence_Hashes.txt', explain: 'Fingerprints the exported SoA and appends the line to the evidence hash list the packet will cite.', sample: '3f1c…9a2e  02_Statement_of_Applicability.csv' },
        ],
        expectedOutput: '3f1c0d8e4b7a2c9e5d1f6a3b8c4e7d2f9a1b6c3e8d5f2a7b4c1e9d6f3a8b5c2e  02_Statement_of_Applicability.csv',
        outputKind: 'console',
        verify: ['02_Statement_of_Applicability.csv'],
        whatItMeans: 'An auditor samples the SoA as it stood when the controls were chosen. The hash is how you prove this is that version.',
        frameworks: ['ISO_27001'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mg-w1-s3',
        title: 'Count the applicable controls',
        description: 'How many controls apply, from the file, not from memory.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'grep -ci ",yes," 02_Statement_of_Applicability.csv && echo "APPLICABLE counted"', explain: 'Counts the rows marked applicable. The number goes in the SoA summary and must match the matrix next week.', sample: '12\nAPPLICABLE counted' },
        ],
        expectedOutput: '12\nAPPLICABLE counted',
        outputKind: 'console',
        verify: ['APPLICABLE counted'],
        whatItMeans: 'The SoA says how big the control set is. Counting it from the export catches the row someone marked twice.',
        frameworks: ['ISO_27001'],
      },
    ],
  },
  {
    id: 'mr-w1',
    role: 'red',
    week: 1,
    title: 'External attack-surface assessment',
    objective: 'Map the in-scope external attack surface to feed the gap analysis.',
    frameworks: ['NIST_800_115', 'OWASP'],
    deliverables: ['09_Gap_Assessment.md'],
    estimatedTime: '90 min',
    prerequisites: ['Rules of engagement confirmed'],
    learn: ['Attack-surface enumeration', 'TLS/config hygiene'],
    tools: ['nmap', 'testssl.sh'],
    definitionOfDone: ['In-scope hosts port-scanned', 'TLS/exposure issues noted for the gap analysis'],
    handoff: [{ to: 'grc', artifact: 'Attack-surface findings', note: 'GRC folds exposure gaps into the risk assessment.' }],
    steps: [
      {
        id: 'mr-w1-s1',
        title: 'Scan the in-scope hosts',
        usesForm: 'Gap Assessment',
        description: 'Enumerate services on the authorized targets.',
        commands: [
          {
            cmd: 'nmap -sV -Pn <IN_SCOPE_HOST>',
            explain: 'Service/version scan of one authorized host.',
            flags: [
              { flag: '-sV', meaning: 'Probe open ports for service/version.' },
              { flag: '-Pn', meaning: 'Skip host discovery (treat as up).' },
            ],
          },
        ],
        expectedOutput: `Nmap scan report for 10.10.100.30
Host is up (0.00051s latency).

PORT    STATE SERVICE VERSION
22/tcp  open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.7
443/tcp open  ssl/http nginx 1.14.0 (Ubuntu)
3389/tcp open ms-wbt-server Microsoft Terminal Services

Service detection performed. Nmap done: 1 IP address (1 host up)`,
        outputHighlights: [
          { text: 'OpenSSH 7.6p1', label: 'an old SSH version. In a gap assessment the exact version is the finding — it maps to specific advisories the client must patch.' },
          { text: '3389/tcp open ms-wbt-server', label: 'RDP exposed to the network. Remote Desktop reachable externally is a classic high-risk gap that goes straight into the risk assessment.' },
          { text: '1 host up', label: 'you scanned exactly the one authorised host. Anything more would be outside the agreed scope and window.' },
        ],
        whatItMeans: 'A repeatable, authorized scan (NIST 800-115) is the credible basis for the “technical vulnerability” side of the gap assessment.',
        frameworks: ['NIST_800_115'],
        troubleshooting: '“Host seems down” → keep `-Pn`. No permission/blocked → confirm the host is in the authorized scope and window.',
        verify: ['open'],
      },
    ],
  },
  {
    id: 'mb-w1',
    role: 'blue',
    week: 1,
    title: 'CIS baseline gap scan',
    objective: 'Measure current hardening against the CIS Benchmarks to find the control gaps.',
    prerequisites: ['Log centralization from Week 0 done', 'SSH / console access to the in-scope hosts', 'The relevant CIS Benchmark PDF to score against'],
    frameworks: ['CIS', 'ISO_27001'],
    deliverables: [],
    estimatedTime: '60 min',
    learn: ['CIS Benchmarks', 'Configuration hardening baselines'],
    tools: ['lynis'],
    definitionOfDone: ['Baseline scan run', 'Top hardening gaps recorded for Week 2'],
    handoff: [{ to: 'grc', artifact: 'Hardening gaps', note: 'GRC references gaps when building the control matrix.' }],
    steps: [
      {
        id: 'mb-w1-s1',
        title: 'Run a hardening audit',
        description: 'Scan the host against a CIS-style baseline.',
        command: 'sudo lynis audit system --quick',
        expectedOutput: `[+] Results
  Warnings (1):
  ! SSH root login is permitted [SSH-7412]
  Suggestions (14):
  * Set a password on GRUB bootloader [BOOT-5122]
  * Disable core dumps for setuid programs [KRNL-5820]

  Hardening index : 58 [###########         ]`,
        outputHighlights: [
          { text: 'Hardening index : 58', label: 'the baseline score. Its whole value is the before/after pair — record it now so Week 2’s fixes have something to be measured against.' },
          { text: 'SSH root login is permitted', label: 'a warning, and warnings are your priority gaps. This one maps directly to SOC 2 CC6 access controls.' },
          { text: 'SSH-7412', label: 'the test ID. Quoting it makes the gap traceable in the control matrix — an auditor can look up exactly what was checked.' },
        ],
        whatItMeans: 'Gaps against CIS map directly to SOC 2 CC6 and ISO A.8 controls, turning “harden the box” into auditable control work.',
        frameworks: ['CIS'],
        troubleshooting: '`lynis: command not found` → `sudo apt install lynis` (or run from a cloned copy).',
        verify: ['Hardening index'],
      },
    ],
  },

  // ── Week 2 — P2 Control Implementation ─────────────────────────────────────
  {
    id: 'mg-w2',
    role: 'grc',
    week: 2,
    title: 'Build the control matrix',
    objective: 'Map every control to its SOC 2 CC and ISO Annex A references, assign an owner, and name the evidence.',
    frameworks: ['SOC_2', 'ISO_27001'],
    deliverables: ['03_Control_Matrix.csv'],
    estimatedTime: '2 hours',
    prerequisites: ['SoA complete (Gate 1)'],
    learn: ['SOC 2 ↔ ISO ↔ NIST CSF crosswalk', 'Control ownership', 'Evidence-by-design'],
    tools: ['Control Matrix form'],
    definitionOfDone: ['≥3 controls with SOC 2 or ISO references', 'Every control has an owner + evidence source'],
    handoff: [{ to: 'blue', artifact: 'Control assignments', note: 'Blue implements and evidences the controls it owns.' }],
    steps: [
      {
        id: 'mg-w2-s1',
        title: 'Map controls and assign owners',
        description: 'Create the working crosswalk of controls.',
        instruction: 'Fill the Control Matrix form: one row per control with its SOC 2 CC, ISO Annex A, owner, status, and the evidence an auditor would sample.',
        usesForm: 'Control Matrix',
        whatItMeans: 'Build the control once and satisfy both frameworks — the matrix is how a multi-framework MSSP avoids doing the work twice.',
        frameworks: ['SOC_2', 'ISO_27001'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mg-w2-s2',
        title: 'Export the matrix and hash it',
        description: 'The crosswalk, fingerprinted.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'sha256sum 03_Control_Matrix.csv | tee -a Evidence_Hashes.txt', explain: 'Fingerprints the control matrix and records it for the evidence packet.', sample: '7b2e…c41d  03_Control_Matrix.csv' },
        ],
        expectedOutput: '7b2e4f9a1c6d8e3b5a7f2c9d4e1b6a8f3c5d7e2a9b4f1c6d8e3a5b7c2f9d4e1b  03_Control_Matrix.csv',
        outputKind: 'console',
        verify: ['03_Control_Matrix.csv'],
        whatItMeans: 'The matrix is the artefact both frameworks are audited against; a dated hash is what makes a later change visible.',
        frameworks: ['SOC_2'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mg-w2-s3',
        title: 'Check every control has an owner',
        description: 'No row without an owner survives the export.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'awk -F, \'NR>1 && $4==""\' 03_Control_Matrix.csv | wc -l && echo "OWNERLESS rows"', explain: 'Counts matrix rows whose owner column is empty. Zero is the only acceptable answer before the hand-off.', sample: '0\nOWNERLESS rows' },
        ],
        expectedOutput: '0\nOWNERLESS rows',
        outputKind: 'console',
        verify: ['OWNERLESS rows'],
        whatItMeans: 'A control nobody owns is a control nobody operates. The count is the check the auditor would otherwise make for you.',
        frameworks: ['SOC_2'],
      },
    ],
  },
  {
    id: 'mb-w2',
    role: 'blue',
    week: 2,
    title: 'Implement the technical controls',
    objective: 'Stand up the missing controls GRC assigned and record what changed.',
    frameworks: ['CIS', 'SOC_2', 'ISO_27001'],
    deliverables: [],
    estimatedTime: '2 hours',
    prerequisites: ['Control Matrix assigns Blue’s controls'],
    learn: ['Host firewall & access controls', 'Change discipline'],
    tools: ['ufw', 'auditctl'],
    definitionOfDone: ['Assigned controls implemented', 'Each change recorded for the evidence trail'],
    handoff: [{ to: 'grc', artifact: 'Implemented controls', note: 'GRC updates the matrix status to Implemented/Operating with evidence.' }],
    steps: [
      {
        id: 'mb-w2-s1',
        title: 'Enforce baseline access controls',
        description: 'Apply a default-deny firewall and log the change.',
        commands: [
          { cmd: 'sudo ufw default deny incoming', explain: 'Block all inbound by default.' },
          { cmd: 'sudo ufw allow 22/tcp', explain: 'Permit only the services you intend to expose.' },
          { cmd: 'sudo ufw --force enable', explain: 'Turn the firewall on.' },
        ],
        expectedOutput: `$ sudo ufw status verbose
Status: active
Default: deny (incoming), allow (outgoing), disabled (routed)

To         Action      From
--         ------      ----
22/tcp     ALLOW IN    Anywhere`,
        outputHighlights: [
          { text: 'Status: active', label: 'the control is actually enforcing. An "inactive" firewall with correct rules is a control that exists on paper but not in operation — the exact thing an auditor tests for.' },
          { text: 'deny (incoming)', label: 'the default-deny posture CC6.6 and ISO A.8.20 expect. Everything is blocked unless explicitly allowed below.' },
          { text: '22/tcp     ALLOW IN', label: 'the one justified exception. A short, reasoned allow-list is the evidence — a long one undermines the default-deny claim.' },
        ],
        whatItMeans: 'This is a control implementation, not just a config — record it so it becomes sampled evidence in the matrix and packet.',
        frameworks: ['CIS', 'SOC_2'],
        troubleshooting: 'Locked out of SSH? Always `ufw allow 22/tcp` BEFORE enabling. On a remote box, keep an open session while you test.',
        verify: ['Status: active'],
      },
    ],
  },

  {
    id: 'mr-w2',
    role: 'red',
    week: 2,
    title: 'Threat-model the proposed controls',
    objective:
      'Check the controls being implemented against the attack paths found in Week 1, and say which ones actually close them.',
    frameworks: ['NIST_800_115', 'OWASP', 'SOC_2'],
    deliverables: [],
    estimatedTime: '90 min',
    prerequisites: ['Attack-surface findings from Week 1', 'Control Matrix with owners assigned (in progress)'],
    learn: ['Threat modelling against a control set', 'Control efficacy vs control existence', 'Compensating controls'],
    tools: ['Control Matrix', 'Week-1 scan output'],
    definitionOfDone: [
      'Every Week-1 finding mapped to the control that is meant to close it',
      'Any finding with no control covering it raised to GRC before the gate',
    ],
    handoff: [
      {
        to: 'grc',
        artifact: 'Control coverage assessment',
        note: 'GRC records the uncovered findings in the matrix as gaps or accepted risks, with a reason.',
      },
      {
        to: 'blue',
        artifact: 'Which controls to prioritise',
        note: 'Blue implements the controls that close a real finding first.',
      },
    ],
    steps: [
      {
        id: 'mr-w2-s1',
        title: 'Map each finding to the control that closes it',
        description: 'Walk the Week-1 findings against the control matrix.',
        instruction: 'Walk your Week-1 findings against the control matrix.',
        instructionList: [
          'For each finding, name the control in the matrix meant to close it.',
          'Say how you would retest that finding once the control is in.',
          'Where no control closes a finding, write it down and tell GRC.',
        ],
        whatItMeans:
          'An auditor asks whether a control addresses the risk it claims to. Checking that while the controls are still being built beats finding out in Week 4 that one closes nothing.',
        frameworks: ['SOC_2', 'ISO_27001'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mr-w2-s2',
        title: 'Export the threat model rows and hash them',
        description: 'The finding-to-control map, fingerprinted.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'sha256sum 09_Gap_Assessment.md | tee -a Evidence_Hashes.txt', explain: 'Fingerprints the gap assessment that now carries the control mapping, so the Week 4 retest compares against this version.', sample: '8e3b…52ad  09_Gap_Assessment.md' },
        ],
        expectedOutput: '8e3b6f1a9c4d7e2b5f8a3c6d9e1b4f7a2c5d8e3b6f1a9c4d7e2b5f8a3c6d9e1b  09_Gap_Assessment.md',
        outputKind: 'console',
        verify: ['09_Gap_Assessment.md'],
        whatItMeans: 'The retest is judged against the findings as they stood here. The hash fixes what “here” means.',
        frameworks: ['SOC_2'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mr-w2-s3',
        title: 'Check every finding names a control',
        description: 'No finding without the control that closes it.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'grep -c "^| F-" 09_Gap_Assessment.md && grep -c "CC[0-9]\\|A\\.[0-9]" 09_Gap_Assessment.md && echo "MAPPED findings"', explain: 'Counts findings, then counts control references. The second number must be at least the first.', sample: '4\n5\nMAPPED findings' },
        ],
        expectedOutput: '4\n5\nMAPPED findings',
        outputKind: 'console',
        verify: ['MAPPED findings'],
        whatItMeans: 'A finding mapped to no control is risk nobody has decided to own. The two counts make that visible in one line.',
        frameworks: ['SOC_2'],
      },
    ],
  },

  // ── Week 3 — P3 Validation & Testing ───────────────────────────────────────
  {
    id: 'mr-w3',
    role: 'red',
    week: 3,
    title: 'Penetration test & retest',
    objective: 'Test the implemented controls, then retest every fix to prove closure.',
    frameworks: ['NIST_800_115', 'OWASP'],
    deliverables: ['04_Retest_and_Validation.md'],
    estimatedTime: '3 hours',
    prerequisites: ['Controls implemented (Gate 2)'],
    learn: ['PTES / OWASP WSTG', 'Remediation validation', 'Operating-effectiveness evidence'],
    tools: ['Burp', 'sqlmap', 'Retest & Validation form'],
    definitionOfDone: ['Findings tested', 'Every high/critical retested and recorded Closed/Open/Risk-accepted'],
    handoff: [{ to: 'blue', artifact: 'Attack telemetry', note: 'Blue uses the attack timeline to validate detections.' }],
    steps: [
      {
        id: 'mr-w3-s1',
        title: 'Test and record findings',
        description: 'Run the authorized test against the in-scope app.',
        instruction: 'Perform the authorized test; for each finding, record severity, remediation, and (after the fix) the retest result in the form.',
        usesForm: 'Retest & Remediation-Validation Report',
        whatItMeans: 'A finding that is fixed and retested Closed is the strongest operating-effectiveness evidence for CC4.1 / A.8.8 — “we test, and the fixes hold”.',
        frameworks: ['NIST_800_115'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mr-w3-s2',
        title: 'Re-run the scan against the hardened host',
        description: 'The retest scan, same flags, saved to a file.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'nmap -sV -p- --open <target_ip> -oN retest-scan.txt && grep -c "open" retest-scan.txt', explain: 'The same scan as Week 1, saved. The count of open ports is the before/after number the retest report leads with.', sample: 'Nmap scan report for <target_ip>\n22/tcp  open  ssh     OpenSSH 9.6p1\n443/tcp open  ssl/http nginx 1.24.0\nNmap done: 1 IP address (1 host up)\n2' },
        ],
        expectedOutput: 'Nmap scan report for <target_ip>\n22/tcp  open  ssh     OpenSSH 9.6p1\n443/tcp open  ssl/http nginx 1.24.0\nNmap done: 1 IP address (1 host up)\n2',
        outputKind: 'console',
        verify: ['Nmap done'],
        whatItMeans: 'A retest that re-runs the original scan is the only honest comparison. Fewer open ports is the finding closing in front of you.',
        frameworks: ['SOC_2'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mr-w3-s3',
        title: 'Hash the retest evidence',
        description: 'The scan and the proof files, fingerprinted.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'sha256sum retest-scan.txt 04_Retest_and_Validation.md | tee -a Evidence_Hashes.txt', explain: 'Fingerprints the retest scan and the report, so the attestation in Week 4 cites files that cannot change.', sample: '1b9e…7c3f  retest-scan.txt\n6d2a…e85b  04_Retest_and_Validation.md' },
        ],
        expectedOutput: '1b9e7c3f5a2d8e4b6f1c9a3e7d5b2f8a4c6e1d9b3f7a5c2e8d4b6f1a9c3e7d5b  retest-scan.txt\n6d2ae85b3f9c1a7e4d2b8f6c5a3e9d1b7f4c2a8e6d5b3f9c1a7e4d2b8f6c5a3e  04_Retest_and_Validation.md',
        outputKind: 'console',
        verify: ['retest-scan.txt'],
        whatItMeans: 'The tester’s attestation is worth what its evidence is worth. Hashed scan output is evidence; a screenshot is a claim.',
        frameworks: ['SOC_2'],
      },
    ],
  },
  {
    id: 'mb-w3',
    role: 'blue',
    week: 3,
    title: 'Detection engineering',
    objective: 'Write detections mapped to ATT&CK and validate them against the Red team’s activity.',
    frameworks: ['NIST_CSF', 'SOC_2'],
    deliverables: ['05_Detection_Rules.csv'],
    estimatedTime: '2 hours',
    prerequisites: ['Red is running the test (attack telemetry available)'],
    learn: ['Sigma rules', 'MITRE ATT&CK mapping', 'Detection validation'],
    tools: ['Sigma', 'grep', 'SIEM', 'Detection Rules form'],
    definitionOfDone: ['≥2 detections mapped to ATT&CK', '≥1 validated as Fired against Red’s test'],
    handoff: [{ to: 'grc', artifact: 'Validated detections', note: 'GRC references validated detections as CC7 evidence.' }],
    steps: [
      {
        id: 'mb-w3-s1',
        title: 'Write and validate detections',
        description: 'Author detections for the attacks Red is running.',
        instruction: 'For each attack technique, add a detection to the Detection Rules form — log source, ATT&CK id, logic — then mark whether it fired during Red’s test.',
        usesForm: 'Detection Rules',
        whatItMeans: 'Detections that provably catch a real attack satisfy SOC 2 CC7.2/7.3 monitoring — not “we have a SIEM” but “our monitoring works”.',
        frameworks: ['NIST_CSF', 'SOC_2'],
      },
      {
        id: 'mb-w3-s2',
        title: 'Spot the attack in the logs',
        description: 'Confirm the attack is visible in your log source.',
        command: "grep -Ei 'union.*select|or 1=1' /var/log/apache2/access.log",
        expectedOutput: `10.10.100.40 - - [05/Aug/2026:14:22:10 +0000] "GET /login?u=1' OR 1=1-- HTTP/1.1" 200 512
10.10.100.40 - - [05/Aug/2026:14:22:14 +0000] "GET /search?q=1 UNION SELECT null,version()-- HTTP/1.1" 200 743`,
        outputHighlights: [
          { text: 'OR 1=1', label: 'a classic injection probe in a URL. Real users never send this — a match is what proves your detection has genuine attack data to fire on, not a hypothetical.' },
          { text: '10.10.100.40', label: 'the attacker’s IP during the test window. Record it and the timestamp — these become the metrics that show the detection actually caught Red’s activity.' },
          { text: 'UNION SELECT null,version()', label: 'a second, different technique. Two distinct payloads landing lets you map more than one ATT&CK id to real evidence.' },
        ],
        whatItMeans: 'Seeing the attack in the logs is the difference between a theoretical rule and a validated detection.',
        frameworks: ['NIST_CSF'],
        troubleshooting: 'No matches → check the correct log path (`/var/log/nginx/access.log`) and that the test actually hit this host.',
        verify: ['union'],
      },
    ],
  },
  {
    id: 'mg-w3',
    role: 'grc',
    week: 3,
    title: 'Coordinate validation & collect evidence',
    objective: 'Track remediation to closure and start collecting the evidence each control needs.',
    prerequisites: ['Retest results from Red (what closed, what remains)', 'Control Matrix with an owner and evidence named per control (Gate 2)'],
    frameworks: ['SOC_2', 'ISO_27001'],
    deliverables: [],
    estimatedTime: '90 min',
    learn: ['Remediation tracking', 'Evidence collection discipline'],
    tools: ['Control Matrix', 'ticketing'],
    definitionOfDone: ['Findings tracked to closure', 'Evidence gathered for each implemented control'],
    steps: [
      {
        id: 'mg-w3-s1',
        title: 'Track remediation and gather evidence',
        description: 'Update control status and collect the sampled artifacts.',
        instruction: 'For each control in the matrix, move status toward Operating and collect the concrete evidence artifact (config, log, ticket, report).',
        whatItMeans: 'Auditors sample evidence, not intentions — collecting it as you go turns Week 4 from a scramble into an assembly job.',
        frameworks: ['SOC_2', 'ISO_27001'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mg-w3-s2',
        title: 'Hash the evidence collected this week',
        description: 'Every file in the packet folder, fingerprinted.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'sha256sum evidence/* | tee Evidence_Hashes.txt', explain: 'One hash per collected file. The packet cites these lines, so collect first, hash second, never edit after.', sample: 'a91f…3c0b  evidence/firewall-ruleset.txt\n5e2d…8b74  evidence/detection-rule-pack.yml' },
        ],
        expectedOutput: 'a91f2c7e4b1d6f3a8c5e9b2d7f4a1c6e3b8d5f2a9c4e7b1d6f3a8c5e2b9d4f7a  evidence/firewall-ruleset.txt\n5e2d8b741c3f6a9e2b5d8c1f4a7e3b6d9c2f5a8e1b4d7c3f6a9e2b5d8c1f4a7e  evidence/detection-rule-pack.yml',
        outputKind: 'console',
        verify: ['evidence/'],
        whatItMeans: 'Chain of custody for an audit is a list of hashes with dates. This file is that list.',
        frameworks: ['ISO_27001'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mg-w3-s3',
        title: 'Verify the hashes still match',
        description: 'The check an auditor runs on day one.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'sha256sum -c Evidence_Hashes.txt', explain: 'Re-hashes every file and compares. OK on every line, or the evidence has changed since collection.', sample: 'evidence/firewall-ruleset.txt: OK\nevidence/detection-rule-pack.yml: OK' },
        ],
        expectedOutput: 'evidence/firewall-ruleset.txt: OK\nevidence/detection-rule-pack.yml: OK',
        outputKind: 'console',
        verify: ['OK'],
        whatItMeans: 'Collecting evidence is half the job; proving it is unchanged is the other half. This line is the proof.',
        frameworks: ['ISO_27001'],
      },
    ],
  },

  // ── Week 4 — P4 Audit Readiness ────────────────────────────────────────────
  {
    id: 'mr-w4',
    role: 'red',
    week: 4,
    title: 'Close out the retest and attest',
    objective:
      'Finish the Retest & Validation report — every finding resolved one way or another — and attest to the result for the evidence packet.',
    frameworks: ['NIST_800_115', 'SOC_2'],
    deliverables: ['04_Retest_and_Validation.md'],
    estimatedTime: '90 min',
    prerequisites: ['Week-3 findings recorded with remediations', 'Fixes deployed by Blue'],
    learn: ['Remediation validation to closure', 'Risk acceptance with a named owner', 'Tester attestation'],
    tools: ['Retest & Validation form'],
    definitionOfDone: [
      'Every finding reads Closed, Open or Risk accepted — none left blank',
      'The methodology section states how each retest was performed',
      'Anything still Open or Risk accepted names who accepted it and why',
    ],
    handoff: [
      {
        to: 'grc',
        artifact: 'Signed-off retest report',
        note: 'GRC files it in the evidence packet as the operating-effectiveness evidence for CC4.1 / A.8.8.',
      },
    ],
    steps: [
      {
        id: 'mr-w4-s1',
        title: 'Resolve every finding and attest',
        description: 'Retest what is still open, then attest to the result.',
        instruction: 'Take the report from “tested” to “closed out”.',
        instructionList: [
          'Retest anything still open from Week 3 and set its result.',
          'For each Open or Risk-accepted finding, record who accepted it and why.',
          'Fill the methodology section: how the retests were done, not just that they were.',
        ],
        usesForm: 'Retest & Remediation-Validation Report',
        whatItMeans:
          'The auditor’s question is not “did you test?” but “what happened to what you found?”. A blank retest column is an open finding by default, and a risk accepted without a named owner is an omission, not an acceptance.',
        frameworks: ['NIST_800_115', 'SOC_2'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mr-w4-s2',
        title: 'Verify the retest evidence hashes',
        description: 'Every line OK before the attestation is signed.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'sha256sum -c Evidence_Hashes.txt', explain: 'Re-hashes every file the report cites and compares. The attestation is signed only when every line reads OK.', sample: 'retest-scan.txt: OK\n04_Retest_and_Validation.md: OK\n09_Gap_Assessment.md: OK' },
        ],
        expectedOutput: 'retest-scan.txt: OK\n04_Retest_and_Validation.md: OK\n09_Gap_Assessment.md: OK',
        outputKind: 'console',
        verify: ['OK'],
        whatItMeans: 'Signing an attestation over evidence you have not re-verified is how testers lose their names. One command removes the risk.',
        frameworks: ['SOC_2'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mr-w4-s3',
        title: 'Record the accepted risks',
        description: 'The findings the client chose not to fix, counted and dated.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'grep -ci "accepted" 04_Retest_and_Validation.md && echo "ACCEPTED risks" && date -u +%F', explain: 'Counts the accepted-risk rows and stamps today. Both go into the attestation as written.', sample: '1\nACCEPTED risks\n2026-10-28' },
        ],
        expectedOutput: '1\nACCEPTED risks\n2026-10-28',
        outputKind: 'console',
        verify: ['ACCEPTED risks'],
        whatItMeans: 'A risk the client accepts is still a risk; the retest records who accepted it and when, so nobody later calls it an oversight.',
        frameworks: ['SOC_2'],
      },
    ],
  },
  {
    id: 'mb-w4',
    role: 'blue',
    week: 4,
    title: 'Report detection & response metrics',
    objective: 'Compute the MTTD/MTTR and coverage numbers a Type II auditor samples for CC7.',
    prerequisites: ['Detections deployed and validated against Red’s activity (Week 3)', 'Alert/incident timestamps available to compute MTTD/MTTR'],
    frameworks: ['SOC_2'],
    deliverables: ['06_Detection_and_Response_Metrics.md'],
    estimatedTime: '60 min',
    learn: ['MTTD/MTTR', 'ATT&CK coverage', 'Operating-effectiveness metrics'],
    tools: ['SIEM dashboards', 'Detection & Response Metrics form'],
    definitionOfDone: ['MTTD and MTTR recorded', 'Coverage + window set'],
    steps: [
      {
        id: 'mb-w4-s1',
        title: 'Report the response metrics',
        description: 'Summarize detection/response performance over the window.',
        instruction: 'Fill the Detection & Response Metrics form from your SIEM/IR tickets: incidents, MTTD, MTTR, coverage, false-positive rate.',
        usesForm: 'Detection & Response Metrics',
        whatItMeans: 'Numbers over an observation window are what turns a Type I “designed” control into Type II “operating effectively”.',
        frameworks: ['SOC_2'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mb-w4-s2',
        title: 'Count the detections and the responses in the log',
        description: 'Fired, triaged, closed: three numbers from the SIEM export.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'grep -c "alert" siem-export.json && grep -c "\\"status\\": \\"closed\\"" siem-export.json && echo "METRICS counted"', explain: 'Alerts raised, then alerts closed, from the exported month. The ratio is the detection-and-response metric the report leads with.', sample: '38\n35\nMETRICS counted' },
        ],
        expectedOutput: '38\n35\nMETRICS counted',
        outputKind: 'console',
        verify: ['METRICS counted'],
        whatItMeans: 'A metric typed from memory is an opinion; one counted from the export is a measurement. The report wants the second kind.',
        frameworks: ['SOC_2'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mb-w4-s3',
        title: 'Hash the metrics export',
        description: 'The month’s export, fingerprinted for the packet.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'sha256sum siem-export.json 06_Detection_and_Response_Metrics.md | tee -a Evidence_Hashes.txt', explain: 'Fingerprints the export and the report so CC7 evidence in the packet is the file the numbers came from.', sample: 'f2c7…9d1e  siem-export.json\n4a8b…c63f  06_Detection_and_Response_Metrics.md' },
        ],
        expectedOutput: 'f2c79d1e3b6a8c5e2d7f4a1b9c6e3d8f5a2c7e4b1d9f6a3c8e5b2d7f4a1c9e6d  siem-export.json\n4a8bc63f1e7d2a9c5b8e4f1d7a3c6e9b2f5d8a1c4e7b3f6d9a2c5e8b1f4d7a3c  06_Detection_and_Response_Metrics.md',
        outputKind: 'console',
        verify: ['siem-export.json'],
        whatItMeans: 'CC7.2 asks whether you monitor and respond. The hashed export is the answer an auditor can re-derive.',
        frameworks: ['SOC_2'],
      },
    ],
  },
  {
    id: 'mg-w4a',
    role: 'grc',
    week: 4,
    title: 'Run the internal audit',
    objective: 'Do the mandatory ISO 9.2 internal audit before the external auditor arrives.',
    frameworks: ['ISO_27001', 'SOC_2'],
    deliverables: ['07_Internal_Audit_Report.md'],
    estimatedTime: '2 hours',
    prerequisites: ['Control Matrix + evidence collected'],
    learn: ['ISO Clause 9.2 internal audit', 'Nonconformities & corrective action', 'Management review (9.3)'],
    tools: ['Internal Audit Report form'],
    definitionOfDone: ['Findings recorded with results', 'Every nonconformity has a corrective action'],
    handoff: [{ to: 'grc', artifact: 'Corrective actions', note: 'Fix nonconformities before assembling the packet.' }],
    steps: [
      {
        id: 'mg-w4a-s1',
        title: 'Audit your own controls',
        description: 'Independently review each control against its evidence.',
        instruction: 'Fill the Internal Audit Report form: for each control, record conformity / minor NC / major NC and a corrective action with an owner.',
        usesForm: 'Internal Audit Report',
        whatItMeans: 'Finding and fixing your own nonconformities first is the whole point of the internal audit — it is far cheaper than the external auditor finding them.',
        frameworks: ['ISO_27001'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mg-w4a-s2',
        title: 'Export the audit report and hash it',
        description: 'The report, fingerprinted at sign-off.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'sha256sum 07_Internal_Audit_Report.md | tee -a Evidence_Hashes.txt', explain: 'Fingerprints the signed audit report for the packet.', sample: 'c4d8…71fa  07_Internal_Audit_Report.md' },
        ],
        expectedOutput: 'c4d8e2b6f9a3c7e1d5b8f2a6c9e3d7b1f5a8c2e6d9b3f7a1c5e8d2b6f9a3c7e1  07_Internal_Audit_Report.md',
        outputKind: 'console',
        verify: ['07_Internal_Audit_Report.md'],
        whatItMeans: 'Clause 9.2 wants the audit result as a record. A hashed export is a record that cannot be quietly improved later.',
        frameworks: ['ISO_27001'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mg-w4a-s3',
        title: 'Count the nonconformities',
        description: 'Minor and major, from the export.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'grep -ci "nonconform\\|Minor NC\\|Major NC" 07_Internal_Audit_Report.md && echo "NONCONFORMITIES counted"', explain: 'Counts the findings the corrective-action plan has to carry. Each one needs an owner and a date.', sample: '2\nNONCONFORMITIES counted' },
        ],
        expectedOutput: '2\nNONCONFORMITIES counted',
        outputKind: 'console',
        verify: ['NONCONFORMITIES counted'],
        whatItMeans: 'Clause 10.2 turns each nonconformity into a corrective action. Counting them is how you know the plan is complete.',
        frameworks: ['ISO_27001'],
      },
    ],
  },
  {
    id: 'mg-w4b',
    role: 'grc',
    week: 4,
    title: 'Assemble the audit evidence packet',
    objective: 'Index every control to its evidence artifact so the external auditor can sample it.',
    frameworks: ['SOC_2', 'ISO_27001'],
    deliverables: ['08_Audit_Evidence_Packet.csv'],
    estimatedTime: '2 hours',
    prerequisites: ['Internal audit complete', 'All role deliverables in'],
    learn: ['SOC 2 Type I/II evidence', 'ISO Stage 1/2', 'Building a defensible audit trail'],
    tools: ['Audit Evidence Packet form', 'Team package export'],
    definitionOfDone: ['≥3 evidence items tied to controls', 'Every item has an owner + location', 'Team package exported'],
    steps: [
      {
        id: 'mg-w4b-s1',
        title: 'Index the evidence to controls',
        description: 'Build the auditor’s index of evidence.',
        instruction: 'Fill the Audit Evidence Packet form: one row per evidence artifact, tied to its SOC 2 CC / ISO Annex A control, with owner, type, location and period.',
        usesForm: 'Audit Evidence Packet',
        whatItMeans: 'A control mapped to concrete evidence is a control an auditor can pass. This packet is the deliverable that gets the client through Type I / Stage 1.',
        frameworks: ['SOC_2', 'ISO_27001'],
      },
      {
        id: 'mg-w4b-s2',
        title: 'Export the engagement package',
        description: 'Produce the final submission bundle.',
        instruction: 'On the Deliverables page, click Download team package to produce the zip of all eight engagement deliverables.',
        whatItMeans: 'One clean package — agreement, SoA, control matrix, validation, detections, metrics, internal audit, evidence — is what you hand the auditor.',
        frameworks: ['SOC_2', 'ISO_27001'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mg-w4b-s3',
        title: 'Hash the finished packet',
        description: 'The index and every file it names.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'sha256sum 08_Audit_Evidence_Packet.csv evidence/* | tee Packet_Hashes.txt', explain: 'The packet index and every cited file, fingerprinted together. This is the list the auditor receives.', sample: 'd7a1…4e9c  08_Audit_Evidence_Packet.csv\na91f…3c0b  evidence/firewall-ruleset.txt' },
        ],
        expectedOutput: 'd7a1c5e9b3f7a2d6c8e4b1f5a9d3c7e2b6f8a4d1c5e9b3f7a2d6c8e4b1f5a9d3  08_Audit_Evidence_Packet.csv\na91f2c7e4b1d6f3a8c5e9b2d7f4a1c6e3b8d5f2a9c4e7b1d6f3a8c5e2b9d4f7a  evidence/firewall-ruleset.txt',
        outputKind: 'console',
        verify: ['08_Audit_Evidence_Packet.csv'],
        whatItMeans: 'The packet is only as good as the proof that nothing in it moved. One hash list, handed over with it.',
        frameworks: ['SOC_2'],
      },
      // R138: the proof step — the record hashed or counted from the terminal, pasted and checked.
      {
        id: 'mg-w4b-s4',
        title: 'Confirm every index row points at a real file',
        description: 'No citation to a file that does not exist.',
        instruction: 'Run it in the team evidence folder and paste the output.',
        commands: [
          { cmd: 'awk -F, \'NR>1 {print $3}\' 08_Audit_Evidence_Packet.csv | while read f; do [ -f "$f" ] && echo "FOUND $f" || echo "MISSING $f"; done', explain: 'Walks the packet’s file column and says FOUND or MISSING per row. A MISSING line is a citation the auditor cannot follow.', sample: 'FOUND evidence/firewall-ruleset.txt\nFOUND evidence/detection-rule-pack.yml' },
        ],
        expectedOutput: 'FOUND evidence/firewall-ruleset.txt\nFOUND evidence/detection-rule-pack.yml',
        outputKind: 'console',
        verify: ['FOUND'],
        whatItMeans: 'An evidence packet with a broken reference fails the audit on a technicality. The loop finds it before the auditor does.',
        frameworks: ['SOC_2'],
      },
    ],
  },
];

// R142: the evidence-packet task closes by writing the Portfolio.
export const MSSP: Course = withPortfolioStep({
  id: 'mssp',
  title: 'MSSP: SOC 2 + ISO 27001 Engagement',
  slug: 'mssp',
  vendor: 'Engagement',
  certification: 'SOC 2 + ISO 27001',
  level: 'professional',
  audience: 'Run a real client engagement — SOC 2 + ISO 27001 compliance as an MSSP analyst.',
  description:
    'A full client engagement: scope the work, assess the gaps, implement and test controls, then assemble the audit evidence package. Three roles, mapped to SOC 2 and ISO/IEC 27001.',
  roles,
  weeks,
  gates,
  tasks,
  framing: 'engagement',
  isSeed: true,
  version: 1,
  // R84 (the instructor's no-unnecessary-locks rule): the course is complete —
  // 5 weeks, 16 tasks, 8 deliverables, 4 gates — so the old "hidden for now"
  // lock is gone. `locked: true` remains available for genuinely unfinished
  // courses.
  locked: false,
  topologyPicture: 'arch',
  teamCount: 16,
  teamCapacity: 6,
});

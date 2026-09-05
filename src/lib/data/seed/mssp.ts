import { Course, Gate, RoleDef, Task, WeekDef } from '../../types';

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
    name: 'Offensive Security (Red)',
    mission: 'Penetration testing and control validation for the client.',
    color: '#dc2626',
    icon: 'Target',
    label: '🎯 Offensive Security',
  },
  {
    id: 'blue',
    name: 'Managed Detection & Response (Blue)',
    mission: 'Hardening, detection engineering, and incident response.',
    color: '#2563eb',
    icon: 'Shield',
    label: '🛡️ Managed Detection & Response',
  },
  {
    id: 'grc',
    name: 'GRC / vCISO',
    mission: 'Scope, risk, controls, and audit evidence — the compliance spine.',
    color: '#16a34a',
    icon: 'ClipboardList',
    label: '📋 GRC / vCISO',
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
    setup: true, stage: 0, phase: 'Scope & Agree', difficulty: 1, flow: ['Sign the engagement', 'Define the scope'],
    milestone: 'The engagement letter is signed and the system / ISMS boundary is written down and agreed.' },
  { number: 1, title: 'Gap Assessment', theme: 'Know the gaps', objective: 'Assess current state vs SOC 2 + ISO 27001 and pick the controls.', runs: 'Phase P1',
    stage: 1, phase: 'Survey & Assess', difficulty: 2, flow: ['Assess current state', 'List the gaps', 'Select controls'],
    milestone: 'Every SOC 2 and ISO 27001 requirement is marked met or gap, and the SoA names the selected controls.' },
  { number: 2, title: 'Control Implementation', theme: 'Build the controls', objective: 'Stand up the missing controls and write the control matrix.', runs: 'Phase P2',
    stage: 2, phase: 'Build & Establish', difficulty: 3, flow: ['Implement controls', 'Map to requirements', 'Assign owners'],
    milestone: 'Each gap has a control in place, and the matrix says which requirement it satisfies and who owns it.' },
  { number: 3, title: 'Validation & Testing', theme: 'Prove it works', objective: 'Pentest, detect, and evidence that the controls operate.', runs: 'Phase P3',
    stage: 3, phase: 'Test & Prove', difficulty: 3, flow: ['Pentest', 'Detect', 'Evidence the controls'],
    milestone: 'Testing is complete and every control has evidence that it actually operates, not just that it exists.' },
  { number: 4, title: 'Audit Readiness', theme: 'Get audit-ready', objective: 'Internal audit and assemble the evidence package (Type I / Stage 1).', runs: 'Phase P4',
    stage: 4, phase: 'Audit & Package', difficulty: 2, flow: ['Assemble evidence', 'Readiness review', 'Report'],
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
    handoffs: [
      { from: 'grc', to: 'blue', artifact: 'Statement of Applicability', label: 'GRC → Blue: which controls to implement' },
      { from: 'grc', to: 'red', artifact: 'Engagement scope', label: 'GRC → Red: what may be tested' },
    ],
  },
  {
    id: 2,
    week: 2,
    title: 'Controls implemented',
    description: 'Every applicable control is implemented and mapped in the Control Matrix with an owner and its evidence source.',
    requiredArtifactTypes: ['03_Control_Matrix.csv'],
    requiredTasks: ['mg-w2', 'mb-w2', 'mr-w2'],
    handoffs: [
      { from: 'blue', to: 'grc', artifact: 'Implemented controls', label: 'Blue → GRC: controls + evidence' },
    ],
  },
  {
    id: 3,
    week: 3,
    title: 'Validation complete',
    description:
      'The controls have been tested rather than merely built: findings recorded with remediations, detections written and shown to fire against the test, and evidence collection under way.',
    requiredArtifactTypes: ['04_Retest_and_Validation.md', '05_Detection_Rules.csv'],
    requiredTasks: ['mr-w3', 'mb-w3', 'mg-w3'],
    handoffs: [
      { from: 'red', to: 'blue', artifact: 'Attack telemetry', label: 'Red → Blue: what to detect' },
      { from: 'red', to: 'grc', artifact: 'Retest results', label: 'Red → GRC: what closed' },
    ],
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
    ],
  },
  {
    id: 'mr-w1',
    role: 'red',
    week: 1,
    title: 'External attack-surface assessment',
    objective: 'Map the in-scope external attack surface to feed the gap analysis.',
    frameworks: ['NIST_800_115', 'OWASP'],
    deliverables: [],
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
    ],
  },
];

export const MSSP: Course = {
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
  // Hidden from students for now — shows as a locked card (like CySA+); flip to
  // false to re-enable. The course data stays intact.
  locked: true,
  teamCount: 16,
  teamCapacity: 6,
};

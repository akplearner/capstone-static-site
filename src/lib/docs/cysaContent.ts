/**
 * The CySA+ course's reference content, as DATA.
 *
 * Five diagrams, the tool manual and the lab specification were `const` tables
 * inside seven React components — around 1,400 words of instructional prose and
 * 40 structured rows that `content/courses/cysa-plus.json` knew nothing about.
 * The document described the forms, the tasks and the SOC addressing in full and
 * could not tell you what the course teaches about reading an alert.
 *
 * Everything here is plain data. Colours, layout and motion stay in the
 * components: a row says WHICH KIND of thing it is (`attacker` or `response`,
 * `false-positive` or `escalate`) and the component decides what colour that is,
 * so a business instance can rewrite the words without inheriting a palette.
 *
 * Addresses are read from `labTopology.ts`, never typed. Three of them used to be
 * typed here — `10.10.100.N`, `10.10.20.N`, `10.10.30.N` in the lab table — which
 * is the same drift the Server+ topology module was created to stop.
 *
 * NOT here, deliberately: `WazuhWalkthrough`'s eight screens. Those are drawings
 * of a tool's UI — mock chrome, fake table rows, marker anchors — and the
 * instructional captions that go on them already live in the course seed as
 * `Step.walkthrough.markers`. Moving the drawing into a data file would move
 * pixels, not content.
 */
import { SOC_IP, SOC_LOGIN_LABEL, SOC_URL, socTopology } from '../labTopology';

const SOC = socTopology('cysa-plus')!;

/** The team number every worked example in this course uses. Team 7's pod is
 *  what the seeds, the searches and the screenshots all show. */
export const EXAMPLE_TEAM = 7;

/** A pod address for the worked example: `10.10.30.N` with the team filled in. */
export const podAddress = (rule: string, team: number = EXAMPLE_TEAM): string =>
  rule.replace(/\.N$/, `.${team}`);

/** The attacker box in the worked examples, by address. */
export const EXAMPLE_ATTACKER = podAddress(SOC.attacker.ip);

/* ── The attack, end to end (Weeks 2-4) ──────────────────────────────────── */

export interface AttackHop {
  stage: string;
  what: string;
  /** ATT&CK technique id, where the hop maps to one. */
  attck?: string;
  week: number;
  /** The evidence this hop leaves behind — what a student searches for. */
  sees: string;
  /** Whose move it is. The component colours the box from this; it used to
   *  infer it from the row's index, which quietly assumed an order. */
  side: 'attacker' | 'response';
}

export const ATTACK_PATH: { copy: FrameCopy; hops: AttackHop[] } = {
  copy: {
    title: 'The attack, end to end',
    subtitle: 'The same chain you generate, detect, prove and stop across Weeks 2-4',
    howToRead:
      'Read left to right: the first three hops are what the attacker does (you run them yourself against your own pod), the last three are what you do about it. The bottom line of each box is the evidence that hop leaves behind — that is what you search for.',
    legend: [
      { kind: 'attacker', label: 'Attacker action' },
      { kind: 'response', label: 'Your response' },
    ],
  },
  hops: [
    { stage: 'Recon', what: 'nmap scans your pod from Kali', attck: 'T1046', week: 2, sees: 'Suricata: ET SCAN signatures', side: 'attacker' },
    { stage: 'Exploit', what: 'SQL injection against DVWA', attck: 'T1190', week: 2, sees: 'Apache access.log + web rules', side: 'attacker' },
    { stage: 'Brute force', what: 'hydra guesses the SSH password', attck: 'T1110', week: 2, sees: 'repeated authentication_failed', side: 'attacker' },
    { stage: 'Detect', what: 'the SOC raises the first alert', week: 4, sees: 'your incident start time', side: 'response' },
    { stage: 'Investigate', what: 'pivot on the source address', week: 4, sees: 'everything that IP touched', side: 'response' },
    { stage: 'Contain', what: 'block the attacker at the firewall', week: 4, sees: 'ufw DENY, rule position 1', side: 'response' },
  ],
};

/* ── An incident on a time axis (Week 4) ─────────────────────────────────── */

export interface TimelineEvent {
  t: string;
  /** Minutes from the start of the attack — what MTTD and MTTR subtract. */
  min: number;
  label: string;
  source: string;
  kind: 'attack' | 'detect' | 'respond';
}

export const INCIDENT_TIMELINE: {
  copy: FrameCopy;
  /** Minutes drawn on the axis. */
  span: number;
  events: TimelineEvent[];
} = {
  copy: {
    title: 'An incident on a time axis',
    subtitle:
      'The worked example from the Incident Response Report — and where MTTD and MTTR come from',
    howToRead:
      'Every row is one line of your timeline table: a time, what happened, and the source that proves it. MTTD is the gap from the attack starting to the first alert; MTTR is from that alert to containment. Both are subtractions you can read straight off this line.',
    legend: [
      { kind: 'attack', label: 'Attacker action' },
      { kind: 'detect', label: 'Detection' },
      { kind: 'respond', label: 'Response' },
    ],
  },
  span: 24,
  events: [
    { t: '14:20', min: 0, label: 'Port scan begins', source: 'Suricata', kind: 'attack' },
    { t: '14:22', min: 2, label: 'SQL injection against DVWA', source: 'Apache access.log', kind: 'attack' },
    { t: '14:29', min: 9, label: 'First alert raised', source: 'Wazuh Security events', kind: 'detect' },
    { t: '14:31', min: 11, label: 'Web shell uploaded', source: 'Integrity monitoring', kind: 'attack' },
    { t: '14:41', min: 21, label: 'Attacker blocked at the firewall', source: 'ufw', kind: 'respond' },
  ],
};

/* ── How a log reaches the dashboard (Weeks 0-2) ─────────────────────────── */

export interface PipelineStage {
  n: number;
  label: string;
  sub: string;
  /** The one thing that proves this hop is working. */
  proof: string;
  where: 'machine' | 'transit' | 'soc';
}

export const LOG_PIPELINE: { copy: FrameCopy; stages: PipelineStage[] } = {
  copy: {
    title: 'How a log reaches the dashboard',
    subtitle:
      'Seven hops. When the table is empty, one of them broke — this is the order to check them in.',
    howToRead:
      'Follow it left to right. Each box names what proves that hop is working. Start at the far right (is it just the time picker?) and walk backwards until you find the first hop that cannot prove itself — that is where the break is.',
    legend: [
      { kind: 'machine', label: 'On your machine' },
      { kind: 'transit', label: 'In transit' },
      { kind: 'soc', label: 'On the SOC' },
    ],
  },
  stages: [
    { n: 1, label: 'Your machine', sub: 'Ubuntu or Windows', proof: 'the activity happened at all', where: 'machine' },
    { n: 2, label: 'Sensor', sub: 'Suricata · Sysmon · system logs', proof: 'eve.json is growing', where: 'machine' },
    { n: 3, label: 'Wazuh agent', sub: 'reads the files it is told to', proof: 'systemctl status = active', where: 'transit' },
    { n: 4, label: 'Ports 1514 / 1515', sub: 'data · enrolment', proof: '"Connected to the server"', where: 'transit' },
    { n: 5, label: 'Wazuh manager', sub: SOC_IP, proof: 'agent shows Active', where: 'soc' },
    { n: 6, label: 'Rule fires', sub: 'gives it a rule.level', proof: 'the event has a level', where: 'soc' },
    { n: 7, label: 'Dashboard row', sub: 'Security events', proof: 'you can see it — check the time picker', where: 'soc' },
  ],
};

/* ── Deciding an alert (Week 2) ──────────────────────────────────────────── */

export interface TriageBranch {
  /** The test, as a student would read it off the alert in front of them. */
  q: string;
  verdict: string;
  /** What actually gets marked: the reason, not the label. */
  write: string;
  kind: 'false-positive' | 'true-positive' | 'escalate';
}

export const TRIAGE: { copy: FrameCopy; question: string; branches: TriageBranch[] } = {
  copy: {
    title: 'Deciding an alert: real, noise, or escalate',
    subtitle: 'Every verdict is a comparison against the baseline you wrote in Week 1',
    howToRead:
      'Start with the alert in front of you and read the three tests top to bottom — the first one that fits is your verdict. The right-hand column is what actually gets marked: the reason, not the label.',
    legend: [
      { kind: 'false-positive', label: 'False positive' },
      { kind: 'true-positive', label: 'True positive' },
      { kind: 'escalate', label: 'Escalate' },
    ],
  },
  question: 'One alert · compare it against your Week-1 baseline',
  branches: [
    {
      q: 'It matches something in your baseline, at about the usual rate',
      verdict: 'False positive',
      write: 'Name the baseline row it matches. "Expected — matches sshd auth success, ~20/hr."',
      kind: 'false-positive',
    },
    {
      q: 'It is a type you never baselined, or a burst well above the usual rate',
      verdict: 'True positive',
      write: `Give the count and the source. "412 auth failures from ${EXAMPLE_ATTACKER} in 2 min."`,
      kind: 'true-positive',
    },
    {
      q: 'It looks real but you cannot prove what it did from the alert alone',
      verdict: 'Escalate',
      write:
        'Say what you want checked. "SQLi attempt — needs the packet capture to confirm it succeeded."',
      kind: 'escalate',
    },
  ],
};

/* ── Ranking a finding (Week 3) ──────────────────────────────────────────── */

export const RISK_LEVELS = ['Low', 'Medium', 'High'] as const;
export type RiskAxis = (typeof RISK_LEVELS)[number];
export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export const RISK_MATRIX: {
  copy: Omit<FrameCopy, 'legend'> & { legend?: never };
  /** Row = impact, column = likelihood. Mirrors `grc/templates.riskLevel`, which
   *  the forms compute their rating with; a guard asserts the two agree. */
  cell: Record<RiskAxis, Record<RiskAxis, Severity>>;
  likelihoodMeans: Record<RiskAxis, string>;
  impactMeans: Record<RiskAxis, string>;
  axisLabel: string;
} = {
  copy: {
    title: 'Ranking a finding: likelihood × impact',
    subtitle: 'Rate each axis, read the cell — that is the priority you write in the assessment',
    howToRead:
      'Pick the likelihood column using how reachable the flaw is, then the impact row using what an attacker would get. Where they meet is the rating. Two findings with the same CVSS can land in different cells, and the cell is what decides fix order.',
  },
  cell: {
    High: { Low: 'Medium', Medium: 'High', High: 'Critical' },
    Medium: { Low: 'Low', Medium: 'Medium', High: 'High' },
    Low: { Low: 'Low', Medium: 'Low', High: 'Medium' },
  },
  likelihoodMeans: {
    High: 'reachable from the network with no login',
    Medium: 'needs a local account or a user to click something',
    Low: 'needs physical access or an unlikely chain',
  },
  impactMeans: {
    High: 'full data loss, or the attacker gets admin',
    Medium: 'one service down, or limited data exposed',
    Low: 'cosmetic, or no real data at risk',
  },
  axisLabel: 'Likelihood →',
};

/* ── The tool manual (Weeks 2-4) ─────────────────────────────────────────── */

export interface DocRef {
  label: string;
  href: string;
}

/** behaviour → the search that finds it → what tells you it is really that. */
export interface Signature {
  behaviour: string;
  query: string;
  tell: string;
}

export const SIGNATURES: Signature[] = [
  { behaviour: 'Port scan', query: 'rule.groups:(ids or suricata) and data.event_type:alert', tell: 'One data.src_ip hitting many data.dest_port in seconds (Suricata uses underscore fields).' },
  { behaviour: 'SSH brute force', query: 'rule.groups:authentication_failed', tell: 'Repeated failed logins from one IP, then maybe a success.' },
  { behaviour: 'Web attack (SQLi/XSS)', query: 'data.alert.signature:SQL*', tell: 'Suricata signature name flags the injection (no leading *). rule.groups:web if Apache logs are ingested.' },
  { behaviour: 'One machine only', query: 'agent.name:Team<#>-ubuntu', tell: 'Separate Ubuntu vs Windows when both are noisy.' },
  { behaviour: 'Windows process activity', query: 'data.win.system.channel:"Microsoft-Windows-Sysmon/Operational"', tell: 'Sysmon process (ID 1), network (3) and file (11) events.' },
];

export const FILTER_FIELDS =
  'rule.level · rule.groups · rule.description · data.src_ip · data.dest_port · data.alert.signature · data.url · agent.name';

/** action → the click path → the documentation that covers it. */
export interface HowTo {
  action: string;
  how: string;
  ref?: DocRef;
}

export const DASHBOARD_HOWTO: HowTo[] = [
  { action: 'Open the alerts', how: 'Left menu → Security events → Events sub-tab (raw rows) or Dashboard sub-tab (charts + counts).', ref: { label: 'Wazuh dashboard', href: 'https://documentation.wazuh.com/current/user-manual/wazuh-dashboard/index.html' } },
  { action: 'Set the time range', how: 'Time picker, top-right → e.g. Last 24 hours, or Absolute for an exact attack window. #1 reason a query looks empty.' },
  { action: 'Search (DQL)', how: `Search bar → field:value, e.g. data.src_ip:${EXAMPLE_ATTACKER}; combine with and / or. Enter to apply.`, ref: { label: 'Query language (DQL)', href: 'https://documentation.wazuh.com/current/user-manual/wazuh-dashboard/queries.html' } },
  { action: 'Add columns', how: 'In Events, hover a field in the left field list → click the + (Add). Now it is a column you can sort.' },
  { action: 'Save a search', how: 'Top bar → Save → name it (e.g. "Team07 attacker") → reopen from Open.' },
  { action: 'Visualize a field', how: 'Expand a field in the list → Visualize → pick a chart (bar/pie). Save it to reuse.', ref: { label: 'Create a visualization', href: 'https://opensearch.org/docs/latest/dashboards/visualize/viz-index/' } },
  { action: 'Build a dashboard', how: 'Left menu → Dashboards → Create → Add → drop in your saved visualizations → Save.', ref: { label: 'Build a dashboard', href: 'https://opensearch.org/docs/latest/dashboards/dashboard/index/' } },
  { action: 'Vulnerabilities', how: 'Agents → your agent → Vulnerabilities → filter Severity = Critical/High → Export or screenshot.', ref: { label: 'Vulnerability detection', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/vulnerability-detection/index.html' } },
  { action: 'SCA (hardening)', how: 'Agents → your agent → SCA → filter Result = Failed → open a check for its Remediation text.', ref: { label: 'Configuration assessment', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/sec-config-assessment/index.html' } },
  { action: 'File changes (FIM)', how: 'Agents → your agent → Integrity monitoring → Events → read syscheck.path / added·modified. Fallback search: rule.groups:syscheck.', ref: { label: 'File integrity monitoring', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/file-integrity/index.html' } },
];

/** One tool, explained as a component of the system. `icon` names a lucide icon
 *  the component maps — a content file has no business importing a glyph. */
export interface ToolPanel {
  icon: 'dashboard' | 'network' | 'monitor';
  name: string;
  where: string;
  what: string;
  config: string;
  rowsTitle: string;
  rows: { k: string; v: string }[];
  refs: DocRef[];
}

export const TOOL_PANELS: ToolPanel[] = [
  {
    icon: 'dashboard',
    name: 'Wazuh dashboard',
    where: `${SOC_URL} · both pods`,
    what: 'The web SIEM every role shares. Agents ship their logs here and you read, search and prove everything from the browser.',
    config: `No config for students — sign in with ${SOC_LOGIN_LABEL}. Each machine runs a Wazuh agent that forwards its logs to ${SOC_IP} over port 1514 (Linux: /var/log; Windows: the Application/Security/System event channels), plus the Suricata and Sysmon blocks you add. Confirm a machine is actually connected with the "Connected to the server" line in its ossec.log. Left menu: Agents (which machines report + status), Security events (one agent’s feed), and the modules Vulnerabilities, SCA, Integrity monitoring (FIM) and MITRE ATT&CK. The search bar takes field:value queries.`,
    rowsTitle: 'Searches you reuse',
    rows: [
      { k: 'rule.level:>=7', v: 'Cut to alerts that usually matter (levels run 0–15; higher = more severe).' },
      { k: 'rule.level:>=10', v: 'Just the high-severity alerts — where an incident shows up.' },
      { k: 'data.srcip:<ip> or data.src_ip:<ip>', v: 'Everything one source did. Auth logs use data.srcip; Suricata uses data.src_ip — search both.' },
      { k: 'agent.name:Team07-ubuntu', v: 'Limit the view to one machine when several agents are noisy.' },
      { k: 'sort by Time', v: 'Order the events to read an attack as a sequence.' },
      { k: 'Connected to the server', v: 'The ossec.log line that proves an agent is talking to the SOC.' },
    ],
    refs: [
      { label: 'Using the Wazuh dashboard', href: 'https://documentation.wazuh.com/current/user-manual/wazuh-dashboard/index.html' },
      { label: 'Alert levels explained', href: 'https://documentation.wazuh.com/current/user-manual/ruleset/rules-classification.html' },
      { label: 'Vulnerability detection', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/vulnerability-detection/index.html' },
      { label: 'Configuration assessment (SCA)', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/sec-config-assessment/index.html' },
      { label: 'File integrity monitoring (FIM)', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/file-integrity/index.html' },
      { label: 'MITRE ATT&CK module', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/mitre-attack/index.html' },
    ],
  },
  {
    icon: 'network',
    name: 'Suricata',
    where: 'your Ubuntu server',
    what: 'The network IDS. It watches traffic on one network card and raises an alert when it matches a rule — this is how the SOC sees scans and web attacks.',
    config:
      'One gotcha: the capture interface in /etc/suricata/suricata.yaml must be your real NIC (ens18 on Proxmox, not eth0). suricata-update pulls the Emerging Threats ruleset (no rules = no alerts). Suricata writes alerts to /var/log/suricata/eve.json, and the Wazuh agent’s <localfile> block ships that file to the SOC.',
    rowsTitle: 'Reading its alerts',
    rows: [
      { k: '/var/log/suricata/eve.json', v: 'The live alert file — one JSON object per event; `tail -f` it to watch alerts arrive.' },
      { k: 'event_type: "alert"', v: 'The lines that matter — each has a signature name and a category.' },
      { k: 'suricata-update', v: 'Refresh the ruleset; re-run if a scan raises nothing.' },
      { k: 'in the dashboard', v: 'Suricata alerts appear in Security events like any other rule.' },
    ],
    refs: [
      { label: 'Suricata quickstart', href: 'https://docs.suricata.io/en/latest/quickstart.html' },
      { label: 'eve.json output format', href: 'https://docs.suricata.io/en/latest/output/eve/eve-json-format.html' },
      { label: 'Rules — introduction', href: 'https://docs.suricata.io/en/latest/rules/intro.html' },
    ],
  },
  {
    icon: 'monitor',
    name: 'Sysmon',
    where: 'your Windows 11 PC',
    what: 'Rich Windows telemetry — process starts, network connections and file changes that the built-in Windows log does not capture.',
    config:
      'Install with a config or it logs almost nothing: .\\Sysmon64.exe -accepteula -i .\\sysmonconfig.xml (the SwiftOnSecurity config is a sane default). Sysmon writes to the Microsoft-Windows-Sysmon/Operational event channel, and the Wazuh agent’s <localfile> eventchannel block forwards it to the SOC.',
    rowsTitle: 'Event IDs you’ll see',
    rows: [
      { k: 'Event ID 1', v: 'Process created — what ran, with its full command line.' },
      { k: 'Event ID 3', v: 'Network connection — a process reached out to an address.' },
      { k: 'Event ID 11', v: 'File created — e.g. a dropped or uploaded file.' },
      { k: 'find it in Wazuh', v: 'data.win.system.channel: "Microsoft-Windows-Sysmon/Operational"' },
    ],
    refs: [
      { label: 'Sysmon (Sysinternals)', href: 'https://learn.microsoft.com/sysinternals/downloads/sysmon' },
      { label: 'SwiftOnSecurity sysmonconfig.xml', href: 'https://github.com/SwiftOnSecurity/sysmon-config' },
    ],
  },
];

/** Every heading and paragraph the tool manual prints around those tables. */
export const TOOL_GUIDE_COPY = {
  intro:
    'The three tools behind the whole course, as components: what each one is, how it’s configured, where its data lands in the dashboard, and the exact searches or event IDs you’ll reuse. The step-by-step install commands live in each week’s task — this is the reference you come back to.',
  configLabel: 'Config',
  docsLabel: 'Documentation',
  signaturesTitle: 'Filtering & what to look for (Week 2)',
  signaturesColumns: ['Looks like…', 'Search', 'The tell'],
  filterFieldsLabel: 'Fields you filter on:',
  howToTitle: 'Driving the dashboard — search, read, build',
  howToIntro:
    'The clicks behind the tasks: find alerts, filter and read them, then turn a useful search into a saved visualization and your own dashboard. Used across Weeks 2–4.',
  howToColumns: ['To…', 'Do this', 'Docs'],
} as const;

/* ── The lab (Week 0) ────────────────────────────────────────────────────── */

export interface LabMachine {
  name: string;
  role: string;
  addr: string;
  notes: string;
}

export const LAB_MACHINES: LabMachine[] = [
  { name: 'Wazuh SOC', role: 'The dashboard everyone shares', addr: SOC_IP, notes: 'Wazuh manager + indexer + dashboard (all-in-one). You log in here in a browser.' },
  { name: 'Ubuntu pod', role: 'Your team’s target', addr: SOC.pod.ubuntu.ip, notes: 'DVWA web app + Suricata IDS + the Wazuh agent. N = your team number.' },
  { name: 'Windows 11 pod', role: 'Your team’s target', addr: SOC.pod.windows.ip, notes: 'Sysmon + the Wazuh agent for rich Windows logging.' },
  { name: 'Kali Linux', role: 'Your team’s attacker box', addr: SOC.attacker.ip, notes: 'You drive it yourself: the Week 2 traffic, the Week 3 scans and the Week 4 attack all start here — against your own pods only.' },
];

export const LAB_PREFLIGHT: string[] = [
  `The classroom SOC is already running — open ${SOC_URL} and sign in with ${SOC_LOGIN_LABEL}`,
  `Both of your pods (Ubuntu ${SOC.pod.ubuntu.ip} and Windows ${SOC.pod.windows.ip}) exist and you can sign in to them`,
  'You can SSH into your Ubuntu pod as the student user',
  'Your pod numbers are recorded in the Lab access panel (Tasks); Rules of Engagement read',
];

export const LAB_SETUP_COPY = {
  /** `{subnet}` is filled from the model by the renderer, which draws it in a
   *  monospace span — hence a placeholder rather than one flat sentence. */
  intro: {
    before: 'This course runs on a shared ',
    strong: 'Wazuh SOC',
    middle: ' with one pod per team, on a flat lab network (',
    subnet: SOC.subnet,
    after: '). The build is done once — see Week\u00a00 · ',
    week0: 'Environment build',
    end: ' — so as a student you mainly need your account and your pod numbers.',
  },
  machinesTitle: 'Machines',
  machinesColumns: ['Machine', 'Role', 'Address', 'What runs on it'],
  buildTitle: 'Building it (instructor / builder)',
  build: {
    before:
      'The full build — Wazuh all-in-one install, DVWA + Suricata on the Ubuntu template, Sysmon on the Windows template, then cloning ×16 — is a guided task with copy-paste commands and the required files in ',
    strong: 'Week\u00a00 · Environment build',
    middle: ' on the ',
    link: 'Tasks',
    after: ' page.',
  },
  preflightTitle: 'Before Week 1 — pre-flight',
} as const;

/* ── shared ──────────────────────────────────────────────────────────────── */

/** The words a `DiagramFrame` prints. The legend names a KIND, not a colour. */
export interface FrameCopy {
  title: string;
  subtitle?: string;
  howToRead: string;
  legend?: { kind: string; label: string }[];
}

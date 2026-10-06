/**
 * The Security+ course's reference content, as DATA.
 *
 * Two components held it: the self-study lab specification (what to build, how
 * to network it, the DVWA lifecycle, the pre-flight list) and the map from the
 * original course's 17 loose working files to this platform's graded
 * deliverables. Neither reached `content/courses/security-plus.json`, so the
 * document could not say what equipment the course needs — the first question
 * anyone adapting it for a business asks.
 *
 * The lab subnet and the host addresses are read from `labTopology.ts`. The lab
 * spec used to type `10.10.10.0/24` and `.10 / .5 / .6` beside a model that
 * already held all four.
 */
import { LAB_SUBNET, labHost } from '../labTopology';
import { archBuildModel, type ArchPicture } from './archPicture';

/* ── The self-study lab ──────────────────────────────────────────────────── */

export interface LabVm {
  name: string;
  role: string;
  specs: string;
  notes: string;
}

export const LAB_VMS: LabVm[] = [
  { name: 'Kali Linux', role: 'Attacker (Red)', specs: '2 vCPU · 4 GB RAM · 30 GB', notes: 'Recon & exploitation toolbox.' },
  { name: 'Ubuntu Server 22.04', role: 'Target + DVWA (Blue)', specs: '2 vCPU · 2–4 GB RAM · 20 GB', notes: 'Runs SSH, the web app (DVWA via Docker).' },
  { name: 'Windows 10/11 (optional)', role: 'Target (Blue)', specs: '2 vCPU · 4 GB RAM · 40 GB', notes: 'RDP + Defender track; optional second host.' },
];

export const HYPERVISORS: string[] = [
  'VirtualBox (free, Windows/Linux/Intel Mac)',
  'VMware Workstation / Fusion',
  'UTM or Parallels (Apple Silicon Macs)',
  'Proxmox / KVM (lab server)',
];

export const LAB_PREFLIGHT: string[] = [
  'All VMs powered on and on the SAME isolated lab network/subnet',
  'Kali can ping the Ubuntu (and Windows) target',
  'DVWA login page loads at http://<UBUNTU_IP>/ (admin / password)',
  '“pre-hardening” snapshots taken of the target VMs',
  'Target IPs recorded in the Lab access panel; Rules of Engagement read',
];

/** The last octet of each host, so the networking advice can name the addresses
 *  the model already holds instead of restating them. */
const lastOctet = (ip: string) => ip.slice(ip.lastIndexOf('.'));

/**
 * The networking rules, as three sentences with the monospace fragments marked.
 *
 * A bullet like "VirtualBox `Host-Only` or `Internal`" is one sentence with two
 * code spans inside it, so each bullet is a list of runs rather than a string:
 * plain text, or text drawn as code. The renderer walks them.
 */
export type Run =
  | string
  /** Drawn as code — a command, a path, an address. */
  | { code: string }
  /** Weighted, not italic: a named panel or control the student will look for. */
  | { medium: string }
  /** Italic: an aside inside the sentence. */
  | { em: string }
  | { strong: string };

export const LAB_NETWORK: Run[][] = [
  [
    'Put every VM on ONE isolated network — VirtualBox ',
    { code: 'Host-Only' },
    ' or ',
    { code: 'Internal' },
    ', VMware ',
    { code: 'Host-Only' },
    '. Avoid Bridged so the lab never touches your home/work LAN.',
  ],
  [
    'Use one subnet, e.g. ',
    { code: LAB_SUBNET },
    `, with static IPs (Kali ${lastOctet(labHost('kali').ip)}, Ubuntu ${lastOctet(labHost('ubuntu').ip)}, Windows ${lastOctet(labHost('windows').ip)}) — then record them in Lab access.`,
  ],
  ['Confirm reachability: from Kali, ', { code: 'ping <UBUNTU_IP>' }, ' must reply before Week 1.'],
];

/** The DVWA quick reference — the commands and the first-run instructions. */
export const DVWA = {
  title: 'DVWA target (Docker) — quick reference',
  intro: [
    'On the Ubuntu host. Run it once (named ',
    { code: 'dvwa' },
    '), then start/stop it as needed. First run: open ',
    { code: '/setup.php' },
    ' → “Create / Reset Database”, then set Security = Low at ',
    { code: '/security.php' },
    '. Login ',
    { code: 'admin / password' },
    '.',
  ] as Run[],
  commands: [
    { cmd: 'sudo apt install -y docker.io && sudo systemctl enable --now docker', explain: 'Install Docker and start it (first time only).' },
    { cmd: 'sudo docker run -d --name dvwa --restart unless-stopped -p 80:80 vulnerables/web-dvwa', explain: 'Create + start the named DVWA container on port 80.' },
    { cmd: 'sudo docker start dvwa', explain: 'Start the existing container again (after a reboot/stop).' },
    { cmd: 'sudo docker stop dvwa', explain: 'Stop it when you are done.' },
    { cmd: 'sudo docker ps', explain: 'List running containers — confirm dvwa is up.' },
    { cmd: 'sudo docker logs dvwa', explain: 'Check logs if it exited or the page will not load.' },
  ],
};

export const LAB_SETUP_COPY = {
  intro: [
    'You run a small isolated lab of 2–3 VMs. Build them once, put them on one private network, and record their IPs in the ',
    { medium: 'Lab access' },
    ' panel (Tasks).',
  ] as Run[],
  vmsTitle: 'Virtual machines',
  vmsColumns: ['VM', 'Role', 'Suggested specs', 'Notes'],
  hypervisorsLabel: 'Hypervisor options:',
  networkTitle: 'Network',
  preflightTitle: 'Pre-flight checklist',
} as const;

/* ── 17 loose files → graded deliverables ────────────────────────────────── */

/**
 * The original course produced 17 loose working files; this platform
 * consolidates them into graded deliverables. Showing the mapping makes the
 * change legible to a returning student — and makes the consolidation auditable
 * rather than asserted, because `content-integrity.test.ts` resolves every id.
 */
export const DOCS_REDUCTION: { id: string; old: string[] }[] = [
  { id: 'scope_roe', old: ['Case_Overview', 'Scope_and_Rules'] },
  { id: 'asset_inventory', old: ['Asset_List.csv'] },
  { id: 'risk_register', old: ['Simple_Risk_List.csv', 'Threat_Notes'] },
  { id: 'hardening_baseline', old: ['Hardening_Checklist', 'Firewall_Notes', 'Logging_Notes'] },
  { id: 'change_log', old: ['Change_Log'] },
  { id: 'pentest_report', old: ['Scan_Results', 'Exploit_Notes', 'Findings_Summary'] },
  { id: 'incident_report', old: ['IR_Awareness_Notes'] },
  { id: 'final_report', old: ['Final_Presentation', 'Recommendations'] },
];

/** Files that stayed files: they are not deliverables and never were. */
export const DOCS_REDUCTION_ADMIN = ['Team_Roles', 'README'];

export const DOCS_REDUCTION_COPY = {
  collapsedTitle: 'From 17 loose files to graded deliverables',
  /** `{old}` and `{new}` are counted from the data by the renderer, never typed
   *  — the sentence could otherwise claim a number the table disagreed with. */
  summary: [
    'The old course produced ',
    { strong: '{old} loose files' },
    '. They now consolidate into ',
    { strong: '{new} graded deliverables' },
    ' (plus a README and Team_Roles) — same work, one clear set of documents.',
  ] as Run[],
  columns: ['Old working files', 'New deliverable'],
  adminRow: [
    'Admin files — kept as ',
    { code: 'README.md' },
    ' & ',
    { code: 'Team_Roles.md' },
  ] as Run[],
} as const;

/* ── The lab architecture (R99, R103) ────────────────────────────────────── */

/**
 * The attack lab as a system: the attacker outside, the edge, the LAN with
 * its two targets and the controls Blue puts on them, the SOC that watches
 * them, and the records GRC keeps. Every part says what it is for and which
 * form records it; `arrives` is the week it appears. Addresses come from
 * `labTopology`, never typed here.
 */
export const ARCH: ArchPicture = {
  copy: {
    title: 'Lab architecture — the company you attack, defend and govern',
    howToRead:
      'Left: the attacker’s side. Then the edge every packet crosses, the LAN with the two targets and the controls on them, and the SOC that watches. Along the bottom: the fourteen records. Solid lines carry traffic; dashed lines carry logs, backups or trust.',
    footer: 'The addresses are the worked example; your Lab access panel substitutes your own into every command.',
  },
  view: { w: 960, h: 440 },
  zones: [
    { id: 'outside', label: 'Outside', note: 'the attacker’s side', x: 20, y: 40, w: 160, h: 270, tone: 4 },
    { id: 'perimeter', label: 'Perimeter', note: 'what the LAN shows', x: 200, y: 40, w: 170, h: 270, tone: 8 },
    { id: 'lan', label: 'Lab LAN', note: LAB_SUBNET, x: 390, y: 40, w: 340, h: 270, tone: 2 },
    { id: 'soc', label: 'SOC and management', note: 'Blue · GRC', x: 750, y: 40, w: 190, h: 270, tone: 3 },
    { id: 'records', label: 'Records — the deliverables', note: '14 forms', x: 20, y: 350, w: 920, h: 70, tone: 6, lane: true },
  ],
  nodes: [
    { id: 'internet', label: 'Internet', sub: 'OSINT sources · DNS', kind: 'outside', zone: 'outside', x: 100, y: 100, external: true, arrives: 0, records: 'scope_roe', role: 'red', purpose: 'Where passive recon starts and the scope is checked first' },
    { id: 'kali', label: 'Kali attacker', sub: labHost('kali').note, addr: labHost('kali').ip, kind: 'endpoint', zone: 'outside', x: 100, y: 170, arrives: 0, records: 'scope_roe', role: 'red', purpose: 'The attacker’s box: recon, scanning and exploitation inside scope' },
    { id: 'scanner', label: 'Vulnerability scanner', sub: 'nmap · OpenVAS on Kali', kind: 'scanner', zone: 'outside', x: 100, y: 240, arrives: 2, records: 'vm_sop', role: 'red', purpose: 'Finds the weaknesses the risk register ranks' },
    { id: 'edge', label: 'Edge firewall', sub: 'ufw · default deny', kind: 'firewall', zone: 'perimeter', x: 285, y: 100, arrives: 0, records: 'hardening_baseline', role: 'blue', purpose: 'The only path in: allowed ports, everything else dropped' },
    { id: 'logpipe', label: 'Log forwarding', sub: 'rsyslog · agent → SOC', kind: 'monitor', zone: 'perimeter', x: 285, y: 170, arrives: 2, records: 'hardening_baseline', role: 'blue', purpose: 'Sends host and web logs to the SOC as they happen' },
    { id: 'ubuntu', label: 'Ubuntu web server', sub: labHost('ubuntu').services.join(' · '), addr: labHost('ubuntu').ip, kind: 'server', zone: 'lan', x: 475, y: 100, arrives: 0, records: 'asset_inventory', role: 'blue', purpose: 'The target: the web application the company runs' },
    { id: 'windows', label: 'Windows host', sub: labHost('windows').note, addr: labHost('windows').ip, kind: 'endpoint', zone: 'lan', x: 645, y: 100, arrives: 0, records: 'asset_inventory', role: 'blue', purpose: 'Optional second target: RDP and local accounts' },
    { id: 'hardening', label: 'Hardening baseline', sub: 'CIS · SSH · patching', kind: 'control', zone: 'lan', x: 475, y: 170, arrives: 1, records: 'hardening_baseline', role: 'blue', purpose: 'The settings applied before the attack and checked after it' },
    { id: 'accounts', label: 'Accounts and sudo', sub: 'least privilege · policy', kind: 'identity', zone: 'lan', x: 645, y: 170, arrives: 1, records: 'security_policy', role: 'blue', purpose: 'Who may log in to each host, with what rights' },
    { id: 'backup', label: 'VM snapshot', sub: 'pre-exploit restore point', kind: 'backup', zone: 'lan', x: 475, y: 240, arrives: 3, records: 'ir_runbook', role: 'blue', purpose: 'The restore point the runbook falls back to' },
    { id: 'siem', label: 'SIEM', sub: 'Wazuh · alerts', kind: 'siem', zone: 'soc', x: 835, y: 100, arrives: 2, records: 'incident_report', role: 'blue', purpose: 'Turns forwarded logs into alerts Blue can act on' },
    { id: 'cases', label: 'Case queue', sub: 'triage · containment', kind: 'ticket', zone: 'soc', x: 835, y: 170, arrives: 3, records: 'incident_report', role: 'blue', purpose: 'Every alert worked to a decision and a containment step' },
    { id: 'evidence', label: 'Evidence vault', sub: 'sha256 · custody log', kind: 'evidence', zone: 'soc', x: 835, y: 240, arrives: 3, records: 'evidence_log', role: 'grc', purpose: 'Hashed copies of what the findings rest on' },
    { id: 'r_scope', label: 'Scope & RoE', sub: '', kind: 'record', zone: 'records', x: 85, y: 368, arrives: 1, records: 'scope_roe', role: 'grc', purpose: 'Records what may be tested, when, and who authorized it' },
    { id: 'r_assets', label: 'Asset inventory', sub: '', kind: 'record', zone: 'records', x: 216, y: 368, arrives: 1, records: 'asset_inventory', role: 'grc', purpose: 'Records every host, owner and classification' },
    { id: 'r_framework', label: 'Framework map', sub: '', kind: 'record', zone: 'records', x: 347, y: 368, arrives: 1, records: 'framework_mapping', role: 'grc', purpose: 'Records which control each task satisfies' },
    { id: 'r_policy', label: 'Security policy', sub: '', kind: 'record', zone: 'records', x: 478, y: 368, arrives: 1, records: 'security_policy', role: 'grc', purpose: 'Records the rules the lab runs under' },
    { id: 'r_standard', label: 'Hardening standard', sub: '', kind: 'record', zone: 'records', x: 609, y: 368, arrives: 1, records: 'hardening_standard', role: 'grc', purpose: 'Records the settings Blue must reach' },
    { id: 'r_baseline', label: 'Hardening baseline', sub: '', kind: 'record', zone: 'records', x: 740, y: 368, arrives: 1, records: 'hardening_baseline', role: 'blue', purpose: 'Records what Blue applied and the evidence' },
    { id: 'r_changes', label: 'Change log', sub: '', kind: 'record', zone: 'records', x: 871, y: 368, arrives: 1, records: 'change_log', role: 'blue', purpose: 'Records every change Blue made, when and why' },
    { id: 'r_risks', label: 'Risk register', sub: '', kind: 'record', zone: 'records', x: 85, y: 402, arrives: 2, records: 'risk_register', role: 'grc', purpose: 'Records each risk, scored, with its owner and treatment' },
    { id: 'r_vmsop', label: 'VM SOP', sub: '', kind: 'record', zone: 'records', x: 216, y: 402, arrives: 2, records: 'vm_sop', role: 'grc', purpose: 'Records how scans run and how findings are handled' },
    { id: 'r_pentest', label: 'Pentest report', sub: '', kind: 'record', zone: 'records', x: 347, y: 402, arrives: 2, records: 'pentest_report', role: 'red', purpose: 'Records what Red found, proved and recommends' },
    { id: 'r_runbook', label: 'IR runbook', sub: '', kind: 'record', zone: 'records', x: 478, y: 402, arrives: 3, records: 'ir_runbook', role: 'grc', purpose: 'Records the steps Blue follows when an alert fires' },
    { id: 'r_incident', label: 'Incident report', sub: '', kind: 'record', zone: 'records', x: 609, y: 402, arrives: 3, records: 'incident_report', role: 'blue', purpose: 'Records what happened, when it was seen, and the containment' },
    { id: 'r_evidence', label: 'Evidence log', sub: '', kind: 'record', zone: 'records', x: 740, y: 402, arrives: 3, records: 'evidence_log', role: 'grc', purpose: 'Records every file, its hash and its custody' },
    { id: 'r_final', label: 'Final report', sub: '', kind: 'record', zone: 'records', x: 871, y: 402, arrives: 4, records: 'final_report', role: 'grc', purpose: 'The capstone: findings, risks and recommendations' },
  ],
  edges: [
    { from: 'kali', to: 'edge', label: 'recon · scans · exploits' },
    { from: 'edge', to: 'ubuntu', label: 'allowed ports only' },
    { from: 'ubuntu', to: 'logpipe', label: 'syslog · web logs', kind: 'log' },
    { from: 'logpipe', to: 'siem', label: 'forwarded', kind: 'log' },
    { from: 'siem', to: 'cases', label: 'alerts', kind: 'log' },
    { from: 'ubuntu', to: 'backup', label: 'snapshot', kind: 'backup' },
    { from: 'accounts', to: 'ubuntu', label: 'policy', kind: 'trust' },
  ],
};

export const ARCH_BUILD = archBuildModel(ARCH, {
  processes: {
    1: { title: 'Cold Recon', steps: [
      { from: 'kali', to: 'edge', label: 'OSINT · passive recon' },
      { from: 'edge', to: 'ubuntu', label: 'map the target, quietly' },
      { from: 'r_standard', to: 'hardening', label: 'hardening standard applied' },
    ] },
    2: { title: 'Hard Target', steps: [
      { from: 'scanner', to: 'ubuntu', label: 'port & web scanning' },
      { from: 'logpipe', to: 'siem', label: 'baseline capture' },
      { from: 'siem', to: 'r_risks', label: 'findings → risk register' },
    ] },
    3: { title: 'The Breach', steps: [
      { from: 'kali', to: 'ubuntu', label: 'live exploits' },
      { from: 'siem', to: 'cases', label: 'detect and contain' },
      { from: 'cases', to: 'evidence', label: 'preserve the evidence' },
    ] },
    4: { title: 'Payday', steps: [
      { from: 'evidence', to: 'r_final', label: 'evidence → findings' },
      { from: 'r_risks', to: 'r_final', label: 'final report & presentation' },
    ] },
  },
  captions: {
    0: 'The lab: a Kali attacker outside, the edge firewall, the Ubuntu web server and the optional Windows host. Nothing is hardened yet.',
    1: 'New: the hardening baseline, the account policy and the first seven records. Red maps the target without making noise.',
    2: 'New: the scanner, log forwarding and the SIEM. Red scans while Blue learns what normal looks like and GRC opens the risk register.',
    3: 'New: the snapshot, the case queue and the evidence vault. Red attacks for real; Blue detects, contains and preserves what it found.',
    4: 'New: the final report. No new traffic — the evidence becomes findings and recommendations.',
  },
});

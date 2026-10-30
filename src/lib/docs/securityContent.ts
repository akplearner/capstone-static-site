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
      'One isolated Host-Only network. Left: Red builds the attacker. Centre: Blue builds the targets — the Ubuntu web server, the Windows host, the controls on them and the detection that watches them. Right: GRC keeps the proof. Along the bottom: the fourteen records and the Portfolio. Solid lines carry traffic; dashed lines carry logs, trust or backups. A part fills in as your team finishes the work that builds it.',
    footer: 'The addresses are the worked example; your Lab access panel substitutes your own into every command. LAB_SUBNET is one Host-Only network with no route to the internet.',
  },
  view: { w: 960, h: 560 },
  zones: [
    { id: 'lab', label: 'Your lab', note: `one isolated Host-Only network · ${LAB_SUBNET}`, x: 20, y: 40, w: 920, h: 60, tone: 8 },
    { id: 'attacker', label: 'Red builds — the attacker', note: 'outside the hosts', x: 20, y: 130, w: 180, h: 290, tone: 4 },
    { id: 'targets', label: 'Blue builds — the targets', note: `Ubuntu ${labHost('ubuntu').ip} · Windows ${labHost('windows').ip}`, x: 220, y: 130, w: 480, h: 290, tone: 2 },
    { id: 'proof', label: 'GRC keeps — the proof', note: 'hashes · custody · reports', x: 720, y: 130, w: 220, h: 290, tone: 3 },
    { id: 'records', label: 'Records — the deliverables', note: '14 forms and the Portfolio', x: 20, y: 440, w: 920, h: 104, tone: 6, lane: true },
  ],
  nodes: [
    // The lab platform, there from the start. No owning step: it carries no tick, only the floor the rest is built on.
    { id: 'hypervisor', label: 'Hypervisor', sub: 'VirtualBox · VMware · UTM', kind: 'network', zone: 'lab', x: 110, y: 70, arrives: 0, records: 'scope_roe', purpose: 'Runs every VM on one Host-Only network with no route out' },
    { id: 'labaccess', label: 'Lab access panel', sub: 'your own addresses', kind: 'data', zone: 'lab', x: 830, y: 70, arrives: 0, records: 'scope_roe', role: 'grc', purpose: 'Where your own hosts and addresses go, substituted into commands' },
    // Red builds the attacker.
    { id: 'kali', label: 'Kali attacker', sub: labHost('kali').note, addr: labHost('kali').ip, kind: 'endpoint', zone: 'attacker', x: 110, y: 170, arrives: 0, records: 'scope_roe', role: 'red', purpose: 'The attacker’s box, inside the authorized scope', builtBy: ['red-w0-setup::red-w0-s1', 'red-w0-setup::red-w0-s2'] },
    { id: 'osint', label: 'OSINT recon', sub: 'whois · dig · theHarvester', kind: 'scanner', zone: 'attacker', x: 110, y: 240, arrives: 1, records: 'asset_inventory', role: 'red', purpose: 'Profiles the target quietly, before anything is loud', builtBy: ['red-w1-osint'] },
    { id: 'scanner', label: 'Vulnerability scan', sub: 'nmap · nikto', kind: 'scanner', zone: 'attacker', x: 110, y: 310, arrives: 2, records: 'pentest_report', role: 'red', purpose: 'Finds and ranks the weaknesses the risk register scores', builtBy: ['red-w2-enumeration'] },
    { id: 'exploits', label: 'Authorized attacks', sub: 'sqlmap · hydra · Metasploit', kind: 'app', zone: 'attacker', x: 110, y: 380, arrives: 3, records: 'pentest_report', role: 'red', purpose: 'Proves each finding with evidence, inside scope', builtBy: ['red-w3-attacks::red-w3-s1', 'red-w3-attacks::red-w3-msf'] },
    // Blue builds the targets.
    { id: 'ubuntu', label: 'Ubuntu web server', sub: labHost('ubuntu').services.join(' · '), addr: labHost('ubuntu').ip, kind: 'server', zone: 'targets', x: 300, y: 170, arrives: 0, records: 'asset_inventory', role: 'blue', purpose: 'The web target the attack chain lands on', builtBy: ['blue-w0-setup::blue-w0-s1'] },
    { id: 'dvwa', label: 'DVWA', sub: 'Docker · :80', kind: 'app', zone: 'targets', x: 300, y: 240, arrives: 0, records: 'asset_inventory', role: 'blue', purpose: 'The deliberately vulnerable app Red attacks', builtBy: ['blue-w0-setup::blue-w0-s4', 'blue-w0-setup::blue-w0-s5'] },
    { id: 'linhard', label: 'Linux hardening', sub: 'ufw · fail2ban · Lynis', kind: 'control', zone: 'targets', x: 300, y: 310, arrives: 1, records: 'hardening_baseline', role: 'blue', purpose: 'The controls applied before the attack and checked after', builtBy: ['blue-w1-hardening::blue-w1-s3', 'blue-w1-hardening::blue-w1-s4', 'blue-w1-hardening::blue-w1-s5'] },
    { id: 'snapshot', label: 'VM snapshot', sub: 'pre-hardening restore point', kind: 'backup', zone: 'targets', x: 300, y: 380, arrives: 0, records: 'ir_runbook', role: 'blue', purpose: 'The restore point the runbook falls back to', builtBy: ['blue-w0-setup::blue-w0-s3'] },
    { id: 'windows', label: 'Windows host', sub: labHost('windows').note, addr: labHost('windows').ip, kind: 'endpoint', zone: 'targets', x: 460, y: 170, arrives: 0, records: 'asset_inventory', role: 'blue', purpose: 'The second target: RDP and local accounts', builtBy: ['blue-w0-setup::blue-w0-s2'] },
    { id: 'winhard', label: 'Windows hardening', sub: 'Firewall · Defender · SMBv1 off', kind: 'control', zone: 'targets', x: 460, y: 240, arrives: 1, records: 'hardening_baseline', role: 'blue', purpose: 'The same baseline reached on the Windows host', builtBy: ['blue-w1-hardening::blue-w1-s6', 'blue-w1-hardening::blue-w1-s7'] },
    { id: 'winlog', label: 'Windows logging', sub: 'audit logon 4624 · 4625', kind: 'monitor', zone: 'targets', x: 460, y: 310, arrives: 2, records: 'vm_sop', role: 'blue', purpose: 'Records every logon so a brute force is visible', builtBy: ['blue-w2-baseline::blue-w2-s4'] },
    { id: 'capture', label: 'Packet capture', sub: 'tcpdump · Wireshark pcaps', kind: 'monitor', zone: 'targets', x: 620, y: 170, arrives: 2, records: 'vm_sop', role: 'blue', purpose: 'The normal and attack traffic samples Blue reads', builtBy: ['blue-w2-baseline::blue-w2-s1', 'blue-w2-baseline::blue-w2-s2'] },
    { id: 'rules', label: 'Detection filters', sub: 'SYN-scan · SQLi', kind: 'control', zone: 'targets', x: 620, y: 240, arrives: 2, records: 'vm_sop', role: 'blue', purpose: 'The filters that name the attack in the capture', builtBy: ['blue-w2-baseline::blue-w2-s3'] },
    { id: 'weblog', label: 'Web-log watch', sub: 'tail -f · grep access.log', kind: 'monitor', zone: 'targets', x: 620, y: 310, arrives: 3, records: 'incident_report', role: 'blue', purpose: 'Catches the live SQL injection as it is tried', builtBy: ['blue-w3-detection::blue-w3-s2', 'blue-w3-detection::blue-w3-s3'] },
    { id: 'contain', label: 'Containment', sub: 'ufw deny · firewall rule', kind: 'firewall', zone: 'targets', x: 620, y: 380, arrives: 3, records: 'incident_report', role: 'blue', purpose: 'Cuts the attacker off once the case is confirmed', builtBy: ['blue-w3-detection::blue-w3-s4', 'blue-w3-detection::blue-w3-s5'] },
    // GRC keeps the proof.
    { id: 'workspace', label: 'Team workspace', sub: 'team-artifacts/', kind: 'data', zone: 'proof', x: 830, y: 170, arrives: 0, records: 'scope_roe', role: 'grc', purpose: 'Where every artefact is filed, week by week', builtBy: ['grc-w0-setup::grc-w0-s1'] },
    { id: 'risk', label: 'Risk scoring', sub: 'likelihood × impact · CVSS', kind: 'data', zone: 'proof', x: 830, y: 240, arrives: 2, records: 'risk_register', role: 'grc', purpose: 'Scores each finding so the fix order is defensible', builtBy: ['grc-w2-risk'] },
    { id: 'hashes', label: 'Evidence hashes', sub: 'sha256sum · custody', kind: 'evidence', zone: 'proof', x: 830, y: 310, arrives: 3, records: 'evidence_log', role: 'grc', purpose: 'Hashes every file so the evidence cannot be altered', builtBy: ['grc-w3-custody::grc-w3-s2', 'grc-w3-custody::grc-w3-s3'] },
    { id: 'briefing', label: 'Final briefing', sub: 'report · slides', kind: 'people', zone: 'proof', x: 830, y: 380, arrives: 4, records: 'final_report', role: 'grc', purpose: 'The capstone: findings, risks and recommendations', builtBy: ['grc-w4-report'] },
    { id: 'r_scope', label: 'Scope & RoE', sub: '', kind: 'record', zone: 'records', x: 85, y: 458, arrives: 1, records: 'scope_roe', role: 'grc', purpose: 'Records what may be tested, when, and who authorized it' },
    { id: 'r_assets', label: 'Asset inventory', sub: '', kind: 'record', zone: 'records', x: 216, y: 458, arrives: 1, records: 'asset_inventory', role: 'grc', purpose: 'Records every host, owner and classification' },
    { id: 'r_framework', label: 'Framework map', sub: '', kind: 'record', zone: 'records', x: 347, y: 458, arrives: 1, records: 'framework_mapping', role: 'grc', purpose: 'Records which control each task satisfies' },
    { id: 'r_policy', label: 'Security policy', sub: '', kind: 'record', zone: 'records', x: 478, y: 458, arrives: 1, records: 'security_policy', role: 'grc', purpose: 'Records the rules the lab runs under' },
    { id: 'r_standard', label: 'Hardening standard', sub: '', kind: 'record', zone: 'records', x: 609, y: 458, arrives: 1, records: 'hardening_standard', role: 'grc', purpose: 'Records the settings Blue must reach' },
    { id: 'r_baseline', label: 'Hardening baseline', sub: '', kind: 'record', zone: 'records', x: 740, y: 458, arrives: 1, records: 'hardening_baseline', role: 'blue', purpose: 'Records what Blue applied and the evidence' },
    { id: 'r_changes', label: 'Change log', sub: '', kind: 'record', zone: 'records', x: 871, y: 458, arrives: 1, records: 'change_log', role: 'blue', purpose: 'Records every change Blue made, when and why' },
    { id: 'r_risks', label: 'Risk register', sub: '', kind: 'record', zone: 'records', x: 85, y: 492, arrives: 2, records: 'risk_register', role: 'grc', purpose: 'Records each risk, scored, with its owner and treatment' },
    { id: 'r_vmsop', label: 'VM SOP', sub: '', kind: 'record', zone: 'records', x: 216, y: 492, arrives: 2, records: 'vm_sop', role: 'grc', purpose: 'Records how scans run and how findings are handled' },
    { id: 'r_pentest', label: 'Pentest report', sub: '', kind: 'record', zone: 'records', x: 347, y: 492, arrives: 2, records: 'pentest_report', role: 'red', purpose: 'Records what Red found, proved and recommends' },
    { id: 'r_runbook', label: 'IR runbook', sub: '', kind: 'record', zone: 'records', x: 478, y: 492, arrives: 3, records: 'ir_runbook', role: 'grc', purpose: 'Records the steps Blue follows when an alert fires' },
    { id: 'r_incident', label: 'Incident report', sub: '', kind: 'record', zone: 'records', x: 609, y: 492, arrives: 3, records: 'incident_report', role: 'blue', purpose: 'Records what happened, when it was seen, and the containment' },
    { id: 'r_evidence', label: 'Evidence log', sub: '', kind: 'record', zone: 'records', x: 740, y: 492, arrives: 3, records: 'evidence_log', role: 'grc', purpose: 'Records every file, its hash and its custody' },
    { id: 'r_final', label: 'Final report', sub: '', kind: 'record', zone: 'records', x: 871, y: 492, arrives: 4, records: 'final_report', role: 'grc', purpose: 'The capstone: findings, risks and recommendations' },
    { id: 'r_portfolio', label: 'Portfolio', sub: '', kind: 'record', zone: 'records', x: 85, y: 526, arrives: 4, records: 'sec_portfolio', role: 'grc', purpose: 'The repository, case study, resume bullets and diagram' },
  ],
  edges: [
    { from: 'kali', to: 'ubuntu', label: 'recon · scans · exploits' },
    { from: 'kali', to: 'windows', label: 'RDP · accounts' },
    { from: 'linhard', to: 'ubuntu', label: 'baseline', kind: 'trust' },
    { from: 'winhard', to: 'windows', label: 'baseline', kind: 'trust' },
    { from: 'ubuntu', to: 'weblog', label: 'access.log', kind: 'log' },
    { from: 'windows', to: 'winlog', label: '4624 · 4625', kind: 'log' },
    { from: 'hypervisor', to: 'snapshot', label: 'snapshot', kind: 'backup' },
    { from: 'capture', to: 'hashes', label: 'pcaps, hashed', kind: 'log' },
    { from: 'weblog', to: 'contain', label: 'detect → block', kind: 'admin' },
    { from: 'hashes', to: 'briefing', label: 'evidence', kind: 'log' },
  ],
  spec: {
    columns: ['Component', 'Address', 'Runs', 'Who'],
    rows: [
      ['Hypervisor', '—', 'VirtualBox · VMware · UTM', 'Everyone'],
      ['Kali attacker', labHost('kali').ip, 'recon · scan · exploit', 'Red'],
      ['Ubuntu web server', labHost('ubuntu').ip, 'DVWA in Docker · SSH', 'Blue'],
      ['Windows host', labHost('windows').ip, 'RDP · local accounts', 'Blue'],
    ],
  },
};

export const ARCH_BUILD = archBuildModel(ARCH, {
  processes: {
    1: { title: 'Cold Recon', steps: [
      { from: 'kali', to: 'ubuntu', label: 'passive recon, nothing loud' },
      { from: 'osint', to: 'r_assets', label: 'profile into the asset list' },
      { from: 'r_standard', to: 'linhard', label: 'hardening standard applied' },
      { from: 'r_standard', to: 'winhard', label: 'same baseline on Windows' },
    ] },
    2: { title: 'Hard Target', steps: [
      { from: 'scanner', to: 'dvwa', label: 'port and web scanning' },
      { from: 'capture', to: 'rules', label: 'baseline becomes detection filters' },
      { from: 'windows', to: 'winlog', label: 'turn on logon auditing' },
      { from: 'scanner', to: 'r_risks', label: 'findings into the risk register' },
    ] },
    3: { title: 'The Breach', steps: [
      { from: 'exploits', to: 'dvwa', label: 'live exploits land' },
      { from: 'weblog', to: 'contain', label: 'detect, then cut it off' },
      { from: 'winlog', to: 'contain', label: 'failed logons, then block' },
      { from: 'capture', to: 'hashes', label: 'preserve the evidence, hashed' },
    ] },
    4: { title: 'Payday', steps: [
      { from: 'hashes', to: 'r_final', label: 'evidence into findings' },
      { from: 'r_risks', to: 'r_final', label: 'risks into the final report' },
      { from: 'r_final', to: 'briefing', label: 'brief it to the room' },
    ] },
  },
  captions: {
    0: 'The lab, built: one isolated Host-Only network with a Kali attacker, the Ubuntu and Windows targets, a snapshot and the GRC workspace.',
    1: 'New: Red profiles the target with OSINT; Blue hardens both hosts with ufw, fail2ban, Lynis and Defender; GRC issues the hardening standard.',
    2: 'New: the scanner, Windows logon auditing, packet capture and detection filters. Red scans while Blue learns normal traffic and GRC opens the risk register.',
    3: 'New: live exploits, the web-log watch, the containment rule and the evidence hashes. Red attacks for real; Blue detects, contains and preserves.',
    4: 'New: the final report and the briefing. No new traffic — the evidence becomes findings, the risks become recommendations, and the team briefs the room.',
  },
});

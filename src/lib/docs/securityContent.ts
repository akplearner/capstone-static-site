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

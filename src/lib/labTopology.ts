/**
 * Single source of truth for the lab network topology.
 *
 * The subnet, host names, IPs, and exposed services live here so the network
 * diagram, the lab-setup guide, and the worked-example seed data all agree — no
 * more drift where one place says the target is .5 and another says .15.
 *
 * These are the *example* addresses the course is written around. Students set
 * their own values in the Lab access panel (`labAccess.ts`), which are then
 * substituted into commands; the diagrams still show these canonical examples.
 */

export const LAB_SUBNET = '10.10.10.0/24';

export interface LabHost {
  key: 'kali' | 'ubuntu' | 'windows';
  name: string;
  ip: string;
  /** Which role owns/uses this host. */
  owner: 'red' | 'blue';
  services: string[];
  optional?: boolean;
  note: string;
}

export const LAB_HOSTS: LabHost[] = [
  { key: 'kali', name: 'Kali (Attacker)', ip: '10.10.10.10', owner: 'red', services: [], note: 'recon → exploit' },
  { key: 'ubuntu', name: 'Ubuntu web server', ip: '10.10.10.5', owner: 'blue', services: ['SSH', 'HTTP', 'DNS'], note: 'DVWA target · Blue defends' },
  { key: 'windows', name: 'Windows host', ip: '10.10.10.6', owner: 'blue', services: ['RDP'], optional: true, note: 'Blue defends · optional' },
];

export function labHost(key: LabHost['key']): LabHost {
  return LAB_HOSTS.find((h) => h.key === key)!;
}

/** The primary target students attack/defend — the Ubuntu+DVWA host. */
export const TARGET_IP = labHost('ubuntu').ip;

/** What the attacker→target link carries each week, plus the week's focus line. */
export const WEEK_WIRE: Record<number, { wire: string; focus: string }> = {
  1: { wire: 'OSINT · passive recon', focus: 'Map the target and harden the baseline before anyone is loud.' },
  2: { wire: 'port & web scanning', focus: 'Find weaknesses while the SOC learns what normal traffic looks like.' },
  3: { wire: 'live exploits', focus: 'Attack for real while Blue detects, contains, and preserves evidence.' },
  4: { wire: 'findings & report', focus: 'No new traffic — compile the evidence into findings and recommendations.' },
};

/* ───────────────────────────────────────────────────────────────────────────
 * SOC-style topology (CySA+): a shared Wazuh SOC on one flat network, with N
 * identical team pods (Ubuntu+DVWA / Windows) each reporting in via an agent,
 * a Kali attacker, and the analyst's browser. This is a different shape from the
 * single-company ArchitectureDiagram above, so it has its own data + component
 * (SocTopologyDiagram). Courses without an entry here fall back to the
 * red/blue/grc ArchitectureDiagram.
 * ────────────────────────────────────────────────────────────────────────── */
export interface SocTopology {
  /** Whole-lab subnet, e.g. '10.10.0.0/16'. */
  subnet: string;
  /** Hypervisor host that runs every VM. */
  proxmoxHost: string;
  /** The shared monitoring hub students open in a browser. */
  soc: { name: string; ip: string; lines: string[] };
  /** The per-team pod template (IP `N` = team number). */
  pod: {
    ubuntu: { name: string; ip: string };
    windows: { name: string; ip: string };
  };
  attacker: { name: string; note: string };
  browser: { name: string; note: string };
  /** How many team pods are cloned (drives the chip row). */
  teamCount: number;
  /** The "what is what" reference table under the diagram. */
  spec: { component: string; address: string; runs: string; who: string }[];
}

export const SOC_TOPOLOGY_BY_COURSE: Record<string, SocTopology> = {
  'cysa-plus': {
    subnet: '10.10.0.0/16',
    proxmoxHost: '10.10.10.45',
    soc: {
      name: 'Wazuh SOC',
      ip: '10.10.100.100',
      lines: ['one dashboard for everything', 'alerts · files · vulnerabilities', 'built once · shared by all teams'],
    },
    pod: {
      ubuntu: { name: 'Ubuntu + DVWA + Suricata', ip: '10.10.100.N' },
      windows: { name: 'Windows 11 + Sysmon', ip: '10.10.20.N' },
    },
    attacker: { name: 'Kali Linux', note: 'the attacker (you drive it)' },
    browser: { name: 'Your browser', note: 'where analysts work' },
    teamCount: 16,
    spec: [
      { component: 'Wazuh SOC', address: '10.10.100.100', runs: 'Wazuh manager + indexer + dashboard', who: 'Everyone, in a browser' },
      { component: 'Ubuntu server', address: '10.10.100.N', runs: 'DVWA web app · Suricata (network IDS) · Wazuh agent', who: 'Your team' },
      { component: 'Windows 11 PC', address: '10.10.20.N', runs: 'Sysmon · Wazuh agent', who: 'Your team' },
      { component: 'Kali Linux', address: 'on the network', runs: 'Nmap · Nikto · attack tools', who: 'Builder (drives attacks)' },
      { component: 'Proxmox host', address: '10.10.10.45', runs: 'Runs all the VMs above', who: 'Builder only' },
    ],
  },
};

export function socTopology(courseId: string): SocTopology | undefined {
  return SOC_TOPOLOGY_BY_COURSE[courseId];
}

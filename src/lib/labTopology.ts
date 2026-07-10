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

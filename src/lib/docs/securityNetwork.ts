import { LAB_SUBNET, labHost } from '../labTopology';
import type { LabNetwork, NetHost } from './labNetwork';

/**
 * R152/R153 — the Security+ lab as a NETWORK: three hosts on one Host-Only segment under one hypervisor,
 * what each exposes, the controls Blue applies, and the attacks Red runs each week with Blue's answer.
 * Every host, port, control and attack carries a one-line description (R153) shown on click / on step.
 *
 * Every address comes from `labTopology`; every `builtBy` is a real task id or `task::step` key of the
 * course (`labNetwork.test.ts` proves it). DVWA runs in Docker on :8080 — the one true port (R152); :80
 * is the Ubuntu host's own web server. Tool names are categories, never commands. Weeks 5–6 are the
 * off-network AI module and are not part of this picture.
 */
const kali = labHost('kali');
const ubuntu = labHost('ubuntu');
const windows = labHost('windows');

const HOSTS: NetHost[] = [
  {
    id: 'kali',
    label: 'Kali attacker',
    description: 'The attacker’s machine — where Red runs recon, scanning and exploitation inside the authorised scope.',
    addr: kali.ip,
    kind: 'attacker',
    role: 'red',
    x: 130,
    y: 150,
    services: [],
    controls: [],
  },
  {
    id: 'ubuntu',
    label: 'Ubuntu web server',
    description: 'The target web server; it runs DVWA in Docker and is where most attacks land.',
    addr: ubuntu.ip,
    kind: 'server',
    role: 'blue',
    x: 470,
    y: 150,
    services: [
      { port: 22, proto: 'tcp', name: 'SSH', description: 'Remote shell for admins; a brute-force and entry target, so fail2ban watches it.', from: 0 },
      { port: 80, proto: 'tcp', name: 'host web', description: 'The Ubuntu host’s own web server, kept separate from the DVWA target on 8080.', from: 0 },
      { port: 8080, proto: 'tcp', name: 'DVWA (Docker)', description: 'The deliberately vulnerable app in Docker; the Week-3 attack surface for injection and more.', from: 0 },
      { port: 3306, proto: 'tcp', name: 'MySQL', description: 'The database behind DVWA; what a successful SQL injection reads from.', from: 0 },
      { port: 53, proto: 'udp', name: 'DNS', description: 'Name service the lab uses; Red queries it during passive reconnaissance.', from: 0 },
    ],
    controls: [
      { id: 'ctl:ubuntu-snapshot', label: 'pre-hardening snapshot', description: 'A clean restore point taken before hardening, so the host can be rolled back after the breach.', kind: 'recover', arrives: 0, role: 'blue', builtBy: ['blue-w0-setup::blue-w0-s3'] },
      { id: 'ctl:ubuntu-ufw', label: 'ufw firewall', description: 'The host firewall: only the ports in scope are allowed, everything else is denied.', kind: 'harden', arrives: 1, role: 'blue', builtBy: ['blue-w1-hardening::blue-w1-s3'] },
      { id: 'ctl:ubuntu-fail2ban', label: 'fail2ban', description: 'Bans an address after repeated failed SSH logins, blunting brute force.', kind: 'harden', arrives: 1, role: 'blue', builtBy: ['blue-w1-hardening::blue-w1-s4'] },
      { id: 'ctl:ubuntu-lynis', label: 'Lynis audit', description: 'An audit that scores the host against a hardening baseline and lists what to fix.', kind: 'harden', arrives: 1, role: 'blue', builtBy: ['blue-w1-hardening::blue-w1-s5'] },
      { id: 'ctl:ubuntu-capture', label: 'packet capture', description: 'Records network traffic to a file so an attack can be seen and replayed.', kind: 'detect', arrives: 2, role: 'blue', builtBy: ['blue-w2-baseline::blue-w2-s1', 'blue-w2-baseline::blue-w2-s2'] },
      { id: 'ctl:ubuntu-filters', label: 'detection filters', description: 'Saved filters that pick a SYN scan or a SQL-injection request out of the capture.', kind: 'detect', arrives: 2, role: 'blue', builtBy: ['blue-w2-baseline::blue-w2-s3'] },
      { id: 'ctl:ubuntu-weblog', label: 'web-log watch', description: 'Watches the DVWA container’s web log for the injection as it is tried.', kind: 'detect', arrives: 3, role: 'blue', builtBy: ['blue-w3-detection::blue-w3-s2', 'blue-w3-detection::blue-w3-s3'] },
      { id: 'ctl:ubuntu-ufwdeny', label: 'ufw deny', description: 'A deny rule that cuts the attacker’s address off once the case is confirmed.', kind: 'contain', arrives: 3, role: 'blue', builtBy: ['blue-w3-detection::blue-w3-s4'] },
    ],
  },
  {
    id: 'windows',
    label: 'Windows host',
    description: 'The optional second target: a Windows endpoint reached over RDP, with local accounts to defend.',
    addr: windows.ip,
    kind: 'endpoint',
    role: 'blue',
    optional: true,
    x: 760,
    y: 150,
    services: [{ port: 3389, proto: 'tcp', name: 'RDP', description: 'Remote Desktop into the Windows host; failed sign-ins here show up as event 4625.', from: 0 }],
    controls: [
      { id: 'ctl:win-firewall', label: 'Windows Firewall', description: 'The Windows Firewall, turned on across every profile.', kind: 'harden', arrives: 1, role: 'blue', builtBy: ['blue-w1-hardening::blue-w1-s6'] },
      { id: 'ctl:win-defender', label: 'Defender · SMBv1 off', description: 'Microsoft Defender on with real-time scanning, and the legacy SMBv1 protocol removed.', kind: 'harden', arrives: 1, role: 'blue', builtBy: ['blue-w1-hardening::blue-w1-s7'] },
      { id: 'ctl:win-logging', label: 'logon auditing', description: 'Logon auditing on, so successful and failed sign-ins are recorded (events 4624/4625).', kind: 'detect', arrives: 2, role: 'blue', builtBy: ['blue-w2-baseline::blue-w2-s4'] },
      { id: 'ctl:win-block', label: 'firewall block rule', description: 'A firewall rule that blocks the source after the failed-logon spike.', kind: 'contain', arrives: 3, role: 'blue', builtBy: ['blue-w3-detection::blue-w3-s5'] },
    ],
  },
];

export const NETWORK: LabNetwork = {
  copy: {
    title: 'The lab network — what you attack, defend and watch',
    howToRead:
      'One isolated Host-Only network. Kali on the left is the attacker; the Ubuntu web server and the optional Windows host are the targets. Each card shows its open ports and the controls on it. Switch Before and After to see the week change the system; step through the numbered attacks to follow Red, with the Blue answer to each; click any host, port or control for a description.',
    footer: 'The addresses are the worked example; your Lab access panel substitutes your own into every command.',
  },
  view: { w: 960, h: 520 },
  subnet: LAB_SUBNET,
  fabric: {
    hypervisor: {
      id: 'hypervisor',
      label: 'Hypervisor',
      description: 'Runs every VM on one isolated Host-Only network with no route to the internet.',
      kind: 'hypervisor',
      x: 130,
      y: 430,
      services: [],
      controls: [],
    },
    segment: { id: 'hostonly', label: 'Host-Only network', note: LAB_SUBNET, y: 150 },
  },
  hosts: HOSTS,
  weeks: [
    {
      week: 0,
      wire: 'reachability',
      focus: 'Stand up the lab and confirm the targets answer.',
      before: 'Empty lab: VMs built, DVWA up on :8080, a pre-hardening snapshot taken.',
      after: 'Kali reaches both targets; the scope and rules of engagement are signed.',
      attacks: [{ n: 1, kind: 'reconnaissance', from: 'kali', to: 'ubuntu', tool: 'connectivity check', description: 'A reachability check that the attacker can see the target before any testing begins.', builtBy: 'red-w0-setup::red-w0-s2' }],
    },
    {
      week: 1,
      wire: 'OSINT · passive recon',
      focus: 'Profile the target quietly while Blue hardens the baseline.',
      before: 'Both hosts unhardened; only passive recon so far.',
      after: 'Baseline hardening on both hosts: ufw, fail2ban, Lynis, Windows Firewall, Defender, SMBv1 off.',
      attacks: [{ n: 1, kind: 'reconnaissance', from: 'kali', to: 'ubuntu', port: 80, tool: 'OSINT and web fingerprinting', description: 'Passive profiling from public sources and the site’s own banners, making no noise on the target.', builtBy: 'red-w1-osint::red-w1-s3' }],
    },
    {
      week: 2,
      wire: 'port & web scanning',
      focus: 'Find the weaknesses while Blue learns what normal looks like.',
      before: 'Hosts hardened; no detection in place yet.',
      after: 'Packet capture, detection filters and Windows logon auditing are live; risks are scored.',
      attacks: [
        { n: 1, kind: 'scanning', from: 'kali', to: 'ubuntu', tool: 'all-ports scanner', description: 'Sweeps every TCP port to map what the host exposes and where to look next.', builtBy: 'red-w2-enumeration::red-w2-s1', response: { kind: 'detect', controlId: 'ctl:ubuntu-filters', builtBy: 'blue-w2-baseline::blue-w2-s3', label: 'the SYN-scan filter flags the scan' } },
        { n: 2, kind: 'enumeration', from: 'kali', to: 'ubuntu', port: 80, tool: 'web vulnerability scanner', description: 'Probes the web server for known weaknesses and misconfigurations to follow up.', builtBy: 'red-w2-enumeration::red-w2-s2', response: { kind: 'detect', controlId: 'ctl:ubuntu-capture', builtBy: 'blue-w2-baseline::blue-w2-s1', label: 'the baseline capture records it' } },
        { n: 3, kind: 'enumeration', from: 'kali', to: 'ubuntu', port: 22, tool: 'service enumeration', description: 'Questions the SSH service to learn which login methods it will accept.', builtBy: 'red-w2-enumeration::red-w2-s3' },
      ],
    },
    {
      week: 3,
      wire: 'live exploits',
      focus: 'Attack for real while Blue detects, contains and preserves evidence.',
      before: 'Hardened and instrumented; the attack is about to land.',
      after: 'The breach is proven; Blue detected and contained on both hosts; the evidence is hashed.',
      attacks: [
        { n: 1, kind: 'injection', from: 'kali', to: 'ubuntu', port: 8080, tool: 'SQL-injection tool', description: 'Feeds crafted input the app trusts, reading the database behind DVWA.', builtBy: 'red-w3-attacks::red-w3-s1', response: { kind: 'detect', controlId: 'ctl:ubuntu-weblog', builtBy: 'blue-w3-detection::blue-w3-s3', label: 'the web-log watch catches the UNION/SELECT' } },
        { n: 2, kind: 'brute-force', from: 'kali', to: 'ubuntu', port: 8080, tool: 'login brute-forcer', description: 'Tries many passwords against the DVWA login until one works.', builtBy: 'red-w3-attacks::red-w3-s2', response: { kind: 'contain', controlId: 'ctl:ubuntu-ufwdeny', builtBy: 'blue-w3-detection::blue-w3-s4', label: 'ufw deny blocks the source' } },
        { n: 3, kind: 'remote-code-execution', from: 'kali', to: 'ubuntu', port: 8080, tool: 'command injection to a shell', description: 'Turns an unchecked input into commands on the host, opening a remote shell.', builtBy: 'red-w3-attacks::red-w3-s3', response: { kind: 'detect', controlId: 'ctl:ubuntu-capture', builtBy: 'blue-w3-detection::blue-w3-s1', label: 'the live capture records the shell' } },
        { n: 4, kind: 'remote-code-execution', from: 'kali', to: 'ubuntu', port: 8080, tool: 'exploit framework upload', description: 'Uploads a malicious file through DVWA to run code and gain a foothold.', builtBy: 'red-w3-attacks::red-w3-msf' },
        { n: 5, kind: 'brute-force', from: 'windows', to: 'windows', port: 3389, tool: "Blue's own test logons", description: 'Blue triggers failed RDP logons on its own host to prove the 4625 detection fires.', selfTest: true, response: { kind: 'detect', controlId: 'ctl:win-logging', builtBy: 'blue-w3-detection::blue-w3-s5', label: 'the 4625 spike is detected and a firewall rule added' } },
      ],
    },
    {
      week: 4,
      wire: 'findings & report',
      focus: 'No new traffic: compile the evidence into findings and recommendations.',
      before: 'The incident is closed; the evidence is preserved.',
      after: 'The final report and the briefing are delivered.',
      attacks: [],
    },
  ],
  spec: {
    columns: ['Host', 'Address', 'Ports', 'Who'],
    rows: [
      ['Hypervisor', '—', 'VirtualBox · VMware · UTM', 'Everyone'],
      ['Kali attacker', kali.ip, 'recon · scan · exploit', 'Red'],
      ['Ubuntu web server', ubuntu.ip, 'SSH 22 · web 80 · DVWA 8080 · MySQL 3306', 'Blue'],
      ['Windows host', windows.ip, 'RDP 3389', 'Blue'],
    ],
  },
};

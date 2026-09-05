/**
 * Single source of truth for the Server+ capstone topology.
 *
 * The configuration guide arrived in the platform as a *copy* of the seed rather
 * than as a second reader of it, and the copies had already disagreed before the
 * commit that made them landed: one surface handed 192.168.0.4 to the optional
 * monitoring host while another told teams to start their own VMs there. Five
 * hand-typed tables cannot be kept in step by care alone — a subnet, a gateway or
 * a hostname changes in four of them and the fifth quietly becomes a lie a
 * student follows into an address collision.
 *
 * So the addressing lives here once, and the guide, the topology diagram and
 * anything that comes next render it rather than restate it. Moving the private
 * zone is now one edit, and there is no fifth place to forget.
 *
 * The one thing deliberately NOT centralised is the body of a shell command. A
 * student copies `ping -c 4 192.168.0.1` and types it at a prompt; a command
 * assembled out of constants stops reading like the thing they will type. Those
 * literals stay inline in the procedure text — `src/lib/page-shape.test.ts`
 * scans everything else, so the tables and labels cannot drift back.
 *
 * This is the Server+ sibling of `labTopology.ts`, which does the same job for
 * the CySA+ SOC lab.
 */

/**
 * The school network every team's management interface sits on.
 *
 * The gateway is NOT on the same third octet as the hosts: hosts sit at
 * 10.10.30.T and the gateway answers on 10.10.10.1, and both are reachable only
 * because the prefix is /16. That gap is exactly why a /24 here fails — and why
 * the gateway was wrong in this file for so long without anything noticing.
 */
export const CAMPUS_LAN = {
  cidr: '10.10.0.0/16',
  gateway: '10.10.10.1',
};

/**
 * The Proxmox host address rule.
 *
 * Every team gets the same third octet and its own fourth: `T` is the team
 * number, so Team 1 is 10.10.30.1. The guide is written around Team 1 because a
 * procedure full of substitution markers is unreadable.
 */
export const HOST = {
  hostname: 'pve-host',
  /** The rule as it is printed to students, marker and all. */
  rule: '10.10.30.T',
  /** The letter a team replaces with its own number. */
  teamMarker: 'T',
  consolePort: 8006,
  exampleTeam: 1,
  exampleAddress: '10.10.30.1',
};

/** What a student types into the browser to reach the Proxmox web console. */
export const HOST_CONSOLE_URL = `https://${HOST.rule}:${HOST.consolePort}`;

/**
 * The Proxmox root login every team sets during the Week 1 install.
 *
 * One classroom password rather than a per-team choice, for the same reason the
 * CySA SOC has one (`SOC_LOGIN` in labTopology.ts): an instructor walking twelve
 * benches cannot help with a console nobody can open, and a password students
 * invent on install day is the thing most often lost by Week 4.
 *
 * `page-shape.test.ts` asserts this literal appears nowhere else, so the guide,
 * the week steps and the forms all read it from here. Week 4 hardening is where
 * a real deployment would rotate it — the course says so rather than pretending
 * a shared password is good practice.
 */
export const HOST_ROOT_LOGIN = { user: 'root', password: 'Pass@2026' };

export interface Bridge {
  id: 'vmbr0' | 'vmbr1' | 'vmbr2';
  /** Zone name as it is labelled on the diagram and in the IP plan. */
  zone: string;
  cidr: string;
  /** Held by the Proxmox host itself, until the later Cisco phase moves it. */
  gateway: string;
  note: string;
}

export const BRIDGES: Bridge[] = [
  {
    id: 'vmbr0',
    zone: 'Management',
    cidr: CAMPUS_LAN.cidr,
    gateway: CAMPUS_LAN.gateway,
    note: 'The campus LAN. The host lives here and every other zone routes out through it.',
  },
  {
    id: 'vmbr1',
    zone: 'DMZ',
    cidr: '172.16.0.0/24',
    gateway: '172.16.0.1',
    note: 'Public-facing only. The website answers here and nothing internal belongs in it.',
  },
  {
    id: 'vmbr2',
    zone: 'Private',
    cidr: '192.168.0.0/24',
    gateway: '192.168.0.1',
    note: 'Internal systems. Later mapped to a physical NIC into the Cisco router and switch.',
  },
];

export function bridge(id: Bridge['id']): Bridge {
  return BRIDGES.find((b) => b.id === id)!;
}

/** A segmented zone — everything except the management bridge. */
export type ZoneBridgeId = Exclude<Bridge['id'], 'vmbr0'>;

/** The two segmented zones, in the order the diagram and the guide draw them. */
export const ZONE_BRIDGES = BRIDGES.filter(
  (b): b is Bridge & { id: ZoneBridgeId } => b.id !== 'vmbr0',
);

export interface BaseVm {
  hostname: 'websrv' | 'winserver' | 'linuxsrv' | 'secmon';
  address: string;
  bridge: Bridge['id'];
  os: string;
  /** What the machine is for, short enough to sit inside a diagram node. */
  runs: string;
  /** The services it carries, for the addressing table and the IP plan. */
  services: string[];
  /** Advanced monitoring track — a real host, but not required to pass. */
  optional?: boolean;
}

/**
 * The base build: the same three machines on every team's host, plus the
 * optional monitoring host. Teams add their own business VMs beside these.
 */
export const BASE_VMS: BaseVm[] = [
  {
    hostname: 'websrv',
    address: '172.16.0.10',
    bridge: 'vmbr1',
    os: 'Ubuntu Server',
    runs: 'The website — public-facing',
    services: ['NGINX'],
  },
  {
    hostname: 'winserver',
    address: '192.168.0.2',
    bridge: 'vmbr2',
    os: 'Windows Server',
    runs: 'Windows Server — directory · DNS · DHCP',
    services: ['AD DS', 'DNS', 'DHCP'],
  },
  {
    hostname: 'linuxsrv',
    address: '192.168.0.3',
    bridge: 'vmbr2',
    os: 'Ubuntu Server',
    runs: 'Ubuntu Server — the database',
    services: ['MariaDB'],
  },
  {
    hostname: 'secmon',
    address: '192.168.0.4',
    bridge: 'vmbr2',
    os: 'Ubuntu Server',
    runs: 'Monitoring — the optional track',
    services: ['Prometheus', 'Grafana', 'Loki'],
    optional: true,
  },
];

export function vm(hostname: BaseVm['hostname']): BaseVm {
  return BASE_VMS.find((v) => v.hostname === hostname)!;
}

/** The required machines on a bridge — what every team builds, in build order. */
export function baseVmsOn(id: Bridge['id']): BaseVm[] {
  return BASE_VMS.filter((v) => v.bridge === id && !v.optional);
}

/** The optional Prometheus/Grafana/Loki host. It owns .4; teams start at .5. */
export const MONITORING_HOST = vm('secmon');


/**
 * Where a team's OWN business VMs start in each zone.
 *
 * The private zone starts at .5, not .4: .4 belongs to the optional monitoring
 * host, and a team on that track that also numbered its first VM .4 would have
 * built a duplicate address on purpose.
 */
export const TEAM_VM_START: Record<ZoneBridgeId, string> = {
  vmbr1: '172.16.0.11',
  vmbr2: '192.168.0.5',
};

/** The physical rack the one server is built into. */
export const RACK_UNITS = 24;

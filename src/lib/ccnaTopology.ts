/**
 * Single source of truth for the CCNA capstone's network.
 *
 * Every VLAN id, prefix, gateway, DHCP range, device name, interface and WAN
 * address the course names is here. The diagrams, the command registry, the IP
 * Plan form's worked rows and the configuration guide all render from this
 * module, for the reason `serverTopology.ts` exists: the Server+ guide was once
 * created by COPYING the seed, and the copies disagreed inside the commit that
 * introduced them. `page-shape.test.ts` holds the same line here — the key
 * literals below live in this file and nowhere else.
 *
 * WHY THESE RANGES. Deliberately clear of the other courses: Server+ owns
 * 10.10.10.x (campus), 172.16.0.x (DMZ), 192.168.0.x (private) and 10.20.0.x
 * (ops); CySA+ owns 10.10.100.x and 10.10.20.x. A CCNA student reading two
 * courses should never wonder which network they are looking at.
 *
 * THE CONVENTION THE COURSE TEACHES: the third octet IS the VLAN id. VLAN 20 at
 * headquarters is 10.50.20.0/24; VLAN 199 at the branch is 10.60.199.0/24. That
 * is a real design habit, it makes a `show ip route` readable at a glance, and it
 * means a student can derive an address instead of looking it up.
 *
 * These are the WORKED EXAMPLE the course is written around. A team on its own
 * hardware may use different numbers and records them in the IP Plan — the same
 * contract `labTopology.ts` states for the security courses.
 */

/** The fictional company the whole course serves. It grows every week: one
 *  office, then departments, then a second building, then a network somebody has
 *  to run. */
export const COMPANY = {
  name: 'Northgate Supply Co.',
  industry: 'Regional building-supplies distributor',
  /** Staff at the end of the build, which is what sizes the addressing. */
  staff: 85,
  /** Why the network is being rebuilt — the business requirement every design
   *  decision is traced back to in the Requirements form. */
  driver: 'One flat network, one switch out of ports, and a second building opening in six weeks.',
} as const;

export interface Site {
  id: 'hq' | 'branch';
  name: string;
  /** Short label for a diagram node. */
  short: string;
  /** The second octet every prefix at this site shares. */
  octet: number;
  /** Where the equipment lives, for the site survey and the cabling records. */
  rooms: string;
}

export const SITES: Site[] = [
  {
    id: 'hq',
    name: 'Austin HQ',
    short: 'HQ',
    octet: 50,
    rooms: 'MDF in the server room, an IDF on the warehouse mezzanine',
  },
  {
    id: 'branch',
    name: 'Round Rock branch',
    short: 'Branch',
    octet: 60,
    rooms: 'One wall-mount cabinet in the office',
  },
];

export function site(id: Site['id']): Site {
  return SITES.find((s) => s.id === id)!;
}

/**
 * A VLAN, with everything the LLD has to state about it.
 *
 * `purpose` is what the business calls this traffic — the sentence that makes an
 * ACL a policy rather than syntax. `dhcp` is absent where addresses are static,
 * which is itself a design decision a student has to be able to defend.
 */
export interface Vlan {
  id: number;
  /** The name configured on the switch, upper-case as Cisco convention has it. */
  name: string;
  site: Site['id'];
  purpose: string;
  /** Last octet range handed out by DHCP, or undefined for a static VLAN. */
  dhcp?: { from: number; to: number };
  /** Carried over the air by a WLAN as well as on copper. */
  wireless?: boolean;
  /** The management VLAN — the one the team administers the kit from. */
  management?: boolean;
}

export const VLANS: Vlan[] = [
  { id: 10, name: 'CORP-USERS', site: 'hq', purpose: 'Staff PCs and laptops', dhcp: { from: 50, to: 200 }, wireless: true },
  { id: 20, name: 'SERVERS', site: 'hq', purpose: 'File, DNS/DHCP and the order system' },
  { id: 30, name: 'VOICE', site: 'hq', purpose: 'Desk phones, on PoE', dhcp: { from: 50, to: 200 } },
  { id: 40, name: 'SECURITY', site: 'hq', purpose: 'Door controllers and cameras' },
  { id: 50, name: 'GUEST', site: 'hq', purpose: 'Visitors — internet only, never the LAN', dhcp: { from: 100, to: 200 }, wireless: true },
  { id: 60, name: 'IOT', site: 'hq', purpose: 'Warehouse scanners and printers', dhcp: { from: 50, to: 150 }, wireless: true },
  { id: 99, name: 'MGMT', site: 'hq', purpose: 'Switch and router management only', management: true },
  { id: 110, name: 'BR-USERS', site: 'branch', purpose: 'Branch staff PCs', dhcp: { from: 50, to: 200 }, wireless: true },
  { id: 130, name: 'BR-VOICE', site: 'branch', purpose: 'Branch desk phones', dhcp: { from: 50, to: 200 } },
  { id: 199, name: 'BR-MGMT', site: 'branch', purpose: 'Branch kit management only', management: true },
];

export function vlan(id: number): Vlan {
  const v = VLANS.find((x) => x.id === id);
  if (!v) throw new Error(`no VLAN ${id} in the plan`);
  return v;
}

/** The VLANs of one site, in id order — what a trunk has to carry. */
export function vlansAt(id: Site['id']): Vlan[] {
  return VLANS.filter((v) => v.site === id);
}

/* ── Addressing, derived rather than restated ───────────────────────────────
 *
 * Every function below computes an address from the VLAN and its site. Nothing
 * that can be derived is typed out, which is what stops the IP plan, the guide
 * and the diagram from ever disagreeing: there is one rule and they all run it.
 * ────────────────────────────────────────────────────────────────────────── */

/** The /24 a VLAN lives in — third octet is the VLAN id. */
export function prefixOf(v: Vlan): string {
  return `10.${site(v.site).octet}.${v.id}.0/24`;
}

/** The network address without the mask. */
export function networkOf(v: Vlan): string {
  return `10.${site(v.site).octet}.${v.id}.0`;
}

/** The default gateway: always `.1`, always the routing device at that site. */
export function gatewayOf(v: Vlan): string {
  return `10.${site(v.site).octet}.${v.id}.1`;
}

/** Any host address in a VLAN, by last octet. */
export function addressIn(v: Vlan, host: number): string {
  return `10.${site(v.site).octet}.${v.id}.${host}`;
}

/** The DHCP pool as a student would write it in the LLD. */
export function dhcpRangeOf(v: Vlan): string | undefined {
  if (!v.dhcp) return undefined;
  return `${addressIn(v, v.dhcp.from)}–${addressIn(v, v.dhcp.to)}`;
}

/** Every /24 here is a /24: the course uses one mask so subnetting is taught
 *  once, on purpose, rather than as a puzzle in every week. */
export const SITE_MASK = '255.255.255.0';

/* ── The equipment the course is written for ────────────────────────────── */

/**
 * What a device IS, in the terms the capability model uses.
 *
 * The class decides what the device can be asked to do, and Week 0's Equipment
 * Register records which of these the team actually has. A team with no
 * `l3-switch` does inter-VLAN routing on a router instead — same requirement,
 * different procedure — which is why the class is data and not prose.
 */
export type DeviceClass =
  | 'router'
  | 'l3-switch'
  | 'l2-switch'
  | 'ap'
  | 'wlc'
  | 'firewall'
  | 'server'
  | 'workstation';

export interface Device {
  /** The hostname configured on the device, and its name in every record. */
  name: string;
  class: DeviceClass;
  site: Site['id'];
  /** What it does, short enough to sit inside a diagram node. */
  runs: string;
  /** Management address: VLAN id and last octet, resolved by `mgmtAddress`. */
  mgmt?: { vlan: number; host: number };
  /** The week this device first appears, so the diagram can fill in as the build
   *  does rather than showing a finished network on day one. */
  arrives: number;
  /** Not required to pass: the advanced weeks' tooling and the optional kit. */
  optional?: boolean;
}

export const DEVICES: Device[] = [
  {
    name: 'R1-HQ',
    class: 'router',
    site: 'hq',
    runs: 'Edge router — internet, NAT, OSPF',
    mgmt: { vlan: 99, host: 2 },
    arrives: 3,
  },
  {
    name: 'SW-CORE-01',
    class: 'l3-switch',
    site: 'hq',
    runs: 'Core switch — SVIs, inter-VLAN routing',
    mgmt: { vlan: 99, host: 10 },
    arrives: 1,
  },
  {
    name: 'SW-ACC-01',
    class: 'l2-switch',
    site: 'hq',
    runs: 'Access switch — offices, trunk to core',
    mgmt: { vlan: 99, host: 11 },
    arrives: 1,
  },
  {
    name: 'SW-ACC-02',
    class: 'l2-switch',
    site: 'hq',
    runs: 'Access switch — warehouse IDF, PoE for phones',
    mgmt: { vlan: 99, host: 12 },
    arrives: 2,
  },
  {
    name: 'AP-01',
    class: 'ap',
    site: 'hq',
    runs: 'Access point — CORP, GUEST and IOT WLANs',
    mgmt: { vlan: 99, host: 20 },
    arrives: 4,
  },
  {
    name: 'R2-BR',
    class: 'router',
    site: 'branch',
    runs: 'Branch router — WAN to HQ, OSPF',
    mgmt: { vlan: 199, host: 2 },
    arrives: 3,
  },
  {
    name: 'SW-BR-01',
    class: 'l2-switch',
    site: 'branch',
    runs: 'Branch access switch',
    mgmt: { vlan: 199, host: 11 },
    arrives: 3,
  },
  {
    name: 'SRV-CORE',
    class: 'server',
    site: 'hq',
    runs: 'DNS · DHCP · the order system',
    mgmt: { vlan: 20, host: 10 },
    arrives: 2,
  },
  {
    name: 'NETOPS',
    class: 'server',
    site: 'hq',
    runs: 'NetBox · LibreNMS · Oxidized — the advanced weeks',
    mgmt: { vlan: 20, host: 20 },
    arrives: 5,
    optional: true,
  },
  {
    name: 'ADMIN-PC',
    class: 'workstation',
    site: 'hq',
    runs: 'Where you work — console, SSH, browser',
    mgmt: { vlan: 99, host: 50 },
    arrives: 0,
  },
];

export function device(name: string): Device {
  const d = DEVICES.find((x) => x.name === name);
  if (!d) throw new Error(`no device '${name}' in the topology`);
  return d;
}

/** The devices at a site, in the order the build reaches them. */
export function devicesAt(id: Site['id']): Device[] {
  return DEVICES.filter((d) => d.site === id).sort((a, b) => a.arrives - b.arrives);
}

/** Every device of a class — what a capability question is really asking. */
export function devicesOfClass(c: DeviceClass): Device[] {
  return DEVICES.filter((d) => d.class === c);
}

/** A device's management address, resolved through the VLAN plan. */
export function mgmtAddress(d: Device): string | undefined {
  if (!d.mgmt) return undefined;
  return addressIn(vlan(d.mgmt.vlan), d.mgmt.host);
}

/* ── The links between them ─────────────────────────────────────────────── */

/**
 * A cable, as the cabling record and the physical diagram both need it.
 *
 * `kind` is what the link IS, which is also what a student has to verify: an
 * access port carries one VLAN, a trunk carries a list, an EtherChannel is two
 * ports behaving as one.
 */
export interface Link {
  from: { device: string; port: string };
  to: { device: string; port: string };
  kind: 'access' | 'trunk' | 'etherchannel' | 'routed' | 'wan' | 'uplink';
  /** Media, because the course teaches that copper and fibre are choices. */
  media: 'cat6' | 'fiber-mm' | 'serial';
  /** VLANs carried, for a trunk. */
  vlans?: number[];
  arrives: number;
}

export const LINKS: Link[] = [
  {
    from: { device: 'SW-ACC-01', port: 'Gi1/0/24' },
    to: { device: 'SW-CORE-01', port: 'Gi1/0/1' },
    kind: 'trunk',
    media: 'cat6',
    vlans: [10, 20, 30, 40, 50, 60, 99],
    arrives: 2,
  },
  {
    from: { device: 'SW-ACC-02', port: 'Gi1/0/23' },
    to: { device: 'SW-CORE-01', port: 'Gi1/0/2' },
    kind: 'etherchannel',
    media: 'cat6',
    vlans: [10, 20, 30, 40, 50, 60, 99],
    arrives: 2,
  },
  {
    from: { device: 'SW-CORE-01', port: 'Gi1/0/48' },
    to: { device: 'R1-HQ', port: 'Gi0/0/1' },
    kind: 'routed',
    media: 'cat6',
    arrives: 3,
  },
  {
    from: { device: 'R1-HQ', port: 'Gi0/0/0' },
    to: { device: 'R2-BR', port: 'Gi0/0/0' },
    kind: 'wan',
    media: 'serial',
    arrives: 3,
  },
  {
    from: { device: 'SW-BR-01', port: 'Gi1/0/24' },
    to: { device: 'R2-BR', port: 'Gi0/0/1' },
    kind: 'trunk',
    media: 'cat6',
    vlans: [110, 130, 199],
    arrives: 3,
  },
  {
    from: { device: 'AP-01', port: 'GigabitEthernet0' },
    to: { device: 'SW-ACC-01', port: 'Gi1/0/20' },
    kind: 'uplink',
    media: 'cat6',
    vlans: [10, 50, 60, 99],
    arrives: 4,
  },
];

/* ── Beyond the walls: the WAN and the internet ─────────────────────────── */

/**
 * The link between the two buildings, and the circuit to the ISP.
 *
 * `198.51.100.0/24` and the /30 below are the IETF documentation ranges
 * (RFC 5737). Using them rather than an invented "public" address is itself part
 * of the lesson: a design document that ships a real third party's address is a
 * document nobody should copy.
 */
export const WAN = {
  /** The point-to-point link HQ ↔ branch. A /30 is two usable addresses, which
   *  is exactly what a point-to-point link needs and nothing more. */
  prefix: '10.255.255.0/30',
  mask: '255.255.255.252',
  hq: '10.255.255.1',
  branch: '10.255.255.2',
  /** Single-area OSPF: every link is in the backbone. Areas are a CCNP problem;
   *  one area, correctly adjacent, is the CCNA outcome. */
  ospfArea: 0,
  ospfProcess: 1,
} as const;

export const ISP = {
  /** The outside interface of the edge router. */
  outside: '198.51.100.2',
  prefix: '198.51.100.0/30',
  mask: '255.255.255.252',
  gateway: '198.51.100.1',
  name: 'Lonestar Fibre',
  circuit: 'LSF-44127',
  speed: '200 Mbps symmetric',
} as const;

/**
 * Services every device points at, so no command invents its own.
 *
 * Derived from the devices that provide them rather than typed again: the
 * resolver IS `SRV-CORE`'s address, and the syslog collector IS `NETOPS`'s. Type
 * either one out and the day somebody moves a server, half the course keeps
 * pointing at where it used to be.
 */
export const SERVICES = {
  /** The company's own resolver and DHCP server. */
  dns: mgmtAddress(device('SRV-CORE'))!,
  dhcp: mgmtAddress(device('SRV-CORE'))!,
  /** The router is the NTP server for the kit; it syncs from the pool itself. */
  ntpUpstream: 'pool.ntp.org',
  /** Where syslog and SNMP land once Week 6 stands the NOC up. */
  syslog: mgmtAddress(device('NETOPS'))!,
  snmpTarget: mgmtAddress(device('NETOPS'))!,
  domain: 'northgate.local',
} as const;

/* ── The policy the ACLs enforce ────────────────────────────────────────── */

/**
 * What may reach what — the business rules, written before any ACL exists.
 *
 * Week 4 turns these rows into access lists. Keeping them here, in the model,
 * is what makes an ACL reviewable: a reviewer checks the configuration against
 * a stated rule instead of reading the rule out of the configuration.
 */
export interface PolicyRule {
  from: number;
  to: number | 'internet';
  allow: boolean;
  /** Why, in the words the business would use. */
  because: string;
}

export const POLICY: PolicyRule[] = [
  { from: 50, to: 'internet', allow: true, because: 'Guests get internet — that is the whole service' },
  { from: 50, to: 10, allow: false, because: 'A visitor must never reach a staff PC' },
  { from: 50, to: 20, allow: false, because: 'A visitor must never reach the order system' },
  { from: 60, to: 20, allow: true, because: 'Warehouse scanners post to the order system' },
  { from: 60, to: 'internet', allow: false, because: 'Scanners have no business on the internet' },
  { from: 10, to: 20, allow: true, because: 'Staff use the order system all day' },
  { from: 40, to: 20, allow: false, because: 'Cameras record; they do not talk to servers' },
  { from: 10, to: 99, allow: false, because: 'Only the network team reaches the management VLAN' },
];

/** The rules that govern one VLAN, for the ACL the student writes on it. */
export function policyFor(vlanId: number): PolicyRule[] {
  return POLICY.filter((p) => p.from === vlanId);
}

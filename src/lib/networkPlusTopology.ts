/**
 * The Network+ capstone's branch network, as DATA (R131).
 *
 * One small branch office: two access switches, one router, four VLANs, an
 * ISP link. The seed, the forms and the picture read every name and address
 * from here, so nothing is typed twice. The addressing rule the course
 * teaches is the CCNA one — the third octet IS the VLAN id — in its own
 * second octet (70) so a student reading two courses never meets the same
 * subnet twice: Security+ owns 10.10.10.x, CySA+ 10.10.100.x and 10.10.20.x,
 * Server+ 10.10.0.0/16, 172.16.0.x, 192.168.0.x and 10.20.0.x, CCNA 10.50.x
 * and 10.60.x with 10.255.255.0/30 for its WAN. The ISP side is in the RFC
 * 5737 documentation range, so nothing "public" here is anyone's address.
 */

export const COMPANY = {
  name: 'Millbrook Vets — Riverside branch',
  driver:
    'A new branch opens in six weeks with one flat network drawn on a napkin: staff PCs, two printers, a guest WiFi for the waiting room, and one router the ISP will ship. It needs a design that separates guests from patient records, a build the team can prove, and a plan to buy the real equipment.',
  people: 9,
};

/** The one site. */
export const SITE = { id: 'riverside', name: 'Riverside branch', octet: 70 } as const;

export interface Vlan {
  id: number;
  name: string;
  purpose: string;
  /** DHCP pool as host numbers, or none for a static VLAN. */
  pool?: [number, number];
}

export const VLANS: Vlan[] = [
  { id: 10, name: 'Staff', purpose: 'Reception and consulting-room PCs; reaches the practice system and the internet.', pool: [50, 199] },
  { id: 20, name: 'Devices', purpose: 'Printers and the label printer; reachable from Staff only.', pool: [50, 99] },
  { id: 30, name: 'Guest', purpose: 'The waiting-room WiFi; internet only, never the practice.', pool: [50, 250] },
  { id: 99, name: 'Management', purpose: 'The switches and the router, reached by the network team only.' },
];

export function vlan(id: number): Vlan {
  const v = VLANS.find((x) => x.id === id);
  if (!v) throw new Error(`no VLAN ${id}`);
  return v;
}

/** 10.70.<vlan>.0/24 — the third octet is the VLAN id. */
export function prefixOf(v: Vlan): string {
  return `10.${SITE.octet}.${v.id}.0/24`;
}

export function gatewayOf(v: Vlan): string {
  return `10.${SITE.octet}.${v.id}.1`;
}

export function addressIn(v: Vlan, host: number): string {
  return `10.${SITE.octet}.${v.id}.${host}`;
}

export function dhcpRangeOf(v: Vlan): string | undefined {
  return v.pool ? `${addressIn(v, v.pool[0])} – ${addressIn(v, v.pool[1])}` : undefined;
}

export const SITE_MASK = '255.255.255.0';

export type DeviceClass = 'router' | 'l2-switch' | 'pc' | 'printer' | 'ap' | 'cloud';

export interface Device {
  name: string;
  class: DeviceClass;
  /** The Packet Tracer model to place, so the build log and the design say the same thing. */
  model: string;
  /** The management VLAN host number (switches and the router) or the static host (printer). */
  host?: number;
  vlan?: number;
  purpose: string;
}

export const DEVICES: Device[] = [
  { name: 'R1-BR', class: 'router', model: 'ISR 4321', host: 1, vlan: 99, purpose: 'Routes between the VLANs and out to the ISP with NAT' },
  { name: 'SW-01', class: 'l2-switch', model: 'Catalyst 2960-24TT', host: 11, vlan: 99, purpose: 'Reception: staff PCs, the printer and the guest access point' },
  { name: 'SW-02', class: 'l2-switch', model: 'Catalyst 2960-24TT', host: 12, vlan: 99, purpose: 'Consulting rooms: staff PCs and the label printer' },
  { name: 'PC-STAFF-1', class: 'pc', model: 'PC-PT', vlan: 10, purpose: 'Reception desk; proves Staff reaches Devices and the internet' },
  { name: 'PC-STAFF-2', class: 'pc', model: 'PC-PT', vlan: 10, purpose: 'Consulting room; proves the trunk carries Staff between switches' },
  { name: 'PRINTER-1', class: 'printer', model: 'Printer-PT', host: 20, vlan: 20, purpose: 'Reception printer, static address; reachable from Staff only' },
  { name: 'AP-GUEST', class: 'ap', model: 'AccessPoint-PT', vlan: 30, purpose: 'Waiting-room WiFi on the Guest VLAN' },
  { name: 'PC-GUEST-1', class: 'pc', model: 'Laptop-PT', vlan: 30, purpose: 'A guest; proves the internet works and the practice is refused' },
  { name: 'ISP', class: 'cloud', model: 'Cloud-PT', purpose: 'The provider; one public address on the far end of the link' },
];

export function device(name: string): Device {
  const d = DEVICES.find((x) => x.name === name);
  if (!d) throw new Error(`no device ${name}`);
  return d;
}

export function mgmtAddress(d: Device): string | undefined {
  return d.host !== undefined && d.vlan !== undefined ? addressIn(vlan(d.vlan), d.host) : undefined;
}

export interface Link {
  from: string;
  fromPort: string;
  to: string;
  toPort: string;
  kind: 'access' | 'trunk' | 'wan';
  vlan?: number;
}

export const LINKS: Link[] = [
  { from: 'SW-01', fromPort: 'Gi0/1', to: 'R1-BR', toPort: 'Gi0/0/0', kind: 'trunk' },
  { from: 'SW-01', fromPort: 'Gi0/2', to: 'SW-02', toPort: 'Gi0/1', kind: 'trunk' },
  { from: 'SW-01', fromPort: 'Fa0/1', to: 'PC-STAFF-1', toPort: 'Fa0', kind: 'access', vlan: 10 },
  { from: 'SW-01', fromPort: 'Fa0/10', to: 'PRINTER-1', toPort: 'Fa0', kind: 'access', vlan: 20 },
  { from: 'SW-01', fromPort: 'Fa0/20', to: 'AP-GUEST', toPort: 'Port 0', kind: 'access', vlan: 30 },
  { from: 'SW-02', fromPort: 'Fa0/1', to: 'PC-STAFF-2', toPort: 'Fa0', kind: 'access', vlan: 10 },
  { from: 'R1-BR', fromPort: 'Gi0/0/1', to: 'ISP', toPort: 'Eth6', kind: 'wan' },
];

/** The ISP link: RFC 5737 documentation addresses, so nothing here is real. */
export const WAN = {
  prefix: '203.0.113.0/30',
  router: '203.0.113.2',
  isp: '203.0.113.1',
  /** What the branch resolves names with; the ISP's resolver in the lab. */
  dns: '203.0.113.53',
};

export interface PolicyRule {
  from: number;
  to: 'practice' | 'internet' | number;
  allow: boolean;
  why: string;
}

/** The business rules the ACLs enforce; the Guest line is the one that is proved by a refusal. */
export const POLICY: PolicyRule[] = [
  { from: 10, to: 20, allow: true, why: 'Staff print.' },
  { from: 10, to: 'internet', allow: true, why: 'Staff look things up and reach the practice system.' },
  { from: 30, to: 'internet', allow: true, why: 'Guests browse while they wait.' },
  { from: 30, to: 10, allow: false, why: 'A guest never reaches a staff PC.' },
  { from: 30, to: 20, allow: false, why: 'A guest never reaches a printer.' },
  { from: 30, to: 99, allow: false, why: 'Nobody but the network team reaches the switches.' },
  { from: 20, to: 'internet', allow: false, why: 'A printer has no reason to call out.' },
];

export function policyFor(vlanId: number): PolicyRule[] {
  return POLICY.filter((p) => p.from === vlanId);
}

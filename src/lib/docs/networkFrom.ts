import type { Course, Role, Step, Task } from '../types';
import type { BuildModel } from '../weekVisual';
import type { ArchKind, ArchNode, ArchPart, ArchPicture } from './archPicture';
import type { CloudContainer, CloudIconKey, CloudNode, CloudTopology } from '../cloud/model';
import {
  allHosts,
  layoutNetwork,
  type ActionKind,
  type AttackKind,
  type ControlKind,
  type HostKind,
  type LabNetwork,
  type NetAction,
  type NetAttack,
  type NetControl,
  type NetHost,
  type NetLink,
  type NetSegment,
  type NetService,
  type NetTool,
  type NetWeek,
  type Proto,
} from './labNetwork';

/**
 * R157 — every course's network, derived from what the course already carries.
 *
 * Security+ draws its network by hand (`securityNetwork.ts`). Every other course has a topology module
 * (Server+ rack, CCNA campus, Network+ branch, the two cloud pictures, the CySA+ SOC) or an architecture
 * picture (`ARCH`), and this module turns each of those shapes into the one `LabNetwork` the Network tab,
 * the week picture and the built map read. Pure: every function takes the module objects as parameters and
 * returns plain data; `dto.ts` is the only importer. Honesty rules: no address is typed here — every one is
 * read from the topology module (page-shape forbids an IPv4 literal in this file); the only numbers are the
 * well-known protocol ports in `WELL_KNOWN`; a step that names no machine is placed on the whole lab, never
 * guessed; action text is the step's own title, never trimmed.
 */

/** Protocol constants, not lab facts: the port a well-known service listens on. */
export const WELL_KNOWN = { ssh: 22, dns: 53, dhcp: 67, tftp: 69, http: 80, ntp: 123, snmpTrap: 162, https: 443, syslog: 514, mysql: 3306, rdp: 3389, postgres: 5432 } as const;

/* ── shared helpers ─────────────────────────────────────────────────────── */

export const firstSentence = (s: string) => s.split(/(?<=[.!?])\s/)[0].replace(/[.!?]$/, '') + '.';

/** The first CIDR in a string, or none. */
export const cidrIn = (s: string) => s.match(/\d+\.\d+\.\d+\.\d+\/\d+/)?.[0];

/** A port named in an edge label: ":80", "port 5432", or a well-known protocol word. */
export function portIn(label: string): number | undefined {
  const m = label.match(/:(\d{2,5})\b/) ?? label.match(/\bport (\d{2,5})\b/i);
  if (m) return Number(m[1]);
  const l = label.toLowerCase();
  if (/\bhttps\b/.test(l)) return WELL_KNOWN.https;
  if (/\bhttp\b/.test(l)) return WELL_KNOWN.http;
  if (/\bssh\b/.test(l)) return WELL_KNOWN.ssh;
  if (/\brdp\b/.test(l)) return WELL_KNOWN.rdp;
  if (/postgres/.test(l)) return WELL_KNOWN.postgres;
  if (/mysql|mariadb/.test(l)) return WELL_KNOWN.mysql;
  return undefined;
}

/** "Built so far: A, B, C and 4 more." — what stands before the week begins. */
function builtSoFar(build: BuildModel | undefined, week: number, labelOf: (id: string) => string | undefined): string {
  if (!build) return '';
  const labels = Object.entries(build.arrives)
    .filter(([, w]) => w < week)
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => labelOf(id))
    .filter((l): l is string => !!l);
  if (labels.length === 0) return 'Nothing built yet.';
  const shown = labels.slice(0, 3);
  const rest = labels.length - shown.length;
  return `Built so far: ${shown.join(', ')}${rest > 0 ? ` and ${rest} more` : ''}.`;
}

/** One `NetWeek` per course week: title as the wire, objective as the focus, the build's caption as the after line. */
export function weeksFrom(course: Pick<Course, 'weeks'>, build: BuildModel | undefined, labelOf: (id: string) => string | undefined): NetWeek[] {
  return course.weeks.map((w) => ({
    week: w.number,
    wire: w.title,
    focus: w.objective,
    before: builtSoFar(build, w.number, labelOf),
    after: build?.captions[w.number] ?? '',
    attacks: [],
    actions: [],
  }));
}

/** Make sure every course week has an entry (the AI module adds weeks after the lab's); keep authored ones. */
export function withCourseWeeks(net: LabNetwork, course: Pick<Course, 'weeks'>): LabNetwork {
  const have = new Set(net.weeks.map((w) => w.week));
  const added = course.weeks.filter((w) => !have.has(w.number)).map((w) => ({ week: w.number, wire: w.title, focus: w.objective, before: '', after: '', attacks: [], actions: [] }));
  return added.length ? { ...net, weeks: [...net.weeks, ...added].sort((a, b) => a.week - b.week) } : net;
}

function specFromHosts(net: LabNetwork, who: (h: NetHost) => string): LabNetwork['spec'] {
  const runs = (h: NetHost) => (h.services.length ? h.services.map((s) => `${s.port} ${s.name}`).join(' · ') : h.apps?.length ? h.apps.join(' · ') : '—');
  return { columns: ['Component', 'Address', 'Runs', 'Who'], rows: allHosts(net).map((h) => [h.label, h.addr ?? '—', runs(h), who(h)]) };
}

interface CopyOpts { course: Pick<Course, 'title'>; family: string; footer: string; attacks?: boolean; platform?: string }
function copyFor(net: Pick<LabNetwork, 'hosts' | 'fabric'>, o: CopyOpts): LabNetwork['copy'] {
  const under = o.platform ?? net.fabric.hypervisor?.label;
  const segs = net.fabric.segments.map((s) => s.label);
  return {
    title: `The ${o.course.title} network — what you build and where`,
    howToRead: `${net.hosts.length} components on ${segs.length} segment${segs.length === 1 ? '' : 's'}${under ? `, under ${under}` : ''}. Each card shows its address, what it runs and exposes, and the controls on it. Pick a week to see what has arrived${o.attacks ? ' and step through the attacks' : ''}.`,
    footer: o.footer,
    reference: {
      lede: `Every component of the ${o.family}, its address where it has one, what it runs and exposes, the tools on it, and what each task does to it, week by week.`,
      lan: segs.length ? `${segs.length} segment${segs.length === 1 ? '' : 's'}: ${segs.slice(0, 4).join(', ')}${segs.length > 4 ? ` and ${segs.length - 4} more` : ''}.` : 'One flat lab.',
      ports: 'What answers on the network, and what stays inside a host or a single segment.',
      tools: 'What is installed where, and the task that uses it.',
      attacks: 'The attack types in exam vocabulary, where this lab uses each, and the control that answers it.',
      actions: 'What each task of the week does on the network: the work placed on the components it touches.',
      links: 'Every cable, port to port, with what it carries.',
    },
  };
}

const svc = (port: number, proto: Proto, name: string, description: string, from: number, extra: Partial<NetService> = {}): NetService => ({ port, proto, name, description, from, ...extra });
const ctl = (id: string, label: string, description: string, kind: ControlKind, arrives: number, extra: Partial<NetControl> = {}): NetControl => ({ id: `ctl:${id}`, label, description, kind, arrives, ...extra });

/* ── 1. Server+ — the rack: a Proxmox host, three bridges, the base VMs, the published ports ──────── */

export interface ServerTopologyLike {
  CAMPUS_LAN: { cidr: string; gateway: string };
  HOST: { hostname: string; rule: string; teamMarker: string; consolePort: number; exampleTeam: number };
  BRIDGES: { id: string; zone: string; cidr: string; gateway: string; note: string }[];
  BASE_VMS: { hostname: string; address: string; bridge: string; os: string; runs: string; services: string[]; optional?: boolean }[];
  OPS: { bridge: string; vlan: number; uplink: string; cidr: string; core: Record<string, string>; team: { rule: string; node: string; opsVm: string } };
  PUBLISHED_PORTS: { hostPort: number; proto: Proto; to: string; port: number; purpose: string }[];
  REMOTE_ADMIN: { iface: string; routes: readonly string[]; allow: { to?: string; port: number; proto: Proto; purpose: string }[] };
  CROSS_ZONE_ALLOW: { from: string; to: string; proto: Proto; port: number; purpose: string }[];
  MACHINES: Record<string, { id: string; label: string; how: string; node?: string }>;
}
export interface ServerDiagramsLike { SERVER_BUILD: BuildModel; PARTS: ArchPart[]; SERVER_DIAGRAM_COPY: { edge: { label: string; sub: string } } }

export function networkFromServer(st: ServerTopologyLike, sd: ServerDiagramsLike, course: Course): LabNetwork {
  const A = sd.SERVER_BUILD.arrives;
  const part = (id: string) => sd.PARTS.find((p) => p.id === id);
  const segments: NetSegment[] = [
    ...st.BRIDGES.map((b) => ({ id: b.id, label: `${b.zone} (${b.id})`, note: `${b.cidr} · gw ${b.gateway} — ${b.note}`, kind: 'bridge' as const, arrives: b.id === 'vmbr0' ? 0 : A.zones })),
    { id: st.OPS.bridge, label: `Operations network (VLAN ${st.OPS.vlan})`, note: `${st.OPS.cidr} · host ${st.OPS.team.node} · ${st.OPS.uplink}`, kind: 'vlan', arrives: A.ops },
  ];
  const vms: NetHost[] = st.BASE_VMS.map((v) => {
    const services: NetService[] = [];
    const add = (s: NetService) => {
      if (!services.some((x) => x.port === s.port && x.proto === s.proto)) services.push(s);
    };
    for (const p of st.PUBLISHED_PORTS.filter((p) => p.to === v.hostname)) add(svc(p.port, p.proto, p.purpose.split(' — ')[0], `${p.purpose}; the campus reaches it through the host's :${p.hostPort}.`, A.published, { scope: 'segment', via: v.bridge }));
    for (const r of st.CROSS_ZONE_ALLOW.filter((r) => r.to === v.hostname)) add(svc(r.port, r.proto, r.purpose, `${r.purpose} — the one path the ${r.from} zone may open to it.`, A.crossZone, { scope: 'segment', via: r.from }));
    for (const r of st.REMOTE_ADMIN.allow) {
      if (r.to ? r.to === v.hostname : !v.optional) add(svc(r.port, r.proto, r.purpose.split(' to ')[0], `${r.purpose}, from the tailnet through the host.`, A.tailnet, { scope: 'segment', via: st.REMOTE_ADMIN.iface }));
    }
    const hardened = part('hardened');
    return {
      id: v.hostname,
      label: v.hostname,
      description: v.runs,
      addr: v.address,
      segment: v.bridge,
      nic: v.bridge,
      os: v.os,
      kind: 'server',
      optional: v.optional,
      arrives: A[v.hostname] ?? A.vms,
      apps: v.services,
      services,
      controls: !v.optional && hardened ? [ctl(`hardened-${v.hostname}`, hardened.label, hardened.purpose, 'harden', A.hardened)] : [],
    };
  });
  const edge = part('edge');
  const hosts: NetHost[] = [
    { id: 'workstation', label: st.MACHINES.workstation.label, description: firstSentence(st.MACHINES.workstation.how), segment: 'vmbr0', kind: 'client', arrives: 0, services: [], controls: [] },
    { id: 'edge', label: sd.SERVER_DIAGRAM_COPY.edge.label, description: edge?.purpose ?? sd.SERVER_DIAGRAM_COPY.edge.sub, addr: st.CAMPUS_LAN.gateway, segment: 'vmbr0', kind: 'router', arrives: A.edge, external: true, services: [], controls: [] },
    ...vms,
    { id: 'opsVm', label: part('opsVm')?.label ?? 'Ops VM', description: part('opsVm')?.purpose ?? '', addr: st.OPS.team.opsVm, segment: st.OPS.bridge, kind: 'server', arrives: A.opsVm, optional: true, services: [], controls: [] },
    { id: 'core', label: part('core')?.label ?? 'Core services', description: part('core')?.purpose ?? '', segment: st.OPS.bridge, kind: 'service', arrives: A.core, optional: true, apps: Object.entries(st.OPS.core).map(([k, v]) => `${k} · ${v}`), services: [], controls: [] },
    { id: 'laptop', label: st.MACHINES.laptop.label, description: firstSentence(st.MACHINES.laptop.how), kind: 'client', external: true, arrives: A.tailnet, services: [], controls: [] },
  ];
  const hypervisor: NetHost = {
    id: 'host',
    label: `Proxmox host (${st.HOST.hostname})`,
    description: firstSentence(st.MACHINES.host.how),
    addr: st.HOST.rule,
    segment: 'vmbr0',
    kind: 'hypervisor',
    arrives: A.host,
    services: [svc(st.HOST.consolePort, 'tcp', 'web console', firstSentence(st.MACHINES['pve-ui'].how), A.host)],
    controls: [
      ctl('host-forward-drop', 'FORWARD policy DROP · logged', 'Everything the host is asked to forward and no rule allows is dropped and logged.', 'harden', A.zones),
      ctl('host-tailnet', part('tailnet')?.label ?? 'Tailnet', `${part('tailnet')?.purpose ?? ''} Routes advertised: ${st.REMOTE_ADMIN.routes.join(', ')}.`, 'harden', A.tailnet),
      ctl('host-backup', part('backup')?.label ?? 'Snapshots', part('backup')?.purpose ?? '', 'recover', A.backup),
      ctl('host-backupstore', part('backupStore')?.label ?? 'Backup datastore', part('backupStore')?.purpose ?? '', 'recover', A.backupStore),
    ],
    publishes: st.PUBLISHED_PORTS.map((p) => ({ host: p.hostPort, to: p.to, port: p.port, proto: p.proto, purpose: p.purpose, from: A.published })),
  };
  const base: LabNetwork = {
    copy: { title: '', howToRead: '', footer: '' },
    view: { w: 0, h: 0 },
    subnet: st.CAMPUS_LAN.cidr,
    fabric: { hypervisor, segments },
    hosts,
    weeks: weeksFrom(course, sd.SERVER_BUILD, (id) => part(id)?.label),
    spec: { columns: [], rows: [] },
  };
  base.copy = copyFor(base, { course, family: 'rack', footer: `The addresses are Team ${st.HOST.exampleTeam}’s worked example; ${st.HOST.teamMarker} is your team number.` });
  base.spec = specFromHosts(base, (h) => (h.kind === 'hypervisor' ? 'Everyone' : h.id === 'core' ? 'Instructor' : h.external ? 'Outside' : 'Team'));
  return layoutNetwork(base);
}

/* ── 2. CCNA — two sites, ten VLANs, twelve devices, the WAN and the ISP ───────────────────────── */

export interface CcnaVlanLike { id: number; name: string; site: string; purpose: string; dhcp?: { from: number; to: number }; wireless?: boolean; management?: boolean }
export interface CcnaDeviceLike { name: string; class: string; site: string; runs: string; mgmt?: { vlan: number; host: number }; arrives: number; optional?: boolean }
export interface CcnaTopologyLike<D extends CcnaDeviceLike = CcnaDeviceLike, V extends CcnaVlanLike = CcnaVlanLike> {
  SITES: { id: string; name: string; octet: number; rooms: string }[];
  VLANS: V[];
  DEVICES: D[];
  LINKS: { from: { device: string; port: string }; to: { device: string; port: string }; kind: NetLink['kind']; media: string; vlans?: number[]; arrives: number }[];
  WAN: { prefix: string; hq: string; branch: string; ospfArea: number };
  ISP: { outside: string; prefix: string; gateway: string; name: string; circuit: string; speed: string };
  SERVICES: { dns: string; dhcp: string; syslog: string; snmpTarget: string };
  POLICY: { allow: boolean }[];
  mgmtAddress: (d: D) => string | undefined;
  prefixOf: (v: V) => string;
  gatewayOf: (v: V) => string;
  dhcpRangeOf: (v: V) => string | undefined;
}
export interface CcnaDiagramsLike { CCNA_BUILD: BuildModel; PARTS: ArchPart[]; CCNA_DIAGRAM_COPY: { footer: string } }

const NET_KIND_BY_CLASS: Record<string, HostKind> = { router: 'router', 'l3-switch': 'switch', 'l2-switch': 'switch', ap: 'ap', wlc: 'wlc', firewall: 'firewall', server: 'server', workstation: 'client', pc: 'client', printer: 'endpoint', cloud: 'external' };
const NETWORK_DEVICE = new Set(['router', 'l3-switch', 'l2-switch', 'firewall', 'wlc']);

export function networkFromCcna<D extends CcnaDeviceLike, V extends CcnaVlanLike>(ct: CcnaTopologyLike<D, V>, cd: CcnaDiagramsLike, course: Course): LabNetwork {
  const A = cd.CCNA_BUILD.arrives;
  const part = (id: string) => cd.PARTS.find((p) => p.id === id);
  const segments: NetSegment[] = [
    ...ct.SITES.map((s) => ({ id: `site:${s.id}`, label: s.name, note: s.rooms, kind: 'site' as const, arrives: A[`site:${s.id}`] ?? 0 })),
    ...ct.VLANS.map((v) => ({
      id: `vlan:${v.id}`,
      label: `VLAN ${v.id} ${v.name}`,
      note: `${ct.prefixOf(v)} · gw ${ct.gatewayOf(v)}${v.dhcp ? ` · DHCP ${ct.dhcpRangeOf(v)}` : ' · static'}${v.wireless ? ' · wireless' : ''}${v.management ? ' · management' : ''} — ${v.purpose}`,
      kind: 'vlan' as const,
      parent: `site:${v.site}`,
      arrives: A.vlans,
    })),
    { id: 'wan', label: 'WAN link', note: `${ct.WAN.prefix} · OSPF area ${ct.WAN.ospfArea}`, kind: 'subnet', arrives: A.wan },
    { id: 'internet', label: 'Internet', note: `${ct.ISP.prefix} · ${ct.ISP.name} ${ct.ISP.circuit} · ${ct.ISP.speed}`, kind: 'zone', arrives: A.internet },
  ];
  const routing = ct.DEVICES.find((d) => d.class === 'l3-switch') ?? ct.DEVICES.find((d) => d.class === 'router');
  const hosts: NetHost[] = ct.DEVICES.map((d) => {
    const addr = ct.mgmtAddress(d);
    const services: NetService[] = [];
    const controls: NetControl[] = [];
    const apps: string[] = [];
    if (NETWORK_DEVICE.has(d.class) && d.mgmt) {
      services.push(svc(WELL_KNOWN.ssh, 'tcp', 'SSH', 'Management access to the device, from the management VLAN only; no telnet.', d.arrives, { scope: 'segment', via: `vlan:${d.mgmt.vlan}` }));
      const m = part('management');
      if (m) controls.push(ctl(`${d.name}-mgmt`, m.label, m.purpose, 'harden', A.management));
    }
    if (d.class === 'router') {
      services.push(svc(WELL_KNOWN.ntp, 'udp', 'NTP', 'The router is the time source for the kit; it syncs from the pool itself.', d.arrives));
      apps.push(`WAN ${d.site === 'hq' ? ct.WAN.hq : ct.WAN.branch}`);
      if (d.site === 'hq') apps.push(`outside ${ct.ISP.outside}`);
    }
    if (addr && addr === ct.SERVICES.dns) services.push(svc(WELL_KNOWN.dns, 'udp', 'DNS', 'The company’s own resolver; every device points at it.', d.arrives));
    if (addr && addr === ct.SERVICES.dhcp) services.push(svc(WELL_KNOWN.dhcp, 'udp', 'DHCP', 'Hands out the pool addresses for every VLAN that has one.', d.arrives));
    if (addr && addr === ct.SERVICES.syslog) services.push(svc(WELL_KNOWN.syslog, 'udp', 'syslog', 'Where every device’s log lines land once the NOC is up.', A.noc));
    if (addr && addr === ct.SERVICES.snmpTarget) services.push(svc(WELL_KNOWN.snmpTrap, 'udp', 'SNMP trap', 'Where every device’s traps land once the NOC is up.', A.noc));
    if (addr && addr === ct.SERVICES.dns) {
      const aaa = part('aaa');
      if (aaa) controls.push(ctl(`${d.name}-aaa`, aaa.label, aaa.purpose, 'harden', A.aaa));
    }
    if (addr && addr === ct.SERVICES.syslog) {
      const b = part('backups');
      const n = part('noc');
      const au = part('automation');
      if (b) controls.push(ctl(`${d.name}-backups`, b.label, b.purpose, 'recover', A.backups));
      if (n) controls.push(ctl(`${d.name}-noc`, n.label, n.purpose, 'detect', A.noc));
      if (au) apps.push(`${au.label} (week ${A.automation})`);
    }
    if (routing && d.name === routing.name) {
      const p = part('policy');
      const allow = ct.POLICY.filter((r) => r.allow).length;
      if (p) controls.push(ctl(`${d.name}-policy`, p.label, `${p.purpose}: ${allow} allow, ${ct.POLICY.length - allow} deny.`, 'harden', A.policy));
    }
    return {
      id: d.name,
      label: d.name,
      description: d.runs,
      addr,
      segment: d.mgmt ? `vlan:${d.mgmt.vlan}` : `site:${d.site}`,
      nic: d.class,
      kind: NET_KIND_BY_CLASS[d.class] ?? 'endpoint',
      arrives: d.arrives,
      optional: d.optional,
      apps: apps.length ? apps : undefined,
      services,
      controls,
    };
  });
  hosts.push({ id: 'isp', label: ct.ISP.name, description: part('isp')?.purpose ?? '', addr: ct.ISP.gateway, segment: 'internet', kind: 'external', external: true, arrives: A.isp, services: [], controls: [] });
  const links: NetLink[] = ct.LINKS.map((l) => ({ from: l.from.device, to: l.to.device, fromPort: l.from.port, toPort: l.to.port, kind: l.kind, media: l.media, vlans: l.vlans, arrives: l.arrives }));
  const base: LabNetwork = {
    copy: { title: '', howToRead: '', footer: '' },
    view: { w: 0, h: 0 },
    fabric: { segments },
    hosts,
    links,
    weeks: weeksFrom(course, cd.CCNA_BUILD, (id) => part(id)?.label),
    spec: { columns: [], rows: [] },
  };
  base.copy = copyFor(base, { course, family: 'campus', footer: cd.CCNA_DIAGRAM_COPY.footer });
  base.spec = specFromHosts(base, (h) => (h.external ? 'Outside' : 'Team'));
  return layoutNetwork(base);
}

/* ── 3. Network+ — one branch: two switches, a router, four VLANs, the ISP link ─────────────────── */

export interface NpVlanLike { id: number; name: string; purpose: string; pool?: [number, number] }
export interface NpDeviceLike { name: string; class: string; model: string; host?: number; vlan?: number; purpose: string }
export interface NetworkPlusTopologyLike<D extends NpDeviceLike = NpDeviceLike, V extends NpVlanLike = NpVlanLike> {
  COMPANY: { name: string };
  SITE: { id: string; name: string };
  VLANS: V[];
  DEVICES: D[];
  LINKS: { from: string; fromPort: string; to: string; toPort: string; kind: 'access' | 'trunk' | 'wan'; vlan?: number }[];
  WAN: { prefix: string; router: string; isp: string; dns: string };
  POLICY: { allow: boolean }[];
  mgmtAddress: (d: D) => string | undefined;
  prefixOf: (v: V) => string;
  gatewayOf: (v: V) => string;
  dhcpRangeOf: (v: V) => string | undefined;
}

export function networkFromNetworkPlus<D extends NpDeviceLike, V extends NpVlanLike>(nt: NetworkPlusTopologyLike<D, V>, ARCH: ArchPicture, ARCH_BUILD: BuildModel, course: Course): LabNetwork {
  const node = (id: string) => ARCH.nodes.find((n) => n.id === id);
  const byLabel = (label: string) => ARCH.nodes.find((n) => n.label === label);
  const siteId = `site:${nt.SITE.id}`;
  const segments: NetSegment[] = [
    { id: siteId, label: nt.SITE.name, note: nt.COMPANY.name, kind: 'site', arrives: 0 },
    ...nt.VLANS.map((v) => ({ id: `vlan:${v.id}`, label: `VLAN ${v.id} ${v.name}`, note: `${nt.prefixOf(v)} · gw ${nt.gatewayOf(v)}${v.pool ? ` · DHCP ${nt.dhcpRangeOf(v)}` : ' · static'} — ${v.purpose}`, kind: 'vlan' as const, parent: siteId, arrives: node('vlans')?.arrives ?? 2 })),
    { id: 'wan', label: 'ISP link', note: `${nt.WAN.prefix} · DNS ${nt.WAN.dns}`, kind: 'subnet', arrives: node('isp')?.arrives ?? 2 },
  ];
  const hosts: NetHost[] = nt.DEVICES.map((d) => {
    if (d.class === 'cloud') {
      return { id: d.name, label: d.name, description: d.purpose, addr: nt.WAN.isp, segment: 'wan', kind: 'external', external: true, arrives: node('isp')?.arrives ?? 2, os: d.model, services: [], controls: [] };
    }
    const arch = byLabel(d.name);
    const arrives = arch?.arrives ?? (d.class === 'router' || d.class === 'l2-switch' ? 1 : 2);
    const controls: NetControl[] = [];
    const acl = node('acl');
    const portsec = node('portsec');
    if (d.class === 'router' && acl) controls.push(ctl(`${d.name}-acl`, `${acl.label} ${acl.sub}`.trim(), `${acl.purpose}: ${nt.POLICY.filter((r) => r.allow).length} allow, ${nt.POLICY.filter((r) => !r.allow).length} deny.`, 'harden', acl.arrives));
    if (d.class === 'l2-switch' && portsec) controls.push(ctl(`${d.name}-portsec`, portsec.label, portsec.purpose, 'harden', portsec.arrives));
    const gateways = node('gateways');
    if (d.class === 'router' && gateways) controls.push(ctl(`${d.name}-gateways`, gateways.label, gateways.purpose, 'harden', gateways.arrives));
    return {
      id: d.name,
      label: d.name,
      description: d.purpose,
      addr: nt.mgmtAddress(d),
      segment: d.vlan !== undefined ? `vlan:${d.vlan}` : siteId,
      kind: NET_KIND_BY_CLASS[d.class] ?? 'endpoint',
      os: d.model,
      arrives,
      apps: d.class === 'router' ? [`outside ${nt.WAN.router}`] : undefined,
      services: d.class === 'router' || d.class === 'l2-switch' ? [svc(WELL_KNOWN.ssh, 'tcp', 'SSH', 'Management access from the Management VLAN; the console otherwise.', arrives, { scope: 'segment', via: 'vlan:99' })] : [],
      controls,
    };
  });
  const server = node('server');
  if (server) {
    hosts.push({
      id: server.id,
      label: server.label,
      description: server.purpose,
      segment: 'vlan:99',
      kind: 'server',
      arrives: server.arrives,
      services: [svc(WELL_KNOWN.syslog, 'udp', 'syslog', 'Receives every device’s log lines, timestamped, in one place.', server.arrives), svc(WELL_KNOWN.tftp, 'udp', 'TFTP', 'Holds every configuration backup, one per device, dated.', server.arrives)],
      controls: [],
    });
  }
  const sim = node('simulator');
  const hypervisor: NetHost | undefined = sim ? { id: sim.id, label: sim.label, description: sim.purpose, kind: 'platform', arrives: 0, services: [], controls: [] } : undefined;
  const arrivesOf = (name: string) => hosts.find((h) => h.id === name)?.arrives ?? 0;
  const links: NetLink[] = nt.LINKS.map((l) => ({ from: l.from, to: l.to, fromPort: l.fromPort, toPort: l.toPort, kind: l.kind, vlans: l.vlan !== undefined ? [l.vlan] : undefined, arrives: Math.max(arrivesOf(l.from), arrivesOf(l.to)) }));
  const base: LabNetwork = {
    copy: { title: '', howToRead: '', footer: '' },
    view: { w: 0, h: 0 },
    fabric: { hypervisor, segments },
    hosts,
    links,
    weeks: weeksFrom(course, ARCH_BUILD, (id) => node(id)?.label),
    spec: { columns: [], rows: [] },
  };
  base.copy = copyFor(base, { course, family: 'branch network', footer: ARCH.copy.footer });
  base.spec = specFromHosts(base, (h) => (h.external ? 'Outside' : h.kind === 'platform' ? 'Everyone' : 'Team'));
  return layoutNetwork(base);
}

/* ── 4. Cloud — an account, a region, a network, subnets, the resources in them ───────────────── */

const CLOUD_HOST_KIND: Partial<Record<CloudIconKey, HostKind>> = {
  vm: 'server', fleet: 'server', bastion: 'server', container: 'service', function: 'service', api: 'service', endpoint: 'service', gateway: 'router', lb: 'router', cdn: 'router',
  nosql: 'storage', db: 'storage', storage: 'storage', disk: 'storage', queue: 'storage', identity: 'identity', secret: 'identity',
};
const CLOUD_CONTROL_KIND: Partial<Record<CloudIconKey, ControlKind>> = {
  firewall: 'harden', policy: 'harden', role: 'harden', oac: 'harden', bucketpolicy: 'harden', budget: 'harden',
  alert: 'detect', logs: 'detect', apm: 'detect', audit: 'detect', diag: 'detect', notify: 'detect', backup: 'recover',
};
const CLOUD_SEGMENT_KIND: Record<CloudContainer['kind'], NetSegment['kind']> = { account: 'zone', group: 'zone', region: 'site', network: 'vpc', subnet: 'subnet', 'subnet-private': 'subnet', zone: 'zone' };

const inside = (c: CloudContainer, x: number, y: number) => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h;
const area = (c: CloudContainer) => c.w * c.h;

export function networkFromCloud(topology: CloudTopology, block: { weeks: [number, number] }, build: BuildModel, course: Course): LabNetwork {
  const [lo, hi] = block.weeks;
  const local = (w: number) => Math.max(0, w - lo + 1);
  const account = topology.containers.find((c) => c.kind === 'account');
  const boxes = topology.containers.filter((c) => c.kind !== 'account');
  const innermost = (x: number, y: number) => boxes.filter((c) => inside(c, x, y)).sort((a, b) => area(a) - area(b))[0];
  const parentOf = (c: CloudContainer) => boxes.filter((o) => o.id !== c.id && inside(o, c.x, c.y) && inside(o, c.x + c.w, c.y + c.h) && area(o) > area(c)).sort((a, b) => area(a) - area(b))[0];
  const segments: NetSegment[] = boxes.map((c) => ({ id: c.id, label: c.label, note: c.sub ?? '', kind: CLOUD_SEGMENT_KIND[c.kind], parent: parentOf(c)?.id, arrives: local(c.week) }));
  const nodeLabel = (n: CloudNode) => (n.name ? `${n.label} · ${n.name}` : n.label);
  const shown = topology.nodes.filter((n) => !n.detail && n.week <= hi);
  const hosts: NetHost[] = [];
  for (const n of shown) {
    const kind = n.external ? 'external' : CLOUD_HOST_KIND[n.icon];
    if (!kind) continue;
    const seg = n.external ? undefined : innermost(n.x, n.y);
    hosts.push({ id: n.id, label: nodeLabel(n), description: n.purpose ?? n.label, segment: seg?.id, kind, arrives: local(n.week), external: n.external, services: [], controls: [] });
  }
  const host = (id: string) => hosts.find((h) => h.id === id);
  const platform: NetHost | undefined = account ? { id: account.id, label: account.label, description: account.sub ?? '', kind: 'platform', os: topology.platform === 'aws' ? 'AWS' : 'Azure', arrives: 0, services: [], controls: [] } : undefined;
  // Controls sit on the resource that references them: the host at the other end of an edge, else the platform.
  for (const n of shown) {
    const kind = CLOUD_CONTROL_KIND[n.icon];
    if (!kind) continue;
    const edges = topology.edges.filter((e) => e.from === n.id || e.to === n.id);
    const byTraffic = edges.filter((e) => e.kind === 'traffic').map((e) => host(e.from === n.id ? e.to : e.from)).find(Boolean);
    const byDepends = edges.map((e) => host(e.from === n.id ? e.to : e.from)).find(Boolean);
    const target = byTraffic ?? byDepends ?? platform;
    if (!target) continue;
    target.controls.push(ctl(n.id, nodeLabel(n), n.purpose ?? n.label, kind, local(n.week)));
  }
  // Ports come from the request paths whose label names one; a path to a private subnet answers only there.
  for (const e of topology.edges) {
    if (e.kind !== 'traffic' || !e.label) continue;
    const port = portIn(e.label);
    const to = host(e.to);
    const from = host(e.from) ?? (e.from === account?.id ? platform : undefined);
    if (!port || !to) continue;
    if (to.services.some((s) => s.port === port)) continue;
    const seg = boxes.find((c) => c.id === to.segment);
    const priv = seg?.kind === 'subnet-private';
    to.services.push(svc(port, 'tcp', e.label, `${from?.label ?? e.from} → ${to.label}: ${e.label}.`, local(e.week), { to: e.until !== undefined ? local(e.until) : undefined, scope: priv ? 'segment' : 'lan', via: priv ? seg?.id : undefined }));
  }
  const labelOf = (id: string) => topology.nodes.find((n) => n.id === id)?.label ?? topology.containers.find((c) => c.id === id)?.label;
  const base: LabNetwork = {
    copy: { title: '', howToRead: '', footer: '' },
    view: { w: 0, h: 0 },
    fabric: { hypervisor: platform, segments },
    hosts,
    weeks: weeksFrom(course, build, labelOf),
    spec: { columns: [], rows: [] },
  };
  base.copy = copyFor(base, { course, family: `${topology.platform === 'aws' ? 'AWS' : 'Azure'} environment`, footer: `Names are ${account?.sub ?? 'the worked example'}’s; your team’s follow the naming standard.`, platform: platform?.label });
  base.spec = specFromHosts(base, (h) => (h.kind === 'platform' ? 'Everyone' : h.external ? 'Outside' : 'Team'));
  return layoutNetwork(base);
}

/* ── 5. CySA+ — the shared SOC, your pod, the attacker you drive ──────────────────────────────── */

export interface SocLike {
  subnet: string;
  proxmoxHost: string;
  soc: { name: string; ip: string; lines: string[] };
  pod: { ubuntu: { name: string; ip: string }; windows: { name: string; ip: string } };
  attacker: { name: string; ip: string; note: string };
  browser: { name: string; note: string };
  spec: { component: string; address: string; runs: string; who: string }[];
}
export interface CysaContentLike {
  ARCH: ArchPicture;
  ARCH_BUILD: BuildModel;
  ATTACK_PATH: { hops: { stage: string; what: string; attck?: string; week: number; sees: string; side: 'attacker' | 'response' }[] };
  INCIDENT_TIMELINE: { events: { label: string; source: string; kind: 'attack' | 'detect' | 'respond' }[] };
}

/** Where each SOC-picture control lives on the pod — the ARCH draws them in the pod zone, not on a host. */
const SOC_CONTROL_HOSTS: Record<string, string[]> = { 'sensor-agent': ['ubuntu', 'windows'], 'sensor-suricata': ['ubuntu'], 'sensor-sysmon': ['windows'], firewall: ['ubuntu'], 'soc-vuln': ['soc'] };
const SOC_CONTROL_KIND: Partial<Record<ArchKind, ControlKind>> = { monitor: 'detect', scanner: 'detect', firewall: 'contain', control: 'harden', backup: 'recover' };
const HOP_KIND: Record<string, AttackKind> = { Recon: 'scanning', Exploit: 'injection', 'Brute force': 'brute-force' };
const HOP_TOOL: [RegExp, string][] = [[/nmap/i, 'port scanner'], [/sql injection/i, 'SQL-injection tool'], [/hydra/i, 'login brute-forcer']];
const HOP_PORT: Record<string, number | undefined> = { Exploit: WELL_KNOWN.http, 'Brute force': WELL_KNOWN.ssh };

export function networkFromSoc(SOC: SocLike, cysa: CysaContentLike, course: Course): LabNetwork {
  const node = (id: string) => cysa.ARCH.nodes.find((n) => n.id === id);
  const runsOf = (component: string) => SOC.spec.find((r) => r.component === component)?.runs.split(' · ') ?? [];
  const segments: NetSegment[] = [{ id: 'lab', label: 'Lab network', note: SOC.subnet, kind: 'lan', arrives: 0 }];
  const edgePorts = (node('edge')?.sub.match(/\d{2,5}/g) ?? []).map(Number);
  const PORT_NAME: Record<number, [string, string]> = {
    [WELL_KNOWN.ssh]: ['SSH', 'Admin shell on the SOC host.'],
    [WELL_KNOWN.https]: ['dashboard', 'The Wazuh dashboard every role signs in to.'],
    1514: ['agent events', 'Where every agent ships its events.'],
    1515: ['agent enrolment', 'Where a new agent registers.'],
  };
  const soc: NetHost = {
    id: 'soc', label: SOC.soc.name, description: node('soc')?.purpose ?? '', addr: SOC.soc.ip, segment: 'lab', kind: 'server', role: 'blue', arrives: 0, apps: SOC.soc.lines,
    services: edgePorts.filter((p) => PORT_NAME[p]).map((p) => svc(p, 'tcp', PORT_NAME[p][0], PORT_NAME[p][1], 0)),
    controls: [],
  };
  const ubuntu: NetHost = {
    id: 'ubuntu', label: SOC.pod.ubuntu.name, description: node('ubuntu')?.purpose ?? '', addr: SOC.pod.ubuntu.ip, segment: 'lab', kind: 'server', role: 'blue', arrives: 0, apps: runsOf('Ubuntu server'),
    services: [svc(WELL_KNOWN.ssh, 'tcp', 'SSH', 'The student login; what the Week-2 brute force guesses at.', 0), svc(WELL_KNOWN.http, 'tcp', 'DVWA', 'The vulnerable web app the attack lands on.', 0)],
    controls: [],
  };
  const windows: NetHost = { id: 'windows', label: SOC.pod.windows.name, description: node('windows')?.purpose ?? '', addr: SOC.pod.windows.ip, segment: 'lab', kind: 'endpoint', role: 'blue', arrives: 0, apps: runsOf('Windows 11 PC'), services: [], controls: [] };
  const kali: NetHost = { id: 'kali', label: SOC.attacker.name, description: node('kali')?.purpose ?? SOC.attacker.note, addr: SOC.attacker.ip, segment: 'lab', kind: 'attacker', role: 'red', arrives: 0, apps: runsOf('Kali Linux'), services: [], controls: [] };
  const browser: NetHost = { id: 'browser', label: SOC.browser.name, description: node('browser')?.purpose ?? SOC.browser.note, kind: 'client', external: true, arrives: 0, services: [], controls: [] };
  const hosts = [kali, ubuntu, windows, soc, browser];
  const hypervisor: NetHost = { id: 'host', label: node('host')?.label ?? 'Proxmox host', description: node('host')?.purpose ?? '', addr: SOC.proxmoxHost, segment: 'lab', kind: 'hypervisor', arrives: 0, services: [], controls: [] };
  const edge = node('edge');
  if (edge) hypervisor.controls.push(ctl('host-edge', edge.label, edge.purpose, 'harden', edge.arrives));
  for (const n of cysa.ARCH.nodes) {
    const kind = SOC_CONTROL_KIND[n.kind];
    const where = SOC_CONTROL_HOSTS[n.id];
    if (!kind || !where || !n.builtBy) continue;
    for (const hid of where) {
      const h = hosts.find((x) => x.id === hid);
      h?.controls.push(ctl(`${hid}-${n.id.replace(/^sensor-/, '')}`, n.label, n.purpose, kind, n.arrives, { builtBy: n.builtBy, role: n.role }));
    }
  }
  const weeks = weeksFrom(course, cysa.ARCH_BUILD, (id) => node(id)?.label);
  const week = (n: number) => weeks.find((w) => w.week === n);
  // Week 2: the chain you run yourself. Week 4: the same chain replayed, with the SOC's answer to each hop.
  const attackerHops = cysa.ATTACK_PATH.hops.filter((h) => h.side === 'attacker');
  const responses = cysa.ATTACK_PATH.hops.filter((h) => h.side === 'response');
  const toAttack = (h: (typeof attackerHops)[number], n: number, builtBy: string): NetAttack => ({
    n,
    kind: HOP_KIND[h.stage] ?? 'scanning',
    from: 'kali',
    to: 'ubuntu',
    port: HOP_PORT[h.stage],
    tool: HOP_TOOL.find(([re]) => re.test(h.what))?.[1] ?? 'attack tool',
    description: `${h.what}; evidence: ${h.sees}.`,
    ref: h.attck,
    builtBy,
  });
  const w2 = week(2);
  if (w2) w2.attacks = attackerHops.map((h, i) => toAttack(h, i + 1, 'cr-w2'));
  const w4 = week(4);
  if (w4 && responses.length >= 3) {
    const replay = attackerHops.map((h, i) => toAttack(h, i + 1, 'cr-w4'));
    const detectCtl = ubuntu.controls.find((c) => /suricata/i.test(c.label))?.id;
    const agentCtl = ubuntu.controls.find((c) => /agent/i.test(c.label))?.id;
    const containCtl = ubuntu.controls.find((c) => c.kind === 'contain')?.id;
    if (replay[0] && detectCtl) replay[0].response = { kind: 'detect', controlId: detectCtl, label: responses[0].what };
    if (replay[1] && agentCtl) replay[1].response = { kind: 'detect', controlId: agentCtl, label: responses[1].what };
    const shell = cysa.INCIDENT_TIMELINE.events.find((e) => /shell/i.test(e.label));
    if (shell && containCtl) replay.push({ n: replay.length + 1, kind: 'remote-code-execution', from: 'kali', to: 'ubuntu', port: WELL_KNOWN.http, tool: 'web shell upload', description: `${shell.label}; seen by ${shell.source}.`, builtBy: 'cr-w4', response: { kind: 'contain', controlId: containCtl, builtBy: 'cr-w4', label: responses[2].what } });
    w4.attacks = replay;
  }
  // The SOC-side work the picture names: lookups, the case queue, the evidence share.
  for (const n of cysa.ARCH.nodes) {
    if ((n.kind !== 'data' && n.kind !== 'ticket' && n.kind !== 'evidence') || !n.builtBy?.length) continue;
    const w = week(n.arrives);
    if (!w) continue;
    const [taskId, step] = n.builtBy[0].split('::');
    (w.actions ??= []).push({ taskId, step, role: (n.role ?? 'grc') as Role, kind: n.kind === 'ticket' ? 'governance' : 'evidence', at: ['soc'], text: n.purpose });
  }
  const base: LabNetwork = {
    copy: { title: '', howToRead: '', footer: '' },
    view: { w: 0, h: 0 },
    subnet: SOC.subnet,
    fabric: { hypervisor, segments },
    hosts,
    weeks,
    spec: { columns: ['Component', 'Address', 'Runs', 'Who'], rows: SOC.spec.map((r) => [r.component, r.address, r.runs, r.who]) },
  };
  base.copy = copyFor(base, { course, family: 'SOC lab', footer: cysa.ARCH.copy.footer, attacks: true });
  return layoutNetwork(base);
}

/* ── 6. Any course with an architecture picture: components, zones, controls, records ─────────── */

const ARCH_HOST_KIND: Partial<Record<ArchKind, HostKind>> = {
  server: 'server', endpoint: 'endpoint', app: 'service', ai: 'service', data: 'storage', firewall: 'firewall', router: 'router', switch: 'switch', wireless: 'ap', network: 'service', idp: 'identity', identity: 'identity', siem: 'server', people: 'client', outside: 'external',
};
const ARCH_CONTROL_KIND: Partial<Record<ArchKind, ControlKind>> = { control: 'harden', pipeline: 'harden', monitor: 'detect', scanner: 'detect', backup: 'recover' };
const ARCH_ACTION_KIND: Partial<Record<ArchKind, ActionKind>> = { ticket: 'governance', evidence: 'evidence' };

/** The one synthetic host the derivers may add: where a student works from, when the picture draws no person. */
export const OPERATOR_HOST: NetHost = { id: 'operator', label: 'Your own machine', description: 'Where you work from in this course.', kind: 'client', external: true, arrives: 0, services: [], controls: [] };

export function networkFromArch(ARCH: ArchPicture, ARCH_BUILD: BuildModel, course: Course): LabNetwork {
  const lanes = new Set(ARCH.zones.filter((z) => z.lane).map((z) => z.id));
  const nodes = ARCH.nodes.filter((n) => !lanes.has(n.zone) && n.kind !== 'record');
  const hosts: NetHost[] = nodes
    .filter((n) => ARCH_HOST_KIND[n.kind])
    .map((n) => ({
      id: n.id,
      label: n.label,
      description: n.purpose,
      addr: n.addr,
      segment: n.zone,
      kind: ARCH_HOST_KIND[n.kind]!,
      role: n.role,
      arrives: n.arrives,
      builtBy: n.builtBy,
      external: n.external || n.kind === 'outside' || n.kind === 'people' || undefined,
      apps: n.sub ? n.sub.split(' · ').filter(Boolean) : undefined,
      services: [],
      controls: [],
    }));
  const host = (id: string) => hosts.find((h) => h.id === id);
  const placeFor = (n: ArchNode): NetHost | undefined => {
    const edge = ARCH.edges.find((e) => (e.from === n.id && host(e.to)) || (e.to === n.id && host(e.from)));
    if (edge) return host(edge.from === n.id ? edge.to : edge.from);
    const sameZone = hosts.filter((h) => h.segment === n.zone && !h.external);
    return sameZone.find((h) => (h.arrives ?? 0) <= n.arrives) ?? sameZone[0] ?? hosts.find((h) => !h.external) ?? hosts[0];
  };
  for (const n of nodes) {
    const kind = ARCH_CONTROL_KIND[n.kind];
    if (!kind) continue;
    placeFor(n)?.controls.push(ctl(n.id, n.label, n.purpose, kind, n.arrives, { builtBy: n.builtBy, role: n.role }));
  }
  const segments: NetSegment[] = ARCH.zones
    .filter((z) => !z.lane)
    .map((z) => ({ id: z.id, label: z.label, note: z.note, kind: 'zone' as const, arrives: Math.min(...nodes.filter((n) => n.zone === z.id).map((n) => n.arrives), 99) === 99 ? 0 : Math.min(...nodes.filter((n) => n.zone === z.id).map((n) => n.arrives)) }));
  const weeks = weeksFrom(course, ARCH_BUILD, (id) => ARCH.nodes.find((n) => n.id === id)?.label);
  for (const n of nodes) {
    const kind = ARCH_ACTION_KIND[n.kind];
    if (!kind || !n.builtBy?.length) continue;
    const w = weeks.find((x) => x.week === n.arrives);
    if (!w) continue;
    const [taskId, step] = n.builtBy[0].split('::');
    (w.actions ??= []).push({ taskId, step, role: (n.role ?? course.roles[0]?.id ?? 'grc') as Role, kind, at: hosts.filter((h) => h.segment === n.zone && !h.external).map((h) => h.id), text: n.purpose });
  }
  const base: LabNetwork = {
    copy: { title: '', howToRead: '', footer: '' },
    view: { w: 0, h: 0 },
    fabric: { segments },
    hosts,
    weeks,
    spec: ARCH.spec ?? { columns: [], rows: [] },
  };
  base.copy = copyFor(base, { course, family: 'system you work on', footer: ARCH.copy.footer });
  if (!ARCH.spec) base.spec = specFromHosts(base, (h) => (h.external ? 'Outside' : h.role ? h.role : 'Team'));
  return layoutNetwork(base);
}

/* ── Per-task actions and tools, from what the steps already say ─────────────────────────────── */

export interface WhereRule { re: RegExp; at: (net: LabNetwork, week: number) => string[] }
export interface ActionMatchers {
  /** The host a student works from, when a step names only a console, a portal or "your own machine". */
  operator?: string;
  /** Server+: `Step.commands[].on` → host id. */
  machineHost?: (on: string) => string | undefined;
  /** `Step.where` phrases → hosts; tried in order after the generic host-name match. */
  where: WhereRule[];
}
export interface ToolDefLike { id: string; label: string; kind: string }

/** A step that happens in the forms, the notes or a meeting is not on the network. */
const OFF_NETWORK = /deliverables|your notes|this course|team meeting|the document|\bforms?\b|\breports?\b|slides|markdown|a teammate|team decision/i;
const KIND_PURPOSE: Record<string, string> = {
  cli: 'A command-line tool run in the task’s steps.',
  app: 'A desktop or web application the task works in.',
  portal: 'A management console the task configures things in.',
  service: 'A managed service the task provisions or reads.',
  platform: 'The platform the task builds on.',
  appliance: 'A network or security appliance the task configures.',
  hardware: 'Physical equipment the task handles.',
  document: 'A document format the task writes in.',
  language: 'A language the task writes or reads.',
};

/** Hosts whose label or id appears, as a whole word, in the text. */
function hostsNamedIn(net: LabNetwork, text: string): string[] {
  const t = ` ${text.toLowerCase()} `;
  return allHosts(net)
    .filter((h) => {
      const names = [h.id, ...h.label.split(' · ')].map((n) => n.toLowerCase()).filter((n) => n.length >= 4 && !/^(your|team|the|and|with)$/.test(n));
      return names.some((n) => t.includes(` ${n} `) || t.includes(` ${n}:`) || t.includes(` ${n},`) || t.includes(`(${n})`) || t.includes(` ${n}.`) || t.includes(` ${n}’`) || t.includes(` ${n}'`));
    })
    .map((h) => h.id);
}

export function actionsFromTasks(course: Course, net: LabNetwork, m: ActionMatchers, toolsByTask: Record<string, string[]>, toolDefs: ToolDefLike[]): LabNetwork {
  // What the network already places, and in which week — a line is skipped only where it would repeat.
  const built = new Map<string, Set<number>>();
  const mark = (key: string, week: number) => built.set(key, (built.get(key) ?? new Set<number>()).add(week));
  const has = (key: string, week: number) => built.get(key)?.has(week) ?? false;
  for (const w of net.weeks) {
    for (const a of w.attacks) {
      if (a.builtBy) mark(a.builtBy, w.week);
      if (a.response?.builtBy) mark(a.response.builtBy, w.week);
    }
    for (const a of w.actions ?? []) mark(a.step ? `${a.taskId}::${a.step}` : a.taskId, w.week);
  }
  for (const h of allHosts(net)) {
    for (const c of h.controls) for (const k of c.builtBy ?? []) mark(k, c.arrives);
    for (const k of h.builtBy ?? []) mark(k, h.arrives ?? 0);
  }
  const weekIds = new Set(net.weeks.map((w) => w.week));
  const toolById = new Map(toolDefs.map((t) => [t.id, t] as const));
  const hostIds = new Set(allHosts(net).map((h) => h.id));
  const toolsAt = new Map<string, Map<string, NetTool>>();

  const place = (step: Step, week: number): string[] => {
    const onMachines = (step.commands ?? []).map((c) => c.on).filter((o): o is string => !!o).map((o) => m.machineHost?.(o)).filter((h): h is string => !!h && hostIds.has(h));
    if (onMachines.length) return [...new Set(onMachines)];
    const where = step.where ?? '';
    if (OFF_NETWORK.test(where) || step.usesForm) return [];
    const named = hostsNamedIn(net, `${where} ${step.title}`);
    for (const rule of m.where) {
      if (rule.re.test(where)) {
        const at = rule.at(net, week).filter((id) => hostIds.has(id));
        return [...new Set([...at, ...named])];
      }
    }
    if (named.length) return named;
    if (m.operator && hostIds.has(m.operator) && (step.command || step.commands?.length) && /machine|terminal|laptop|shell|console|prompt|cli\b|simulator/i.test(where)) return [m.operator];
    return [];
  };
  const kindOf = (step: Step, at: string[]): ActionKind => {
    if (step.isEvidenceStep || step.producesDeliverable) return 'evidence';
    if (step.usesForm || (at.length === 0 && !step.command && !step.commands?.length)) return 'governance';
    return 'setup';
  };

  const weeks = net.weeks.map((w) => ({ ...w, actions: [...(w.actions ?? [])] }));
  for (const task of course.tasks as Task[]) {
    if (task.track === 'ai' || !weekIds.has(task.week) || has(task.id, task.week)) continue;
    const w = weeks.find((x) => x.week === task.week)!;
    const lines: NetAction[] = [];
    for (const step of task.steps) {
      if (has(`${task.id}::${step.id}`, task.week)) continue;
      const at = place(step, task.week);
      lines.push({ taskId: task.id, step: step.id, role: task.role, kind: kindOf(step, at), at, text: step.title });
    }
    // Steps that all happen off the network collapse to one line per kind, so a long task is not a wall of "whole lab".
    const placed = lines.filter((l) => l.at.length);
    const off = lines.filter((l) => !l.at.length);
    const collapsed: NetAction[] = [];
    for (const l of off) if (!collapsed.some((c) => c.kind === l.kind)) collapsed.push(l);
    w.actions.push(...placed, ...collapsed);
    // Tools: on the host the task's steps touch most, else where the student works from.
    const counts = new Map<string, number>();
    for (const l of placed) for (const id of l.at) counts.set(id, (counts.get(id) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? (m.operator && hostIds.has(m.operator) ? m.operator : undefined);
    if (!top) continue;
    for (const tid of toolsByTask[task.id] ?? []) {
      const def = toolById.get(tid);
      if (!def) continue;
      const byName = toolsAt.get(top) ?? new Map<string, NetTool>();
      const cur = byName.get(def.label);
      if (cur) cur.usedIn = [...new Set([...(cur.usedIn ?? []), task.id])];
      else byName.set(def.label, { name: def.label, purpose: KIND_PURPOSE[def.kind] ?? 'A tool the task uses.', usedIn: [task.id] });
      toolsAt.set(top, byName);
    }
  }
  const withTools = (h: NetHost): NetHost => {
    const add = toolsAt.get(h.id);
    if (!add) return h;
    const tools = [...(h.tools ?? [])];
    for (const t of add.values()) {
      const cur = tools.find((x) => x.name === t.name);
      if (cur) cur.usedIn = [...new Set([...(cur.usedIn ?? []), ...(t.usedIn ?? [])])];
      else tools.push(t);
    }
    return { ...h, tools };
  };
  return { ...net, weeks, hosts: net.hosts.map(withTools), fabric: { ...net.fabric, hypervisor: net.fabric.hypervisor ? withTools(net.fabric.hypervisor) : undefined } };
}

/** Hosts of a kind present by the week. */
const ofKind = (kinds: HostKind[]) => (net: LabNetwork, week: number) => net.hosts.filter((h) => kinds.includes(h.kind) && (h.arrives ?? 0) <= week && !h.external).map((h) => h.id);
const ids = (...list: string[]) => () => list;

/** The per-family phrase rules; the generic host-name match runs first for every course. */
export function matchersFor(courseId: string, family: 'server' | 'ccna' | 'network-plus' | 'cloud' | 'soc' | 'arch', net: LabNetwork, course: Course): ActionMatchers {
  switch (family) {
    case 'server':
      return {
        operator: 'workstation',
        machineHost: (on) => ({ host: 'host', console: 'host', 'pve-ui': 'host', campus: 'workstation', workstation: 'workstation', laptop: 'laptop' } as Record<string, string>)[on] ?? (net.hosts.some((h) => h.id === on) ? on : undefined),
        where: [
          { re: /proxmox|host shell|web console|server console|at the rack|the rack/i, at: ids('host') },
          { re: /ops vm/i, at: ids('opsVm') },
          { re: /tools vm/i, at: ids('tools') },
          { re: /workstation|campus pc|classroom pc/i, at: ids('workstation') },
          { re: /laptop/i, at: ids('laptop') },
        ],
      };
    case 'soc':
      return {
        operator: 'browser',
        where: [
          { re: /wazuh|dashboard|\bsoc\b/i, at: ids('soc') },
          { re: /ubuntu/i, at: ids('ubuntu') },
          { re: /windows/i, at: ids('windows') },
          { re: /kali/i, at: ids('kali') },
          { re: /proxmox/i, at: ids('host') },
          { re: /browser|threat-intel|virustotal/i, at: ids('browser') },
        ],
      };
    case 'ccna':
      return {
        operator: 'ADMIN-PC',
        where: [
          { re: /each switch/i, at: ofKind(['switch']) },
          { re: /each device|every device|both routers/i, at: ofKind(['router', 'switch', 'firewall', 'wlc', 'ap']) },
          { re: /tools host|netbox|librenms|oxidized/i, at: ids('NETOPS') },
          { re: /core switch/i, at: ids('SW-CORE-01') },
          { re: /edge router/i, at: ids('R1-HQ') },
          { re: /AP or controller/i, at: ids('AP-01', 'WLC-01') },
        ],
      };
    case 'network-plus':
      return {
        // Everything runs in the simulator, so a step that names no device still happens there.
        operator: net.fabric.hypervisor?.id,
        where: [
          { re: /each device|every device|all devices/i, at: ofKind(['router', 'switch']) },
          { re: /each PC|every PC/i, at: ofKind(['client']) },
          { re: /both switches|SW1 then SW2|SW-01 then SW-02/i, at: ofKind(['switch']) },
          { re: /guest laptop/i, at: ids('PC-GUEST-1') },
          { re: /server-pt|syslog|tftp/i, at: ids('server') },
          { re: /\bR1\b/i, at: ofKind(['router']) },
          { re: /\bSW1\b/i, at: ids('SW-01') },
          { re: /\bSW2\b/i, at: ids('SW-02') },
          { re: /packet tracer|simulator/i, at: (n) => (n.fabric.hypervisor ? [n.fabric.hypervisor.id] : []) },
        ],
      };
    case 'cloud':
      return {
        operator: 'admin',
        where: [
          { re: /github|repository/i, at: ids('github') },
          { re: /console|portal|cloud ?shell|entra|monitor|bedrock|pricing|calculator|advisor|cloudfront|iam\b|config/i, at: ids('admin') },
        ],
      };
    case 'arch':
    default: {
      const lead = course.roles[0]?.id;
      const people = net.hosts.find((h) => h.kind === 'client' && h.role === lead) ?? net.hosts.find((h) => h.kind === 'client');
      return { operator: people?.id ?? OPERATOR_HOST.id, where: [{ re: /own machine|lab machine|terminal|live usb|powershell/i, at: (n) => (n.hosts.some((h) => h.id === (people?.id ?? OPERATOR_HOST.id)) ? [people?.id ?? OPERATOR_HOST.id] : []) }] };
    }
  }
}

/** Add the synthetic operator host when the picture draws no person to work from (ARCH-only courses). */
export function withOperator(net: LabNetwork): LabNetwork {
  if (net.hosts.some((h) => h.kind === 'client')) return net;
  return layoutNetwork({ ...net, view: { w: 0, h: 0 }, hosts: [...net.hosts, OPERATOR_HOST] });
}


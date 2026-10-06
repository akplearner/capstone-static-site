/**
 * The Server+ reference picture, as DATA.
 *
 * The rack elevation, the week each part of the topology arrives in, and every
 * caption the diagram prints used to be `const`s inside
 * `components/diagrams/ServerTopologyDiagram.tsx`. That put roughly 300 words of
 * instructional copy and a 6-row equipment list somewhere no export could reach:
 * `content/courses/server-plus.json` described the addressing in full and said
 * nothing about the rack the course is built around, and an instructor adapting
 * the course for a business with a 42U rack and a second switch had to edit a
 * React component to do it.
 *
 * So the component keeps the layout, the colours and the dimming, and reads what
 * it says from here. Anything interpolated is interpolated AT MODULE LOAD from
 * `serverTopology.ts` — the same rule the command registry follows — so every
 * export below is a plain string or a plain object, and the whole module
 * serialises into the course document unchanged.
 */
import { BASE_VMS, CROSS_ZONE_ALLOW, PUBLISHED_PORTS, RACK_UNITS } from '../serverTopology';
import type { BuildModel } from '../weekVisual';
import type { ArchPart } from './archPicture';

/**
 * Which week each part of the picture arrives in.
 *
 * `builtThrough` dims what a student has not built yet and tags it with the
 * week it shows up, so the Home tab's picture fills in as the build does
 * instead of showing a finished design on day one.
 */
export const ARRIVES = { host: 1, zones: 2, vms: 2, published: 3, crossZone: 3, tailnet: 3 } as const;

/** What a slot in the rack holds. The colour it is drawn in belongs to the
 *  component; which KIND of equipment it is belongs here. */
export type RackKind = 'panel' | 'switch' | 'server' | 'pdu' | 'blank';

export interface RackSlot {
  /** The U or U-range, as a rack is labelled. */
  u: string;
  label: string;
  sub?: string;
  kind: RackKind;
  /** How many U the device occupies. */
  span: number;
}

/**
 * The 24U elevation, ordered high U to low U.
 *
 * A rack is counted bottom-up and read top-down, which is why the order looks
 * inverted: this is the order a student sees standing in front of it.
 */
export const RACK_ELEVATION: RackSlot[] = [
  { u: 'U24', label: '24-port patch panel', sub: 'Cat6 terminations from the office drops', kind: 'panel', span: 1 },
  { u: 'U23', label: 'Access switch', sub: 'Uplink to the office LAN on port 24', kind: 'switch', span: 1 },
  { u: 'U22', label: '', kind: 'blank', span: 1 },
  { u: 'U20–U21', label: 'The server — Proxmox host', sub: '2U, on sliding rails · the one machine you build', kind: 'server', span: 2 },
  { u: 'U2–U19', label: 'Expansion reserve — ≥20% kept free for growth', kind: 'blank', span: 1 },
  { u: 'U1', label: 'Rack PDU', sub: '8-outlet · feeds every device above', kind: 'pdu', span: 1 },
];

/** The four physical legend entries, by the kind each one colours. */
export const RACK_LEGEND: { kind: Exclude<RackKind, 'blank'>; label: string }[] = [
  { kind: 'panel', label: 'Patch panel — structured cabling' },
  { kind: 'switch', label: 'Switch — the network' },
  { kind: 'server', label: 'Server — the Proxmox host' },
  { kind: 'pdu', label: 'PDU — power' },
];

/** The published ports grouped by the VM that answers, in declaration order. */
export const PUBLISHED_BY_VM: { to: string; ports: number[] }[] = PUBLISHED_PORTS.reduce<
  { to: string; ports: number[] }[]
>((acc, p) => {
  const row = acc.find((r) => r.to === p.to);
  if (row) row.ports.push(p.hostPort);
  else acc.push({ to: p.to, ports: [p.hostPort] });
  return acc;
}, []);

/** What the DMZ may open into the private zone, as a short phrase. */
export const CROSS_ZONE_LABEL = [...new Set(CROSS_ZONE_ALLOW.map((r) => r.purpose))].join(' · ');

/**
 * Every word the picture prints.
 *
 * `{bridge}`, `{zone}` and `{business}` are filled per zone by the renderer —
 * the same placeholder convention the commands use — because a caption that
 * names a bridge cannot be written once per bridge without repeating itself.
 */
export const SERVER_DIAGRAM_COPY = {
  title: `What you build — one server in a ${RACK_UNITS}U rack`,
  howToRead: `Left is the physical ${RACK_UNITS}U rack. Right is the network topology the one server carries: the campus LAN into vmbr0 management, a DMZ zone for public-facing services, and a private zone for internal systems. Dashed slots are where your team adds the VMs its business needs.`,
  zoneLegend: '{bridge} — {zone} zone',
  rackHeading: `Rack A · ${RACK_UNITS}U`,
  rackAspect: 'front elevation',
  rackCaption:
    'Patch panel → switch → server NIC. Every lead is labelled and logged in the Rack, Power & Asset Register.',
  buildingFor: 'Building for: {business}',
  campusLan: 'Campus LAN',
  publishedHeading: 'Published through the host at {host}',
  hostHeading: 'Proxmox host',
  /** The dashed slot inside each zone: the VMs that make the build this team's. */
  teamSlotHeading: '+ {business}’s VMs',
  teamSlotBlurb: {
    DMZ: 'public-facing services your business needs',
    Private: 'internal systems your business runs on',
  } as Record<string, string>,
  /** Split because the address in the middle is drawn in monospace. */
  teamSlotWhere: { before: '— from ', after: ', planned in the Architecture Brief' },
  /** Three captions name something the model owns and print it in bold, so they
   *  are split rather than flattened — the emphasis is part of the sentence. */
  crossZone: {
    before: '→ private zone: ',
    after: ' only — everything else the DMZ tries is dropped and logged',
  },
  vmbr2Later: {
    before: 'later phase: physical NIC → ',
    strong: 'Cisco router + switch',
    after: ' — the servers’ only internet path',
  },
  tailnetPath: { after: ' → tailnet → the host → both zones' },
  tailnetNote:
    'Administration only: {allow}. Nothing in the private zone is published to the campus.',
  /** R103: the parts that were in the model but not in the picture. */
  edge: { label: 'Campus edge', sub: 'router + firewall · the servers’ only internet path' },
  directoryChip: 'AD DS · DNS · DHCP',
  backupStoreChip: 'PBS datastore · local',
  footer:
    'The Windows / Linux / website VMs are the base build — every team the same. Zone subnets are worked examples; record yours in the IP Plan & Connectivity Proof.',
} as const;

/* ── What you build this week (R99) ───────────────────────────────────────── */

/** The week each advanced host arrives in; the base VMs all arrive with the zones. */
const ADVANCED_WEEK: Record<string, number> = { secmon: 5, wazuh: 5, tools: 6 };

/**
 * The whole build, week by week. Ids are the parts `ServerTopologyDiagram`
 * draws: the physical parts, the host, the zones and every VM (base and
 * advanced, read from `BASE_VMS` so a hostname cannot drift), the published
 * ports, the tailnet, and the operations network of Weeks 7–8.
 */
export const SERVER_BUILD: BuildModel = {
  arrives: {
    campus: 0,
    rack: 1,
    host: 1,
    zones: ARRIVES.zones,
    ...Object.fromEntries(BASE_VMS.map((v) => [v.hostname, v.optional ? ADVANCED_WEEK[v.hostname] : ARRIVES.vms])),
    published: ARRIVES.published,
    crossZone: ARRIVES.crossZone,
    tailnet: ARRIVES.tailnet,
    directory: 2,
    edge: 3,
    hardened: 4,
    backup: 4,
    backupStore: 4,
    ops: 7,
    opsVm: 7,
    core: 8,
  },
  processes: {
    0: { title: 'Survey the campus', steps: [
      { from: 'campus', to: 'rack', label: 'power · cooling · the uplink drop' },
    ] },
    1: { title: 'Bring the server up', steps: [
      { from: 'campus', to: 'host', label: 'console → POST → RAID → install' },
    ] },
    2: { title: 'Build the base VMs', steps: [
      { from: 'host', to: 'winserver', label: 'install · promote the directory' },
      { from: 'winserver', to: 'linuxsrv', label: 'DNS · DHCP for the zone' },
      { from: 'host', to: 'websrv', label: 'install · first page' },
    ] },
    3: { title: 'Publish the website', steps: [
      { from: 'campus', to: 'published', label: 'HTTP · HTTPS' },
      { from: 'published', to: 'websrv', label: 'DNAT :80 :443' },
    ] },
    4: { title: 'Secure and hand over', steps: [
      { from: 'host', to: 'backup', label: 'snapshot every VM' },
      { from: 'backup', to: 'linuxsrv', label: 'restore and time it' },
      { from: 'tailnet', to: 'host', label: 'patch over the tailnet' },
    ] },
    5: { title: 'Watch and detect', steps: [
      { from: 'websrv', to: 'secmon', label: 'metrics · logs' },
      { from: 'winserver', to: 'wazuh', label: 'Wazuh agent' },
      { from: 'secmon', to: 'campus', label: 'alert → runbook' },
    ] },
    6: { title: 'The lab as code', steps: [
      { from: 'campus', to: 'host', label: 'terraform apply' },
      { from: 'host', to: 'tools', label: 'register in NetBox · GLPI' },
    ] },
    7: { title: 'Join the fleet', steps: [
      { from: 'opsVm', to: 'core', label: 'git push' },
      { from: 'core', to: 'opsVm', label: 'golden template' },
      { from: 'opsVm', to: 'host', label: 'clone from the template' },
    ] },
    8: { title: 'Run it as a fleet', steps: [
      { from: 'opsVm', to: 'websrv', label: 'playbook, idempotent' },
      { from: 'host', to: 'core', label: 'metrics · backups → PBS' },
      { from: 'core', to: 'host', label: 'rebuild from Git' },
    ] },
  },
  captions: {
    0: 'Before the build: the campus LAN and an empty rack. Everything on the right is still to come.',
    1: 'New: the rack and the Proxmox host. The one machine you build goes in and comes up.',
    2: 'New: the DMZ and private zones with the three base VMs, and the directory role: AD DS, DNS and DHCP on the Windows server.',
    3: 'New: the campus edge, the published ports, the DMZ-to-private rule and the tailnet. The campus reaches the site through the host.',
    4: 'New: the hardening baseline, the backup and its local datastore. Snapshot, restore, patch, and hand it over.',
    5: 'New: the monitoring host and your own SIEM. Every VM reports in; the first alert runs the runbook.',
    6: 'New: the tools host. The lab is rebuilt from code and registered in NetBox and GLPI.',
    7: 'New: the operations network and your ops VM. The fleet’s Core node holds Git and the golden template.',
    8: 'New: the fleet’s Core services. Playbooks, central metrics and backups, and a rebuild from Git.',
  },
};

/* ── The parts, for the weekly breakdown (R103) ───────────────────────────── */

/** What each part is for and which form records it; ids as in `SERVER_BUILD`. */
const PART_ROWS: Record<string, { label: string; purpose: string; records: string }> = {
  campus: { label: 'Campus LAN', purpose: 'The network the rack plugs into and the team works from', records: 'srv_business_reqs' },
  rack: { label: 'Rack A', purpose: 'Patch panel, switch, the server and the PDU, labelled and logged', records: 'srv_rack_assets' },
  host: { label: 'Proxmox host', purpose: 'The one machine you build; every VM runs on it', records: 'srv_hardware' },
  zones: { label: 'DMZ and private zones', purpose: 'Two bridges: public-facing services apart from internal systems', records: 'srv_ip_plan' },
  directory: { label: 'Directory role', purpose: 'AD DS, DNS and DHCP on the Windows server for the zone', records: 'srv_bringup' },
  edge: { label: 'Campus edge', purpose: 'Router and firewall: the servers’ only path to the internet', records: 'srv_ip_plan' },
  published: { label: 'Published ports', purpose: 'What the campus reaches through the host, port by port', records: 'srv_ip_plan' },
  crossZone: { label: 'DMZ → private rule', purpose: 'The one thing the DMZ may open into the private zone', records: 'srv_standards' },
  tailnet: { label: 'Tailnet', purpose: 'Administration from off campus, into both zones', records: 'srv_ip_plan' },
  hardened: { label: 'Hardening baseline', purpose: 'The settings every VM must reach before handover', records: 'srv_standards' },
  backup: { label: 'Snapshots and restore', purpose: 'Every VM snapshotted; a restore timed and recorded', records: 'srv_as_built' },
  backupStore: { label: 'Backup datastore', purpose: 'Where the snapshots live until the fleet’s PBS takes over', records: 'srv_as_built' },
  ops: { label: 'Operations network', purpose: 'The bridge the ops VM and the Core node talk on', records: 'srv_as_built' },
  opsVm: { label: 'Ops VM', purpose: 'Your seat in the fleet: playbooks, Git, the golden template', records: 'srv_as_built' },
  core: { label: 'Core services', purpose: 'Git, central metrics, XDR and backups for the whole fleet', records: 'srv_as_built' },
};
const VM_RECORDS: Record<string, string> = { secmon: 'srv_operations', wazuh: 'srv_operations', tools: 'srv_operations' };

export const PARTS: ArchPart[] = Object.keys(SERVER_BUILD.arrives).map((id) => {
  const row = PART_ROWS[id];
  if (row) return { id, label: row.label, purpose: row.purpose, records: row.records, arrives: SERVER_BUILD.arrives[id] };
  const vm = BASE_VMS.find((v) => v.hostname === id)!;
  return { id, label: vm.hostname, purpose: vm.runs, records: VM_RECORDS[id] ?? 'srv_bringup', arrives: SERVER_BUILD.arrives[id] };
});

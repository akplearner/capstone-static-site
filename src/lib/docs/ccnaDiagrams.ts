/**
 * The CCNA reference picture, as DATA.
 *
 * Same contract as `serverDiagrams.ts`: the component owns the layout, the
 * colours and the dimming; every word it prints and every row it draws comes from
 * here, and everything interpolated is interpolated AT MODULE LOAD from
 * `ccnaTopology.ts`. So the whole module serialises into the course document, and
 * an instructor adapting the course for a business with three sites edits data
 * rather than JSX.
 */
import {
  DEVICES,
  ISP,
  SITES,
  VLANS,
  WAN,
  devicesAt,
  gatewayOf,
  prefixOf,
  type Device,
  type Site,
  type Vlan,
} from '../ccnaTopology';
import type { BuildModel } from '../weekVisual';

/**
 * Which week each part of the picture arrives in.
 *
 * Read from the model rather than restated: a device's own `arrives` week is what
 * dims it, so adding a device to the topology puts it in the right week of the
 * diagram automatically. These are the parts that are not devices.
 */
export const ARRIVES = {
  site: { hq: 1, branch: 3 },
  vlans: 2,
  trunks: 2,
  routing: 2,
  wan: 3,
  internet: 3,
  policy: 4,
  wireless: 4,
} as const;

/** A VLAN row as the picture draws it: the three facts that fit in a node. */
export interface VlanRow {
  id: number;
  name: string;
  prefix: string;
  gateway: string;
  purpose: string;
  site: Site['id'];
  wireless: boolean;
  management: boolean;
}

export const VLAN_ROWS: VlanRow[] = VLANS.map((v: Vlan) => ({
  id: v.id,
  name: v.name,
  prefix: prefixOf(v),
  gateway: gatewayOf(v),
  purpose: v.purpose,
  site: v.site,
  wireless: !!v.wireless,
  management: !!v.management,
}));

/** The devices of each site, in build order, for the two columns of the picture. */
export const SITE_COLUMNS: { site: Site; devices: Device[] }[] = SITES.map((s) => ({
  site: s,
  devices: devicesAt(s.id),
}));

/** How many VLANs a trunk at each site has to carry — the number the caption
 *  prints, counted rather than typed. */
export const TRUNK_LOAD: Record<Site['id'], number> = SITES.reduce(
  (acc, s) => {
    acc[s.id] = VLANS.filter((v) => v.site === s.id).length;
    return acc;
  },
  {} as Record<Site['id'], number>
);

/** Every word the picture prints. `{token}` is filled by the renderer. */
export const CCNA_DIAGRAM_COPY = {
  title: 'What you build — two sites, one network',
  howToRead: `Each column is a site. Inside it, the devices from the top of the network down to the access ports. The VLAN strip below each site is what that site's trunks carry. Dimmed parts arrive in a later week, tagged with the week they show up.`,
  legend: [
    { kind: 'router', label: 'Router — routing, NAT, the WAN' },
    { kind: 'l3-switch', label: 'Switch that routes — SVIs and the core' },
    { kind: 'l2-switch', label: 'Access switch — where users plug in' },
    { kind: 'ap', label: 'Access point — the WLANs' },
    { kind: 'server', label: 'Server — DNS, DHCP, the tools' },
    { kind: 'workstation', label: 'Where you work from' },
  ],
  siteHeading: '{name}',
  siteRooms: '{rooms}',
  vlanStripHeading: '{count} VLANs on the trunk',
  wanHeading: `WAN · ${WAN.prefix} · OSPF area ${WAN.ospfArea}`,
  wanNote: 'A point-to-point link needs exactly two addresses, which is what a /30 gives you.',
  internetHeading: `Internet · ${ISP.name} · ${ISP.speed}`,
  internetNote: `The whole company leaves through one address (${ISP.outside}). That is what NAT is for.`,
  policyNote: 'Guest reaches the internet and nothing else. Only the network team reaches management.',
  wirelessNote: 'Each SSID lands in its own VLAN, so wireless inherits the wired segmentation.',
  footer:
    'These are the worked-example numbers the course is written around. Record your own in the Low-Level Design — and what your kit can actually do in the Kit & Capability Register.',
  /** Shown when a team's kit cannot route on the switch: the same design, built
   *  the other way. The register decides which of the two a student sees. */
  routerOnAStick:
    'Your register says no switch here routes, so inter-VLAN routing happens on the router over one trunk — router-on-a-stick.',
} as const;

/** The whole picture in words, for the screen-reader list under it. Built from
 *  the model, so it can never describe a different network from the one drawn. */
export const SPOKEN: string[] = [
  ...SITES.map(
    (s) =>
      `${s.name}: ${devicesAt(s.id)
        .map((d) => `${d.name}, ${d.runs}`)
        .join('; ')}.`
  ),
  `The sites are joined by a ${WAN.prefix} link in OSPF area ${WAN.ospfArea}.`,
  ...VLAN_ROWS.map((v) => `VLAN ${v.id} ${v.name}: ${v.prefix}, gateway ${v.gateway} — ${v.purpose}.`),
  `${DEVICES.filter((d) => d.optional).length} of the devices are for the advanced weeks and are not required to pass.`,
];

/* ── What you build this week (R99) ───────────────────────────────────────── */

/**
 * The network, week by week. Device ids are the device names (each device's
 * own `arrives` week); the rest are the parts of the picture that are not
 * devices, plus the operating practice of the advanced weeks drawn as chips
 * on NETOPS: config backups (Week 5), the NOC (Week 6), automation (Week 7).
 */
export const CCNA_BUILD: BuildModel = {
  arrives: {
    ...Object.fromEntries(DEVICES.map((d: Device) => [d.name, d.arrives])),
    'site:hq': ARRIVES.site.hq,
    'site:branch': ARRIVES.site.branch,
    vlans: ARRIVES.vlans,
    trunks: ARRIVES.trunks,
    routing: ARRIVES.routing,
    etherchannel: 2,
    wan: ARRIVES.wan,
    internet: ARRIVES.internet,
    policy: ARRIVES.policy,
    wireless: ARRIVES.wireless,
    management: 4,
    backups: 5,
    noc: 6,
    automation: 7,
  },
  processes: {
    1: { title: 'Connect', steps: [
      { from: 'ADMIN-PC', to: 'SW-CORE-01', label: 'console · hostname · mgmt IP' },
      { from: 'SW-CORE-01', to: 'SW-ACC-01', label: 'first uplink' },
    ] },
    2: { title: 'Segment', steps: [
      { from: 'SW-ACC-01', to: 'SW-CORE-01', label: 'trunk carries every VLAN' },
      { from: 'SW-ACC-02', to: 'SW-CORE-01', label: 'EtherChannel — pull one cable' },
    ] },
    3: { title: 'Route', steps: [
      { from: 'R1-HQ', to: 'R2-BR', label: 'OSPF area 0 over the /30' },
      { from: 'R1-HQ', to: 'internet', label: 'NAT · one public address' },
    ] },
    4: { title: 'Protect', steps: [
      { from: 'SW-CORE-01', to: 'policy', label: 'ACLs from the policy rows' },
      { from: 'AP-01', to: 'SW-ACC-01', label: 'guest Wi-Fi, internet only' },
    ] },
    5: { title: 'Operate', steps: [
      { from: 'NETOPS', to: 'SW-CORE-01', label: 'config backup, Oxidized' },
      { from: 'ADMIN-PC', to: 'NETOPS', label: 'change ticket' },
    ] },
    6: { title: 'Observe', steps: [
      { from: 'SW-ACC-01', to: 'NETOPS', label: 'syslog · SNMP' },
      { from: 'NETOPS', to: 'ADMIN-PC', label: 'alert → ticket' },
    ] },
    7: { title: 'Automate', steps: [
      { from: 'NETOPS', to: 'SW-ACC-02', label: 'Ansible, from the source of truth' },
    ] },
    8: { title: 'Engineer', steps: [
      { from: 'SW-ACC-02', to: 'SW-CORE-01', label: 'break it on purpose' },
      { from: 'ADMIN-PC', to: 'NETOPS', label: 'incident → RCA' },
      { from: 'NETOPS', to: 'ADMIN-PC', label: 'handover' },
    ] },
  },
  captions: {
    0: 'Before the build: the kit on the bench and the admin PC. Only what you can touch exists.',
    1: 'New: the HQ core and first access switch. Console in, name it, give it a management address.',
    2: 'New: the second access switch, VLANs, trunks and an EtherChannel that survives a pulled cable.',
    3: 'New: both routers, the branch site, the WAN link and the internet. OSPF and NAT connect it all.',
    4: 'New: the access point, the policy and the hardened management plane. The network is protected.',
    5: 'New: config backups. Nothing is built — the network is operated: backups, changes, tickets.',
    6: 'New: the NOC. Syslog and SNMP from every device become alerts, and alerts become tickets.',
    7: 'New: automation. Configuration flows from the source of truth, not from the keyboard.',
    8: 'Nothing new is built. Break it, run the incident, write the RCA, hand the network over.',
  },
};

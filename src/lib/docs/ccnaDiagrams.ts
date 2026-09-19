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

/** Fill `{token}` placeholders in a caption. */
export function fillCopy(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in values ? String(values[k]) : m));
}

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

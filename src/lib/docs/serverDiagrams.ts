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
import { CROSS_ZONE_ALLOW, PUBLISHED_PORTS, RACK_UNITS } from '../serverTopology';

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
  footer:
    'The Windows / Linux / website VMs are the base build — every team the same. Zone subnets are worked examples; record yours in the IP Plan & Connectivity Proof.',
} as const;

/** Fill `{token}` placeholders in a caption. Unknown tokens are left alone so a
 *  half-filled caption is visible rather than silently blank. */
export function fillCopy(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in values ? String(values[k]) : m));
}

/**
 * The diagram kit's vocabulary (R84).
 *
 * One spec type for every platform-provided deliverable visual: a rack
 * elevation, a device faceplate, a zoned topology, or a left-to-right flow.
 * The spec is DATA — node names, ports, addresses, captions — and the kit
 * components under `src/components/diagrams/kit/` own the drawing. That split
 * is the same one `serverDiagrams.ts` / `ServerTopologyDiagram.tsx` made:
 * an instructor changes the picture by editing a model, not a component.
 *
 * The types live in lib (not beside the components) so `kitPresets.ts` can
 * build specs from the topology models without lib importing components.
 */

export type KitNodeKind =
  | 'router'
  | 'l3-switch'
  | 'l2-switch'
  | 'ap'
  | 'wlc'
  | 'firewall'
  | 'server'
  | 'workstation'
  | 'cloud'
  | 'sensor'
  | 'browser'
  | 'people';

/** A named region nodes belong to: a site, a zone, a team's side of the lab. */
export interface KitZone {
  id: string;
  label: string;
  note?: string;
}

export interface KitNode {
  id: string;
  label: string;
  sub?: string;
  kind: KitNodeKind;
  zone?: string;
  /** An address worth printing (management IP, subnet), in monospace. */
  addr?: string;
  optional?: boolean;
}

/** A cable or a data path. Ports are first-class: they are what a student
 *  has to verify, so the kit prints them instead of a bare line. */
export interface KitLink {
  from: string;
  fromPort?: string;
  to: string;
  toPort?: string;
  kind?: 'access' | 'trunk' | 'etherchannel' | 'routed' | 'wan' | 'uplink' | 'flow';
  label?: string;
}

export interface KitRackSlot {
  /** The U or U-range, as a rack is labelled. */
  u: string;
  label: string;
  sub?: string;
  kind: 'panel' | 'switch' | 'server' | 'pdu' | 'blank';
  span: number;
}

/** A single device drawn as its faceplate: ports and status lights. */
export interface KitDeviceFace {
  name: string;
  kind: KitNodeKind;
  ports: { label: string; on?: boolean }[];
  note?: string;
}

export interface KitStage {
  id: string;
  label: string;
  sub?: string;
  kind?: KitNodeKind;
}

export interface KitSpec {
  kit: 'rack' | 'device' | 'topology' | 'flow';
  title: string;
  howToRead?: string;
  footer?: string;
  /** Legend entries name a node kind (or rack slot kind) so the swatch colour
   *  comes from the kit's one tone map, never from the preset. */
  legend?: { label: string; kind: string }[];
  rack?: { heading: string; caption?: string; slots: KitRackSlot[] };
  device?: KitDeviceFace;
  zones?: KitZone[];
  nodes?: KitNode[];
  links?: KitLink[];
  stages?: KitStage[];
}

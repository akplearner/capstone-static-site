/**
 * R101 — the "hub" picture, as a shape.
 *
 * SecAI+ and CISSP both work on the same fictional company's move to the
 * Ridgeline Service Hub, and neither has a machine lab of its own until the
 * starter kit exists — so each draws the SYSTEM it secures: the parts, the
 * zones they sit in, and the week's process walking across them. One renderer
 * (`HubDiagram`) draws any course's hub from data; each course's content
 * module (`secaiContent.ts`, `cisspContent.ts`) supplies the parts and the
 * build model, and the course document carries it as `content.hub`.
 *
 * Coordinates live in the data, in the picture's own viewBox units, so the
 * component holds no table of its own.
 */
export type HubKind = 'people' | 'app' | 'ai' | 'data' | 'control' | 'monitor' | 'pipeline' | 'network' | 'identity' | 'outside';

export interface HubZone {
  id: string;
  label: string;
  note: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Which phase colour token (`--color-wN`) outlines it. */
  tone: number;
}

export interface HubNode {
  id: string;
  label: string;
  sub: string;
  kind: HubKind;
  zone: string;
  x: number;
  y: number;
  /** Drawn dashed: a party outside the company (a supplier, a customer, an attacker's inbox). */
  external?: boolean;
}

export interface HubPicture {
  copy: { title: string; howToRead: string; footer: string };
  view: { w: number; h: number };
  zones: HubZone[];
  nodes: HubNode[];
  /** The standing paths, drawn when no process is, once both ends exist. */
  edges: { from: string; to: string; label: string }[];
}

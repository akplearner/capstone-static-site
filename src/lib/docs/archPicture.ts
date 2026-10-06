/**
 * R103 — the architecture picture, as a shape.
 *
 * Every course that draws its own picture (Security+, CySA+, MSSP, SecAI+,
 * CISSP) draws the SYSTEM it works on: the zones (sites, trust boundaries,
 * network segments), the components in them, the standing paths between
 * them, and a lane of records — the forms that document those components.
 * One renderer (`ArchDiagram`) draws any course's picture from data; each
 * course's content module supplies `ARCH` and the authored week overlays, and
 * the course document carries it as `content.arch`.
 *
 * Coordinates live in the data, in the picture's own viewBox units, so the
 * component holds no table of its own. The week each part arrives in is ON
 * the part (`arrives`), the single source `archBuildModel` derives the build
 * model from — nothing is typed twice.
 */
import type { Role } from '../types';
import type { BuildModel, WeekProcess } from '../weekVisual';
import type { KitNodeKind } from '../diagrams/kitSpec';

export type ArchKind =
  | 'people'
  | 'outside'
  | 'endpoint'
  | 'server'
  | 'app'
  | 'ai'
  | 'data'
  | 'firewall'
  | 'router'
  | 'switch'
  | 'wireless'
  | 'network'
  | 'idp'
  | 'identity'
  | 'siem'
  | 'monitor'
  | 'pipeline'
  | 'backup'
  | 'scanner'
  | 'ticket'
  | 'evidence'
  | 'control'
  /** A document in the records lane: the form that records a part of the build. */
  | 'record';

/** What a standing path carries. Drawn with a different dash per kind. */
export type ArchEdgeKind = 'traffic' | 'trust' | 'log' | 'backup' | 'admin';

export interface ArchZone {
  id: string;
  label: string;
  note: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Which phase colour token (`--color-wN`) outlines it. */
  tone: number;
  /** The records lane: a strip of document pills, not a place in the network. */
  lane?: boolean;
}

export interface ArchNode {
  id: string;
  label: string;
  /** Second line, in monospace, unless `addr` is set. */
  sub: string;
  kind: ArchKind;
  zone: string;
  x: number;
  y: number;
  /** Drawn dashed: a party outside the organisation (a supplier, a customer, an attacker's inbox). */
  external?: boolean;
  /** What it is for, in at most twelve words. The "This week adds" line and the box's tooltip. */
  purpose: string;
  /** The deliverable (by id) whose form records this part. A record pill names itself. */
  records?: string;
  /** Printed under the label. Always a reference into a topology module — never a literal. */
  addr?: string;
  /** The role that owns it; the picture dims the others when a role is highlighted. */
  role?: Role;
  /** The course-local week it arrives in. 0 = there from the start. */
  arrives: number;
}

export interface ArchEdge {
  from: string;
  to: string;
  label: string;
  kind?: ArchEdgeKind;
}

export interface ArchPicture {
  copy: { title: string; howToRead: string; footer: string };
  view: { w: number; h: number };
  zones: ArchZone[];
  nodes: ArchNode[];
  /** The standing paths, drawn when no process is, once both ends exist. */
  edges: ArchEdge[];
  /** An optional reference table under the picture (addresses, what runs where). */
  spec?: { columns: string[]; rows: string[][] };
}

/** The week overlays a course authors on top of its picture. */
export interface ArchOverlays {
  processes: Record<number, WeekProcess>;
  captions: Record<number, string>;
}

/** The build model: every part's arrival from the picture, the overlays as authored. */
export function archBuildModel(picture: ArchPicture, overlays: ArchOverlays): BuildModel {
  const arrives: Record<string, number> = {};
  for (const n of picture.nodes) arrives[n.id] = n.arrives;
  return { arrives, processes: overlays.processes, captions: overlays.captions };
}

/** The kit's vocabulary for a part, so a form's picture can be a projection of the course's. */
export function kitKindOf(kind: ArchKind): KitNodeKind {
  switch (kind) {
    case 'people':
    case 'outside':
      return 'people';
    case 'endpoint':
      return 'workstation';
    case 'firewall':
      return 'firewall';
    case 'router':
      return 'router';
    case 'switch':
      return 'l2-switch';
    case 'wireless':
      return 'ap';
    case 'siem':
    case 'monitor':
    case 'scanner':
      return 'sensor';
    case 'ticket':
    case 'record':
      return 'browser';
    case 'ai':
    case 'network':
      return 'cloud';
    default:
      return 'server';
  }
}

/** One row of the weekly breakdown: a part, what it is for, and where it is recorded. */
export interface ArchPart {
  id: string;
  label: string;
  purpose: string;
  records?: string;
  arrives: number;
}

export function partsOfPicture(picture: ArchPicture): ArchPart[] {
  return picture.nodes.map((n) => ({ id: n.id, label: n.label, purpose: n.purpose, records: n.records, arrives: n.arrives }));
}

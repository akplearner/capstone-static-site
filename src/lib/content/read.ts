/**
 * Typed reads over a course document.
 *
 * A document's `content`, `topology` and `deliverables` are `Record<string,
 * unknown>` on the wire — the writer walks the content modules and keeps
 * whatever is data, so the document's shape is "whatever the module exports
 * that is not a function". These accessors give that back its type without a
 * runtime import: `typeof import('…')` is a type query, so `read.ts` names the
 * module's shape and never loads the module — which is what keeps the reader
 * outside the writer's import graph.
 *
 * `DataOf` drops the functions, exactly as `contentData` does on the way out,
 * so the type here is the type of what is actually in the file.
 */
import type { CourseDto, Serialisable } from './dto';
import type { DeliverableDef } from '@/lib/docs/types';
import type { RoleGuide } from '@/lib/roleGuide';
import type { CloudTopology, IacBundle } from '@/lib/cloud/model';
import type { KitSpec } from '@/lib/diagrams/kitSpec';
import type { BuildModel, WeekVisual } from '@/lib/weekVisual';
import type { ArchPart, ArchPicture } from '@/lib/docs/archPicture';

type DataOf<M> = { [K in keyof M as M[K] extends (...args: never[]) => unknown ? never : K]: M[K] };
type ContentOf<M> = Serialisable<DataOf<M>>;

export type CysaContent = ContentOf<typeof import('@/lib/docs/cysaContent')>;
export type SecurityContent = ContentOf<typeof import('@/lib/docs/securityContent')>;
export type ManualContent = ContentOf<typeof import('@/lib/docs/manual')>;
export type ServerDiagramsContent = ContentOf<typeof import('@/lib/docs/serverDiagrams')>;
export type CcnaDiagramsContent = ContentOf<typeof import('@/lib/docs/ccnaDiagrams')>;
export type CcnaKitContent = ContentOf<typeof import('@/lib/docs/ccnaKit')>;
export type TroubleshootingContent = ContentOf<typeof import('@/lib/docs/troubleshooting')>;
export type CustodyContent = ContentOf<typeof import('@/lib/docs/custodyTemplate')>;
export type MsspContent = ContentOf<typeof import('@/lib/docs/msspContent')>;
/** R103: the architecture picture and its build model, one shape for every course that draws its own. */
export type ArchContent = Serialisable<{ ARCH: ArchPicture; ARCH_BUILD: BuildModel }>;
export type ProcedureWeeks = Serialisable<typeof import('@/lib/docs/serverProcedures').WEEKS>;
export type Procedures = Serialisable<typeof import('@/lib/docs/serverProcedures').PROCEDURES>;

import { withDerivedBundle } from '@/lib/docs/derive';

const section = <T,>(doc: CourseDto, key: string): T => ((doc.content?.[key] ?? {}) as T);

/** The forms, checklists and templates this course's students fill in. */
export function deliverablesOf(doc: CourseDto): DeliverableDef[] {
  // `Serialisable<DeliverableDef>` and `DeliverableDef` are the same shape now
  // that every Definition-of-Done check is a predicate (data) — dto.test.ts
  // asserts there is no function marker anywhere in a document.
  //
  // R84: every definition leaves here with its bundle (validators, rubric,
  // visual) filled in — derived from the definition itself when the seed does
  // not set it, so all 52 forms meet the standard without 52 edits, and the
  // exported JSON stays byte-identical to the seeds.
  return ((doc.deliverables ?? []) as unknown as DeliverableDef[]).map(withDerivedBundle);
}

export const cysaOf = (doc: CourseDto) => section<CysaContent>(doc, 'cysa');
export const securityOf = (doc: CourseDto) => section<SecurityContent>(doc, 'security');
export const manualOf = (doc: CourseDto) => section<ManualContent>(doc, 'manual');
export const serverDiagramsOf = (doc: CourseDto) => section<ServerDiagramsContent>(doc, 'diagrams');
export const ccnaDiagramsOf = (doc: CourseDto) => section<CcnaDiagramsContent>(doc, 'ccnaDiagrams');
export const ccnaKitOf = (doc: CourseDto) => section<CcnaKitContent>(doc, 'kit');
export const troubleshootingOf = (doc: CourseDto) => section<TroubleshootingContent>(doc, 'troubleshooting');
export const custodyOf = (doc: CourseDto) => section<CustodyContent>(doc, 'custody');
export const msspOf = (doc: CourseDto) => section<MsspContent>(doc, 'mssp');
/** R103: the course's architecture picture (Security+, CySA+, MSSP, SecAI+, CISSP). */
export const archOf = (doc: CourseDto) => section<ArchContent>(doc, 'arch');

/**
 * R103: every part of the course's picture, whatever draws it — the arch
 * picture's nodes, the rack's and the campus's part catalogues, or the cloud
 * topology's resources — as the rows of the weekly breakdown.
 */
export function partsOf(doc: CourseDto): ArchPart[] {
  const arch = doc.content?.arch as ArchContent | undefined;
  if (arch?.ARCH?.nodes) return arch.ARCH.nodes.map((n) => ({ id: n.id, label: n.label, purpose: n.purpose, records: n.records, arrives: n.arrives }));
  for (const key of ['diagrams', 'ccnaDiagrams']) {
    const parts = (doc.content?.[key] as { PARTS?: ArchPart[] } | undefined)?.PARTS;
    if (parts) return parts;
  }
  const cloud = cloudOf(doc);
  if (cloud) {
    return cloud.topology.nodes
      .filter((n) => !n.detail)
      .map((n) => ({ id: n.id, label: n.name ? `${n.label} · ${n.name}` : n.label, purpose: n.purpose ?? '', arrives: n.week }));
  }
  return [];
}
/** R99: the course's "What you build this week" visuals, one per week. */
export const weekVisualsOf = (doc: CourseDto): WeekVisual[] => ((doc.content?.weekVisuals ?? []) as WeekVisual[]);

/** The cloud capstones' topology and template (R87). Absent on other courses. */
export interface CloudContent {
  topology: CloudTopology;
  iac: IacBundle;
  workflows: KitSpec[];
  /** R90: which global weeks this course is, and its one-line intro. */
  block: { weeks: [number, number]; intro: string; title: string };
  raci: typeof import('@/lib/cloud/workflows').CLOUD_RACI;
  phases: typeof import('@/lib/cloud/workflows').CLOUD_PHASES;
}
export function cloudOf(doc: CourseDto): CloudContent | null {
  const c = doc.content?.cloud as CloudContent | undefined;
  return c?.topology && c?.iac ? c : null;
}

/** Server+ only: the configuration guide the steps point at. Empty elsewhere. */
export function proceduresOf(doc: CourseDto): { weeks: ProcedureWeeks; procedures: Procedures } {
  return {
    weeks: (doc.procedureWeeks ?? []) as ProcedureWeeks,
    procedures: (doc.procedures ?? []) as Procedures,
  };
}

/** The role guides written for this course, keyed by role id. A role with no
 *  entry has no specific guide, and the join picker shows its mission instead. */
export function roleGuidesOf(doc: CourseDto): Record<string, RoleGuide> {
  return (doc.roleGuide ?? {}) as Record<string, RoleGuide>;
}

export function glossaryOf(doc: CourseDto): Record<string, string> {
  return doc.glossary ?? {};
}

/** Fill `{token}` placeholders in a caption read from the document. Unknown
 *  tokens are left alone so a half-filled caption is visible rather than
 *  silently blank. Lived in two content modules until R78-D3. */
export function fillCopy(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in values ? String(values[k]) : m));
}

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
export type ProcedureWeeks = Serialisable<typeof import('@/lib/docs/serverProcedures').WEEKS>;
export type Procedures = Serialisable<typeof import('@/lib/docs/serverProcedures').PROCEDURES>;

const section = <T,>(doc: CourseDto, key: string): T => ((doc.content?.[key] ?? {}) as T);

/** The forms, checklists and templates this course's students fill in. */
export function deliverablesOf(doc: CourseDto): DeliverableDef[] {
  // `Serialisable<DeliverableDef>` and `DeliverableDef` are the same shape now
  // that every Definition-of-Done check is a predicate (data) — dto.test.ts
  // asserts there is no function marker anywhere in a document.
  return (doc.deliverables ?? []) as unknown as DeliverableDef[];
}

export const cysaOf = (doc: CourseDto) => section<CysaContent>(doc, 'cysa');
export const securityOf = (doc: CourseDto) => section<SecurityContent>(doc, 'security');
export const manualOf = (doc: CourseDto) => section<ManualContent>(doc, 'manual');
export const serverDiagramsOf = (doc: CourseDto) => section<ServerDiagramsContent>(doc, 'diagrams');
export const ccnaDiagramsOf = (doc: CourseDto) => section<CcnaDiagramsContent>(doc, 'ccnaDiagrams');
export const ccnaKitOf = (doc: CourseDto) => section<CcnaKitContent>(doc, 'kit');
export const troubleshootingOf = (doc: CourseDto) => section<TroubleshootingContent>(doc, 'troubleshooting');
export const custodyOf = (doc: CourseDto) => section<CustodyContent>(doc, 'custody');

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

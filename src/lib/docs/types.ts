import { Framework, Role } from '../types';
import type { Column } from '../grc/templates';

/**
 * A single (non-repeating) input on a deliverable form.
 *
 * The five types after `signature` were added because nearly every input in the
 * course was a free-text box — 149 of ~190 table columns — including the ones
 * holding a port number, a disk size, a date, an address or a hostname the team
 * had already written down somewhere else. A text box accepts anything, so it
 * accepts the wrong thing silently, and asks the student to remember a format
 * nobody stated.
 *
 *   number    a quantity, with its unit shown in the field rather than hidden
 *             in the placeholder
 *   ipv4      an address, checked for shape once the student leaves the field
 *   hostref   a host the team has already declared — the reason `websrv`,
 *             `web-srv` and `WebSrv` used to appear in three different forms
 *   duration  a recovery target: a number and a unit, not a sentence
 *   evidence  a reference to an artifact the student has actually hashed,
 *             picked rather than described
 *
 * `hostref` and `evidence` need to see beyond this one form, which is what
 * `FormContext` below is for.
 */
export type FieldType =
  | 'text'
  | 'area'
  | 'select'
  | 'date'
  | 'paste'
  | 'fileref'
  | 'signature'
  | 'number'
  | 'ipv4'
  | 'hostref'
  | 'duration'
  | 'evidence';

export interface Field {
  field: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  /** Unit for a `number` — GB, ports, minutes. Rendered inside the input. */
  unit?: string;
  /** Read-only value computed from the record (e.g. derived severity). */
  derived?: (rec: Record<string, string>) => string;
}

/**
 * What a form can see beyond itself.
 *
 * `DeliverableForm` is handed one document. Two things need more than that: a
 * `hostref` has to offer the hostnames the team declared in another form, and
 * an `evidence` field has to offer the artifacts this member has hashed. Rather
 * than let either reach into a repo from inside a cell renderer, the page builds
 * this once and passes it down.
 *
 * Everything here is plain data, so a test can construct one.
 */
export interface FormContext {
  /** Every deliverable this team has saved, by deliverable id. */
  docs: Record<string, DeliverableData>;
  /** Hostnames the team has declared, deduplicated and sorted. */
  hostnames: string[];
  /** Artifacts this member has hashed — filename first, hash for the record. */
  evidence: { filename: string; sha256: string }[];
}

export function emptyFormContext(): FormContext {
  return { docs: {}, hostnames: [], evidence: [] };
}

// A repeatable multi-row table inside a deliverable (Asset Inventory, Risk
// Register, the IoC table, the Evidence log, per-finding rows). Reuses the
// RegisterTable column schema.
export interface FieldGroup {
  group: string;
  label: string;
  help?: string;
  columns: Column[];
  /** Worked-example rows. */
  seed?: Record<string, string>[];
}

export type Section =
  | { kind: 'fields'; title?: string; fields: Field[] }
  | { kind: 'group'; group: FieldGroup };

export type DeliverableKind = 'template' | 'form' | 'checklist';

// One stored deliverable: single fields + named repeatable groups.
export interface DeliverableData {
  fields: Record<string, string>;
  groups: Record<string, Record<string, string>[]>;
}

export interface DodCheck {
  label: string;
  test: (d: DeliverableData) => boolean;
  /**
   * The first week this check counts. A form that spans weeks — a log written
   * across the build, an addressing table filled once the system runs — was
   * being graded on ALL of its checks in EVERY week it appeared, so Week 1
   * could not be marked complete until Week 3's work was done. A check with a
   * `week` is simply not evaluated before that week; one without it behaves
   * exactly as it always has.
   */
  week?: number;
}

export interface DeliverableDef {
  id: string; // 'asset_inventory'
  num: number; // 1..8
  file: string; // '02_Asset_Inventory.csv'
  title: string;
  /** Which course this deliverable belongs to. Omitted = 'security-plus'
   *  (the original single-course set). Used to scope the docs subsystem so a
   *  second course's forms never leak into another course's pages/ZIP. */
  courseId?: string;
  /** Who leads the documentation for this record. On a role-split course that
   *  is also who fills it; on a shared-track course (see `shared`) everyone
   *  fills it and this is the focus that documents it deepest. It is the lane
   *  the deliverable chain draws it in, so it must be a real role of the course. */
  owner: Role; // 'red' | 'blue' | 'grc'
  /** Every role of the course sees and fills this form, not just `owner`.
   *  Set on shared-track courses, where the build is one shared track and the
   *  role only decides whose deep-dive the record gets. */
  shared?: boolean;
  folder: string;
  standard: string;
  framework?: Framework;
  /** Weeks this deliverable is produced/updated (per spec §4). */
  weeks: number[];
  gate?: number;
  /** Hard-lock this deliverable until the team's Scope & RoE is signed off (ethics anchor). */
  requiresAuth?: boolean;
  kind: DeliverableKind;
  /** Primary export format for the file. */
  exportFormat: 'md' | 'csv';
  purpose: string;
  howTo: string;
  /** Which Red/Blue/other input this is built from. */
  source?: string;
  /** Optional richer "how to build this — and what it means" guidance, shown in a
   *  collapsible on the Deliverables page. All optional so other courses are
   *  unaffected. */
  buildSteps?: string[]; // ordered how-to: where each value comes from
  meaning?: string; // what it means & what a good one looks like
  useIt?: string; // who receives it / what it feeds next
  pitfalls?: string[]; // common mistakes to avoid
  /** Deliverable ids this document feeds into — the real dependency edges.
   *
   *  The chain was previously expressed only in the `source` / `useIt` prose
   *  above, which reads well but no code can follow. These are the same edges
   *  the prose already describes, written so the app can draw them. Ids must
   *  resolve within the same course (asserted by content-integrity.test.ts). */
  feeds?: string[];
  /** The course's final artefact — the one that is defended rather than merely
   *  filed. Exactly one deliverable per course carries this, and filing it is
   *  what completes the Capstone Stone. */
  capstone?: boolean;
  sections: Section[];
  /** Objective Definition-of-Done checks (spec §8). */
  dod?: DodCheck[];
}

/** Empty data shell for a deliverable (no example rows). */
export function emptyData(): DeliverableData {
  return { fields: {}, groups: {} };
}

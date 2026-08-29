import { Framework, Role } from '../types';
import type { Column } from '../grc/templates';

// A single (non-repeating) input on a deliverable form.
export type FieldType = 'text' | 'area' | 'select' | 'date' | 'paste' | 'fileref' | 'signature';

export interface Field {
  field: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  /** Read-only value computed from the record (e.g. derived severity). */
  derived?: (rec: Record<string, string>) => string;
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

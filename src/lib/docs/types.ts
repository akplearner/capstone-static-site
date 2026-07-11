import { Framework, Role } from '../types';
import type { Column } from '../grc/templates';

// A single (non-repeating) input on a deliverable form.
export type FieldType = 'text' | 'area' | 'select' | 'date' | 'paste' | 'fileref';

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
  owner: Role; // 'red' | 'blue' | 'grc'
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
  sections: Section[];
  /** Objective Definition-of-Done checks (spec §8). */
  dod?: DodCheck[];
}

/** Empty data shell for a deliverable (no example rows). */
export function emptyData(): DeliverableData {
  return { fields: {}, groups: {} };
}

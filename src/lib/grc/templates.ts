import type { RegisterRow } from '../types';

/**
 * The column schema `RegisterTable` runs on, and the two derivations it needs.
 *
 * This file used to be the whole GRC Workspace: a `RegisterDef` per register,
 * a `REGISTERS` catalogue, a seeder and CSV/Markdown exporters — about 150
 * lines. The deliverable forms in `lib/docs/` replaced all of it and nothing
 * called any of it, so R65 removed it. Only the column vocabulary survived,
 * because that is what the table still speaks.
 */

// Column schema for the generic RegisterTable. `derived` columns are computed
// (read-only) from the other fields, so students don't hand-calculate severity
// or risk level.
export type ColumnType =
  | 'text'
  | 'number'
  | 'select'
  | 'area'
  | 'date'
  | 'ipv4'
  | 'hostref'
  | 'duration'
  | 'evidence';
export interface Column {
  field: string;
  label: string;
  type: ColumnType;
  options?: string[];
  derived?: (row: RegisterRow) => string;
  /** Unit for a `number` column — GB, ports, minutes. Shown inside the cell. */
  unit?: string;
  /** For an `ipv4` column: the sibling column naming the subnet this address
   *  should sit in, so the cell can say "that is not in the zone you named"
   *  rather than only checking the shape. */
  subnetFrom?: string;
  /** An EXAMPLE of a good value. */
  placeholder?: string;
  /**
   * Where the value comes from — the command to run, the screen to read, the
   * menu path to follow. `Field` has carried this since the forms were written,
   * but `Column` did not, and two thirds of every form's inputs are columns. So
   * the one thing a student most needs ("how do I get this?") was structurally
   * impossible to say for most of the course, and one table worked around it by
   * adding a literal "How you found it" column to hold the answer.
   *
   * Rendered as a hint under the column heading, once per table rather than
   * once per row.
   */
  help?: string;
}

/** Likelihood × Impact → risk level (NIST SP 800-30 style 3×3 matrix). */
export function riskLevel(likelihood: string, impact: string): string {
  const v = (x: string) => (x === 'High' ? 3 : x === 'Medium' ? 2 : x === 'Low' ? 1 : 0);
  const score = v(likelihood) * v(impact);
  if (score === 0) return '';
  if (score >= 6) return 'Critical';
  if (score >= 4) return 'High';
  if (score >= 2) return 'Medium';
  return 'Low';
}

/** Value for a cell, computing derived columns. */
export function cellValue(col: Column, row: RegisterRow): string {
  return col.derived ? col.derived(row) : row[col.field] ?? '';
}

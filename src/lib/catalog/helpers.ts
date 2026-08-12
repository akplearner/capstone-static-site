import type { Level } from '../types';
import { CATALOG, type CatalogEntry } from './entries';
import { VENDORS, vendorById, type Vendor } from './vendors';
import { LEVEL_ORDER, LEVELS, type LevelDef } from './levels';

/** True for an entry with an authored capstone behind it. */
export function isAvailable(entry: CatalogEntry): boolean {
  return entry.status === 'available';
}

/** The course route for an entry — only ever set for an available one, so a
 *  coming-soon cell can never link into /courses/* and hit a missing course. */
export function courseHref(entry: CatalogEntry): string | null {
  return entry.status === 'available' && entry.courseId ? `/courses/${entry.courseId}` : null;
}

/** The catalog entry that opens a given course, if any. */
export function entryForCourse(courseId: string): CatalogEntry | undefined {
  return CATALOG.find((e) => e.status === 'available' && e.courseId === courseId);
}

/** Entries in a single vendor × level cell, in catalog order. */
export function entriesFor(vendorId: string, level: Level): CatalogEntry[] {
  return CATALOG.filter((e) => e.vendorId === vendorId && e.level === level);
}

/** The levels a vendor actually has entries for, foundation-first. */
export function levelsForVendor(vendorId: string): LevelDef[] {
  const present = new Set(CATALOG.filter((e) => e.vendorId === vendorId).map((e) => e.level));
  return LEVELS.filter((l) => present.has(l.id)).sort((a, b) => a.order - b.order);
}

export interface VendorGroup {
  vendor: Vendor;
  /** Cells for this vendor, one per level that has entries, foundation-first. */
  cells: { level: LevelDef; entries: CatalogEntry[] }[];
  /** How many entries are available (unlocked) vs total, for the vendor header. */
  availableCount: number;
  totalCount: number;
}

/**
 * The whole grid, grouped by vendor in canonical order, each vendor's cells in
 * level order. Optional filters narrow to a single vendor and/or level without
 * changing the shape callers render. Vendors that end up empty after filtering
 * are dropped.
 */
export function catalogByVendor(opts?: { vendorId?: string; level?: Level }): VendorGroup[] {
  const vendors = opts?.vendorId ? VENDORS.filter((v) => v.id === opts.vendorId) : VENDORS;

  return vendors
    .map((vendor) => {
      const levels = levelsForVendor(vendor.id).filter(
        (l) => !opts?.level || l.id === opts.level
      );
      const cells = levels
        .map((level) => ({ level, entries: entriesFor(vendor.id, level.id) }))
        .filter((cell) => cell.entries.length > 0);
      const all = cells.flatMap((c) => c.entries);
      return {
        vendor,
        cells,
        availableCount: all.filter(isAvailable).length,
        totalCount: all.length,
      };
    })
    .filter((group) => group.cells.length > 0);
}

/** Headline counts for the catalog (used by the Explore/landing copy). */
export function catalogSummary(): { available: number; total: number; vendors: number } {
  return {
    available: CATALOG.filter(isAvailable).length,
    total: CATALOG.length,
    vendors: VENDORS.length,
  };
}

export { CATALOG, VENDORS, vendorById, LEVELS, LEVEL_ORDER };
export type { CatalogEntry, Vendor, LevelDef };

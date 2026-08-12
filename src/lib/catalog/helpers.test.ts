import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CATALOG,
  VENDORS,
  LEVELS,
  LEVEL_ORDER,
  vendorById,
  isAvailable,
  courseHref,
  entryForCourse,
  entriesFor,
  levelsForVendor,
  catalogByVendor,
  catalogSummary,
} from './index';
import { SECURITY_PLUS } from '../data/seed/securityPlus';
import { CYSA_PLUS } from '../data/seed/cysa';
import { MSSP } from '../data/seed/mssp';
import type { Course, Level } from '../types';

const COURSES: Course[] = [SECURITY_PLUS, CYSA_PLUS, MSSP];
const COURSE_BY_ID = new Map(COURSES.map((c) => [c.id, c]));
const LEVEL_IDS = new Set<Level>(LEVELS.map((l) => l.id));

// The region blocks the theme actually declares. A vendor pointing at a region
// with no block would render un-themed rock — this is the guard the plan calls for.
const CSS = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');
const REGION_BLOCKS = new Set(
  [...CSS.matchAll(/\[data-region='([^']+)'\]/g)].map((m) => m[1])
);

describe('catalog — vendors', () => {
  it('every vendor maps to a region with a CSS block', () => {
    for (const v of VENDORS) {
      expect(REGION_BLOCKS.has(v.region), `${v.id} → region "${v.region}"`).toBe(true);
    }
  });

  it('vendor ids are unique', () => {
    const ids = VENDORS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('catalog — levels', () => {
  it('LEVEL_ORDER is foundation-first and complete', () => {
    expect(LEVEL_ORDER).toEqual(['entry', 'associate', 'professional', 'expert']);
    expect(LEVELS.map((l) => l.order)).toEqual([1, 2, 3, 4]);
  });
});

describe('catalog — entries', () => {
  it('entry ids are unique', () => {
    const ids = CATALOG.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry has a known vendor and level', () => {
    for (const e of CATALOG) {
      expect(vendorById(e.vendorId), `${e.id} vendor`).toBeTruthy();
      expect(LEVEL_IDS.has(e.level), `${e.id} level "${e.level}"`).toBe(true);
    }
  });

  it('every available entry resolves to a real seed course at the matching level', () => {
    for (const e of CATALOG.filter(isAvailable)) {
      expect(e.courseId, `${e.id} must carry a courseId`).toBeTruthy();
      const course = COURSE_BY_ID.get(e.courseId!);
      expect(course, `${e.id} → course "${e.courseId}"`).toBeTruthy();
      // If the course declares a level, the catalog must agree with it.
      if (course?.level) {
        expect(course.level, `${e.id} level vs course.level`).toBe(e.level);
      }
    }
  });

  it('coming-soon entries never carry a course link', () => {
    for (const e of CATALOG.filter((x) => !isAvailable(x))) {
      expect(e.courseId, `${e.id}`).toBeUndefined();
      expect(courseHref(e), `${e.id}`).toBeNull();
    }
  });

  it('all three seed courses are represented as available entries', () => {
    for (const c of COURSES) {
      const entry = entryForCourse(c.id);
      expect(entry, `no catalog entry for ${c.id}`).toBeTruthy();
      expect(entry && isAvailable(entry)).toBe(true);
    }
  });
});

describe('catalog — grouping', () => {
  it('catalogByVendor keeps vendor + level order and drops empty vendors', () => {
    const groups = catalogByVendor();
    expect(groups.length).toBeGreaterThan(0);
    for (const g of groups) {
      expect(g.cells.length).toBeGreaterThan(0);
      const orders = g.cells.map((c) => c.level.order);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
      expect(g.totalCount).toBe(g.cells.reduce((n, c) => n + c.entries.length, 0));
    }
  });

  it('filters narrow to a single vendor and level', () => {
    const groups = catalogByVendor({ vendorId: 'comptia', level: 'professional' });
    expect(groups).toHaveLength(1);
    expect(groups[0].vendor.id).toBe('comptia');
    for (const cell of groups[0].cells) expect(cell.level.id).toBe('professional');
  });

  it('entriesFor and levelsForVendor agree with the grid', () => {
    for (const v of VENDORS) {
      const levels = levelsForVendor(v.id);
      const fromCells = levels.flatMap((l) => entriesFor(v.id, l.id));
      const direct = CATALOG.filter((e) => e.vendorId === v.id);
      expect(fromCells.length).toBe(direct.length);
    }
  });

  it('summary counts match the raw catalog', () => {
    const s = catalogSummary();
    expect(s.available).toBe(CATALOG.filter(isAvailable).length);
    expect(s.total).toBe(CATALOG.length);
    expect(s.vendors).toBe(VENDORS.length);
  });
});

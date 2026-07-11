import { describe, it, expect } from 'vitest';
import {
  DELIVERABLES,
  seedDeliverable,
  deliverableIdByTitle,
  deliverablesForRole,
  deliverablesForCourse,
  courseIdOf,
  getDeliverable,
} from './definitions';
import { emptyData } from './types';

describe('DELIVERABLES integrity', () => {
  it('has globally-unique ids and per-course-unique numbers', () => {
    const ids = DELIVERABLES.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Numbers are the display ordinal within a course, so they only need to be
    // unique per course (Security+ 1..14, MSSP 1..8, …).
    const byCourse = new Map<string, number[]>();
    for (const d of DELIVERABLES) {
      const key = courseIdOf(d);
      byCourse.set(key, [...(byCourse.get(key) ?? []), d.num]);
    }
    for (const [course, nums] of byCourse) {
      expect(new Set(nums).size, course).toBe(nums.length);
    }
  });

  it('every deliverable has an owner, file and at least one week', () => {
    for (const d of DELIVERABLES) {
      expect(d.owner, d.id).toBeTruthy();
      expect(d.file, d.id).toMatch(/\.\w+$/);
      expect(d.weeks.length, d.id).toBeGreaterThan(0);
    }
  });
});

describe('DoD checks are robust', () => {
  // DoD `test` functions run against arbitrary saved form data on the gate-
  // readiness panel; they must never throw and must return a boolean for both
  // empty data and the seeded example (seeds are illustrative, so they may or
  // may not "pass").
  it('every DoD check returns a boolean and never throws', () => {
    for (const d of DELIVERABLES) {
      for (const check of d.dod ?? []) {
        for (const data of [emptyData(), seedDeliverable(d)]) {
          expect(() => check.test(data), `${d.id}: "${check.label}"`).not.toThrow();
          expect(typeof check.test(data), `${d.id}: "${check.label}"`).toBe('boolean');
        }
      }
    }
  });

  it('the ethics form (scope_roe) is not satisfied by empty data', () => {
    const scope = DELIVERABLES.find((d) => d.id === 'scope_roe');
    expect(scope?.dod?.length).toBeGreaterThan(0);
    expect(scope!.dod!.every((c) => c.test(emptyData()))).toBe(false);
  });
});

describe('lookup helpers', () => {
  it('deliverableIdByTitle resolves titles case-insensitively', () => {
    const d = DELIVERABLES[0];
    expect(deliverableIdByTitle(d.title)).toBe(d.id);
    expect(deliverableIdByTitle(d.title.toUpperCase())).toBe(d.id);
    expect(deliverableIdByTitle('no such form')).toBeUndefined();
  });

  it('deliverablesForRole returns only that role+course and matches getDeliverable', () => {
    const grc = deliverablesForRole('grc', 'security-plus');
    expect(grc.length).toBeGreaterThan(0);
    expect(grc.every((d) => d.owner === 'grc')).toBe(true);
    expect(grc.every((d) => courseIdOf(d) === 'security-plus')).toBe(true);
    expect(getDeliverable(grc[0].id)).toEqual(grc[0]);
  });

  it('deliverablesForCourse isolates each course (no cross-course leak)', () => {
    const sp = deliverablesForCourse('security-plus');
    const mssp = deliverablesForCourse('mssp');
    expect(sp.length).toBeGreaterThan(0);
    expect(mssp.length).toBeGreaterThan(0);
    expect(sp.some((d) => mssp.includes(d))).toBe(false);
    expect(sp.length + mssp.length).toBe(DELIVERABLES.length);
  });
});

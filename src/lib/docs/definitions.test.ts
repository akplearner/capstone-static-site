import { describe, it, expect } from 'vitest';
import {
  DELIVERABLES,
  seedDeliverable,
  deliverableIdByTitle,
  deliverablesForRole,
  getDeliverable,
} from './definitions';
import { emptyData } from './types';

describe('DELIVERABLES integrity', () => {
  it('has unique ids and numbers', () => {
    const ids = DELIVERABLES.map((d) => d.id);
    const nums = DELIVERABLES.map((d) => d.num);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(nums).size).toBe(nums.length);
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

  it('deliverablesForRole returns only that role and matches getDeliverable', () => {
    const grc = deliverablesForRole('grc');
    expect(grc.length).toBeGreaterThan(0);
    expect(grc.every((d) => d.owner === 'grc')).toBe(true);
    expect(getDeliverable(grc[0].id)).toEqual(grc[0]);
  });
});

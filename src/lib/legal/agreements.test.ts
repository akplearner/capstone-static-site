import { describe, it, expect } from 'vitest';
import { AGREEMENTS, missingAcceptances } from './agreements';

describe('R86 — the agreements registry and the re-ask rule', () => {
  it('carries the five acknowledgements the platform stands on', () => {
    const ids = AGREEMENTS.map((a) => a.id);
    expect(ids).toEqual(['terms', 'aup', 'lab', 'privacy', 'conduct']);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of AGREEMENTS) {
      expect(a.version, a.id).toBeGreaterThanOrEqual(1);
      expect(a.sections.length, a.id).toBeGreaterThan(0);
      expect(a.summary.length, a.id).toBeGreaterThan(10);
    }
  });

  it('says the load-bearing things in so many words', () => {
    const all = JSON.stringify(AGREEMENTS);
    expect(all).toContain('NO guarantee');
    expect(all).toMatch(/pass any exam/);
    expect(all).toContain('Scope & Rules of Engagement');
    expect(all).toContain('not responsible for damage');
    expect(all).toContain('never the pasted text');
  });

  it('missingAcceptances: everything for a new account, nothing when current, the bumped one after a bump', () => {
    expect(missingAcceptances({})).toHaveLength(AGREEMENTS.length);
    const current = Object.fromEntries(AGREEMENTS.map((a) => [a.id, a.version]));
    expect(missingAcceptances(current)).toHaveLength(0);
    const stale = { ...current, aup: 0 };
    const missing = missingAcceptances(stale);
    expect(missing.map((a) => a.id)).toEqual(['aup']);
    // A future version someone somehow holds never goes negative on the gate.
    expect(missingAcceptances({ ...current, terms: 99 })).toHaveLength(0);
  });
});

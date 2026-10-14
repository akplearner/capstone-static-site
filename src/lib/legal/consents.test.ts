import { describe, it, expect } from 'vitest';
import { CONSENTS, NO_CONSENT, NO_TRAINING, foldConsentRows, isConsentId } from './consents';

/** R110 — three grants, off by default, the latest row wins, nothing about training. */
describe('consents', () => {
  it('names exactly three grants and never a training grant', () => {
    expect(CONSENTS.map((c) => c.id)).toEqual(['share-employer', 'benchmark', 'outcome']);
    expect(JSON.stringify(CONSENTS)).not.toMatch(/\btrain(ing)?\b/i);
    expect(NO_TRAINING).toContain('train');
    for (const c of CONSENTS) {
      expect(c.allows.length).toBeGreaterThan(20);
      expect(c.neverAllows.length).toBeGreaterThan(20);
    }
    expect(Object.values(NO_CONSENT).every((v) => v === false)).toBe(true);
  });

  it('folds rows so the latest answer per grant wins, and ignores unknown grants', () => {
    expect(foldConsentRows([])).toEqual(NO_CONSENT);
    const state = foldConsentRows([
      { grantId: 'outcome', granted: true, recordedAt: 1 },
      { grantId: 'outcome', granted: false, recordedAt: 2 },
      { grantId: 'benchmark', granted: true, recordedAt: 5 },
      { grantId: 'benchmark', granted: false, recordedAt: 4 },
      { grantId: 'train', granted: true, recordedAt: 9 },
    ]);
    expect(state).toEqual({ 'share-employer': false, benchmark: true, outcome: false });
    expect(isConsentId('train')).toBe(false);
    expect(isConsentId('outcome')).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { GLOSSARY, findTerms } from './glossary';

describe('glossary matcher', () => {
  it('finds a known term as a whole word', () => {
    const m = findTerms('The SOC watches for attacks.');
    expect(m.map((x) => x.term)).toContain('SOC');
    expect(m[0].definition).toBe(GLOSSARY.SOC);
  });

  it('ignores a term embedded inside another word', () => {
    // "soc" inside "associate" must NOT match.
    const m = findTerms('She is an associate here.');
    expect(m.some((x) => x.term.toLowerCase() === 'soc')).toBe(false);
  });

  it('matches only the first occurrence of a term', () => {
    const m = findTerms('SOC feeds the SOC and the SOC again.');
    expect(m.filter((x) => x.term === 'SOC')).toHaveLength(1);
  });

  it('prefers the longer multi-word term over a shorter one inside it', () => {
    const m = findTerms('Keep the chain of custody intact.');
    expect(m.map((x) => x.term)).toContain('chain of custody');
  });

  it('is case-insensitive but preserves the original casing', () => {
    const m = findTerms('run triage on the alerts');
    const t = m.find((x) => x.definition === GLOSSARY.triage);
    expect(t?.term).toBe('triage');
  });

  it('returns matches sorted by position and non-overlapping', () => {
    const m = findTerms('The SOC uses a SIEM to raise an IOC.');
    for (let i = 1; i < m.length; i++) {
      expect(m[i].start).toBeGreaterThanOrEqual(m[i - 1].end);
    }
  });

  it('returns nothing for text with no known terms', () => {
    expect(findTerms('the quick brown fox')).toEqual([]);
    expect(findTerms('')).toEqual([]);
  });
});

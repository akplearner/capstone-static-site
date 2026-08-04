import { describe, it, expect } from 'vitest';
import {
  buildTargets,
  locateTargets,
  looksLikeConsoleOutput,
  GENERIC_VERIFY_LABEL,
} from './stepOutcome';

describe('looksLikeConsoleOutput', () => {
  it('treats multi-line text as captured console output', () => {
    expect(looksLikeConsoleOutput('line one\nline two')).toBe(true);
  });

  it('treats an explicit prompt as console output', () => {
    expect(looksLikeConsoleOutput('$ systemctl status suricata')).toBe(true);
    expect(looksLikeConsoleOutput('student@ubuntu:~$ whoami')).toBe(true);
  });

  it('treats a one-line summary sentence as a described result', () => {
    // These are real authored values; rendering them in terminal chrome with a
    // copy button was the original complaint.
    expect(
      looksLikeConsoleOutput(
        'Both Team<#>-ubuntu and Team<#>-win show Active with a recent check-in, captured in a screenshot.'
      )
    ).toBe(false);
    expect(looksLikeConsoleOutput('ens18 inet 10.10.100.X, ping reply from target')).toBe(false);
  });

  it('is false for empty or whitespace-only text', () => {
    // Trimmed first, so a string of only spaces and newlines is empty output —
    // not console output with an unlucky newline in it.
    expect(looksLikeConsoleOutput('')).toBe(false);
    expect(looksLikeConsoleOutput('   ')).toBe(false);
    expect(looksLikeConsoleOutput('   \n  ')).toBe(false);
  });
});

describe('locateTargets', () => {
  const out = 'Active: active (running) since Mon; Connected to the server';

  it('finds targets case-insensitively and numbers them in reading order', () => {
    const { hits, missing } = locateTargets(out, [
      { text: 'Connected to the server', label: 'b' },
      { text: 'active (running)', label: 'a' },
    ]);
    expect(missing).toEqual([]);
    expect(hits.map((h) => h.text)).toEqual(['active (running)', 'Connected to the server']);
    expect(hits.map((h) => h.n)).toEqual([1, 2]);
    expect(out.slice(hits[0].start, hits[0].end).toLowerCase()).toBe('active (running)');
  });

  it('never overlaps two targets that share a substring', () => {
    const { hits } = locateTargets('active (running)', [
      { text: 'active', label: 'x' },
      { text: 'active (running)', label: 'y' },
    ]);
    const ranges = hits.map((h) => [h.start, h.end] as const);
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const [a0, a1] = ranges[i];
        const [b0, b1] = ranges[j];
        expect(a0 < b1 && b0 < a1).toBe(false);
      }
    }
  });

  it('reports targets that are absent from the sample rather than dropping them', () => {
    const { hits, missing } = locateTargets('nothing here', [
      { text: 'DENY', label: 'the firewall rule took effect' },
    ]);
    expect(hits).toEqual([]);
    expect(missing.map((m) => m.text)).toEqual(['DENY']);
  });

  it('ignores empty target text', () => {
    const { hits, missing } = locateTargets('abc', [{ text: '', label: 'nope' }]);
    expect(hits).toEqual([]);
    expect(missing).toEqual([]);
  });
});

describe('buildTargets', () => {
  it('turns verify tokens into targets with a generic label', () => {
    expect(buildTargets(['active (running)'])).toEqual([
      { text: 'active (running)', label: GENERIC_VERIFY_LABEL },
    ]);
  });

  it('lets an authored highlight replace the generic label for the same token', () => {
    const targets = buildTargets(
      ['Connected to the server'],
      [{ text: 'Connected to the server', label: 'proves the agent reached the SOC' }]
    );
    expect(targets).toHaveLength(1);
    expect(targets[0].label).toBe('proves the agent reached the SOC');
  });

  it('is case-insensitive when de-duplicating', () => {
    const targets = buildTargets(['ACTIVE'], [{ text: 'active', label: 'the service is up' }]);
    expect(targets).toHaveLength(1);
    expect(targets[0].label).toBe('the service is up');
  });

  it('returns an empty list when there is nothing to point at', () => {
    expect(buildTargets()).toEqual([]);
    expect(buildTargets([], [])).toEqual([]);
    expect(buildTargets(['  '])).toEqual([]);
  });
});

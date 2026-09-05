import { describe, it, expect } from 'vitest';
import { scoreOutput, foldAttempt, selfAttested, methodLabel, verifiableSteps } from './evidenceLedger';
import type { StepEvidence } from './data/types';
import type { Step } from './types';

// These rules decide whether a student's capstone reads as "verified" or
// "self-attested" — the one number the dashboard and the portfolio lead with. A
// regression here silently changes what the platform claims about someone's work,
// so the edge cases are pinned deliberately.

const VERIFY = ['Active', 'agent.conf', '10.10.100.5'];

describe('scoreOutput', () => {
  it('matches every token, case-insensitively', () => {
    const s = scoreOutput('Status: ACTIVE, reading AGENT.CONF from 10.10.100.5', VERIFY);
    expect(s).toMatchObject({ matched: 3, total: 3, allMatched: true });
    expect(s.missing).toEqual([]);
  });

  it('reports a partial match with the tokens still missing', () => {
    const s = scoreOutput('Status: Active', VERIFY);
    expect(s.matched).toBe(1);
    expect(s.allMatched).toBe(false);
    expect(s.missing).toEqual(['agent.conf', '10.10.100.5']);
  });

  it('scores empty or whitespace output as nothing matched', () => {
    expect(scoreOutput('', VERIFY).matched).toBe(0);
    expect(scoreOutput('   \n ', VERIFY).allMatched).toBe(false);
  });

  it('never claims a match when the step has no tokens to check', () => {
    // A step with no `verify` cannot be verified from output — it can only ever
    // be self-attested, and must not be counted as passing a check that is absent.
    expect(scoreOutput('anything at all', [])).toMatchObject({
      matched: 0,
      total: 0,
      allMatched: false,
    });
  });
});

describe('foldAttempt', () => {
  const base = {
    courseId: 'cysa-plus',
    taskId: 'cb-w1',
    stepId: 's1',
    at: 1_000,
  };

  it('records a first successful paste as verified', () => {
    const r = foldAttempt(undefined, {
      ...base,
      score: scoreOutput('Active agent.conf 10.10.100.5', VERIFY),
      outputSha256: 'h1',
    });
    expect(r).toMatchObject({
      verified: true,
      method: 'verified-output',
      matchedTokens: 3,
      attempts: 1,
      verifiedAt: 1_000,
      outputSha256: 'h1',
    });
    expect(r.firstAttemptAt).toBe(1_000);
  });

  it('counts a distinct second paste as a second attempt', () => {
    const first = foldAttempt(undefined, {
      ...base,
      score: scoreOutput('Active', VERIFY),
      outputSha256: 'h1',
    });
    const second = foldAttempt(first, {
      ...base,
      at: 2_000,
      score: scoreOutput('Active agent.conf 10.10.100.5', VERIFY),
      outputSha256: 'h2',
    });
    expect(second.attempts).toBe(2);
    expect(second.verified).toBe(true);
    // Effort is measured, never punished: the earlier struggle is kept as history.
    expect(second.firstAttemptAt).toBe(1_000);
    expect(second.verifiedAt).toBe(2_000);
  });

  it('does not inflate attempts when the identical text is re-recorded', () => {
    const first = foldAttempt(undefined, {
      ...base,
      score: scoreOutput('Active', VERIFY),
      outputSha256: 'same',
    });
    const again = foldAttempt(first, {
      ...base,
      at: 5_000,
      score: scoreOutput('Active', VERIFY),
      outputSha256: 'same',
    });
    expect(again.attempts).toBe(1);
  });

  it('keeps a step verified when a later paste is partial (verification is sticky)', () => {
    const ok = foldAttempt(undefined, {
      ...base,
      score: scoreOutput('Active agent.conf 10.10.100.5', VERIFY),
      outputSha256: 'good',
    });
    const partial = foldAttempt(ok, {
      ...base,
      at: 9_000,
      score: scoreOutput('Active', VERIFY),
      outputSha256: 'worse',
    });
    expect(partial.verified).toBe(true);
    expect(partial.method).toBe('verified-output');
    // The hash kept is the one that actually proved it.
    expect(partial.outputSha256).toBe('good');
    expect(partial.verifiedAt).toBe(1_000);
    // And the best score seen is not walked backwards.
    expect(partial.matchedTokens).toBe(3);
  });
});

describe('selfAttested', () => {
  const base = { courseId: 'cysa-plus', taskId: 'cb-w1', stepId: 's1', totalTokens: 3, at: 1_000 };

  it('records an un-evidenced tick honestly', () => {
    const r = selfAttested(undefined, base);
    expect(r).toMatchObject({ verified: false, method: 'self-attested', attempts: 0 });
    expect(r.verifiedAt).toBeUndefined();
  });

  it('never downgrades an already-verified step', () => {
    const verified: StepEvidence = {
      courseId: 'cysa-plus',
      taskId: 'cb-w1',
      stepId: 's1',
      verified: true,
      method: 'verified-output',
      matchedTokens: 3,
      totalTokens: 3,
      outputSha256: 'good',
      attempts: 2,
      firstAttemptAt: 500,
      verifiedAt: 900,
    };
    expect(selfAttested(verified, base)).toBe(verified);
  });
});

describe('verifiableSteps + methodLabel', () => {
  it('counts only steps that carry verify tokens', () => {
    const steps = [
      { id: 'a', verify: ['x'] },
      { id: 'b' },
      { id: 'c', verify: [] },
      { id: 'd', verify: ['y', 'z'] },
    ] as Step[];
    expect(verifiableSteps(steps).map((s) => s.id)).toEqual(['a', 'd']);
  });

  it('labels each method for the UI', () => {
    expect(methodLabel('verified-output')).toBe('Verified from output');
    expect(methodLabel('self-attested')).toBe('Self-attested');
  });
});

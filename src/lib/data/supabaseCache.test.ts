import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StepEvidence } from './types';

/**
 * The cloud cache's evidence map, per user (R81). Migration 0006 lets
 * teammates read each other's `step_evidence`, so the map now holds several
 * students' records at once; the user is part of the key so they never merge,
 * a teammate's records survive the caller's reset, and everything goes on
 * sign-out. No client is needed: the cache is the in-memory half.
 */
vi.mock('../supabase/client', () => ({ getBrowserClient: () => null }));

const { cache, setCurrentUserId, stepEvidenceFromRow } = await import('./supabaseCache');

const ev = (userless: Partial<StepEvidence> = {}): StepEvidence => ({
  courseId: 'security-plus',
  taskId: 't1',
  stepId: 's1',
  verified: true,
  method: 'verified-output',
  matchedTokens: 2,
  totalTokens: 2,
  attempts: 1,
  ...userless,
});

beforeEach(() => {
  setCurrentUserId(null);
  setCurrentUserId('ada');
});

describe('supabaseCache — evidence is keyed per user', () => {
  it('keeps two students\' records for the same step apart', () => {
    cache.setStepEvidence(ev(), 'ada');
    cache.setStepEvidence(ev({ verified: false, method: 'self-attested' }), 'bob');
    expect(cache.stepEvidence('security-plus', 'ada')['t1::s1'].method).toBe('verified-output');
    expect(cache.stepEvidence('security-plus', 'bob')['t1::s1'].method).toBe('self-attested');
    expect(cache.stepEvidence('security-plus', 'cy')).toEqual({});
  });

  it('scopes by course as well', () => {
    cache.setStepEvidence(ev(), 'ada');
    cache.setStepEvidence(ev({ courseId: 'ccna' }), 'ada');
    expect(Object.keys(cache.stepEvidence('security-plus', 'ada'))).toEqual(['t1::s1']);
    expect(Object.keys(cache.stepEvidence('ccna', 'ada'))).toEqual(['t1::s1']);
  });

  it('a reset drops only the caller\'s records — a teammate\'s badges are theirs', () => {
    cache.setStepEvidence(ev(), 'ada');
    cache.setStepEvidence(ev(), 'bob');
    cache.clearEvidence('security-plus');
    expect(cache.stepEvidence('security-plus', 'ada')).toEqual({});
    expect(Object.keys(cache.stepEvidence('security-plus', 'bob'))).toEqual(['t1::s1']);
  });

  it('sign-out clears everyone\'s records from the shared machine', () => {
    cache.setStepEvidence(ev(), 'ada');
    cache.setStepEvidence(ev(), 'bob');
    setCurrentUserId(null);
    expect(cache.stepEvidence('security-plus', 'ada')).toEqual({});
    expect(cache.stepEvidence('security-plus', 'bob')).toEqual({});
  });

  it('a row from the table round-trips without its user — the caller supplies it', () => {
    const rec = stepEvidenceFromRow({ user_id: 'bob', course_id: 'security-plus', task_id: 't1', step_id: 's1', verified: true, method: 'verified-output', matched_tokens: 3, total_tokens: 3, attempts: 1 });
    expect(rec).not.toHaveProperty('userId');
    cache.setStepEvidence(rec, 'bob');
    expect(cache.stepEvidence('security-plus', 'bob')['t1::s1'].matchedTokens).toBe(3);
  });
});

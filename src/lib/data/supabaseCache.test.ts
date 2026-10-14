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

const { cache, setCurrentUserId, stepEvidenceFromRow, receiptFromRow } = await import('./supabaseCache');

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

describe('supabaseCache — R113 receipts and re-hash checks', () => {
  const receipt = (stepId: string, receiptedAt: number) => ({ courseId: 'security-plus', taskId: 't1', stepId, outputSha256: 'f'.repeat(64), receiptedAt });

  it('reads no receipts (null, not empty) until the table has answered, then per member, the latest per step', () => {
    expect(cache.receipts('security-plus', 'ada'), 'a project without 0014 says nothing').toBeNull();
    cache.setReceipt(receipt('s1', 5), 'ada');
    cache.setReceipt(receipt('s1', 3), 'ada');
    cache.setReceipt(receipt('s2', 4), 'bob');
    expect(cache.receipts('security-plus', 'ada')?.['t1::s1'].receiptedAt).toBe(5);
    expect(Object.keys(cache.receipts('security-plus', 'ada') ?? {})).toEqual(['t1::s1']);
    expect(Object.keys(cache.receipts('security-plus', 'bob') ?? {})).toEqual(['t1::s2']);
    expect(cache.receipts('security-plus', 'cy')).toEqual({});
  });

  it('keeps re-hash checks per member and clears both on sign-out', () => {
    cache.addRehash({ courseId: 'security-plus', sha256: 'a'.repeat(64), filename: 'x', ok: true, checkedAt: 2 }, 'ada');
    cache.addRehash({ courseId: 'security-plus', sha256: 'a'.repeat(64), filename: 'x', ok: false, checkedAt: 1 }, 'ada');
    expect(cache.rehashes('security-plus', 'ada').map((c) => c.checkedAt)).toEqual([1, 2]);
    expect(cache.rehashes('security-plus', 'bob')).toEqual([]);
    cache.setReceipt(receipt('s1', 5), 'ada');
    setCurrentUserId(null);
    expect(cache.receipts('security-plus', 'ada')).toBeNull();
    expect(cache.rehashes('security-plus', 'ada')).toEqual([]);
  });

  it('a receipt row maps without its user and without any output text', () => {
    const r = receiptFromRow({ user_id: 'ada', course_id: 'security-plus', task_id: 't1', step_id: 's1', output_sha256: 'f'.repeat(64), receipted_at: '2026-10-14T10:00:00Z' });
    expect(r).toEqual({ courseId: 'security-plus', taskId: 't1', stepId: 's1', outputSha256: 'f'.repeat(64), receiptedAt: Date.parse('2026-10-14T10:00:00Z') });
  });
});

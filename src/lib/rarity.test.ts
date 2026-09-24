import { describe, it, expect } from 'vitest';
import { taskRarity, weekRarity } from './rarity';
import type { Task } from './types';
import type { StepEvidence } from './data/types';

const task = {
  id: 't1',
  steps: [
    { id: 's1', title: 'a', verify: ['ok'] },
    { id: 's2', title: 'b' },
    { id: 's3', title: 'c', optional: true, verify: ['x'] },
  ],
} as unknown as Task;

const ev = (stepId: string, verified: boolean, at: number): StepEvidence => ({
  courseId: 'c',
  taskId: 't1',
  stepId,
  verified,
  method: verified ? 'verified-output' : 'self-attested',
  matchedTokens: 0,
  totalTokens: 1,
  attempts: 1,
  firstAttemptAt: at,
  verifiedAt: verified ? at : undefined,
});
const JAN1 = Date.parse('2026-01-01T12:00:00');
const JAN9 = Date.parse('2026-01-09T12:00:00');

describe('taskRarity — earned by proof', () => {
  it('an unfinished task earns nothing', () => {
    expect(taskRarity({ task, percent: 60, evidence: {} })).toBeNull();
  });

  it('done after the due day, nothing verified: Common', () => {
    const evidence = { 't1::s1': ev('s1', false, JAN9), 't1::s2': ev('s2', false, JAN9) };
    expect(taskRarity({ task, percent: 100, evidence, dueDay: '2026-01-05' })).toBe(0);
  });

  it('done on time, nothing verified: Rare — and no calendar means on time', () => {
    const evidence = { 't1::s1': ev('s1', false, JAN1), 't1::s2': ev('s2', false, JAN1) };
    expect(taskRarity({ task, percent: 100, evidence, dueDay: '2026-01-05' })).toBe(1);
    expect(taskRarity({ task, percent: 100, evidence })).toBe(1);
  });

  it('every verifiable step verified, but late or a step self-attested: Epic', () => {
    const late = { 't1::s1': ev('s1', true, JAN9) };
    expect(taskRarity({ task, percent: 100, evidence: late, dueDay: '2026-01-05' })).toBe(2);
    const mixed = { 't1::s1': ev('s1', true, JAN1), 't1::s2': ev('s2', false, JAN1) };
    expect(taskRarity({ task, percent: 100, evidence: mixed, dueDay: '2026-01-05' })).toBe(2);
  });

  it('verified, on time, nothing self-attested: Legendary', () => {
    const evidence = { 't1::s1': ev('s1', true, JAN1) };
    expect(taskRarity({ task, percent: 100, evidence, dueDay: '2026-01-05' })).toBe(3);
  });

  it('a task with nothing to verify tops out at Rare', () => {
    const plain = { id: 't2', steps: [{ id: 'p', title: 'p' }] } as unknown as Task;
    expect(taskRarity({ task: plain, percent: 100, evidence: {} })).toBe(1);
  });

  it('a week is as rare as its weakest task, and unfinished while any is', () => {
    expect(weekRarity([3, 1, 2])).toBe(1);
    expect(weekRarity([3, null])).toBeNull();
    expect(weekRarity([])).toBeNull();
  });
});

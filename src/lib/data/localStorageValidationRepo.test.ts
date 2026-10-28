import { beforeEach, describe, expect, it } from 'vitest';
import { localStorageValidationRepo } from './localStorageValidationRepo';
import { localStorageUserStateRepo } from './localStorageUserStateRepo';
import { KEYS } from './keys';
import type { ValidationAnswer } from './types';

beforeEach(() => localStorage.clear());

const answer = (over: Partial<ValidationAnswer> = {}): ValidationAnswer => ({
  courseId: 'server-plus', memberId: 'm1', teamId: 't1', activityId: 'val:3:recall:k', checkpoint: 3, kind: 'recall', recordKey: 'k', answerSha256: 'a'.repeat(64), correct: false, explanation: '', at: 1, ...over,
});

/** R140 — offline, the answers are one append-only blob per member, and the timers ride in the course state. */
describe('localStorageValidationRepo', () => {
  it('appends, lists oldest first, and keeps a retry as a second row', () => {
    localStorageValidationRepo.save(answer());
    localStorageValidationRepo.save(answer({ correct: true, at: 2 }));
    const list = localStorageValidationRepo.list('server-plus', 'm1');
    expect(list).toHaveLength(2);
    expect(list.map((a) => a.correct)).toEqual([false, true]);
    expect(localStorageValidationRepo.list('server-plus', 'm2')).toEqual([]);
    expect(localStorage.getItem(KEYS.validation('server-plus', 'm1'))).toContain('val:3:recall:k');
  });

  it('lists the team’s answers from the roster on this device', () => {
    localStorage.setItem(KEYS.roster('server-plus'), JSON.stringify([{ memberId: 'm1', teamId: 't1', role: 'net', displayName: 'm1', cohort: '', joinedAt: 1 }, { memberId: 'm2', teamId: 't2', role: 'net', displayName: 'm2', cohort: '', joinedAt: 1 }]));
    localStorageValidationRepo.save(answer());
    localStorageValidationRepo.save(answer({ memberId: 'm2', teamId: 't2' }));
    expect(localStorageValidationRepo.listTeam('server-plus', 't1').map((a) => a.memberId)).toEqual(['m1']);
  });
});

describe('localStorageUserStateRepo timers', () => {
  it('round-trips the timers and the paused task beside the resume pointer, and drops them when cleared', () => {
    localStorageUserStateRepo.save('server-plus', 'm1', { timers: { t1: { elapsedMs: 5000, runningSince: null } }, paused: 't1' });
    expect(localStorageUserStateRepo.get('server-plus', 'm1')).toEqual({ timers: { t1: { elapsedMs: 5000, runningSince: null } }, paused: 't1' });
    localStorageUserStateRepo.save('server-plus', 'm1', { mineSeen: 1 });
    expect(localStorageUserStateRepo.get('server-plus', 'm1')).toEqual({ mineSeen: 1 });
  });
});

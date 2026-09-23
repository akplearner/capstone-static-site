import { describe, it, expect, beforeEach } from 'vitest';
import { localStorageReviewRepo, localStorageCohortRepo, localStorageStepNotesRepo } from './localStorageFeatureRepos';
import { localStorageProgressRepo } from './localStorageProgressRepo';
import { KEYS } from './keys';

beforeEach(() => {
  localStorage.clear();
});

describe('localStorageReviewRepo', () => {
  it('keeps one verdict per form and week, newest wins', () => {
    const base = { courseId: 'server-plus', teamId: '2026-09-t3', deliverableId: 'srv_as_built', reviewer: 'instructor', comment: '' };
    localStorageReviewRepo.save({ ...base, week: 4, status: 'revise', comment: 'RTO missing', at: 1 });
    localStorageReviewRepo.save({ ...base, week: 5, status: 'pending', at: 2 });
    localStorageReviewRepo.save({ ...base, week: 4, status: 'approved', comment: 'Good', at: 3 });
    const list = localStorageReviewRepo.list('server-plus', '2026-09-t3');
    expect(list).toHaveLength(2);
    expect(list.find((r) => r.week === 4)).toMatchObject({ status: 'approved', comment: 'Good' });
    expect(localStorageReviewRepo.list('server-plus', '2026-09-t4')).toEqual([]);
  });
});

describe('localStorageCohortRepo', () => {
  it('stores one start date per course and cohort', () => {
    expect(localStorageCohortRepo.get('server-plus', '2026-09')).toBeNull();
    localStorageCohortRepo.save({ courseId: 'server-plus', cohort: '2026-09', startsOn: '2026-09-07' });
    expect(localStorageCohortRepo.get('server-plus', '2026-09')?.startsOn).toBe('2026-09-07');
    expect(localStorage.getItem(KEYS.cohortCalendar('server-plus', '2026-09'))).toContain('2026-09-07');
  });
});

describe('localStorageStepNotesRepo', () => {
  const join = (memberId: string, teamId: string) => {
    localStorage.setItem(
      KEYS.roster('server-plus'),
      JSON.stringify([
        ...(JSON.parse(localStorage.getItem(KEYS.roster('server-plus')) ?? '[]') as unknown[]),
        { memberId, teamId, role: 'lnx', displayName: memberId, cohort: '2026-09', joinedAt: 1 },
      ])
    );
  };

  it('saves a note per step and reads them whole', () => {
    localStorageStepNotesRepo.save('m1', { courseId: 'server-plus', taskId: 't', stepId: 's1', note: 'ens19 not ens18', stuck: false, at: 1 });
    localStorageStepNotesRepo.save('m1', { courseId: 'server-plus', taskId: 't', stepId: 's2', note: '', stuck: true, at: 2 });
    const all = localStorageStepNotesRepo.getAll('server-plus', 'm1');
    expect(Object.keys(all)).toEqual(['t::s1', 't::s2']);
    expect(all['t::s1'].note).toBe('ens19 not ens18');
    localStorageStepNotesRepo.resetCourse('server-plus', 'm1');
    expect(localStorageStepNotesRepo.getAll('server-plus', 'm1')).toEqual({});
  });

  it('teamStuck returns flags for the team only, and never a note', () => {
    join('m1', '2026-09-t3');
    join('m2', '2026-09-t3');
    join('m9', '2026-09-t9');
    expect(localStorageProgressRepo.getRoster('server-plus')).toHaveLength(3);
    localStorageStepNotesRepo.save('m1', { courseId: 'server-plus', taskId: 't', stepId: 's1', note: 'secret thoughts', stuck: true, at: 5 });
    localStorageStepNotesRepo.save('m2', { courseId: 'server-plus', taskId: 't', stepId: 's1', note: 'fine', stuck: false, at: 6 });
    localStorageStepNotesRepo.save('m9', { courseId: 'server-plus', taskId: 't', stepId: 's2', note: '', stuck: true, at: 7 });
    const flags = localStorageStepNotesRepo.teamStuck('server-plus', '2026-09-t3');
    expect(flags).toEqual([{ memberId: 'm1', taskId: 't', stepId: 's1', at: 5 }]);
    expect(JSON.stringify(flags)).not.toContain('secret');
  });
});

/**
 * R79 split Server+'s two advanced weeks into four. Task and step ids kept
 * their `sp-w5-` / `sp-w6-` prefixes on purpose: they are the keys of every
 * completion, evidence record and deep link a student already has. This is the
 * test that a completion written before the split still counts after it —
 * progress is keyed by ids, never by the week number the task now carries.
 */
describe('a completion survives a task moving weeks', () => {
  it('a step ticked under its old id still counts toward the task in its new week', async () => {
    localStorage.clear();
    const { localStorageProgressRepo } = await import('./localStorageProgressRepo');
    const { SERVER_PLUS } = await import('./seed/serverPlus');
    const task = SERVER_PLUS.tasks.find((t) => t.id === 'sp-w6-spine')!;
    expect(task.week).toBe(7);
    for (const s of task.steps) {
      localStorageProgressRepo.setCompletion({ courseId: 'server-plus', taskId: task.id, memberId: 'm1', stepId: s.id, completedAt: 1 });
    }
    expect(localStorageProgressRepo.getTaskPercent('server-plus', 'm1', task)).toBe(100);
    expect(localStorageProgressRepo.getWeekCompletion(SERVER_PLUS, 'm1', 'net', 7)).toBeGreaterThan(0);
    expect(localStorageProgressRepo.getWeekCompletion(SERVER_PLUS, 'm1', 'net', 6)).toBe(0);
  });
});

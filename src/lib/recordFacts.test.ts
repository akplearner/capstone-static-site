import { describe, it, expect, beforeEach } from 'vitest';
import { ownIssues } from './recordFacts';
import { courseRepo, progressRepo, taskReportsRepo } from '@/lib/data';
import { invalidateCourseCache } from '@/lib/data/localStorageCourseRepo';
import { SEED_COURSES } from '@/lib/content/dto';
import type { Member } from '@/lib/types';

/**
 * R127 — the issues a member reported, read when a PDF is made: only this member's, newest first, joined to the course, week, task and
 * step the way the inbox joins them, and nothing for a course the member is not in.
 */
const security = SEED_COURSES.find((c) => c.id === 'security-plus')!;
const azure = SEED_COURSES.find((c) => c.id === 'azure-fundamentals')!;
const me = (course: typeof security): Member => ({ memberId: 'me', courseId: course.id, teamId: 't1', role: course.roles[0].id, displayName: 'Grace', cohort: '2026-10' });
const file = (id: string, courseId: string, memberId: string, over: Record<string, unknown> = {}) => {
  const course = courseId === security.id ? security : azure;
  taskReportsRepo.save({ id, courseId, taskId: course.tasks[1].id, teamId: 't1', memberId, kind: 'broken', note: id, status: 'open', at: Date.UTC(2026, 9, 12, 12), reporterName: memberId, ...over });
};

beforeEach(() => {
  localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage'));
  invalidateCourseCache();
  courseRepo.list();
});

describe('ownIssues', () => {
  it('keeps this member’s reports and drops a teammate’s, newest first, joined to where they were filed', () => {
    progressRepo.setContext(me(security));
    file('older', security.id, 'me', { at: Date.UTC(2026, 9, 10, 12) });
    file('newer', security.id, 'me', { at: Date.UTC(2026, 9, 12, 12), stepId: security.tasks[1].steps[1].id });
    file('theirs', security.id, 'a-teammate');
    const issues = ownIssues([security.id]);
    expect(issues.map((i) => i.id)).toEqual(['newer', 'older']);
    expect(issues[0]).toMatchObject({ courseId: security.id, courseTitle: security.title, taskId: security.tasks[1].id, stepNumber: 2, status: 'open' });
    expect(issues[0].taskTitle).toBe(security.tasks[1].title);
  });

  it('reads across the courses asked for, and only those', () => {
    progressRepo.setContext(me(security));
    progressRepo.setContext(me(azure));
    file('s', security.id, 'me');
    file('a', azure.id, 'me');
    expect(ownIssues([security.id, azure.id]).map((i) => i.id).sort()).toEqual(['a', 's']);
    expect(ownIssues([azure.id]).map((i) => i.id)).toEqual(['a']);
  });

  it('is empty for a course the member has not joined, an unknown course, and no courses', () => {
    progressRepo.setContext(me(security));
    file('s', security.id, 'me');
    expect(ownIssues([azure.id])).toEqual([]);
    expect(ownIssues(['no-such-course'])).toEqual([]);
    expect(ownIssues([])).toEqual([]);
  });

  it('keeps what a report recorded when it was filed: the name, the role and the resolution', () => {
    progressRepo.setContext(me(security));
    file('done', security.id, 'me', { status: 'resolved', resolutionNote: 'Reworded.', resolvedAt: Date.UTC(2026, 9, 14, 9), fixRevision: 3, reporterName: 'Grace', reporterRole: security.roles[0].id, contentVersion: '1.2' });
    const [issue] = ownIssues([security.id]);
    expect(issue.reporter.name).toBe('Grace');
    expect(issue.contentVersion).toBe('1.2');
    expect(issue.resolution).toMatchObject({ note: 'Reworded.', fixRevision: 3 });
  });
});

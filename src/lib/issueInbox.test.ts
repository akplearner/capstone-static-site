import { describe, it, expect } from 'vitest';
import { ISSUE_SCHEMA, buildIssues, filterIssues, groupByTask, issueCounts, issueFacets, issueTab, issuesCsv, type IssuePeople } from './issueInbox';
import { AZURE_FUNDAMENTALS } from './data/seed/azureCloud';
import { SECURITY_PLUS } from './data/seed/securityPlus';
import type { TaskReport } from './data/types';

/**
 * R120 — the inbox answers who reported it, when, in which course, week, task and
 * step, in what role, on which version, and where it stands. It names people, never
 * accounts, and uses what was recorded at filing rather than what the roster says today.
 */
const A = AZURE_FUNDAMENTALS;
const S = SECURITY_PLUS;
const archTask = A.tasks.find((t) => t.id === 'az-w1-arch')!;
const devTask = A.tasks.find((t) => t.id === 'az-w1-dev')!;
const redTask = S.tasks.find((t) => t.role === 'red' && t.week === 2)!;
const t = (iso: string) => Date.parse(iso);

const report = (over: Partial<TaskReport> = {}): TaskReport => ({
  id: 'r1',
  courseId: A.id,
  taskId: archTask.id,
  teamId: '2026-10-t1',
  memberId: 'acct-9f3c-ada',
  kind: 'broken',
  note: '',
  status: 'open',
  at: t('2026-10-12T14:05:00Z'),
  ...over,
});
const people: IssuePeople = {
  nameOf: (id) => ({ 'acct-9f3c-ada': 'Ada Lovelace', 'acct-77b1-ben': 'Ben Roster' } as Record<string, string>)[id],
  roleOf: (_c, id) => ({ 'acct-9f3c-ada': 'infra', 'acct-77b1-ben': 'dev' } as Record<string, string>)[id],
  resolverName: (id) => ({ 'acct-ivy': 'Ivy Instructor' } as Record<string, string>)[id],
};
const courses = [A, S];

describe('buildIssues', () => {
  it('joins a report to its course, week, task, step and role', () => {
    const step = archTask.steps[1];
    const [row] = buildIssues(courses, [report({ stepId: step.id, reporterName: 'Ada L.', reporterRole: 'infra', contentVersion: '1.7', note: 'the flag is rejected' })], people);
    expect(row).toMatchObject({
      schema: ISSUE_SCHEMA,
      id: 'r1',
      courseId: A.id,
      courseTitle: A.title,
      week: 1,
      weekTitle: A.weeks.find((w) => w.number === 1)!.title,
      taskId: archTask.id,
      taskTitle: archTask.title,
      taskRole: 'arch',
      stepId: step.id,
      stepTitle: step.title,
      stepNumber: 2,
      kind: 'broken',
      note: 'the flag is rejected',
      contentVersion: '1.7',
      status: 'open',
      resolution: null,
      orphan: false,
    });
    expect(row.taskRoleName).toBe(A.roles.find((r) => r.id === 'arch')!.name);
    expect(row.reportedAt).toBe('2026-10-12T14:05:00.000Z');
  });

  it('uses the name and role recorded at filing, and falls back to the roster only for older reports', () => {
    const [filed, older] = buildIssues(courses, [report({ id: 'a', reporterName: 'Ada (as filed)', reporterRole: 'dev' }), report({ id: 'b', at: t('2026-10-01T00:00:00Z') })], people);
    expect(filed.reporter).toMatchObject({ name: 'Ada (as filed)', role: 'dev', roleName: A.roles.find((r) => r.id === 'dev')!.name, teamId: '2026-10-t1' });
    expect(older.reporter).toMatchObject({ name: 'Ada Lovelace', role: 'infra' });
    expect(older.contentVersion).toBeNull();
    const [nobody] = buildIssues(courses, [report({ memberId: 'acct-unknown' })], people);
    expect(nobody.reporter).toMatchObject({ name: 'Unnamed', role: null, roleName: null });
  });

  it('names nobody by account: no member id appears in any issue', () => {
    const rows = buildIssues(courses, [report({ resolvedBy: 'acct-ivy', status: 'resolved', resolvedAt: t('2026-10-13T09:00:00Z') })], people);
    const json = JSON.stringify(rows);
    for (const id of ['acct-9f3c-ada', 'acct-ivy']) expect(json, id).not.toContain(id);
    expect(rows[0].resolution!.by).toBe('Ivy Instructor');
  });

  it('sorts newest first and keeps ties in a stable order', () => {
    const rows = buildIssues(courses, [report({ id: 'old', at: t('2026-10-01T00:00:00Z') }), report({ id: 'new', at: t('2026-10-12T00:00:00Z') }), report({ id: 'tie-b', at: t('2026-10-05T00:00:00Z') }), report({ id: 'tie-a', at: t('2026-10-05T00:00:00Z') })], people);
    expect(rows.map((r) => r.id)).toEqual(['new', 'tie-a', 'tie-b', 'old']);
  });

  it('flags a report whose task, step or course is gone, and still lists it', () => {
    const rows = buildIssues(
      courses,
      [report({ id: 'task', taskId: 'removed-task', week: 4 }), report({ id: 'step', stepId: 'removed-step' }), report({ id: 'course', courseId: 'removed-course' }), report({ id: 'ok', stepId: archTask.steps[0].id })],
      people
    );
    const by = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(by.task).toMatchObject({ orphan: true, taskTitle: 'removed-task', week: 4, weekTitle: A.weeks.find((w) => w.number === 4)?.title ?? null });
    expect(by.step).toMatchObject({ orphan: true, stepId: 'removed-step', stepTitle: null, stepNumber: null });
    expect(by.course).toMatchObject({ orphan: true, courseTitle: 'removed-course', taskRole: null });
    expect(by.ok.orphan).toBe(false);
  });

  it('records the resolution only when there is one, with the fix that made it', () => {
    const [open, wont, done] = buildIssues(
      courses,
      [
        report({ id: 'o', at: t('2026-10-03T00:00:00Z') }),
        report({ id: 'w', at: t('2026-10-02T00:00:00Z'), status: 'wont_fix', resolutionNote: 'Works as written.', resolvedAt: t('2026-10-04T00:00:00Z'), resolvedBy: 'acct-ivy' }),
        report({ id: 'd', at: t('2026-10-01T00:00:00Z'), status: 'resolved', resolutionNote: 'Fixed the flag.', resolvedAt: t('2026-10-05T00:00:00Z'), fixRevision: 7 }),
      ],
      people
    );
    expect(open.resolution).toBeNull();
    expect(wont.resolution).toEqual({ note: 'Works as written.', at: '2026-10-04T00:00:00.000Z', by: 'Ivy Instructor', fixRevision: null });
    expect(done.resolution).toEqual({ note: 'Fixed the flag.', at: '2026-10-05T00:00:00.000Z', by: null, fixRevision: 7 });
  });
});

describe('tabs, filters and counts', () => {
  const rows = buildIssues(
    courses,
    [
      report({ id: 'a', status: 'open', kind: 'unclear', note: 'Which subscription?', reporterName: 'Ada', reporterRole: 'infra', at: t('2026-10-12T00:00:00Z') }),
      report({ id: 'b', status: 'in_progress', kind: 'broken', note: 'az login fails', stepId: archTask.steps[1].id, reporterName: 'Ben', reporterRole: 'dev', at: t('2026-10-11T00:00:00Z') }),
      report({ id: 'c', status: 'resolved', kind: 'outdated', courseId: S.id, taskId: redTask.id, reporterName: 'Cy', reporterRole: 'red', resolutionNote: 'Updated the screenshot', at: t('2026-10-10T00:00:00Z') }),
      report({ id: 'd', status: 'wont_fix', kind: 'question', taskId: devTask.id, reporterName: 'Ada', reporterRole: 'infra', at: t('2026-10-09T00:00:00Z') }),
    ],
    people
  );
  const ids = (f: Parameters<typeof filterIssues>[1]) => filterIssues(rows, f).map((r) => r.id);

  it('maps every status to one tab: pending is open plus in progress', () => {
    expect(['open', 'in_progress', 'resolved', 'wont_fix'].map(issueTab)).toEqual(['pending', 'pending', 'complete', 'wont_fix']);
    expect(ids({ tab: 'pending' })).toEqual(['a', 'b']);
    expect(ids({ tab: 'complete' })).toEqual(['c']);
    expect(ids({ tab: 'wont_fix' })).toEqual(['d']);
    expect(ids({ tab: 'all' })).toEqual(['a', 'b', 'c', 'd']);
    expect(ids({})).toEqual(['a', 'b', 'c', 'd']);
  });

  it('filters by course, week, both roles, kind and reporter', () => {
    expect(ids({ courseId: S.id })).toEqual(['c']);
    expect(ids({ week: 2 })).toEqual(['c']);
    expect(ids({ week: 1 })).toEqual(['a', 'b', 'd']);
    expect(ids({ reporterRole: 'infra' })).toEqual(['a', 'd']);
    expect(ids({ taskRole: 'arch' })).toEqual(['a', 'b']);
    expect(ids({ taskRole: 'dev' })).toEqual(['d']);
    expect(ids({ kind: 'broken' })).toEqual(['b']);
    expect(ids({ reporter: 'Ada' })).toEqual(['a', 'd']);
  });

  it('searches the note, titles, reporter and resolution, every word at once and ignoring case', () => {
    expect(ids({ q: 'subscription' })).toEqual(['a']);
    expect(ids({ q: 'AZ LOGIN' })).toEqual(['b']);
    expect(ids({ q: 'screenshot' })).toEqual(['c']);
    expect(ids({ q: 'cy' })).toContain('c');
    expect(ids({ q: 'az nothing-like-this' })).toEqual([]);
    expect(ids({ q: '   ' })).toEqual(['a', 'b', 'c', 'd']);
  });

  it('combines filters, and counts each tab over the rows it is given', () => {
    expect(ids({ tab: 'pending', reporterRole: 'infra' })).toEqual(['a']);
    expect(issueCounts(rows)).toEqual({ pending: 2, complete: 1, wontFix: 1, total: 4 });
    expect(issueCounts(filterIssues(rows, { courseId: A.id }))).toEqual({ pending: 2, complete: 0, wontFix: 1, total: 3 });
    expect(issueCounts([])).toEqual({ pending: 0, complete: 0, wontFix: 0, total: 0 });
  });

  it('offers each filter only the values that exist, so no choice returns an empty list', () => {
    const f = issueFacets(rows);
    expect(f.courses.map((c) => c.id).sort()).toEqual([A.id, S.id].sort());
    expect(f.weeks).toEqual([1, 2]);
    expect(f.reporterRoles.map((r) => r.id).sort()).toEqual(['dev', 'infra', 'red']);
    expect(f.taskRoles.map((r) => r.id).sort()).toEqual(['arch', 'dev', 'red']);
    expect(f.kinds.map((k) => k.id)).toEqual(['unclear', 'broken', 'question', 'outdated']);
    expect(f.reporters).toEqual(['Ada', 'Ben', 'Cy']);
    for (const c of f.courses) expect(filterIssues(rows, { courseId: c.id }).length).toBeGreaterThan(0);
    for (const r of f.reporterRoles) expect(filterIssues(rows, { reporterRole: r.id }).length).toBeGreaterThan(0);
  });
});

describe('groupByTask', () => {
  it('puts the tasks with the most pending reports first, with a count per kind', () => {
    const rows = buildIssues(
      courses,
      [
        report({ id: '1', taskId: archTask.id, kind: 'broken', at: t('2026-10-01T00:00:00Z') }),
        report({ id: '2', taskId: archTask.id, kind: 'broken', at: t('2026-10-03T00:00:00Z') }),
        report({ id: '3', taskId: archTask.id, kind: 'unclear', status: 'resolved', at: t('2026-10-02T00:00:00Z') }),
        report({ id: '4', taskId: devTask.id, kind: 'question', at: t('2026-10-09T00:00:00Z') }),
        report({ id: '5', courseId: S.id, taskId: redTask.id, status: 'wont_fix', at: t('2026-10-10T00:00:00Z') }),
      ],
      people
    );
    const groups = groupByTask(rows);
    expect(groups.map((g) => [g.taskId, g.pending, g.total])).toEqual([
      [archTask.id, 2, 3],
      [devTask.id, 1, 1],
      [redTask.id, 0, 1],
    ]);
    expect(groups[0].kinds).toEqual({ broken: 2, unclear: 1 });
    expect(groups[0].latest).toBe('2026-10-03T00:00:00.000Z');
    expect(groups[0].issues.map((r) => r.id)).toEqual(['2', '3', '1']);
    expect(groupByTask([])).toEqual([]);
  });

  it('keeps the same task id in two courses apart', () => {
    const shared = 'same-id';
    const rows = buildIssues(courses, [report({ id: 'x', courseId: A.id, taskId: shared }), report({ id: 'y', courseId: S.id, taskId: shared })], people);
    expect(groupByTask(rows)).toHaveLength(2);
  });
});

describe('issuesCsv', () => {
  it('writes one row per report under a header, quoting what needs it', () => {
    const rows = buildIssues(courses, [report({ id: 'q', note: 'He said "no", then\nleft, twice', reporterName: 'Ada', reporterRole: 'infra', stepId: archTask.steps[0].id, contentVersion: '1.2', status: 'resolved', resolutionNote: 'Fixed, thanks', fixRevision: 3, resolvedAt: t('2026-10-13T00:00:00Z'), resolvedBy: 'acct-ivy' })], people);
    const csv = issuesCsv(rows);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('id,reported_at,course,week,task,step,reporter,reporter_role,team,kind,note,content_version,status,resolution_note,resolved_at,resolved_by,fix_revision');
    expect(csv).toContain('"He said ""no"", then\nleft, twice"');
    expect(lines[1]).toMatch(/,"?1\. /);
    expect(csv).toContain('Resolved');
    expect(csv).toContain('"Fixed, thanks"');
    expect(csv).toContain('Ivy Instructor');
    expect(csv).not.toContain('acct-ivy');
    expect(issuesCsv([]).split('\r\n')).toHaveLength(2);
  });
});

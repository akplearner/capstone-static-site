import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * R120 — the report repositories. A report keeps who, what, when and which version
 * as filed and lets only the status and the resolution change; and because the admin
 * applies SQL by hand, a database that has not had 0016 yet must still take a report
 * (with the columns it has) and must say plainly when a change cannot be saved.
 */
const calls = vi.hoisted(() => ({
  inserts: [] as Record<string, unknown>[],
  updates: [] as Record<string, unknown>[],
  insertResults: [] as { error: unknown }[],
  updateResults: [] as { error: unknown }[],
  toasts: [] as { message: string }[],
}));
const client = {
  from: () => ({
    insert: (row: Record<string, unknown>) => {
      calls.inserts.push(row);
      return Promise.resolve(calls.insertResults.shift() ?? { error: null });
    },
    update: (row: Record<string, unknown>) => {
      calls.updates.push(row);
      return { eq: () => Promise.resolve(calls.updateResults.shift() ?? { error: null }) };
    },
  }),
  functions: { invoke: () => Promise.resolve({}) },
};
vi.mock('../supabase/client', () => ({ getBrowserClient: () => client }));
vi.mock('@/lib/toastBus', () => ({ toast: (t: { message: string }) => calls.toasts.push(t) }));

const { supabaseTaskReportsRepo } = await import('./supabaseFeatureRepos');
const { localStorageTaskReportsRepo } = await import('./localStorageFeatureRepos');
const { cache, setCurrentUserId, taskReportFromRow } = await import('./supabaseCache');
const { isMissingSchema } = await import('./schemaErrors');
const { loadIssuesLocal, loadPendingCounts } = await import('./issuesLoader');
const { KEYS } = await import('./keys');
const { AZURE_FUNDAMENTALS } = await import('./seed/azureCloud');
import type { TaskReport } from './types';

const C = AZURE_FUNDAMENTALS.id;
const report = (over: Partial<TaskReport> = {}): TaskReport => ({
  id: 'r1',
  courseId: C,
  taskId: 'az-w1-arch',
  teamId: '2026-10-t1',
  memberId: 'acct-1',
  kind: 'broken',
  note: 'the flag is rejected',
  status: 'open',
  at: Date.parse('2026-10-12T14:05:00Z'),
  stepId: 'az-w1-arch-s2',
  week: 1,
  reporterName: 'Ada Lovelace',
  reporterRole: 'infra',
  contentVersion: '1.7',
  ...over,
});

beforeEach(() => {
  localStorage.clear();
  calls.inserts.length = calls.updates.length = calls.insertResults.length = calls.updateResults.length = calls.toasts.length = 0;
  setCurrentUserId(null);
  setCurrentUserId('acct-1');
});

describe('taskReportFromRow', () => {
  it('maps a row with its context, and reads an older row as having none', () => {
    const full = taskReportFromRow({ id: 'x', course_id: C, task_id: 't', team_id: 'T', user_id: 'u', kind: 'broken', note: 'n', status: 'resolved', created_at: '2026-10-12T14:05:00Z', step_id: 's2', week: 3, reporter_name: 'Ada', reporter_role: 'infra', content_version: '1.7', resolution_note: 'Fixed', resolved_at: '2026-10-13T00:00:00Z', resolved_by: 'ivy', fix_revision: 4 });
    expect(full).toMatchObject({ status: 'resolved', stepId: 's2', week: 3, reporterName: 'Ada', reporterRole: 'infra', contentVersion: '1.7', resolutionNote: 'Fixed', resolvedBy: 'ivy', fixRevision: 4 });
    expect(full.resolvedAt).toBe(Date.parse('2026-10-13T00:00:00Z'));
    const old = taskReportFromRow({ id: 'y', course_id: C, task_id: 't', user_id: 'u', created_at: '2026-10-01T00:00:00Z', reporter_name: '', content_version: '' });
    expect(old).toMatchObject({ status: 'open', kind: 'question', note: '' });
    for (const k of ['stepId', 'week', 'reporterName', 'reporterRole', 'contentVersion', 'resolutionNote', 'resolvedAt', 'resolvedBy', 'fixRevision'] as const) expect(old[k], k).toBeUndefined();
    expect(taskReportFromRow({ id: 'z', course_id: C, task_id: 't', user_id: 'u', status: 'bogus' }).status).toBe('open');
  });
});

describe('isMissingSchema', () => {
  it('knows the four codes and the messages Postgres and PostgREST use for a database that has not been updated', () => {
    for (const code of ['42703', 'PGRST204', '42P01', 'PGRST205']) expect(isMissingSchema({ code }), code).toBe(true);
    expect(isMissingSchema({ message: 'column "step_id" of relation "task_reports" does not exist' })).toBe(true);
    expect(isMissingSchema({ message: "Could not find the 'step_id' column of 'task_reports' in the schema cache" })).toBe(true);
    expect(isMissingSchema({ message: 'relation "public.content_fixes" does not exist' })).toBe(true);
  });
  it('does not mistake a real failure for it', () => {
    for (const e of [null, undefined, {}, { code: '23514', message: 'violates check constraint' }, { code: '42501', message: 'new row violates row-level security policy' }, { message: 'network down' }]) expect(isMissingSchema(e), JSON.stringify(e)).toBe(false);
  });
});

describe('supabaseTaskReportsRepo.save', () => {
  it('files the step, week, name, role and version with the report', async () => {
    supabaseTaskReportsRepo.save(report());
    await vi.waitFor(() => expect(calls.inserts).toHaveLength(1));
    expect(calls.inserts[0]).toMatchObject({ id: 'r1', user_id: 'acct-1', task_id: 'az-w1-arch', status: 'open', step_id: 'az-w1-arch-s2', week: 1, reporter_name: 'Ada Lovelace', reporter_role: 'infra', content_version: '1.7' });
  });

  it('files without the new columns when the database has not had 0016, and does not alarm the student', async () => {
    calls.insertResults.push({ error: { code: '42703', message: 'column "step_id" of relation "task_reports" does not exist' } });
    supabaseTaskReportsRepo.save(report());
    await vi.waitFor(() => expect(calls.inserts).toHaveLength(2));
    expect(Object.keys(calls.inserts[1]).sort()).toEqual(['course_id', 'created_at', 'id', 'kind', 'note', 'status', 'task_id', 'team_id', 'user_id']);
    await new Promise((r) => setTimeout(r, 0));
    expect(calls.toasts).toEqual([]);
  });

  it('tells the student when the report could not be filed for any other reason', async () => {
    calls.insertResults.push({ error: { code: '08006', message: 'connection failure' } });
    supabaseTaskReportsRepo.save(report());
    await vi.waitFor(() => expect(calls.toasts).toHaveLength(1));
    expect(calls.inserts).toHaveLength(1);
    expect(calls.toasts[0].message).toMatch(/Couldn’t file the report/);
  });
});

describe('supabaseTaskReportsRepo.update', () => {
  beforeEach(() => cache.setTaskReport(report()));

  it('moves the status with a note, stamps who closed it, and keeps the report as filed', async () => {
    const ok = await supabaseTaskReportsRepo.update(C, 'r1', { status: 'resolved', note: 'Fixed the flag', fixRevision: 3 });
    expect(ok).toBe(true);
    expect(calls.updates[0]).toMatchObject({ status: 'resolved', resolution_note: 'Fixed the flag', fix_revision: 3, resolved_by: 'acct-1' });
    expect(typeof calls.updates[0].resolved_at).toBe('string');
    expect(Object.keys(calls.updates[0])).not.toContain('reporter_name');
    expect(Object.keys(calls.updates[0])).not.toContain('note');
    const [r] = cache.taskReports(C);
    expect(r).toMatchObject({ status: 'resolved', resolutionNote: 'Fixed the flag', fixRevision: 3, stepId: 'az-w1-arch-s2', reporterName: 'Ada Lovelace', note: 'the flag is rejected' });
  });

  it('a reopened report loses its closing time and closer', async () => {
    await supabaseTaskReportsRepo.update(C, 'r1', { status: 'resolved' });
    await supabaseTaskReportsRepo.update(C, 'r1', { status: 'in_progress' });
    expect(calls.updates[1]).toMatchObject({ status: 'in_progress', resolved_at: null, resolved_by: null });
    expect(cache.taskReports(C)[0].resolvedAt).toBeUndefined();
  });

  it('resolves false, puts the report back and says what to do when the database has not had 0016', async () => {
    calls.updateResults.push({ error: { code: '23514', message: 'new row violates check constraint "task_reports_status_check"' } });
    const ok = await supabaseTaskReportsRepo.update(C, 'r1', { status: 'wont_fix', note: 'as written' });
    expect(ok).toBe(false);
    expect(cache.taskReports(C)[0].status).toBe('open');
    expect(calls.toasts[0].message).toMatch(/latest update \(re-run supabase\/setup\.sql\)/);
    calls.updateResults.push({ error: { code: '42703', message: 'column "resolution_note" does not exist' } });
    expect(await supabaseTaskReportsRepo.update(C, 'r1', { status: 'resolved', note: 'x' })).toBe(false);
  });

  it('says a different thing for a failure that is not the schema', async () => {
    calls.updateResults.push({ error: { code: '42501', message: 'permission denied' } });
    expect(await supabaseTaskReportsRepo.update(C, 'r1', { status: 'resolved' })).toBe(false);
    expect(calls.toasts[0].message).toMatch(/Couldn’t save the change/);
  });
});

describe('localStorageTaskReportsRepo', () => {
  it('keeps the report as filed while the status, the note and the fix change', async () => {
    localStorageTaskReportsRepo.save(report());
    expect(await localStorageTaskReportsRepo.update(C, 'r1', { status: 'resolved', note: 'Fixed', fixRevision: 2 })).toBe(true);
    const [r] = localStorageTaskReportsRepo.list(C);
    expect(r).toMatchObject({ status: 'resolved', resolutionNote: 'Fixed', fixRevision: 2, resolvedBy: 'instructor', stepId: 'az-w1-arch-s2', reporterName: 'Ada Lovelace', contentVersion: '1.7', note: 'the flag is rejected' });
    expect(typeof r.resolvedAt).toBe('number');
    await localStorageTaskReportsRepo.update(C, 'r1', { status: 'open' });
    const [again] = localStorageTaskReportsRepo.list(C);
    expect(again.status).toBe('open');
    expect(again.resolvedAt).toBeUndefined();
    expect(again.resolutionNote).toBe('Fixed');
  });

  it('keeps resolve as the one-click close', () => {
    localStorageTaskReportsRepo.save(report());
    localStorageTaskReportsRepo.resolve(C, 'r1');
    expect(localStorageTaskReportsRepo.list(C)[0].status).toBe('resolved');
  });
});

describe('issuesLoader — offline', () => {
  it('gathers every course’s reports and the names and roles the rosters hold', async () => {
    localStorageTaskReportsRepo.save(report({ id: 'a', reporterName: undefined, reporterRole: undefined }));
    localStorageTaskReportsRepo.save(report({ id: 'b', courseId: 'security-plus', taskId: 't1', status: 'resolved' }));
    localStorage.setItem(KEYS.roster(C), JSON.stringify([{ memberId: 'acct-1', teamId: '2026-10-t1', role: 'infra', displayName: 'Ada Roster', cohort: '2026-10', joinedAt: 1 }]));
    const data = loadIssuesLocal([AZURE_FUNDAMENTALS, { ...AZURE_FUNDAMENTALS, id: 'security-plus' }]);
    expect(data.mode).toBe('local');
    expect(data.needsUpdate).toBe(false);
    expect(data.reports.map((r) => r.id).sort()).toEqual(['a', 'b']);
    expect(data.people.nameOf('acct-1')).toBe('Ada Roster');
    expect(data.people.roleOf(C, 'acct-1')).toBe('infra');
    expect(data.people.roleOf('security-plus', 'acct-1')).toBeUndefined();
    expect(data.people.resolverName('instructor')).toBe('Instructor');
    expect(data.people.resolverName('acct-1')).toBeUndefined();
  });

  it('counts the pending reports per course, open and in progress alike, and leaves out a course with none', async () => {
    localStorageTaskReportsRepo.save(report({ id: 'a' }));
    localStorageTaskReportsRepo.save(report({ id: 'b', status: 'in_progress' }));
    localStorageTaskReportsRepo.save(report({ id: 'c', status: 'resolved' }));
    localStorageTaskReportsRepo.save(report({ id: 'd', courseId: 'security-plus', status: 'wont_fix' }));
    // Offline mode counts through the local repository: the cloud client above is only used when configured.
    expect(await loadPendingCounts([AZURE_FUNDAMENTALS, { ...AZURE_FUNDAMENTALS, id: 'security-plus' }])).toEqual({ [C]: 2 });
  });
});

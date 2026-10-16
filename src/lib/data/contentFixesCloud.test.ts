import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * R121 — the content fix ledger in the cloud. The admin applies SQL by hand, so a database that
 * has not had 0017 yet must read as "no fixes, update needed" and never as an error on a page a
 * student is reading; and a write is awaited, because the revision is the database's to assign.
 */
const calls = vi.hoisted(() => ({
  inserted: [] as Record<string, unknown>[],
  insertResults: [] as { data: unknown; error: unknown }[],
  pages: [] as { data: unknown[] | null; error: unknown }[],
  ranges: [] as [number, number][],
  toasts: [] as { message: string }[],
}));
const client = {
  from: () => ({
    insert: (row: Record<string, unknown>) => {
      calls.inserted.push(row);
      return { select: () => ({ single: () => Promise.resolve(calls.insertResults.shift() ?? { data: null, error: { message: 'no result queued' } }) }) };
    },
    select: () => ({
      order: () => ({
        order: () => ({
          range: (from: number, to: number) => {
            calls.ranges.push([from, to]);
            return Promise.resolve(calls.pages.shift() ?? { data: [], error: null });
          },
        }),
      }),
    }),
  }),
};
vi.mock('../supabase/client', () => ({ getBrowserClient: () => client }));
vi.mock('@/lib/toastBus', () => ({ toast: (t: { message: string }) => calls.toasts.push(t) }));

const { cache, contentFixFromRow, hydrateContentFixes, setCurrentUserId } = await import('./supabaseCache');
const { supabaseContentFixesRepo } = await import('./supabaseContentFixesRepo');
const { documentFor } = await import('./supabaseCourseRepo');
const { baseCourse } = await import('../content/docs');
const { NO_FIXES, changesFrom, fixDraft, foldDraft, readField, revertDraft } = await import('../contentFix');
import type { ContentFix } from '../contentFix';

const row = (over: Record<string, unknown> = {}) => ({
  id: 'f1',
  course_id: 'security-plus',
  revision: 1,
  kind: 'fix',
  summary: 'Reword',
  changes: [{ taskId: 't1', stepId: 's1', field: 'title', before: 'A', after: 'B' }],
  issue_ids: ['r1'],
  reverts: null,
  folds: [],
  folded_in: '',
  doc_version: 1,
  author_name: 'Ana Admin',
  created_at: '2026-10-16T09:00:00+00:00',
  ...over,
});

beforeEach(() => {
  calls.inserted.length = calls.insertResults.length = calls.pages.length = calls.ranges.length = calls.toasts.length = 0;
  cache.setContentFixes('security-plus', []);
  cache.setContentFixes('ccna', []);
  setCurrentUserId(null);
  setCurrentUserId('admin-1');
});

describe('contentFixFromRow', () => {
  it('maps the columns to the entry, and reads what is malformed as empty rather than failing', () => {
    expect(contentFixFromRow(row())).toEqual({
      schema: 'capstone-content-fix/1',
      id: 'f1',
      courseId: 'security-plus',
      revision: 1,
      kind: 'fix',
      summary: 'Reword',
      changes: [{ taskId: 't1', stepId: 's1', field: 'title', before: 'A', after: 'B' }],
      issueIds: ['r1'],
      reverts: null,
      folds: [],
      foldedIn: '',
      docVersion: 1,
      by: 'Ana Admin',
      at: '2026-10-16T09:00:00.000Z',
    });
    expect(contentFixFromRow(row({ kind: 'revert', reverts: 1, revision: 2 }))).toMatchObject({ kind: 'revert', reverts: 1, revision: 2 });
    expect(contentFixFromRow(row({ kind: 'fold', folds: [1, 3], folded_in: 'deploy' }))).toMatchObject({ kind: 'fold', folds: [1, 3], foldedIn: 'deploy' });
    const bad = contentFixFromRow(row({ kind: 'bogus', changes: [{ taskId: 1 }, null, 'x', { taskId: 't', field: 'f', before: 'a', after: 'b' }], issue_ids: null, folds: null, doc_version: 0, author_name: null, created_at: null }));
    expect(bad).toMatchObject({ kind: 'fix', issueIds: [], folds: [], docVersion: 1, by: '', at: '' });
    expect(bad.changes).toEqual([{ taskId: 't', field: 'f', before: 'a', after: 'b' }]);
  });
});

describe('the ledger cache', () => {
  const fix = (n: number, courseId = 'security-plus'): ContentFix => contentFixFromRow(row({ id: `f${n}`, revision: n, course_id: courseId }));

  it('replaces a course’s list, keeps its identity when nothing changed, and reads an empty ledger as the one shared array', () => {
    expect(cache.contentFixes('security-plus')).toBe(NO_FIXES);
    const v0 = cache.contentFixesVersion();
    cache.setContentFixes('security-plus', [fix(2), fix(1)]);
    const list = cache.contentFixes('security-plus');
    expect(list.map((f) => f.revision), 'oldest first').toEqual([1, 2]);
    expect(cache.contentFixesVersion()).toBe(v0 + 1);
    cache.setContentFixes('security-plus', [fix(1), fix(2)]);
    expect(cache.contentFixes('security-plus'), 'the same entries are the same array').toBe(list);
    expect(cache.contentFixesVersion(), 'and no new version').toBe(v0 + 1);
    expect(cache.contentFixes('ccna'), 'other courses are untouched').toBe(NO_FIXES);
  });

  it('merges an entry the caller just wrote by revision, so a later hydrate that holds it too changes nothing', () => {
    cache.setContentFixes('security-plus', [fix(1)]);
    cache.addContentFix({ ...fix(2), id: 'optimistic' });
    expect(cache.contentFixes('security-plus').map((f) => f.id)).toEqual(['f1', 'optimistic']);
    cache.addContentFix(fix(2));
    expect(cache.contentFixes('security-plus').map((f) => f.id), 'same revision replaces, never duplicates').toEqual(['f1', 'f2']);
  });
});

describe('hydrateContentFixes', () => {
  it('loads every course’s ledger in pages, grouped by course', async () => {
    const full = Array.from({ length: 1000 }, (_, i) => row({ id: `a${i}`, revision: i + 1 }));
    calls.pages.push({ data: full, error: null }, { data: [row({ id: 'c1', course_id: 'ccna', revision: 1 })], error: null });
    expect(await hydrateContentFixes()).toEqual({ ok: true, needsUpdate: false });
    expect(calls.ranges).toEqual([[0, 999], [1000, 1999]]);
    expect(cache.contentFixes('security-plus')).toHaveLength(1000);
    expect(cache.contentFixes('ccna').map((f) => f.id)).toEqual(['c1']);
  });

  it('says the database needs its update, quietly, when the table does not exist yet, and leaves the ledger as it was', async () => {
    cache.setContentFixes('security-plus', [contentFixFromRow(row())]);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const error of [{ code: '42P01', message: 'relation "public.content_fixes" does not exist' }, { code: 'PGRST205', message: "Could not find the table 'public.content_fixes' in the schema cache" }]) {
      calls.pages.push({ data: null, error });
      expect(await hydrateContentFixes()).toEqual({ ok: false, needsUpdate: true });
    }
    expect(errors).not.toHaveBeenCalled();
    expect(cache.contentFixes('security-plus')).toHaveLength(1);
    calls.pages.push({ data: null, error: { code: '08006', message: 'connection failure' } });
    expect(await hydrateContentFixes()).toEqual({ ok: false, needsUpdate: false });
    expect(errors).toHaveBeenCalledTimes(1);
    errors.mockRestore();
  });

  it('an empty answer, as a signed-out visitor gets from row-level security, never wipes what is held', async () => {
    cache.setContentFixes('security-plus', [contentFixFromRow(row())]);
    calls.pages.push({ data: [], error: null });
    expect(await hydrateContentFixes()).toEqual({ ok: true, needsUpdate: false });
    expect(cache.contentFixes('security-plus')).toHaveLength(1);
  });
});

describe('supabaseContentFixesRepo.add', () => {
  const draft = () => {
    const course = baseCourse('security-plus')!;
    const t = { taskId: course.tasks[0].id, stepId: course.tasks[0].steps[0].id };
    return fixDraft('Reword the step', changesFrom(course, t, { title: 'Reworded' }), ['r1', 'r2']);
  };

  it('writes the entry as the admin, awaits the revision the database assigns, and puts it in the cache', async () => {
    calls.insertResults.push({ data: row({ id: 'new', revision: 7, summary: 'Reword the step', issue_ids: ['r1', 'r2'] }), error: null });
    const fix = await supabaseContentFixesRepo.add('security-plus', draft(), 'Ana Admin');
    expect(calls.inserted[0]).toMatchObject({ course_id: 'security-plus', kind: 'fix', summary: 'Reword the step', issue_ids: ['r1', 'r2'], reverts: null, folds: [], folded_in: '', author_name: 'Ana Admin', created_by: 'admin-1', doc_version: baseCourse('security-plus')!.version ?? 1 });
    expect(calls.inserted[0]).not.toHaveProperty('revision');
    expect(calls.inserted[0]).not.toHaveProperty('id');
    expect(fix).toMatchObject({ id: 'new', revision: 7 });
    expect(supabaseContentFixesRepo.list('security-plus').map((f) => f.revision)).toEqual([7]);
    expect(supabaseContentFixesRepo.version()).toBe(cache.contentFixesVersion());
  });

  it('writes a revert and a fold with what names them', async () => {
    const first = contentFixFromRow(row());
    calls.insertResults.push({ data: row({ id: 'r', revision: 2, kind: 'revert', reverts: 1 }), error: null }, { data: row({ id: 'f', revision: 3, kind: 'fold', folds: [1], changes: [] }), error: null });
    await supabaseContentFixesRepo.add('security-plus', revertDraft(first), 'Ana');
    await supabaseContentFixesRepo.add('security-plus', foldDraft([1], 'deploy 20'), 'Ana');
    expect(calls.inserted[0]).toMatchObject({ kind: 'revert', reverts: 1, issue_ids: [] });
    expect(calls.inserted[1]).toMatchObject({ kind: 'fold', folds: [1], folded_in: 'deploy 20', changes: [] });
  });

  it('says why when it could not be saved, and caches nothing', async () => {
    calls.insertResults.push({ data: null, error: { code: '42P01', message: 'relation "public.content_fixes" does not exist' } });
    expect(await supabaseContentFixesRepo.add('security-plus', draft(), 'Ana')).toBeNull();
    expect(calls.toasts.at(-1)!.message).toMatch(/latest update/);
    calls.insertResults.push({ data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "content_fixes_one_revert"' } });
    expect(await supabaseContentFixesRepo.add('security-plus', revertDraft(contentFixFromRow(row())), 'Ana')).toBeNull();
    expect(calls.toasts.at(-1)!.message).toMatch(/already reverted/);
    calls.insertResults.push({ data: null, error: { code: '42501', message: 'new row violates row-level security policy' } });
    expect(await supabaseContentFixesRepo.add('security-plus', draft(), 'Ana')).toBeNull();
    expect(calls.toasts.at(-1)!.message).toMatch(/Couldn’t save the fix/);
    expect(cache.contentFixes('security-plus')).toBe(NO_FIXES);
  });

  it('asks the signed-out to sign in rather than writing', async () => {
    setCurrentUserId(null);
    expect(await supabaseContentFixesRepo.add('security-plus', draft(), 'Ana')).toBeNull();
    expect(calls.inserted).toHaveLength(0);
    expect(calls.toasts.at(-1)!.message).toMatch(/Sign in/);
  });
});

describe('saving a copy of a course that has fixes', () => {
  it('writes the document without the ledger or its counter: the ledger has its own table', () => {
    const course = baseCourse('security-plus')!;
    const t = { taskId: course.tasks[0].id, stepId: course.tasks[0].steps[0].id };
    const edited = { ...course, title: 'My edit', revision: 5 };
    const doc = documentFor(edited);
    expect(doc.course.title).toBe('My edit');
    expect('revision' in doc.course, 'no counter inside the saved course').toBe(false);
    expect('revision' in doc, 'no ledger counter on the document').toBe(false);
    expect('fixes' in doc, 'no copy of the ledger on the document').toBe(false);
    expect(readField(doc.course as never, t, 'title')).toBe(course.tasks[0].steps[0].title);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * R122 — the studio's history in the cloud. The database numbers and keeps every save (0018);
 * the client asks for the columns that describe a version, never every document, restores an old
 * one as an ordinary save, and says so plainly when the database has not had the migration.
 */
const calls = vi.hoisted(() => ({
  selects: [] as { table: string; cols: string; eq: [string, unknown][]; order?: [string, unknown] }[],
  listResult: { data: [] as unknown[] | null, error: null as unknown },
  getResult: { data: null as { doc: unknown } | null, error: null as unknown },
  upserts: [] as { row: Record<string, unknown>; opts: unknown }[],
  upsertResult: { data: null as { doc: unknown; version: number } | null, error: null as unknown },
  toasts: [] as { message: string }[],
}));

function chain(table: string, cols: string) {
  const rec = { table, cols, eq: [] as [string, unknown][], order: undefined as [string, unknown] | undefined };
  calls.selects.push(rec);
  const api = {
    eq(col: string, v: unknown) {
      rec.eq.push([col, v]);
      return api;
    },
    order(col: string, opts: unknown) {
      rec.order = [col, opts];
      // `content_fixes` (R121) pages with order, order, range: answer it with an empty ledger.
      return Object.assign(Promise.resolve(calls.listResult), { order: () => ({ range: () => Promise.resolve({ data: [], error: null }) }) });
    },
    maybeSingle: () => Promise.resolve(calls.getResult),
  };
  return api;
}
const client = {
  from: (table: string) => ({
    select: (cols: string) => chain(table, cols),
    upsert: (row: Record<string, unknown>, opts: unknown) => {
      calls.upserts.push({ row, opts });
      return { select: () => ({ single: () => Promise.resolve(calls.upsertResult) }) };
    },
  }),
};
vi.mock('../supabase/client', () => ({ getBrowserClient: () => client }));
vi.mock('@/lib/toastBus', () => ({ toast: (t: { message: string }) => calls.toasts.push(t) }));

const { supabaseCourseHistoryRepo } = await import('./supabaseCourseHistoryRepo');
const { supabaseCourseRepo } = await import('./supabaseCourseRepo');
const { cache, setCurrentUserId } = await import('./supabaseCache');
import type { CourseDto } from '../content/dto';

const doc = (id: string, title: string, version: number): CourseDto => ({ schema: 'capstone-course-dto/1', generatedFrom: [], course: { id, title, version, isSeed: false } as CourseDto['course'], deliverables: [] });

beforeEach(() => {
  calls.selects.length = calls.upserts.length = calls.toasts.length = 0;
  calls.listResult = { data: [], error: null };
  calls.getResult = { data: null, error: null };
  calls.upsertResult = { data: null, error: null };
  for (const d of cache.courseDocuments()) cache.deleteCourseDocument(d.course.id);
  setCurrentUserId(null);
  setCurrentUserId('admin-1');
});

describe('supabaseCourseHistoryRepo.list', () => {
  it('asks for what describes a version, never the documents, newest first', async () => {
    calls.listResult = {
      data: [
        { version: 3, saved_by_name: 'Ana Admin', saved_at: '2026-10-16T09:00:00+00:00', title: 'CCNA edited again', bytes: 152000 },
        { version: 2, saved_by_name: null, saved_at: null, title: null, bytes: null },
      ],
      error: null,
    };
    const r = await supabaseCourseHistoryRepo.list('ccna');
    expect(calls.selects[0]).toMatchObject({ table: 'course_document_versions', cols: 'version, saved_by_name, saved_at, title, bytes', eq: [['course_id', 'ccna']], order: ['version', { ascending: false }] });
    expect(calls.selects[0].cols, 'the (large) document is not in the list').not.toContain('doc');
    expect(r.versions).toEqual([
      { version: 3, savedAt: Date.parse('2026-10-16T09:00:00Z'), by: 'Ana Admin', title: 'CCNA edited again', bytes: 152000 },
      { version: 2, savedAt: 0, by: '', title: '', bytes: 0 },
    ]);
    expect(r.ok).toBe(true);
  });

  it('says the database needs its update, quietly, and an ordinary failure loudly', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    calls.listResult = { data: null, error: { code: '42P01', message: 'relation "public.course_document_versions" does not exist' } };
    expect(await supabaseCourseHistoryRepo.list('ccna')).toEqual({ ok: false, needsUpdate: true, versions: [] });
    expect(errors).not.toHaveBeenCalled();
    calls.listResult = { data: null, error: { code: '42501', message: 'permission denied' } };
    expect(await supabaseCourseHistoryRepo.list('ccna')).toEqual({ ok: false, needsUpdate: false, versions: [] });
    expect(errors).toHaveBeenCalledTimes(1);
    errors.mockRestore();
  });
});

describe('supabaseCourseHistoryRepo.get and restore', () => {
  it('fetches one document by number', async () => {
    calls.getResult = { data: { doc: doc('ccna', 'CCNA v2', 2) }, error: null };
    const d = await supabaseCourseHistoryRepo.get('ccna', 2);
    expect(d?.course.title).toBe('CCNA v2');
    expect(calls.selects[0]).toMatchObject({ cols: 'doc', eq: [['course_id', 'ccna'], ['version', 2]] });
    calls.getResult = { data: null, error: null };
    expect(await supabaseCourseHistoryRepo.get('ccna', 9)).toBeNull();
  });

  it('restores an old document as an ordinary save, as the admin, and takes the number and the document the database answers with', async () => {
    cache.setCourseDocument(doc('ccna', 'CCNA now', 5));
    calls.getResult = { data: { doc: doc('ccna', 'CCNA v2', 2) }, error: null };
    calls.upsertResult = { data: { doc: doc('ccna', 'CCNA v2', 6), version: 6 }, error: null };
    const now = await supabaseCourseHistoryRepo.restore('ccna', 2);
    expect(now).toBe(6);
    expect(calls.upserts[0].opts).toEqual({ onConflict: 'course_id' });
    expect(calls.upserts[0].row).toMatchObject({ course_id: 'ccna', schema: 'capstone-course-dto/1', version: 6, updated_by: 'admin-1' });
    expect((calls.upserts[0].row.doc as CourseDto).course.title).toBe('CCNA v2');
    // The page reads what the database kept, renumbered.
    expect(cache.courseDocument('ccna')?.course).toMatchObject({ title: 'CCNA v2', version: 6 });
  });

  it('says why when it could not restore, and changes nothing', async () => {
    cache.setCourseDocument(doc('ccna', 'CCNA now', 5));
    calls.getResult = { data: null, error: null };
    expect(await supabaseCourseHistoryRepo.restore('ccna', 2)).toBeNull();
    expect(calls.toasts.at(-1)!.message).toMatch(/could not be read/);
    calls.getResult = { data: { doc: doc('ccna', 'CCNA v2', 2) }, error: null };
    calls.upsertResult = { data: null, error: { code: '42501', message: 'new row violates row-level security policy' } };
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await supabaseCourseHistoryRepo.restore('ccna', 2)).toBeNull();
    errors.mockRestore();
    expect(calls.toasts.at(-1)!.message).toMatch(/Couldn’t restore/);
    expect(cache.courseDocument('ccna')?.course.title, 'the page keeps what it had').toBe('CCNA now');
    setCurrentUserId(null);
    expect(await supabaseCourseHistoryRepo.restore('ccna', 2)).toBeNull();
    expect(calls.toasts.at(-1)!.message).toMatch(/Sign in/);
  });
});

describe('the cloud course repo counts the same way the database does', () => {
  it('sends one past what the course was, whatever the draft held, and a copy starts at 1', async () => {
    const upserts: Record<string, unknown>[] = [];
    // The shared client records upserts of course_documents too.
    const original = client.from;
    client.from = ((table: string) => ({
      ...original(table),
      upsert: (row: Record<string, unknown>) => {
        upserts.push(row);
        return { then: (cb: (r: { error: null }) => void) => cb({ error: null }) };
      },
    })) as unknown as typeof client.from;
    try {
      const shipped = supabaseCourseRepo.get('ccna')!;
      supabaseCourseRepo.save({ ...shipped, title: 'First fork' });
      expect(upserts[0].version, 'a built-in’s first edit is one past its shipped version').toBe((shipped.version ?? 0) + 1);
      expect(supabaseCourseRepo.get('ccna')!.version).toBe((shipped.version ?? 0) + 1);
      supabaseCourseRepo.save({ ...supabaseCourseRepo.get('ccna')!, title: 'Second', version: 1 });
      expect(upserts[1].version, 'the count does not depend on the number the draft holds').toBe((shipped.version ?? 0) + 2);
      const copy = supabaseCourseRepo.duplicate('ccna', 'ccna-copy', 'CCNA copy')!;
      expect(copy.version).toBeUndefined();
      expect(upserts[2].version, 'a copy’s first save is version 1').toBe(1);
    } finally {
      client.from = original;
    }
  });
});

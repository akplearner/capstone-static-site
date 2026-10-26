import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CourseDto } from '../content/dto';
import serverPlusDoc from '../../../content/courses/server-plus.json';

/**
 * The cloud course repo: seeds from their documents, authored courses from
 * `course_documents`, and a save that writes the WHOLE document. The client
 * is a fake that records what would have gone over the wire.
 */
type Call = { table: string; op: string; row?: unknown; opts?: unknown; col?: string; v?: unknown };
const calls: Call[] = [];
let rows: { course_id: string; doc: unknown }[] = [];
let fixRows: Record<string, unknown>[] = [];

vi.mock('../supabase/client', () => ({
  getBrowserClient: () => ({
    from(table: string) {
      return {
        // `course_documents` is awaited as it stands; `content_fixes` (R121) is paged: order, order, range.
        select: () => ({
          then: (res: (r: unknown) => void) => res({ data: rows, error: null }),
          order: () => ({ order: () => ({ range: () => Promise.resolve({ data: table === 'content_fixes' ? fixRows : [], error: null }) }) }),
        }),
        upsert: (row: unknown, opts: unknown) => {
          calls.push({ table, op: 'upsert', row, opts });
          return { then: (cb: (r: { error: null }) => void) => cb({ error: null }) };
        },
        delete: () => ({
          eq: (col: string, v: unknown) => {
            calls.push({ table, op: 'delete', col, v });
            return { then: (cb: (r: { error: null }) => void) => cb({ error: null }) };
          },
        }),
      };
    },
  }),
}));

const { supabaseCourseRepo, supabaseDocumentSource, documentFor } = await import('./supabaseCourseRepo');
const { cache, hydrateContentFixes, hydrateCourseDocuments, setCurrentUserId } = await import('./supabaseCache');
const { registerDocumentSource, registerFixesSource } = await import('../content/docs');
const { NO_FIXES } = await import('../contentFix');

const parent = serverPlusDoc as unknown as CourseDto;
const authoredDoc = (id: string, title: string): CourseDto => ({
  ...parent,
  generatedFrom: [],
  course: { ...parent.course, id, slug: id, title, isSeed: false, basedOn: 'server-plus' },
});

beforeEach(() => {
  calls.length = 0;
  rows = [];
  fixRows = [];
  for (const d of cache.courseDocuments()) cache.deleteCourseDocument(d.course.id);
  registerDocumentSource(supabaseDocumentSource);
  registerFixesSource(() => NO_FIXES);
  cache.setContentFixes('security-plus', []);
  setCurrentUserId('instructor-1');
});

describe('the cloud course repo', () => {
  it('serves the built-in courses from their documents', () => {
    const ids = supabaseCourseRepo.list().map((c) => c.id);
    expect(ids).toEqual(['security-plus', 'mssp', 'cysa-plus', 'server-plus', 'ccna', 'a-plus', 'secai-plus', 'cissp', 'azure-fundamentals', 'azure-administrator', 'azure-devops', 'aws-cloud-practitioner', 'aws-solutions-architect', 'aws-devops']);
    expect(supabaseCourseRepo.get('server-plus')?.title).toBe(parent.course.title);
  });

  it('an authored document in course_documents is a course in the catalogue', async () => {
    rows = [{ course_id: 'my-server', doc: authoredDoc('my-server', 'My Server course') }];
    await hydrateCourseDocuments();
    const course = supabaseCourseRepo.get('my-server');
    expect(course?.title).toBe('My Server course');
    expect(course?.isSeed).toBe(false);
    // …and its document is what the provider will hand to the readers.
    expect(supabaseDocumentSource('my-server')?.deliverables.length).toBe(parent.deliverables.length);
  });

  it('an authored document with a seed id overrides the seed', async () => {
    rows = [{ course_id: 'server-plus', doc: authoredDoc('server-plus', 'Server+ (edited)') }];
    await hydrateCourseDocuments();
    const list = supabaseCourseRepo.list();
    expect(list.filter((c) => c.id === 'server-plus')).toHaveLength(1);
    expect(supabaseCourseRepo.get('server-plus')?.title).toBe('Server+ (edited)');
  });

  it('a row that is not a document is skipped loudly, not fatal', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    rows = [
      { course_id: 'broken', doc: { schema: 'x' } },
      { course_id: 'fine', doc: authoredDoc('fine', 'Fine') },
    ];
    await hydrateCourseDocuments();
    expect(supabaseCourseRepo.get('broken')).toBeUndefined();
    expect(supabaseCourseRepo.get('fine')?.title).toBe('Fine');
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('duplicating a seed writes the whole document — parent content, new course', () => {
    const created = supabaseCourseRepo.duplicate('server-plus', 'server-copy', 'Server copy');
    expect(created?.basedOn).toBe('server-plus');
    const up = calls.find((c) => c.op === 'upsert');
    expect(up?.table).toBe('course_documents');
    expect(up?.opts).toEqual({ onConflict: 'course_id' });
    const row = up?.row as { course_id: string; schema: string; doc: CourseDto; updated_by: string };
    expect(row.course_id).toBe('server-copy');
    expect(row.schema).toBe(parent.schema);
    expect(row.updated_by).toBe('instructor-1');
    expect(row.doc.course.id).toBe('server-copy');
    expect(row.doc.course.title).toBe('Server copy');
    expect(row.doc.deliverables).toEqual(parent.deliverables);
    expect(row.doc.procedures).toEqual(parent.procedures);
    expect(row.doc.content?.diagrams).toBeDefined();
    // Optimistic: it is in the catalogue and readable before the upsert lands.
    expect(supabaseCourseRepo.get('server-copy')?.title).toBe('Server copy');
    expect(supabaseDocumentSource('server-copy')?.course.id).toBe('server-copy');
  });

  it('a fresh course gets the shared sections and no forms', () => {
    const doc = documentFor({ id: 'blank', slug: 'blank', title: 'Blank', roles: [], weeks: [], gates: [], tasks: [] } as never);
    expect(doc.deliverables).toEqual([]);
    expect(doc.content?.manual).toBeDefined();
    expect(doc.content?.custody).toBeDefined();
    expect(doc.content?.diagrams).toBeUndefined();
  });

  it('delete removes the row and the course', () => {
    supabaseCourseRepo.duplicate('ccna', 'ccna-copy', 'CCNA copy');
    supabaseCourseRepo.delete('ccna-copy');
    expect(calls.find((c) => c.op === 'delete')).toMatchObject({ table: 'course_documents', col: 'course_id', v: 'ccna-copy' });
    expect(supabaseCourseRepo.get('ccna-copy')).toBeUndefined();
  });

  it('course content is not the student’s data: sign-out keeps it', async () => {
    rows = [{ course_id: 'kept', doc: authoredDoc('kept', 'Kept') }];
    await hydrateCourseDocuments();
    setCurrentUserId(null);
    expect(supabaseCourseRepo.get('kept')?.title).toBe('Kept');
  });

  it('content fixes in the ledger change the words in the catalogue and its documents (R121), and only the words', async () => {
    registerFixesSource((id) => cache.contentFixes(id));
    const before = supabaseCourseRepo.get('security-plus')!;
    const task = before.tasks[0];
    const step = task.steps[0];
    fixRows = [{ id: 'f1', course_id: 'security-plus', revision: 1, kind: 'fix', summary: 'Reword', changes: [{ taskId: task.id, stepId: step.id, field: 'title', before: step.title, after: 'Reworded step' }], issue_ids: [], folds: [], folded_in: '', doc_version: 1, author_name: 'Ana', created_at: '2026-10-16T09:00:00Z' }];
    expect(await hydrateContentFixes()).toEqual({ ok: true, needsUpdate: false });
    const after = supabaseCourseRepo.get('security-plus')!;
    expect(after).not.toBe(before);
    expect(after.tasks[0].steps[0].title).toBe('Reworded step');
    expect(after.revision).toBe(1);
    expect(after.tasks[1], 'what the fix did not touch is the same object').toBe(before.tasks[1]);
    expect(supabaseCourseRepo.get('security-plus'), 'and the catalogue is cached on the ledger’s version').toBe(after);
    expect(supabaseCourseRepo.get('ccna')!.revision, 'another course has no revision').toBeUndefined();
    expect(before.tasks[0].steps[0].title, 'the shipped course was not mutated').toBe(step.title);
  });
});

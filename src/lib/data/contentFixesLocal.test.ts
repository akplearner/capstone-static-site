import { describe, it, expect, beforeEach } from 'vitest';
import { contentFixesRepo, courseRepo } from '@/lib/data';
import { invalidateContentFixes } from './localStorageContentFixesRepo';
import { invalidateCourseCache } from './localStorageCourseRepo';
import { SEED_DOCUMENTS, baseCourse, baseDocument, courseDocument, effectiveCourse } from '../content/docs';
import { NO_FIXES, changesFrom, fixDraft, foldDraft, ledger, readField, revertDraft } from '../contentFix';
import { KEYS } from './keys';

/**
 * R121 — the content fix ledger on this device, and what it does to every reader of a course:
 * the catalogue, the document, an edited copy. With no fixes nothing is a new object; with fixes
 * the words change everywhere at once and the version says which words these are.
 */
const ID = 'security-plus';
const target = () => {
  const course = baseCourse(ID)!;
  const task = course.tasks[0];
  return { course, task, step: task.steps[0], target: { taskId: task.id, stepId: task.steps[0].id } };
};
const retitle = (to: string, summary = 'Reword the step') => {
  const { course, target: t } = target();
  return fixDraft(summary, changesFrom(course, t, { title: to }), []);
};

beforeEach(() => {
  localStorage.clear();
  invalidateContentFixes();
  invalidateCourseCache();
});

describe('with no fixes, nothing is a new object', () => {
  it('the catalogue and the document are the shipped ones, and the ledger is the one empty array', () => {
    expect(contentFixesRepo.list(ID)).toBe(NO_FIXES);
    expect(courseRepo.list().find((c) => c.id === ID)).toBe(SEED_DOCUMENTS[ID].course);
    expect(courseDocument(ID)).toBe(SEED_DOCUMENTS[ID]);
    expect(effectiveCourse(SEED_DOCUMENTS[ID].course as never)).toBe(SEED_DOCUMENTS[ID].course);
    expect(courseRepo.get(ID)!.revision).toBeUndefined();
  });
});

describe('a fix changes the words everywhere at once', () => {
  it('gives the course, its document and the catalogue the new text and the revision, and leaves the shipped document alone', async () => {
    const { step, target: t } = target();
    const fix = await contentFixesRepo.add(ID, retitle('A reworded step'), 'Ana');
    expect(fix).toMatchObject({ courseId: ID, revision: 1, kind: 'fix', by: 'Ana', docVersion: baseCourse(ID)!.version ?? 1 });
    expect(fix!.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const course = courseRepo.get(ID)!;
    expect(readField(course, t, 'title')).toBe('A reworded step');
    expect(course.revision).toBe(1);
    const doc = courseDocument(ID)!;
    expect(doc.revision).toBe(1);
    expect(doc.fixes).toHaveLength(1);
    expect(doc.course, 'the catalogue and the document hold the very same course').toBe(course);
    expect(doc.deliverables, 'everything else in the document is untouched').toBe(SEED_DOCUMENTS[ID].deliverables);
    expect(courseDocument(ID), 'and a second read is the same object').toBe(doc);
    expect(courseRepo.get(ID), 'so is the catalogue').toBe(course);

    expect(SEED_DOCUMENTS[ID].course.tasks[0].steps[0].title, 'the shipped file is never mutated').toBe(step.title);
    expect('revision' in SEED_DOCUMENTS[ID]).toBe(false);
  });

  it('a second fix is the next revision, a revert restores the words and is a revision too, and a new ledger is a new object', async () => {
    const { step } = target();
    await contentFixesRepo.add(ID, retitle('First reword'), 'Ana');
    const first = courseRepo.get(ID)!;
    const second = await contentFixesRepo.add(ID, fixDraft('Again', changesFrom(first, { taskId: first.tasks[0].id, stepId: step.id }, { title: 'Second reword' }), []), 'Ana');
    expect(second!.revision).toBe(2);
    expect(courseRepo.get(ID)).not.toBe(first);
    expect(courseRepo.get(ID)!.tasks[0].steps[0].title).toBe('Second reword');

    const rows = ledger(baseCourse(ID)!, contentFixesRepo.list(ID));
    expect(rows.map((r) => [r.fix.revision, r.state, r.canRevert])).toEqual([[1, 'live', false], [2, 'live', true]]);
    const reverted = await contentFixesRepo.add(ID, revertDraft(second!), 'Ana');
    expect(reverted).toMatchObject({ revision: 3, kind: 'revert', reverts: 2 });
    expect(courseRepo.get(ID)!.tasks[0].steps[0].title).toBe('First reword');
    expect(courseRepo.get(ID)!.revision).toBe(3);

    const folded = await contentFixesRepo.add(ID, foldDraft([1], 'commit abc'), 'Ana');
    expect(folded!.revision).toBe(4);
    expect(courseRepo.get(ID)!.revision, 'a fold counts in the version though it changes no text').toBe(4);
    expect(courseRepo.get(ID)!.tasks[0].steps[0].title).toBe('First reword');
  });

  it('keeps one course’s fixes out of another’s', async () => {
    const other = courseRepo.list().find((c) => c.id !== ID)!;
    const before = other;
    await contentFixesRepo.add(ID, retitle('Only here'), 'Ana');
    expect(courseRepo.get(other.id)).toBe(before);
    expect(contentFixesRepo.list(other.id)).toBe(NO_FIXES);
  });

  it('survives a reload, in revision order, and drops what is malformed rather than failing the course', async () => {
    await contentFixesRepo.add(ID, retitle('One'), 'Ana');
    await contentFixesRepo.add(ID, fixDraft('Two', changesFrom(courseRepo.get(ID)!, target().target, { title: 'Two' }), []), 'Ana');
    invalidateContentFixes();
    expect(contentFixesRepo.list(ID).map((f) => f.revision)).toEqual([1, 2]);

    const raw = JSON.parse(localStorage.getItem(KEYS.contentFixes(ID))!) as unknown[];
    localStorage.setItem(KEYS.contentFixes(ID), JSON.stringify([raw[1], { nonsense: true }, null, 7, { ...(raw[0] as object), courseId: 'someone-else' }, raw[0]]));
    invalidateContentFixes();
    expect(contentFixesRepo.list(ID).map((f) => f.revision), 'sorted, and only well-formed entries of this course').toEqual([1, 2]);

    localStorage.setItem(KEYS.contentFixes(ID), '{not json');
    invalidateContentFixes();
    expect(contentFixesRepo.list(ID)).toBe(NO_FIXES);
    localStorage.setItem(KEYS.contentFixes(ID), '{"a":1}');
    invalidateContentFixes();
    expect(contentFixesRepo.list(ID)).toBe(NO_FIXES);
  });

  it('reports the ledger version changing, so a cached catalogue knows to rebuild', async () => {
    const v0 = contentFixesRepo.version();
    await contentFixesRepo.add(ID, retitle('Changed'), 'Ana');
    expect(contentFixesRepo.version()).toBeGreaterThan(v0);
    expect(await contentFixesRepo.load()).toEqual({ ok: true, needsUpdate: false });
  });
});

describe('an edited copy of a built-in course', () => {
  it('never stores the ledger’s revision, keeps the fixed words it was made from, and follows a later revert', async () => {
    const { step, target: t } = target();
    const fix = await contentFixesRepo.add(ID, retitle('Reworded before the copy'), 'Ana');
    const effective = courseRepo.get(ID)!;
    expect(effective.revision).toBe(1);

    courseRepo.save({ ...effective, title: 'An edited copy' });
    const stored = JSON.parse(localStorage.getItem(KEYS.courses)!) as { id: string; revision?: number; title: string }[];
    expect(stored.find((c) => c.id === ID)).toMatchObject({ title: 'An edited copy' });
    expect('revision' in stored.find((c) => c.id === ID)!, 'the ledger’s counter is never a saved copy’s').toBe(false);

    // The copy was saved with the fixed words in it, so the fix reads as already applied, and the revision is still the ledger's.
    expect(readField(courseRepo.get(ID)!, t, 'title')).toBe('Reworded before the copy');
    expect(courseRepo.get(ID)!.revision).toBe(1);
    expect(baseDocument(ID)!.course.title).toBe('An edited copy');
    expect(courseDocument(ID)!.revision).toBe(1);

    // Reverting the fix walks the copy back too: the apply rule sees the fixed text and sets the original.
    await contentFixesRepo.add(ID, revertDraft(fix!), 'Ana');
    expect(readField(courseRepo.get(ID)!, t, 'title')).toBe(step.title);
    expect(readField(courseDocument(ID)!.course as never, t, 'title')).toBe(step.title);
  });

  it('a duplicate under a new id starts with no ledger of its own', async () => {
    await contentFixesRepo.add(ID, retitle('Parent only'), 'Ana');
    const copy = courseRepo.duplicate(ID, 'my-copy', 'My copy')!;
    expect(copy.revision, 'the copy carries no counter').toBeUndefined();
    expect(contentFixesRepo.list('my-copy')).toBe(NO_FIXES);
    expect(readField(courseRepo.get('my-copy')!, target().target, 'title'), 'but it keeps the words it was copied with').toBe('Parent only');
  });
});

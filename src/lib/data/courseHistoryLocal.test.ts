import { describe, it, expect, beforeEach, vi } from 'vitest';
import { courseHistoryRepo, courseRepo } from '@/lib/data';
import { invalidateCourseCache } from './localStorageCourseRepo';
import { invalidateContentFixes } from './localStorageContentFixesRepo';
import { KEYS } from './keys';
import { SEED_DOCUMENTS, courseDocument } from '../content/docs';

/**
 * R122 — every save of a course in the studio is a numbered, restorable version, offline too.
 * The database numbers them in the cloud; this device counts the same way and keeps the last few.
 */
const ID = 'security-plus';
const shipped = SEED_DOCUMENTS[ID].course.version ?? 0;
const retitle = (title: string) => ({ ...courseRepo.get(ID)!, title });

beforeEach(() => {
  localStorage.clear();
  invalidateCourseCache();
  invalidateContentFixes();
});

describe('every save is a new version', () => {
  it('counts from what the course shipped at, one per save, whatever the form held', () => {
    expect(courseRepo.get(ID)!.version).toBe(shipped);
    courseRepo.save(retitle('First edit'));
    expect(courseRepo.get(ID)!.version, 'a built-in’s first edit is one past its shipped version').toBe(shipped + 1);
    // The draft in the studio still holds the old number; the count does not depend on it.
    courseRepo.save({ ...retitle('Second edit'), version: 1 });
    expect(courseRepo.get(ID)!.version).toBe(shipped + 2);
    courseRepo.saveWithContent(retitle('Third edit'), { glossary: { x: 'y' } });
    expect(courseRepo.get(ID)!.version).toBe(shipped + 3);
    expect(courseDocument(ID)!.course.version, 'and the document says the same').toBe(shipped + 3);
  });

  it('a copy is a new course: its first save is version 1', () => {
    const copy = courseRepo.duplicate(ID, 'my-copy', 'My copy')!;
    expect(copy.version).toBeUndefined();
    expect(courseRepo.get('my-copy')!.version).toBe(1);
    courseRepo.save({ ...courseRepo.get('my-copy')!, title: 'Renamed copy' });
    expect(courseRepo.get('my-copy')!.version).toBe(2);
  });
});

describe('the history', () => {
  it('lists the saves newest first, with the title, who and how large', async () => {
    courseRepo.save(retitle('One'));
    courseRepo.save(retitle('Two'));
    const { ok, needsUpdate, versions } = await courseHistoryRepo.list(ID);
    expect(ok).toBe(true);
    expect(needsUpdate).toBe(false);
    expect(versions.map((v) => [v.version, v.title, v.by])).toEqual([[shipped + 2, 'Two', 'Instructor'], [shipped + 1, 'One', 'Instructor']]);
    for (const v of versions) {
      expect(v.bytes).toBeGreaterThan(1000);
      expect(v.savedAt).toBeGreaterThan(Date.parse('2020-01-01'));
    }
    expect((await courseHistoryRepo.list('never-edited')).versions, 'a course never edited has none').toEqual([]);
  });

  it('keeps the last eight, because each is a whole course and a browser’s storage is small', async () => {
    for (let i = 1; i <= 10; i++) courseRepo.save(retitle(`Edit ${i}`));
    const { versions } = await courseHistoryRepo.list(ID);
    expect(versions).toHaveLength(8);
    expect(versions[0].title).toBe('Edit 10');
    expect(versions[7].title).toBe('Edit 3');
  });

  it('returns the document of a version, with the content it was saved with', async () => {
    courseRepo.saveWithContent(retitle('With a glossary'), { glossary: { Term: 'Meaning' } });
    courseRepo.save(retitle('Without'));
    const v1 = (await courseHistoryRepo.get(ID, shipped + 1))!;
    expect(v1.course.title).toBe('With a glossary');
    expect(v1.glossary).toMatchObject({ Term: 'Meaning' });
    expect(v1.schema).toBe('capstone-course-dto/1');
    expect(await courseHistoryRepo.get(ID, 999)).toBeNull();
  });

  it('a course’s history is its own', async () => {
    courseRepo.save(retitle('Only security-plus'));
    expect((await courseHistoryRepo.list('ccna')).versions).toEqual([]);
  });
});

describe('restoring', () => {
  it('saves the old course again as a NEW version, and puts its content back as it was', async () => {
    courseRepo.save(retitle('Version A'));
    const a = courseRepo.get(ID)!.version!;
    courseRepo.saveWithContent(retitle('Version B'), { glossary: { Only: 'in B' } });
    const b = courseRepo.get(ID)!.version!;
    expect(JSON.parse(localStorage.getItem(KEYS.courseContent(ID))!)).toMatchObject({ glossary: { Only: 'in B' } });

    const now = await courseHistoryRepo.restore(ID, a);
    expect(now, 'a restore is the next version, never a rewind').toBe(b + 1);
    expect(courseRepo.get(ID)!.title).toBe('Version A');
    expect(courseRepo.get(ID)!.version).toBe(b + 1);
    expect(localStorage.getItem(KEYS.courseContent(ID)), 'A had no content of its own: B’s is not inherited').toBeNull();
    const { versions } = await courseHistoryRepo.list(ID);
    expect(versions.map((v) => v.version), 'nothing was lost').toEqual([b + 1, b, a]);
    expect(versions[0].title).toBe('Version A');
    // …and restoring B brings its content back.
    await courseHistoryRepo.restore(ID, b);
    expect(courseRepo.get(ID)!.title).toBe('Version B');
    expect(JSON.parse(localStorage.getItem(KEYS.courseContent(ID))!)).toMatchObject({ glossary: { Only: 'in B' } });
  });

  it('says no for a version that is not there', async () => {
    courseRepo.save(retitle('Only one'));
    expect(await courseHistoryRepo.restore(ID, 999)).toBeNull();
    expect(courseRepo.get(ID)!.title).toBe('Only one');
  });
});

describe('a browser with no room', () => {
  it('still saves the course; the history keeps what it can, quietly', async () => {
    courseRepo.save(retitle('Saved before the storage filled'));
    const real = Storage.prototype.setItem;
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === KEYS.courseVersions(ID)) throw new DOMException('full', 'QuotaExceededError');
      return real.call(this, key, value);
    });
    expect(() => courseRepo.save(retitle('Saved with a full history'))).not.toThrow();
    spy.mockRestore();
    expect(courseRepo.get(ID)!.title, 'the course itself saved').toBe('Saved with a full history');
    expect((await courseHistoryRepo.list(ID)).versions.map((v) => v.title), 'the older history is as it was').toEqual(['Saved before the storage filled']);
  });
});

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { localStorageCourseRepo, localDocumentSource } from './localStorageCourseRepo';
import { supabaseCourseRepo } from './supabaseCourseRepo';
import { courseFromDto, ContentError } from '../content/load';
import { courseDocument, registerDocumentSource } from '../content/docs';
import { deliverablesForCourse } from '../docs/definitions';
import { SERVER_PLUS } from './seed/serverPlus';
import { SECURITY_PLUS } from './seed/securityPlus';
import { CYSA_PLUS } from './seed/cysa';
import { MSSP } from './seed/mssp';
import { CCNA } from './seed/ccna';
import serverPlusDoc from '../../../content/courses/server-plus.json';

/**
 * The documents are the source the app renders from.
 *
 * `content/dto.test.ts` proves the two sources are equivalent; this proves which
 * one is actually live. The distinction matters: the equivalence test passed for
 * two rounds while the flag that would have used the documents was off.
 */
describe('the built-in courses load from content/courses', () => {
  const MODULES = [SECURITY_PLUS, MSSP, CYSA_PLUS, SERVER_PLUS, CCNA];

  it('every seed course is there', () => {
    const ids = localStorageCourseRepo.list().map((c) => c.id);
    for (const m of MODULES) expect(ids, m.id).toContain(m.id);
  });

  it('the objects came from the documents, not from the compiled modules', () => {
    for (const m of MODULES) {
      const loaded = localStorageCourseRepo.get(m.id);
      expect(loaded, m.id).toBeDefined();
      // Same course, different object: identity is the whole assertion.
      expect(loaded, m.id).not.toBe(m);
      expect(loaded!.id).toBe(m.id);
    }
  });

  it('and they are the same content — module, document, loaded course all agree', () => {
    // JSON drops `undefined` fields, so the module is compared through the same
    // round trip rather than raw.
    const throughJson = (c: unknown) => JSON.parse(JSON.stringify(c));
    expect(throughJson(localStorageCourseRepo.get('server-plus'))).toEqual(
      throughJson(courseFromDto(serverPlusDoc))
    );
    expect(throughJson(localStorageCourseRepo.get('server-plus'))).toEqual(throughJson(SERVER_PLUS));
  });
});

describe('both repos serve the same built-in courses', () => {
  it('the cloud repo and the local repo agree on every seed, object for object', () => {
    // Supabase is not configured under test, so the cloud repo has nothing
    // authored and its catalogue is the seeds — the same five documents.
    const throughJson = (c: unknown) => JSON.parse(JSON.stringify(c));
    const local = localStorageCourseRepo.list();
    const cloud = supabaseCourseRepo.list();
    expect(cloud.map((c) => c.id)).toEqual(local.map((c) => c.id));
    for (const c of local) expect(throughJson(supabaseCourseRepo.get(c.id)), c.id).toEqual(throughJson(c));
  });
});

describe('a locally authored course has a document too', () => {
  beforeEach(() => {
    localStorage.clear();
    registerDocumentSource(localDocumentSource);
  });

  it('a duplicate renders its parent’s document with itself as the course', () => {
    const dup = localStorageCourseRepo.duplicate('ccna', 'ccna-dup', 'CCNA duplicate');
    expect(dup?.basedOn).toBe('ccna');
    const doc = courseDocument('ccna-dup');
    expect(doc?.course.id).toBe('ccna-dup');
    expect(doc?.deliverables.map((d) => d.id)).toEqual(courseDocument('ccna')!.deliverables.map((d) => d.id));
    // …which is what the Deliverables page asks for.
    expect(deliverablesForCourse('ccna-dup').length).toBe(deliverablesForCourse('ccna').length);
    // Same object until the course changes — the provider memoises on it.
    expect(courseDocument('ccna-dup')).toBe(doc);
  });

  it('a fresh course gets the shared sections and no forms', () => {
    localStorageCourseRepo.save({ id: 'fresh', slug: 'fresh', title: 'Fresh', roles: [], weeks: [], gates: [], tasks: [] } as never);
    const doc = courseDocument('fresh');
    expect(doc?.deliverables).toEqual([]);
    expect(doc?.content?.manual).toBeDefined();
    expect(doc?.content?.kit).toBeUndefined();
  });
});

describe('a broken document is loud, not silent', () => {
  afterEach(() => vi.restoreAllMocks());

  it('a document from another schema is refused with the path that is wrong', () => {
    expect(() => courseFromDto({ ...serverPlusDoc, schema: 'something-else' })).toThrow(ContentError);
    expect(() => courseFromDto({ ...serverPlusDoc, schema: 'something-else' })).toThrow(
      /document\.schema/
    );
  });

  it('a truncated document names the field it lost', () => {
    const doc = JSON.parse(JSON.stringify(serverPlusDoc));
    delete doc.course.weeks[0].title;
    expect(() => courseFromDto(doc)).toThrow(/course\.weeks\[0\]\.title/);
  });
});

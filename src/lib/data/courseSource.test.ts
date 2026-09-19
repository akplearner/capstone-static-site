import { describe, it, expect, vi, afterEach } from 'vitest';
import { localStorageCourseRepo } from './localStorageCourseRepo';
import { courseFromDto, ContentError } from '../content/load';
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

import type { ContentFixesRepository } from './types';
import { KEYS } from './keys';
import { safeSetItem } from './safeStorage';
import { baseCourse } from '../content/docs';
import { NO_FIXES, asContentFix, effectiveRevision, newFix, sortedFixes, type ContentFix } from '../contentFix';
import { notifyStore } from '../useClientStore';

/**
 * The content fix ledger, offline (R121): one blob per course in localStorage, oldest first.
 *
 * Like the course catalogue it is cached on a version counter, because `courseDocument()` and the
 * catalogue read it constantly and the only things that can change the answer are a write here,
 * another tab's write (the `storage` event) or a test clearing storage (`invalidateContentFixes`).
 * A course with no entries reads as `NO_FIXES`, the same frozen array every time, which is what
 * lets `content/docs.ts` hand back the very same course object when nothing has been fixed.
 */
function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

let version = 0;
const cached = new Map<string, { version: number; list: readonly ContentFix[] }>();

/** Another tab wrote, or a test cleared storage: the cache cannot see either. */
export function invalidateContentFixes(): void {
  version++;
  cached.clear();
}

if (hasWindow()) {
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key.endsWith('_content_fixes')) invalidateContentFixes();
  });
}

function read(courseId: string): readonly ContentFix[] {
  if (!hasWindow()) return NO_FIXES;
  const hit = cached.get(courseId);
  if (hit && hit.version === version) return hit.list;
  let list: readonly ContentFix[] = NO_FIXES;
  try {
    const raw = localStorage.getItem(KEYS.contentFixes(courseId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const entries = (Array.isArray(parsed) ? parsed : []).map(asContentFix).filter((f): f is ContentFix => f !== null && f.courseId === courseId);
    if (entries.length > 0) list = sortedFixes(entries);
  } catch {
    list = NO_FIXES;
  }
  cached.set(courseId, { version, list });
  return list;
}

export const localStorageContentFixesRepo: ContentFixesRepository = {
  list: read,
  version: () => version,

  // Everything is already on this device.
  async load() {
    return { ok: true, needsUpdate: false };
  },

  // The revision is the ledger's next number, as the database would assign it; the document
  // version is the course's own. The time is the one place this ledger meets a clock.
  async add(courseId, draft, by) {
    if (!hasWindow()) return null;
    const list = read(courseId);
    const fix = newFix(courseId, draft, {
      id: crypto.randomUUID(),
      revision: effectiveRevision(list) + 1,
      docVersion: baseCourse(courseId)?.version ?? 1,
      by,
      at: new Date().toISOString(),
    });
    safeSetItem(KEYS.contentFixes(courseId), JSON.stringify([...list, fix]));
    invalidateContentFixes();
    notifyStore();
    return fix;
  },
};

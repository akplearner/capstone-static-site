import { Course } from '../types';
import { CourseRepository, ImportResult } from './types';
import { KEYS } from './keys';
import { safeSetItem } from './safeStorage';
import { courseFromDto } from '../content/load';
import securityPlusDoc from '../../../content/courses/security-plus.json';
import msspDoc from '../../../content/courses/mssp.json';
import cysaDoc from '../../../content/courses/cysa-plus.json';
import serverPlusDoc from '../../../content/courses/server-plus.json';
import ccnaDoc from '../../../content/courses/ccna.json';
import { SECURITY_PLUS } from './seed/securityPlus';
import { CYSA_PLUS } from './seed/cysa';
import { MSSP } from './seed/mssp';
import { SERVER_PLUS } from './seed/serverPlus';
import { CCNA } from './seed/ccna';

// Built-in courses shipped in code. They are never written to localStorage so
// they stay upgradeable; an authored course with the same id overrides a seed.
const SEED_MODULES: Course[] = [SECURITY_PLUS, MSSP, CYSA_PLUS, SERVER_PLUS, CCNA];

/**
 * Where the built-in courses come from: the JSON documents, with the TypeScript
 * modules as the fallback.
 *
 * This is the round the flag came out. `content/courses/*.json` is the content
 * model made portable, and `content/dto.test.ts` proves the app behaves
 * identically over either source — same week numbers, same tasks per role, same
 * required step counts, same week summaries. Until R75 the documents could not
 * carry the Definition-of-Done checks or the computed form columns (128 function
 * markers), so a JSON-sourced build would have silently lost the gate checks and
 * the switch stayed off behind `NEXT_PUBLIC_CONTENT_FROM_JSON`. Those are data
 * now, the markers are zero, and the documents hold everything the app renders —
 * so they are what it renders from.
 *
 * The modules stay compiled in as the fallback, and a fallback is LOUD: a
 * document that fails to validate is a content bug someone has to fix, not a
 * condition to paper over. The app keeps working; the console says why.
 *
 * Resolved on first use, never at module load. Eager resolution ran while the
 * seed modules were still initialising — the course graph is a web of
 * cross-imports — and threw a temporal-dead-zone error that the catch below then
 * swallowed into a silent fallback. Lazy is also free: `list()` caches, so this
 * runs once either way.
 */
let seedCache: Course[] | null = null;

function loadSeeds(): Course[] {
  if (seedCache) return seedCache;
  try {
    // Bundled at build time by the JSON loader, not read from disk at runtime,
    // so this works the same in the browser and on the server.
    return (seedCache = SEED_MODULES.map((m) => {
      const doc = CONTENT_DOCS[m.id];
      if (!doc) {
        console.error(`[content] no document for '${m.id}': using the compiled module`);
        return m;
      }
      return courseFromDto(doc);
    }));
  } catch (e) {
    // A broken document must not take the app down: say so and use the modules.
    console.error('[content] falling back to the compiled seeds:', e);
    return (seedCache = SEED_MODULES);
  }
}

/** The exported documents, keyed by course id. */
const CONTENT_DOCS: Record<string, unknown> = {
  'security-plus': securityPlusDoc,
  mssp: msspDoc,
  'cysa-plus': cysaDoc,
  'server-plus': serverPlusDoc,
  ccna: ccnaDoc,
};

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

function readAuthored(): Course[] {
  if (!hasWindow()) return [];
  try {
    const raw = localStorage.getItem(KEYS.courses);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Course[]) : [];
  } catch {
    return [];
  }
}

/**
 * The catalogue, cached.
 *
 * `list()` is the hottest read in the app and it was rebuilding its result every
 * single call: parse the authored JSON, build a Set of ids, filter the seeds,
 * spread both into a new array. `get()` is `list().find()`, so a page asking for
 * one course paid for all of them — and `useClientStore` then `JSON.stringify`s
 * whatever comes back, which for a `Course` is every week, task, step and
 * command it contains. `CourseProvider` and `SiteNav` both do that on every
 * page, and `explore`/`dashboard`/`portfolio` do it per course.
 *
 * The cache is keyed on nothing but a version counter, because the only thing
 * that can change the answer is a local write — seeds are compiled in. Every
 * mutating path already funnels through `writeAuthored`, so bumping there covers
 * save, delete and import without each of them having to remember.
 *
 * Returning the SAME array reference when nothing changed is the second half of
 * the win: it lets callers compare identity instead of re-deriving.
 */
let listCache: { version: number; value: Course[] } | null = null;
let version = 0;

function writeAuthored(courses: Course[]): void {
  if (!hasWindow()) return;
  safeSetItem(KEYS.courses, JSON.stringify(courses));
  version++;
}

/** Another tab wrote, or a test cleared storage — the cache cannot see either. */
export function invalidateCourseCache(): void {
  version++;
  listCache = null;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key === KEYS.courses) invalidateCourseCache();
  });
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';
const str = (v: unknown): v is string => typeof v === 'string';

/**
 * Validate the *shape* of an imported course, not just that the arrays exist —
 * a malformed task/step array would otherwise import cleanly and then crash the
 * course page render. Returns a specific reason so the import UI can explain it.
 * (Mirrors the deep-validation model in docs/handoff.ts.)
 */
function validateCourse(c: unknown): { ok: true } | { ok: false; error: string } {
  if (!isObj(c)) return { ok: false, error: 'JSON is not a course object.' };
  if (!str(c.id) || !c.id.trim()) return { ok: false, error: 'Course is missing a string "id".' };
  if (!str(c.title)) return { ok: false, error: 'Course is missing a string "title".' };
  if (!Array.isArray(c.roles) || !Array.isArray(c.weeks) || !Array.isArray(c.tasks)) {
    return { ok: false, error: 'Course needs "roles", "weeks" and "tasks" arrays.' };
  }
  for (const r of c.roles) {
    if (!isObj(r) || !str(r.id) || !str(r.name)) {
      return { ok: false, error: 'Every role needs a string "id" and "name".' };
    }
  }
  for (const w of c.weeks) {
    if (!isObj(w) || typeof w.number !== 'number' || !str(w.title)) {
      return { ok: false, error: 'Every week needs a numeric "number" and a string "title".' };
    }
  }
  for (const t of c.tasks) {
    if (!isObj(t) || !str(t.id) || !str(t.role) || typeof t.week !== 'number' || !str(t.title)) {
      return { ok: false, error: 'Every task needs "id", "role", numeric "week" and "title".' };
    }
    if (!Array.isArray(t.steps)) {
      return { ok: false, error: `Task "${t.id}" is missing a "steps" array.` };
    }
    for (const s of t.steps) {
      if (!isObj(s) || !str(s.id) || !str(s.title)) {
        return { ok: false, error: `A step in task "${t.id}" is missing "id" or "title".` };
      }
    }
  }
  return { ok: true };
}

export const localStorageCourseRepo: CourseRepository = {
  list(): Course[] {
    // On the server, return seeds only so pages can prerender.
    if (!hasWindow()) return loadSeeds();
    if (listCache && listCache.version === version) return listCache.value;
    const authored = readAuthored();
    const authoredIds = new Set(authored.map((c) => c.id));
    // Authored overrides a seed with the same id; otherwise seeds + authored.
    const seedsKept = loadSeeds().filter((s) => !authoredIds.has(s.id));
    const value = [...seedsKept, ...authored];
    listCache = { version, value };
    return value;
  },

  get(idOrSlug: string): Course | undefined {
    return this.list().find((c) => c.id === idOrSlug || c.slug === idOrSlug);
  },

  save(course: Course): void {
    const authored = readAuthored();
    const next = { ...course, isSeed: false, updatedAt: Date.now() };
    const idx = authored.findIndex((c) => c.id === course.id);
    if (idx >= 0) authored[idx] = next;
    else authored.push(next);
    writeAuthored(authored);
  },

  delete(id: string): void {
    const authored = readAuthored().filter((c) => c.id !== id);
    writeAuthored(authored);
  },

  exportJSON(id: string): string {
    const course = this.get(id);
    return course ? JSON.stringify({ ...course, isSeed: false }, null, 2) : '';
  },

  importJSON(json: string): ImportResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      return { ok: false, error: 'File is not valid JSON.' };
    }
    const valid = validateCourse(parsed);
    if (!valid.ok) {
      return { ok: false, error: valid.error };
    }
    const course = parsed as Course;
    // Avoid clobbering an existing course id.
    let id = course.id;
    if (this.get(id)) id = `${id}-imported-${Date.now().toString(36)}`;
    const toSave: Course = { ...course, id, slug: id, isSeed: false };
    this.save(toSave);
    return { ok: true, course: toSave };
  },

  duplicate(id: string, newId: string, newTitle: string): Course | undefined {
    const src = this.get(id);
    if (!src) return undefined;
    const clone: Course = JSON.parse(JSON.stringify(src));
    clone.id = newId;
    clone.slug = newId;
    clone.title = newTitle;
    clone.isSeed = false;
    this.save(clone);
    return clone;
  },
};

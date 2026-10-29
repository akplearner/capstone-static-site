import { Course } from '../types';
import { CourseContentOverrides, CourseHistoryRepository, CourseRepository, ImportResult } from './types';
import { KEYS } from './keys';
import { safeSetItem } from './safeStorage';
import { bareDocument, effectiveCourse, seedCourses, storedCourse } from '../content/docs';
import { localStorageContentFixesRepo } from './localStorageContentFixesRepo';
import { notifyStore } from '../useClientStore';
import type { CourseDto } from '../content/dto';
import { SECURITY_PLUS } from './seed/securityPlus';
import { CYSA_PLUS } from './seed/cysa';
import { MSSP } from './seed/mssp';
import { SERVER_PLUS } from './seed/serverPlus';
import { CCNA } from './seed/ccna';
import { SECAI_PLUS } from './seed/secaiPlus';
import { CISSP } from './seed/cissp';
import { A_PLUS } from './seed/aPlus';
import { AI_FOUNDATIONS } from './seed/aiFoundations';
import { NETWORK_PLUS } from './seed/networkPlus';
import { AZURE_COURSES } from './seed/azureCloud';
import { AWS_COURSES } from './seed/awsCloud';

// Built-in courses shipped in code. They are never written to localStorage so
// they stay upgradeable; an authored course with the same id overrides a seed.
const SEED_MODULES: Course[] = [SECURITY_PLUS, MSSP, CYSA_PLUS, SERVER_PLUS, CCNA, A_PLUS, NETWORK_PLUS, SECAI_PLUS, CISSP, ...AZURE_COURSES, ...AWS_COURSES, AI_FOUNDATIONS];

/**
 * Where the built-in courses come from: the JSON documents, with the TypeScript
 * modules as the LOUD fallback — see `content/docs.ts`, which owns the files.
 * Resolved on first use, never at module load: eager resolution ran while the
 * seed modules were still initialising and threw a temporal-dead-zone error.
 */
function loadSeeds(): Course[] {
  return seedCourses(SEED_MODULES);
}

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
let listCache: { version: number; fixes: number; value: Course[] } | null = null;
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
export function validateCourse(c: unknown): { ok: true } | { ok: false; error: string } {
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

/**
 * The document for a locally authored course: derived, since localStorage holds
 * courses, not documents. Memoised on the course's save stamp so the provider
 * gets the same object back until the course changes.
 */
const localDocuments = new Map<string, { stamp: number; doc: CourseDto }>();

/** The admin studio's content edits (R85), offline: kept beside the course
 *  and merged over its base document. Only the keys the admin replaced. */
function readContentOverrides(courseId: string): CourseContentOverrides {
  if (!hasWindow()) return {};
  try {
    const raw = localStorage.getItem(KEYS.courseContent(courseId));
    return raw ? (JSON.parse(raw) as CourseContentOverrides) : {};
  } catch {
    return {};
  }
}

function applyOverrides(doc: CourseDto, o: CourseContentOverrides): CourseDto {
  return {
    ...doc,
    ...(o.deliverables ? { deliverables: o.deliverables as CourseDto['deliverables'] } : {}),
    ...(o.glossary ? { glossary: o.glossary } : {}),
    ...(o.content ? { content: { ...doc.content, ...o.content } as CourseDto['content'] } : {}),
  };
}

export function localDocumentSource(courseId: string): CourseDto | undefined {
  // The authored course as saved, not as the catalogue lists it: `courseDocument()` lays the content fixes over this document, once.
  const course = readAuthored().find((c) => c.id === courseId && c.isSeed === false);
  if (!course) return undefined;
  const stamp = course.updatedAt ?? 0;
  const hit = localDocuments.get(courseId);
  if (hit && hit.stamp === stamp) return hit.doc;
  const doc = applyOverrides(bareDocument(course), readContentOverrides(courseId));
  localDocuments.set(courseId, { stamp, doc });
  return doc;
}

export const localStorageCourseRepo: CourseRepository = {
  list(): Course[] {
    // On the server, return seeds only so pages can prerender.
    if (!hasWindow()) return loadSeeds();
    const fixes = localStorageContentFixesRepo.version();
    if (listCache && listCache.version === version && listCache.fixes === fixes) return listCache.value;
    const authored = readAuthored();
    const authoredIds = new Set(authored.map((c) => c.id));
    // Authored overrides a seed with the same id; otherwise seeds + authored. Each with its content fixes laid over it (R121).
    const seedsKept = loadSeeds().filter((s) => !authoredIds.has(s.id));
    const value = [...seedsKept, ...authored].map(effectiveCourse);
    listCache = { version, fixes, value };
    return value;
  },

  get(idOrSlug: string): Course | undefined {
    return this.list().find((c) => c.id === idOrSlug || c.slug === idOrSlug);
  },

  save(course: Course): void {
    const authored = readAuthored();
    const idx = authored.findIndex((c) => c.id === course.id);
    // R122: every save is a new version, counted as the database counts it in the cloud: one past what the
    // course was (a built-in's first edit is one past the version it shipped at).
    const prior = (idx >= 0 ? authored[idx].version : undefined) ?? course.version ?? 0;
    const next = { ...storedCourse(course), isSeed: false, updatedAt: Date.now(), version: prior + 1 };
    if (idx >= 0) authored[idx] = next;
    else authored.push(next);
    writeAuthored(authored);
    recordVersion(next);
  },

  saveWithContent(course: Course, content: CourseContentOverrides): void {
    if (hasWindow() && (content.deliverables || content.glossary || content.content)) {
      const merged = { ...readContentOverrides(course.id), ...content };
      safeSetItem(KEYS.courseContent(course.id), JSON.stringify(merged));
    }
    // save() bumps updatedAt, which is what invalidates the memoised document.
    this.save(course);
  },

  delete(id: string): void {
    const authored = readAuthored().filter((c) => c.id !== id);
    writeAuthored(authored);
  },

  exportJSON(id: string): string {
    const course = this.get(id);
    return course ? JSON.stringify({ ...storedCourse(course), isSeed: false }, null, 2) : '';
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
    const toSave: Course = { ...storedCourse(course), id, slug: id, isSeed: false };
    this.save(toSave);
    return { ok: true, course: toSave };
  },

  duplicate(id: string, newId: string, newTitle: string): Course | undefined {
    const src = this.get(id);
    if (!src) return undefined;
    const clone: Course = JSON.parse(JSON.stringify(storedCourse(src)));
    clone.id = newId;
    clone.slug = newId;
    clone.title = newTitle;
    clone.isSeed = false;
    // A copy is a new course: its first save is its version 1 (R122).
    delete clone.version;
    // A copy keeps its parent's document: the manual, the diagrams, the forms.
    clone.basedOn = src.basedOn ?? (src.isSeed === false ? undefined : src.id);
    this.save(clone);
    return clone;
  },
};

// ── The history of the studio's saves, offline (R122) ──────────────────────────────────────
//
// In the cloud the database numbers and keeps every save. Offline this device keeps the last few
// (each is a whole course, and a browser's storage is small): enough to undo a mistaken save.
// Defined here, beside the repo whose saves it records, so neither imports the other.

const KEEP_VERSIONS = 8;

interface StoredVersion {
  version: number;
  savedAt: number;
  by: string;
  title: string;
  course: Course;
  overrides: CourseContentOverrides;
}

function readVersions(courseId: string): StoredVersion[] {
  if (!hasWindow()) return [];
  try {
    const raw = localStorage.getItem(KEYS.courseVersions(courseId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return (Array.isArray(parsed) ? parsed : []).filter(
      (v): v is StoredVersion => !!v && typeof v === 'object' && Number.isInteger((v as StoredVersion).version) && !!(v as StoredVersion).course
    );
  } catch {
    return [];
  }
}

/** Keep this save: best effort and quiet, because a full browser must not turn a save that worked into an alarm about its history. */
function recordVersion(course: Course): void {
  if (!hasWindow()) return;
  const all = [
    ...readVersions(course.id),
    { version: course.version ?? 1, savedAt: Date.now(), by: 'Instructor', title: course.title, course, overrides: readContentOverrides(course.id) },
  ];
  for (let keep = KEEP_VERSIONS; keep >= 1; keep--) {
    try {
      localStorage.setItem(KEYS.courseVersions(course.id), JSON.stringify(all.slice(-keep)));
      return;
    } catch {
      /* try keeping fewer */
    }
  }
}

export const localStorageCourseHistoryRepo: CourseHistoryRepository = {
  async list(courseId) {
    const versions = readVersions(courseId)
      .map((v) => ({ version: v.version, savedAt: v.savedAt, by: v.by, title: v.title, bytes: JSON.stringify({ course: v.course, overrides: v.overrides }).length }))
      .sort((a, b) => b.version - a.version);
    return { ok: true, needsUpdate: false, versions };
  },

  async get(courseId, version) {
    const v = readVersions(courseId).find((x) => x.version === version);
    return v ? applyOverrides(bareDocument(v.course), v.overrides) : null;
  },

  // An ordinary save of the old course: a NEW version, with the old content overrides put back as they were.
  async restore(courseId, version) {
    const v = readVersions(courseId).find((x) => x.version === version);
    if (!v) return null;
    const has = !!(v.overrides.deliverables || v.overrides.glossary || v.overrides.content);
    if (has) safeSetItem(KEYS.courseContent(courseId), JSON.stringify(v.overrides));
    else if (hasWindow()) localStorage.removeItem(KEYS.courseContent(courseId));
    localStorageCourseRepo.save(v.course);
    notifyStore();
    return localStorageCourseRepo.get(courseId)?.version ?? null;
  },
};

import { Course } from '../types';
import { CourseRepository, ImportResult } from './types';
import { KEYS } from './keys';
import { safeSetItem } from './safeStorage';
import { SECURITY_PLUS } from './seed/securityPlus';
import { CYSA_PLUS } from './seed/cysa';
import { MSSP } from './seed/mssp';
import { SERVER_PLUS } from './seed/serverPlus';

// Built-in courses shipped in code. They are never written to localStorage so
// they stay upgradeable; an authored course with the same id overrides a seed.
const SEEDS: Course[] = [SECURITY_PLUS, MSSP, CYSA_PLUS, SERVER_PLUS];

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

function writeAuthored(courses: Course[]): void {
  if (!hasWindow()) return;
  safeSetItem(KEYS.courses, JSON.stringify(courses));
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
    if (!hasWindow()) return SEEDS;
    const authored = readAuthored();
    const authoredIds = new Set(authored.map((c) => c.id));
    // Authored overrides a seed with the same id; otherwise seeds + authored.
    const seedsKept = SEEDS.filter((s) => !authoredIds.has(s.id));
    return [...seedsKept, ...authored];
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

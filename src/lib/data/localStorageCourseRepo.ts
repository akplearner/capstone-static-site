import { Course } from '../types';
import { CourseRepository, ImportResult } from './types';
import { KEYS } from './keys';
import { SECURITY_PLUS } from './seed/securityPlus';
import { CYSA_PLUS } from './seed/cysa';

// Built-in courses shipped in code. They are never written to localStorage so
// they stay upgradeable; an authored course with the same id overrides a seed.
const SEEDS: Course[] = [SECURITY_PLUS, CYSA_PLUS];

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
  localStorage.setItem(KEYS.courses, JSON.stringify(courses));
}

function isValidCourse(c: unknown): c is Course {
  if (!c || typeof c !== 'object') return false;
  const o = c as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.title === 'string' &&
    Array.isArray(o.roles) &&
    Array.isArray(o.weeks) &&
    Array.isArray(o.tasks)
  );
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
    if (!isValidCourse(parsed)) {
      return { ok: false, error: 'JSON is not a valid course (needs id, title, roles, weeks, tasks).' };
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

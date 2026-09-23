'use client';

import type { Course } from '../types';
import type { CourseRepository, ImportResult } from './types';
import type { CourseDto } from '../content/dto';
import { bareDocument, courseDocument, seedCourses } from '../content/docs';
import { courseFromDto } from '../content/load';
import { getBrowserClient } from '../supabase/client';
import { notifyStore } from '../useClientStore';
import { toast } from '@/lib/toastBus';
import { cache, getCurrentUserId, hydrateCourseDocuments } from './supabaseCache';
import { validateCourse } from './localStorageCourseRepo';
import { SECURITY_PLUS } from './seed/securityPlus';
import { CYSA_PLUS } from './seed/cysa';
import { MSSP } from './seed/mssp';
import { SERVER_PLUS } from './seed/serverPlus';
import { CCNA } from './seed/ccna';

/**
 * The course catalogue, cloud-backed (R78-D5).
 *
 * The built-in courses come from their documents exactly as in the local repo;
 * what this adds is the `course_documents` table: an instructor's authored
 * courses live there as whole documents, so a course published in the studio
 * exists for every student on every device rather than in one browser. The
 * house pattern of every other cloud repo: synchronous read off the cache,
 * optimistic write into it, fire-and-forget upsert with a toast on failure.
 *
 * `save(course)` writes the WHOLE document, not the course alone: the base is
 * the document the course already has (its own, its parent's for a duplicate,
 * or the shared sections), with `course` replaced. So editing a seed keeps the
 * seed's forms and manual beside the edited tasks, and a duplicate carries its
 * parent's content into the cloud with it.
 */
const SEED_MODULES: Course[] = [SECURITY_PLUS, MSSP, CYSA_PLUS, SERVER_PLUS, CCNA];

function report(what: string, message: string) {
  return ({ error }: { error: { message: string } | null }) => {
    if (error) {
      console.error(`${what} save failed`, error.message);
      toast({ message, variant: 'warning', duration: 6000 });
    }
  };
}

/** The courses inside the cached documents; a document that fails to load is a
 *  content bug someone has to see, so it is logged and skipped, never fatal. */
function authoredCourses(): Course[] {
  const out: Course[] = [];
  for (const doc of cache.courseDocuments()) {
    try {
      out.push({ ...courseFromDto(doc), isSeed: false });
    } catch (e) {
      console.error(`[content] course_documents '${doc.course?.id}' did not load:`, e);
    }
  }
  return out;
}

let listCache: { version: number; value: Course[] } | null = null;
let kicked = false;

/** The document an authored course renders from — what `data/index.ts`
 *  registers with `content/docs.ts` when this repo is live. */
export function supabaseDocumentSource(courseId: string): CourseDto | undefined {
  return cache.courseDocument(courseId);
}

/** The document `save(course)` writes: the course's current document (or a
 *  derived one) with the course replaced. Exported for the test. */
export function documentFor(course: Course): CourseDto {
  const base = courseDocument(course.id) ?? bareDocument(course);
  return { ...base, generatedFrom: [], course: course as CourseDto['course'] };
}

export const supabaseCourseRepo: CourseRepository = {
  list(): Course[] {
    if (typeof window !== 'undefined' && !kicked) {
      kicked = true;
      void hydrateCourseDocuments();
    }
    const version = cache.courseDocumentsVersion();
    if (listCache && listCache.version === version) return listCache.value;
    const authored = authoredCourses();
    const authoredIds = new Set(authored.map((c) => c.id));
    const value = [...seedCourses(SEED_MODULES).filter((s) => !authoredIds.has(s.id)), ...authored];
    listCache = { version, value };
    return value;
  },

  get(idOrSlug: string): Course | undefined {
    return this.list().find((c) => c.id === idOrSlug || c.slug === idOrSlug);
  },

  save(course: Course): void {
    const next: Course = { ...course, isSeed: false, updatedAt: Date.now() };
    const doc = documentFor(next);
    cache.setCourseDocument(doc);
    notifyStore();
    const supabase = getBrowserClient();
    if (!supabase) return;
    const updated_by = getCurrentUserId();
    if (!updated_by) {
      toast({ message: 'Sign in as an instructor to publish this course — it is kept on this page until you reload.', variant: 'warning', duration: 6000 });
      return;
    }
    void supabase
      .from('course_documents')
      .upsert(
        {
          course_id: next.id,
          schema: doc.schema,
          doc,
          version: next.version ?? 1,
          updated_by,
          updated_at: new Date(next.updatedAt ?? Date.now()).toISOString(),
        },
        { onConflict: 'course_id' }
      )
      .then(report('course', 'Couldn’t publish the course to the cloud — it is kept on this page until you reload.'));
  },

  delete(id: string): void {
    cache.deleteCourseDocument(id);
    notifyStore();
    const supabase = getBrowserClient();
    if (!supabase) return;
    void supabase
      .from('course_documents')
      .delete()
      .eq('course_id', id)
      .then(report('course', 'Couldn’t delete the course from the cloud — it will be back after a reload.'));
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
    if (!valid.ok) return { ok: false, error: valid.error };
    const course = parsed as Course;
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
    clone.basedOn = src.basedOn ?? (src.isSeed === false ? undefined : src.id);
    this.save(clone);
    return clone;
  },
};

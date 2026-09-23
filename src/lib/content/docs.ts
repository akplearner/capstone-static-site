/**
 * The course documents, as the app reads them.
 *
 * `dto.ts` WRITES `content/courses/<id>.json`; this is the one place that
 * reads them back. Until R78-D only the `course` half of each document was
 * read (`courseFromDto`), and the deliverables, the reference content, the
 * addressing and the role guide were imported by ~30 components straight from
 * the TypeScript modules — so "the document is the source" was true of the
 * tasks and false of everything else. `courseDocument()` hands the whole
 * document to `read.ts`, whose typed accessors are what components consume.
 *
 * Only JSON is imported here, deliberately: a JSON module has no imports of its
 * own, so nothing that reads a document can close the cycle the writer sits in
 * (`dto.ts` imports every seed, which import the topology, which …).
 */
import type { Course } from '@/lib/types';
import type { CourseDto } from './dto';
import { DTO_SCHEMA } from './schema';
import { courseFromDto } from './load';
import securityPlusDoc from '../../../content/courses/security-plus.json';
import msspDoc from '../../../content/courses/mssp.json';
import cysaDoc from '../../../content/courses/cysa-plus.json';
import serverPlusDoc from '../../../content/courses/server-plus.json';
import ccnaDoc from '../../../content/courses/ccna.json';

/** The exported documents, keyed by course id, in catalogue order. */
export const SEED_DOCUMENTS: Record<string, CourseDto> = {
  'security-plus': securityPlusDoc as unknown as CourseDto,
  mssp: msspDoc as unknown as CourseDto,
  'cysa-plus': cysaDoc as unknown as CourseDto,
  'server-plus': serverPlusDoc as unknown as CourseDto,
  ccna: ccnaDoc as unknown as CourseDto,
};

export const SEED_IDS = Object.keys(SEED_DOCUMENTS);

/** The document for a built-in course, or nothing for an authored one. */
export function courseDocument(courseId: string): CourseDto | undefined {
  return SEED_DOCUMENTS[courseId];
}

/**
 * A document for a course that has none of its own — an instructor-authored
 * course, or a seed whose file failed to load.
 *
 * A course duplicated from a built-in one (`course.basedOn`) renders its
 * parent's document with itself as the course: the same manual, diagrams,
 * configuration guide and forms, which is what duplicating a course is for.
 * Any other course gets the content every course shares — the manual's
 * sections, the custody template, the terminal troubleshooting, the glossary
 * and the marking weights — and nothing family-specific, so every accessor in
 * `read.ts` answers "empty" rather than throwing.
 */
export function bareDocument(course: Course): CourseDto {
  const parent = course.basedOn ? SEED_DOCUMENTS[course.basedOn] : undefined;
  const base = parent ?? sharedContent();
  return {
    ...base,
    generatedFrom: [],
    course: course as CourseDto['course'],
    deliverables: parent ? parent.deliverables : [],
  };
}

/** The sections identical in every built-in document, taken from the first. */
function sharedContent(): Pick<CourseDto, 'schema' | 'content' | 'glossary' | 'marking'> {
  const first = SEED_DOCUMENTS[SEED_IDS[0]];
  const content = first?.content ?? {};
  return {
    schema: DTO_SCHEMA,
    content: { manual: content.manual, custody: content.custody, troubleshooting: content.troubleshooting },
    glossary: first?.glossary,
    marking: first?.marking,
  };
}

/**
 * The built-in courses, loaded from their documents. Cached; a document that
 * fails to validate is a content bug someone has to fix, so the fallback is
 * LOUD (console.error) rather than silent — the app keeps working on the
 * compiled modules the caller supplies.
 */
let seedCache: Course[] | null = null;
export function seedCourses(fallback: Course[]): Course[] {
  if (seedCache) return seedCache;
  try {
    return (seedCache = fallback.map((m) => {
      const doc = SEED_DOCUMENTS[m.id];
      if (!doc) {
        console.error(`[content] no document for '${m.id}': using the compiled module`);
        return m;
      }
      return courseFromDto(doc);
    }));
  } catch (e) {
    console.error('[content] falling back to the compiled seeds:', e);
    return (seedCache = fallback);
  }
}

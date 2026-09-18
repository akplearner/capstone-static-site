/**
 * Reading a course back out of its own JSON.
 *
 * `dto.ts` writes `content/courses/<id>.json`. Until this file existed nothing
 * read it, which meant "the content is separate from the UI" was a claim with
 * no test behind it: the app rendered from the TypeScript seeds and the JSON was
 * a document nobody could prove was complete.
 *
 * `courseFromDto` closes that loop. It validates a parsed document and returns a
 * `Course` the rest of the platform can render, and `dto.test.ts` asserts that
 * the helpers the UI actually uses — week numbers, task lookup, required step
 * counts, week summaries — give identical answers over the loaded course and
 * over the seed. That is the real claim: not that the bytes match, but that the
 * application behaves the same when the content comes from a file.
 *
 * WHAT IS STILL MISSING, deliberately and visibly: Definition-of-Done checks are
 * TypeScript functions, so the writer replaces each with a `{"$fn": …}` marker
 * and this reader cannot bring it back. `dto.test.ts` pins the exact list of
 * paths where that happens, so the gap is written down rather than assumed, and
 * it shrinks to nothing when declarative predicates land.
 */
import type { Course } from '@/lib/types';
import { DTO_SCHEMA } from './schema';
import type { CourseDto } from './dto';

export class ContentError extends Error {
  constructor(message: string, readonly path: string) {
    super(`${path}: ${message}`);
    this.name = 'ContentError';
  }
}

function want(cond: unknown, path: string, message: string): asserts cond {
  if (!cond) throw new ContentError(message, path);
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function str(v: unknown, path: string): string {
  want(typeof v === 'string', path, `expected a string, got ${typeof v}`);
  return v;
}

function arr(v: unknown, path: string): unknown[] {
  want(Array.isArray(v), path, `expected an array, got ${typeof v}`);
  return v;
}

/**
 * Validate the shape the UI depends on.
 *
 * Deliberately not a full schema of every optional field: those are additive and
 * a loader that rejected an unknown one would break on every content addition.
 * What it checks is the structure the render path walks — a course has weeks,
 * tasks, roles and gates; a task has an id, a week and steps; a step has an id
 * and a title — so a truncated or hand-mangled file fails here with the path,
 * rather than as `undefined is not iterable` three components deep.
 */
export function validateCourse(value: unknown, at = 'course'): Course {
  want(isObj(value), at, 'expected an object');
  str(value.id, `${at}.id`);
  str(value.title, `${at}.title`);
  str(value.slug, `${at}.slug`);

  arr(value.roles, `${at}.roles`).forEach((r, i) => {
    want(isObj(r), `${at}.roles[${i}]`, 'expected an object');
    str(r.id, `${at}.roles[${i}].id`);
    str(r.name, `${at}.roles[${i}].name`);
  });

  arr(value.weeks, `${at}.weeks`).forEach((w, i) => {
    want(isObj(w), `${at}.weeks[${i}]`, 'expected an object');
    want(typeof w.number === 'number', `${at}.weeks[${i}].number`, 'expected a number');
    str(w.title, `${at}.weeks[${i}].title`);
  });

  arr(value.gates, `${at}.gates`);

  arr(value.tasks, `${at}.tasks`).forEach((t, i) => {
    const tp = `${at}.tasks[${i}]`;
    want(isObj(t), tp, 'expected an object');
    str(t.id, `${tp}.id`);
    want(typeof t.week === 'number', `${tp}.week`, 'expected a number');
    arr(t.steps, `${tp}.steps`).forEach((s, j) => {
      const sp = `${tp}.steps[${j}]`;
      want(isObj(s), sp, 'expected an object');
      str(s.id, `${sp}.id`);
      str(s.title, `${sp}.title`);
      if (s.commands !== undefined) {
        arr(s.commands, `${sp}.commands`).forEach((c, k) => {
          want(isObj(c), `${sp}.commands[${k}]`, 'expected an object');
          str(c.cmd, `${sp}.commands[${k}].cmd`);
        });
      }
    });
  });

  return value as unknown as Course;
}

/** The course held in a parsed course document. Throws `ContentError` if the
 *  document is not one, or is from a schema this build does not read. */
export function courseFromDto(doc: unknown): Course {
  want(isObj(doc), 'document', 'expected an object');
  want(
    doc.schema === DTO_SCHEMA,
    'document.schema',
    `expected ${DTO_SCHEMA}, got ${JSON.stringify(doc.schema)}`
  );
  return validateCourse(doc.course);
}

/** Parse and load in one step, for a file or a fetch response body. */
export function courseFromJson(text: string): Course {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new ContentError(`not JSON: ${(e as Error).message}`, 'document');
  }
  return courseFromDto(parsed);
}

/** Every JSON path in a document that still holds a function marker. The
 *  round-trip test pins this list, so the remaining gap is explicit. */
export function fnMarkerPaths(doc: CourseDto | unknown, at = ''): string[] {
  const out: string[] = [];
  const walk = (v: unknown, path: string) => {
    if (Array.isArray(v)) {
      v.forEach((x, i) => walk(x, `${path}[${i}]`));
    } else if (isObj(v)) {
      if (typeof v.$fn === 'string') {
        out.push(path);
        return;
      }
      for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
    }
  };
  walk(doc, at);
  return out;
}

/**
 * The course DTOs — every course as one JSON document.
 *
 * The TypeScript seeds stay the source of truth: they carry types, the topology
 * constants and the Definition-of-Done check functions, none of which JSON can
 * hold. What JSON can hold is everything a person needs to read, diff, share or
 * hand-edit against a course — every week, task, step and command; every form
 * with its fields, groups, help text and worked example; the guide procedures;
 * the addressing. `courseDto()` produces exactly that, and
 * `scripts/export-courses.ts` writes it to `content/courses/<id>.json`.
 *
 * `dto.test.ts` deep-compares the committed files with a fresh `courseDto()`,
 * so a seed change without a regenerated snapshot fails the suite (and CI
 * diffs the folder after regenerating). The snapshot can never drift from the
 * seed; it can only be behind it, and the test says so.
 *
 * Functions are the one thing dropped on the way out. A DoD check keeps its
 * label and week; a derived column keeps its label and help. Both are replaced
 * by a `{ "$fn": "<name>" }` marker rather than silently vanishing, so a reader
 * can see that something computed lives there and where to find it.
 */

import type { Course } from '@/lib/types';
import { SECURITY_PLUS } from '@/lib/data/seed/securityPlus';
import { CYSA_PLUS } from '@/lib/data/seed/cysa';
import { MSSP } from '@/lib/data/seed/mssp';
import { SERVER_PLUS } from '@/lib/data/seed/serverPlus';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { PROCEDURES, WEEKS } from '@/lib/docs/serverProcedures';
import * as serverTopology from '@/lib/serverTopology';
import * as labTopology from '@/lib/labTopology';
import { SOC_TOPOLOGY_BY_COURSE } from '@/lib/labTopology';
import { GLOSSARY } from '@/lib/glossary';
import { labProfile, hasLabAccess } from '@/lib/labAccess';
import { IAC_TOOLS, IAC_TOOL_KEY } from '@/lib/iacTool';
import { TEAM_WEIGHT, FOCUS_WEIGHT } from '@/lib/rubric';

export const DTO_SCHEMA = 'capstone-course-dto/1';

/** The seed courses, in the order the catalogue lists them. */
export const SEED_COURSES: Course[] = [SECURITY_PLUS, MSSP, CYSA_PLUS, SERVER_PLUS];

/** A function replaced on the way to JSON: the name says what was there. */
export type FnMarker = { $fn: string };

/** JSON-safe: the same shape as the source with every function marked. */
export type Serialisable<T> = T extends (...args: never[]) => unknown
  ? FnMarker
  : T extends Array<infer U>
    ? Serialisable<U>[]
    : T extends object
      ? { [K in keyof T]: Serialisable<T[K]> }
      : T;

export interface CourseDto {
  schema: typeof DTO_SCHEMA;
  /** The files this document was produced from — where to edit. */
  generatedFrom: string[];
  course: Serialisable<Course>;
  deliverables: Serialisable<ReturnType<typeof deliverablesForCourse>>;
  /** Server+ only: the configuration guide the steps point at. */
  procedureWeeks?: Serialisable<typeof WEEKS>;
  procedures?: Serialisable<typeof PROCEDURES>;
  /** The addressing single source of truth, per course family. */
  topology?: Record<string, unknown>;
  /**
   * The rest of the authored content a course renders, which used to reach the
   * screen without ever reaching `content/`: the glossary terms the prose links,
   * the lab-access fields a student fills in (and the tokens those fill into
   * commands), the infrastructure-as-code tool choice, and the marking weights.
   * All four are content an instructor may want to read, diff or hand-edit.
   */
  glossary?: Record<string, string>;
  labAccess?: Record<string, unknown>;
  iacTools?: Record<string, unknown>;
  marking?: { teamWeight: number; focusWeight: number };
}

/**
 * Deep-copy with every function replaced by a marker. Arrays and plain objects
 * only — the seeds contain nothing else. Key order is preserved, which is what
 * keeps the JSON diffable: a reordered key in the seed shows as a move.
 */
export function serialisable<T>(value: T): Serialisable<T> {
  if (typeof value === 'function') {
    return { $fn: (value as { name?: string }).name || 'anonymous' } as Serialisable<T>;
  }
  if (Array.isArray(value)) {
    return value.map((v) => serialisable(v)) as Serialisable<T>;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = serialisable(v);
    }
    return out as Serialisable<T>;
  }
  return value as Serialisable<T>;
}

const SEED_FILE: Record<string, string> = {
  'security-plus': 'src/lib/data/seed/securityPlus.ts',
  mssp: 'src/lib/data/seed/mssp.ts',
  'cysa-plus': 'src/lib/data/seed/cysa.ts',
  'server-plus': 'src/lib/data/seed/serverPlus.ts',
};

const FORM_FILE: Record<string, string> = {
  'security-plus': 'src/lib/docs/definitions.ts',
  mssp: 'src/lib/docs/msspDeliverables.ts',
  'cysa-plus': 'src/lib/docs/cysaDeliverables.ts',
  'server-plus': 'src/lib/docs/serverPlusDeliverables.ts',
};

/**
 * Everything `serverTopology.ts` holds as DATA, whatever that turns out to be.
 *
 * This used to be a hand-written list of nine names, which meant the export was
 * only as current as the last person to remember to extend it — and nobody did.
 * By the time anyone looked, `PUBLISHED_PORTS`, `CROSS_ZONE_ALLOW`,
 * `REMOTE_ADMIN`, `SITE`, `MACHINES`, `HOST_RULES_FILE`, `ZONE_BRIDGES`,
 * `MONITORING_HOST` and `ADVANCED_HOSTS` had all been added to the model and
 * none of them reached `content/`. The addressing single source of truth was
 * silently only two thirds exported.
 *
 * So the list is computed instead: take the module, drop the functions (they
 * are behaviour, and `serialisable` would only leave a marker), and export what
 * is left. A constant added to the topology is in the snapshot the moment it
 * exists, and `dto.test.ts` fails until the file is regenerated.
 */
export function topologyData(mod: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(mod).sort()) {
    const v = mod[key];
    if (typeof v === 'function' || v === undefined) continue;
    out[key] = v;
  }
  return out;
}

export function courseDto(courseId: string): CourseDto {
  const course = SEED_COURSES.find((c) => c.id === courseId);
  if (!course) throw new Error(`no seed course '${courseId}'`);

  const generatedFrom = [SEED_FILE[courseId], FORM_FILE[courseId]].filter(Boolean);
  const dto: CourseDto = {
    schema: DTO_SCHEMA,
    generatedFrom,
    course: serialisable(course),
    deliverables: serialisable(deliverablesForCourse(courseId)),
  };

  if (courseId === 'server-plus') {
    generatedFrom.push('src/lib/docs/serverProcedures.ts', 'src/lib/serverTopology.ts');
    dto.procedureWeeks = serialisable(WEEKS);
    dto.procedures = serialisable(PROCEDURES);
    dto.topology = serialisable(topologyData(serverTopology));
  } else if (SOC_TOPOLOGY_BY_COURSE[courseId]) {
    generatedFrom.push('src/lib/labTopology.ts');
    // Same rule as the Server+ side: everything the module holds as data, minus
    // the per-course SOC table, which is narrowed to this course's own entry.
    const rest = topologyData(labTopology);
    delete rest.SOC_TOPOLOGY_BY_COURSE;
    dto.topology = serialisable({ ...rest, SOC: SOC_TOPOLOGY_BY_COURSE[courseId] });
  }

  // Content every course renders that has no other home in this document.
  generatedFrom.push('src/lib/glossary.ts', 'src/lib/rubric.ts');
  dto.glossary = serialisable(GLOSSARY);
  dto.marking = { teamWeight: TEAM_WEIGHT, focusWeight: FOCUS_WEIGHT };
  if (hasLabAccess(courseId)) {
    generatedFrom.push('src/lib/labAccess.ts');
    dto.labAccess = serialisable(labProfile(courseId) as unknown as Record<string, unknown>);
  }
  // The tool switch is offered by whichever course's lab profile carries the
  // field, so the profile decides rather than a second flag on the course.
  if (labProfile(courseId).fields.some((f) => f.key === IAC_TOOL_KEY)) {
    generatedFrom.push('src/lib/iacTool.ts');
    dto.iacTools = serialisable({ key: IAC_TOOL_KEY, tools: IAC_TOOLS });
  }
  return dto;
}

/** The catalogue file beside the four documents. Counts only — nothing that
 *  changes with the clock, so regenerating on a quiet tree is a no-op diff. */
export interface CourseIndexEntry {
  id: string;
  title: string;
  version?: number;
  file: string;
  weeks: number;
  tasks: number;
  steps: number;
  deliverables: number;
  procedures: number;
}

export function courseIndex(): { schema: typeof DTO_SCHEMA; courses: CourseIndexEntry[] } {
  return {
    schema: DTO_SCHEMA,
    courses: SEED_COURSES.map((c) => {
      const dto = courseDto(c.id);
      return {
        id: c.id,
        title: c.title,
        version: c.version,
        file: `${c.id}.json`,
        weeks: c.weeks.length,
        tasks: c.tasks.length,
        steps: c.tasks.reduce((n, t) => n + t.steps.length, 0),
        deliverables: dto.deliverables.length,
        procedures: dto.procedures?.length ?? 0,
      };
    }),
  };
}

/** The exact bytes the exporter writes, so the test can compare text too. */
export function toJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n';
}

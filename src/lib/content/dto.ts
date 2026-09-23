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
 * Functions used to be the one thing dropped on the way out — 128 of them, each
 * leaving a `{ "$fn": "<name>" }` marker where a Definition-of-Done check or a
 * computed column should be. They are data now (`docs/predicate.ts`), and
 * `dto.test.ts` asserts no marker is left anywhere. The marker machinery stays
 * because a future seed could still hold a function, and a document that says so
 * is better than one that silently drops it.
 */

import type { Course } from '@/lib/types';
import { SECURITY_PLUS } from '@/lib/data/seed/securityPlus';
import { CYSA_PLUS } from '@/lib/data/seed/cysa';
import { MSSP } from '@/lib/data/seed/mssp';
import { SERVER_PLUS } from '@/lib/data/seed/serverPlus';
import { CCNA } from '@/lib/data/seed/ccna';
import { seedDeliverablesForCourse } from '@/lib/docs/definitions';
import { PROCEDURES, WEEKS } from '@/lib/docs/serverProcedures';
import * as serverTopology from '@/lib/serverTopology';
import * as labTopology from '@/lib/labTopology';
import { SOC_TOPOLOGY_BY_COURSE } from '@/lib/labTopology';
import { GLOSSARY } from '@/lib/glossary';
import { labProfile, hasLabAccess } from '@/lib/labAccess';
import { IAC_TOOLS, IAC_TOOL_KEY } from '@/lib/iacTool';
import { TEAM_WEIGHT, FOCUS_WEIGHT } from '@/lib/rubric';
import * as manual from '@/lib/docs/manual';
import * as serverDiagrams from '@/lib/docs/serverDiagrams';
import * as cysaContent from '@/lib/docs/cysaContent';
import * as securityContent from '@/lib/docs/securityContent';
import * as troubleshooting from '@/lib/docs/troubleshooting';
import * as ccnaTopology from '@/lib/ccnaTopology';
import * as ccnaKit from '@/lib/docs/ccnaKit';
import * as ccnaDiagrams from '@/lib/docs/ccnaDiagrams';
import * as custodyTemplate from '@/lib/docs/custodyTemplate';
import { roleGuidesFor } from '@/lib/roleGuide';
import type { RoleGuide } from '@/lib/roleGuide';

export { DTO_SCHEMA } from './schema';
import { DTO_SCHEMA } from './schema';

/** The seed courses, in the order the catalogue lists them. */
export const SEED_COURSES: Course[] = [SECURITY_PLUS, MSSP, CYSA_PLUS, SERVER_PLUS, CCNA];

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
  deliverables: Serialisable<ReturnType<typeof seedDeliverablesForCourse>>;
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
  /**
   * The diagrams, manuals and guides the course renders — its reference content.
   *
   * Until R75-B this lived inside sixteen React components, so a document
   * described a course's forms, tasks and addressing in full and could not say
   * what the course TEACHES about reading an alert, ranking a finding or wiring
   * a rack. Each entry is one content module's data, keyed by the module: the
   * manual's own sections plus whichever of the per-course modules applies.
   *
   * Assembled by `contentData` below, which walks the module's exports rather
   * than naming them, so a table added to a content module reaches the document
   * without anyone remembering to add it here.
   */
  content?: Record<string, unknown>;
  labAccess?: Record<string, unknown>;
  iacTools?: Record<string, unknown>;
  marking?: { teamWeight: number; focusWeight: number };
  /** The role guides written for this course, keyed by role id (R78-D). */
  roleGuide?: Record<string, Serialisable<RoleGuide>>;
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
  ccna: 'src/lib/data/seed/ccna.ts',
};

const FORM_FILE: Record<string, string> = {
  'security-plus': 'src/lib/docs/definitions.ts',
  mssp: 'src/lib/docs/msspDeliverables.ts',
  'cysa-plus': 'src/lib/docs/cysaDeliverables.ts',
  'server-plus': 'src/lib/docs/serverPlusDeliverables.ts',
  ccna: 'src/lib/docs/ccnaDeliverables.ts',
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

/**
 * Everything a content module holds as data, by export name.
 *
 * The same rule as `topologyData`: walk the module, keep the data, drop the
 * helpers. A module that grows a table reaches the document by existing, which
 * is the whole reason the content was moved out of the components — a table
 * nobody remembered to register is a table the document does not have.
 */
export function contentData(mod: Record<string, unknown>): Record<string, unknown> {
  return topologyData(mod);
}

export function courseDto(courseId: string): CourseDto {
  const course = SEED_COURSES.find((c) => c.id === courseId);
  if (!course) throw new Error(`no seed course '${courseId}'`);

  const generatedFrom = [SEED_FILE[courseId], FORM_FILE[courseId]].filter(Boolean);
  const dto: CourseDto = {
    schema: DTO_SCHEMA,
    generatedFrom,
    course: serialisable(course),
    deliverables: serialisable(seedDeliverablesForCourse(courseId)),
  };

  if (courseId === 'server-plus') {
    generatedFrom.push('src/lib/docs/serverProcedures.ts', 'src/lib/serverTopology.ts');
    dto.procedureWeeks = serialisable(WEEKS);
    dto.procedures = serialisable(PROCEDURES);
    dto.topology = serialisable(topologyData(serverTopology));
  } else if (courseId === 'ccna') {
    generatedFrom.push('src/lib/ccnaTopology.ts');
    dto.topology = serialisable(topologyData(ccnaTopology));
  } else if (SOC_TOPOLOGY_BY_COURSE[courseId]) {
    generatedFrom.push('src/lib/labTopology.ts');
    // Same rule as the Server+ side: everything the module holds as data, minus
    // the per-course SOC table, which is narrowed to this course's own entry.
    const rest = topologyData(labTopology);
    delete rest.SOC_TOPOLOGY_BY_COURSE;
    dto.topology = serialisable({ ...rest, SOC: SOC_TOPOLOGY_BY_COURSE[courseId] });
  }

  // The reference content: the manual's sections for every course, plus the
  // diagrams and guides of whichever family this one belongs to.
  generatedFrom.push('src/lib/docs/manual.ts');
  const content: Record<string, unknown> = { manual: contentData(manual) };
  if (courseId === 'server-plus') {
    generatedFrom.push('src/lib/docs/serverDiagrams.ts');
    content.diagrams = contentData(serverDiagrams);
  }
  if (SOC_TOPOLOGY_BY_COURSE[courseId]) {
    generatedFrom.push('src/lib/docs/cysaContent.ts');
    content.cysa = contentData(cysaContent);
  }
  if (courseId === 'security-plus') {
    generatedFrom.push('src/lib/docs/securityContent.ts', 'src/lib/docs/cysaContent.ts');
    content.security = contentData(securityContent);
    // Security+ draws two of the SOC diagrams on its own forms — the risk
    // matrix on the Risk Register, the incident timeline on the Incident
    // Report — so its document carries exactly those tables, no more.
    const { RISK_LEVELS, RISK_MATRIX, INCIDENT_TIMELINE } = cysaContent;
    content.cysa = { RISK_LEVELS, RISK_MATRIX, INCIDENT_TIMELINE };
  }
  if (courseId === 'ccna') {
    generatedFrom.push('src/lib/docs/ccnaKit.ts', 'src/lib/docs/ccnaDiagrams.ts');
    content.kit = contentData(ccnaKit);
    content.ccnaDiagrams = contentData(ccnaDiagrams);
  }
  // The chain-of-custody columns and rules: every course's evidence guide
  // renders them, and until R78-D no document carried them.
  generatedFrom.push('src/lib/docs/custodyTemplate.ts');
  content.custody = contentData(custodyTemplate);
  // Every course that runs commands renders the troubleshooting manual, and the
  // rows it renders depend on that course's lab — so the document carries the
  // rows, not the ones this course happens to show.
  if (course.tasks.some((t) => t.steps.some((st) => !!st.command || (st.commands?.length ?? 0) > 0))) {
    generatedFrom.push('src/lib/docs/troubleshooting.ts');
    content.troubleshooting = contentData(troubleshooting);
  }
  dto.content = serialisable(content);

  // Content every course renders that has no other home in this document.
  generatedFrom.push('src/lib/glossary.ts', 'src/lib/rubric.ts');
  dto.glossary = serialisable(GLOSSARY);
  dto.marking = { teamWeight: TEAM_WEIGHT, focusWeight: FOCUS_WEIGHT };
  generatedFrom.push('src/lib/roleGuide.ts');
  dto.roleGuide = serialisable(roleGuidesFor(courseId));
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

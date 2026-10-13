import { CERTS } from './certs';
import { AREA_LABEL, SKILLS, TASK_SKILLS, objectiveRef } from './skills';
import { COURSE_TOOL_DEFAULTS, TASK_TOOL_OVERRIDES, TOOLS, TOOL_STRING_EXCEPTIONS, WHERE_TOOLS } from './tools';
import { CONTROLS, CONTROL_EXCEPTIONS, STANDARDS } from './standards';
import { DELIVERABLE_SOPS, SOPS, TASK_SOPS } from './sops';
import { PRACTICES, TACTICS, TASK_PRACTICES, TASK_TACTICS } from './tactics';
import { METRICS, METRIC_INPUTS } from './metricCatalogue';

/**
 * R107 — the published ontology: the registries under `src/lib/docs/` as
 * versioned JSON files any platform can join on. `scripts/export-ontology.ts`
 * writes them to `content/ontology/`; `ontology.test.ts` fails when a
 * registry changes without regenerating, and when an id a committed file
 * carried is gone (deprecate, never remove) or the version did not move for
 * an addition.
 *
 * Semver, additive: a node, a tool, a SOP kind or a practice is added with a
 * minor bump and deprecated with a flag, never removed. The member-profile
 * export and, later, any statement that crosses to another platform name the
 * version they were read against.
 */
export const ONTOLOGY_SCHEMA = 'capstone-ontology/1';
export const ONTOLOGY_VERSION = '1.0.0';
export const MEMBER_PROFILE_SCHEMA = 'capstone-member-profile/1';

const GENERATED_FROM = ['src/lib/docs/skills.ts', 'src/lib/docs/tools.ts', 'src/lib/docs/standards.ts', 'src/lib/docs/sops.ts', 'src/lib/docs/tactics.ts', 'src/lib/docs/metricCatalogue.ts', 'src/lib/docs/certs.ts'];

export const ONTOLOGY_FILES = ['index', 'competencies', 'tools', 'standards', 'sops', 'tactics', 'practices', 'metrics', 'domains'] as const;
export type OntologyFile = (typeof ONTOLOGY_FILES)[number];

const stamp = () => ({ schema: ONTOLOGY_SCHEMA, version: ONTOLOGY_VERSION });

/** node id → the courses and tasks that teach it. */
function taughtBy(): Record<string, { courseId: string; taskId: string }[]> {
  const out: Record<string, { courseId: string; taskId: string }[]> = {};
  for (const [courseId, tasks] of Object.entries(TASK_SKILLS)) for (const [taskId, ids] of Object.entries(tasks)) for (const id of ids) (out[id] ??= []).push({ courseId, taskId });
  return out;
}

/** Every published file, by name, exactly as the exporter writes it. */
export function ontologyFiles(): Record<OntologyFile, Record<string, unknown>> {
  const domains = Object.values(CERTS).flatMap((c) => c.domains.map((d) => ({ id: objectiveRef(c.code, d.id), code: c.code, name: d.name, weight: d.weight, courseId: c.courseId })));
  const files = {
    competencies: { ...stamp(), areas: AREA_LABEL, nodes: SKILLS, taughtBy: taughtBy() },
    tools: { ...stamp(), tools: TOOLS, wherePrefixes: WHERE_TOOLS, courseDefaults: COURSE_TOOL_DEFAULTS, taskOverrides: TASK_TOOL_OVERRIDES, exceptions: TOOL_STRING_EXCEPTIONS },
    // Colour is a product concern: the register's `tone` stays out of the published file.
    standards: { ...stamp(), standards: STANDARDS.map((s) => Object.fromEntries(Object.entries(s).filter(([k]) => k !== 'tone'))), controls: CONTROLS, exceptions: CONTROL_EXCEPTIONS },
    sops: { ...stamp(), sops: SOPS, formsByCourse: DELIVERABLE_SOPS, tasksByCourse: TASK_SOPS },
    tactics: { ...stamp(), tactics: TACTICS, tasksByCourse: TASK_TACTICS },
    practices: { ...stamp(), practices: PRACTICES, tasksByCourse: TASK_PRACTICES },
    metrics: { ...stamp(), inputs: METRIC_INPUTS, metrics: METRICS },
    domains: { ...stamp(), domains },
  };
  const index = {
    ...stamp(),
    generatedFrom: GENERATED_FROM,
    files: Object.fromEntries(Object.keys(files).map((k) => [k, `${k}.json`])),
    counts: {
      competencies: SKILLS.length,
      tools: TOOLS.length,
      standards: STANDARDS.length,
      controls: CONTROLS.length,
      sops: SOPS.length,
      tactics: TACTICS.length,
      practices: PRACTICES.length,
      metrics: METRICS.length,
      domains: domains.length,
    },
    idStyle: {
      competency: 'comp.<area>.<slug>',
      tool: 'tool.<slug>',
      control: '<standard code>.<control>',
      sop: 'sop.<slug>',
      tactic: 'TA<nnnn> (ATT&CK Enterprise) | AML.TA<nnnn> (ATLAS)',
      practice: 'practice.<slug>',
      metric: 'metric.<slug>',
      domain: '<examCode slugged>.<domainId>',
    },
    rules: ['additive', 'deprecate never remove', 'semver: minor on add, major on a shape change'],
  };
  return { index, ...files };
}

/** Every id a file publishes, by file, so a committed id can be checked to still exist. */
export function ontologyIds(files: Record<OntologyFile, Record<string, unknown>>): Record<string, string[]> {
  const ids = (list: unknown, key: string) => ((list as Record<string, unknown>[]) ?? []).map((x) => String(x[key]));
  return {
    competencies: ids(files.competencies.nodes, 'id'),
    tools: ids(files.tools.tools, 'id'),
    standards: ids(files.standards.standards, 'id'),
    controls: ids(files.standards.controls, 'code'),
    sops: ids(files.sops.sops, 'id'),
    tactics: ids(files.tactics.tactics, 'id'),
    practices: ids(files.practices.practices, 'id'),
    metrics: ids(files.metrics.metrics, 'id'),
    domains: ids(files.domains.domains, 'id'),
  };
}

/** The exact bytes the exporter writes. */
export function ontologyJson(file: Record<string, unknown>): string {
  return JSON.stringify(file, null, 2) + '\n';
}

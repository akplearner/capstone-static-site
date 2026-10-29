import { CERTS } from './certs';
import { AREA_LABEL, SKILLS, TASK_SKILLS, objectiveRef } from './skills';
import { COURSE_TOOL_DEFAULTS, TASK_TOOL_OVERRIDES, TOOLS, TOOL_STRING_EXCEPTIONS, WHERE_TOOLS } from './tools';
import { CONTROLS, CONTROL_EXCEPTIONS, STANDARDS } from './standards';
import { DELIVERABLE_SOPS, SOPS, TASK_SOPS } from './sops';
import { PRACTICES, TACTICS, TASK_PRACTICES, TASK_TACTICS } from './tactics';
import { METRICS, METRIC_INPUTS } from './metricCatalogue';
import { DEPRECATED_KPIS, KPIS, KPI_FAMILIES } from './kpis';
import { WORK_ROLES, WORK_ROLE_OF } from './workRoles';
import { SKILL_DOMAINS } from './skillDomains';
import { CATEGORY_DEFS, CHANGE_GROUPS, FORM_CATEGORY, PROFESSIONAL_THRESHOLD, RATIONALE_PATTERN, TROUBLE_GROUPS } from './recordCategories';
import { AREA_LABEL as RECORD_AREA_LABEL, AREA_OF_KIND, RECORD_AREAS, RECORD_FIELDS } from './projectRecord';
import { SCORES } from './scoring';
import { TRACK_LABEL } from '../course-helpers';
import { PORTFOLIO_PLAN, PORTFOLIO_TITLE, portfolioId } from './portfolioPlan';
import { CASE_STUDY_WORDS } from './portfolioForm';

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
 *
 * R132 — 2.0.0: the KPI board changed shape (seven families, twenty-eight
 * rows, scores and timing; the sixteen R108 ids are kept as `deprecated` with
 * the row that replaced each), `scored` became a boolean on every metric, and
 * three files joined: the eight skill domains, the fourteen record categories
 * (with the form groups the projection reads and the professional threshold)
 * and the published scores.
 *
 * R142 — 2.3.0: the premium tracks (`ai`, `cyber`) and the Portfolio joined
 * as the `tracks` file, with the portfolio SOP kind beside the others.
 *
 * R143 — 2.4.0: the Applied-AI competency area and its four nodes, taught by
 * the AI extension task every graded week now carries.
 */
export const ONTOLOGY_SCHEMA = 'capstone-ontology/1';
export const ONTOLOGY_VERSION = '2.4.0';
export const MEMBER_PROFILE_SCHEMA = 'capstone-member-profile/3';

const GENERATED_FROM = ['src/lib/docs/skills.ts', 'src/lib/docs/tools.ts', 'src/lib/docs/standards.ts', 'src/lib/docs/sops.ts', 'src/lib/docs/tactics.ts', 'src/lib/docs/metricCatalogue.ts', 'src/lib/docs/certs.ts', 'src/lib/docs/kpis.ts', 'src/lib/docs/workRoles.ts', 'src/lib/docs/skillDomains.ts', 'src/lib/docs/recordCategories.ts', 'src/lib/docs/scoring.ts', 'src/lib/docs/projectRecord.ts', 'src/lib/course-helpers.ts', 'src/lib/docs/portfolioPlan.ts'];

export const ONTOLOGY_FILES = ['index', 'competencies', 'tools', 'standards', 'sops', 'tactics', 'practices', 'metrics', 'domains', 'kpis', 'work-roles', 'skill-domains', 'record-categories', 'scoring', 'project-record', 'tracks'] as const;
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
    // R108/R132: the KPIs with their families and the deprecated R108 ids, and the NICE work roles with the course roles that prepare for them.
    kpis: { ...stamp(), families: KPI_FAMILIES, kpis: KPIS, deprecated: DEPRECATED_KPIS },
    'work-roles': { ...stamp(), workRoles: WORK_ROLES, byCourse: WORK_ROLE_OF },
    // R132: the eight domains, the fourteen categories with the group reads and the threshold, and the scores with their weights.
    'skill-domains': { ...stamp(), domains: SKILL_DOMAINS },
    'record-categories': { ...stamp(), threshold: PROFESSIONAL_THRESHOLD, categories: CATEGORY_DEFS, formCategories: FORM_CATEGORY, troubleGroups: TROUBLE_GROUPS, changeGroups: CHANGE_GROUPS, rationalePattern: RATIONALE_PATTERN },
    scoring: { ...stamp(), scores: SCORES },
    // R139: the project record — the facts a form records, by kind and area, and the conflict rules read over them.
    'project-record': { ...stamp(), areas: RECORD_AREAS.map((a) => ({ id: a, label: RECORD_AREA_LABEL[a] })), areaOfKind: AREA_OF_KIND, fields: RECORD_FIELDS, conflictRules: ['duplicate-value', 'duplicate-address', 'address-outside-prefix', 'prefixes-overlap', 'port-reused', 'undeclared-host', 'ram-over-committed', 'cpu-over-committed', 'published-port-not-listening'] },
    // R142: the premium tracks an advanced week or an extension task can carry, the rules they obey, and the Portfolio every course closes on.
    tracks: {
      ...stamp(),
      tracks: (Object.keys(TRACK_LABEL) as (keyof typeof TRACK_LABEL)[]).map((id) => ({ id, label: TRACK_LABEL[id] })),
      rules: ['an advanced week carries at most one track; one on neither is counted as an advanced week', 'a graded week carries none: the graded weeks are the certification', 'an extension task carries the ai track, sits in a graded week, is shared by every role and is optional', 'the course index counts the weeks and tasks beyond the certification per course'],
      portfolio: { title: PORTFOLIO_TITLE, caseStudyWords: CASE_STUDY_WORDS, forms: PORTFOLIO_PLAN.map((p) => ({ courseId: p.courseId, id: portfolioId(p), week: p.week, feeds: p.capstone })) },
    },
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
      // Published ids, deprecated ones included: an id is never removed.
      kpis: KPIS.length + DEPRECATED_KPIS.length,
      workRoles: WORK_ROLES.length,
      skillDomains: SKILL_DOMAINS.length,
      recordCategories: CATEGORY_DEFS.length,
      scores: SCORES.length,
      recordFields: RECORD_FIELDS.length,
      tracks: Object.keys(TRACK_LABEL).length,
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
      kpi: 'kpi.<family>.<slug>',
      workRole: 'role.<slug>',
      skillDomain: '<slug>',
      recordCategory: '<slug>',
      score: 'score.<slug>',
      track: '<slug>',
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
    // R132: a deprecated KPI id is still published, so the R108 ids stay in the list.
    kpis: [...ids(files.kpis.kpis, 'id'), ...ids(files.kpis.deprecated, 'id')],
    workRoles: ids(files['work-roles'].workRoles, 'id'),
    skillDomains: ids(files['skill-domains']?.domains, 'id'),
    recordCategories: ids(files['record-categories']?.categories, 'id'),
    scores: ids(files.scoring?.scores, 'id'),
    // R142: the tracks; a committed file from before this round has none, which reads as an addition.
    tracks: ids(files.tracks?.tracks, 'id'),
  };
}

/** The exact bytes the exporter writes. */
export function ontologyJson(file: Record<string, unknown>): string {
  return JSON.stringify(file, null, 2) + '\n';
}

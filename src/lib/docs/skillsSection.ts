import type { Course } from '../types';
import type { DeliverableDef } from './types';
import { AREA_LABEL, SKILLS, TASK_SKILLS, skillOf } from './skills';
import { TOOLS, toolsByTask } from './tools';
import { CONTROLS, CONTROL_EXCEPTIONS, STANDARDS, controlOf, parseStandard, standardOf } from './standards';
import { DELIVERABLE_SOPS, SOPS, TASK_SOPS } from './sops';
import { PRACTICES, TACTICS, TASK_PRACTICES, TASK_TACTICS } from './tactics';
import { METRICS } from './metricCatalogue';
import { DIMENSION_LABEL, LEVEL_LABEL, SKILLS_COPY } from './skillsCopy';
import { KPIS, KPI_FAMILIES } from './kpis';
import { WORK_ROLES, WORK_ROLE_OF, type WorkRoleDef } from './workRoles';
import { SKILL_DOMAINS } from './skillDomains';
import { CATEGORY_DEFS, CHANGE_GROUPS, TROUBLE_GROUPS, formBase } from './recordCategories';
import { SCORES } from './scoring';
import type { SkillRegistry } from './skillCoverage';

/**
 * R107 — `content.skills` for one course: the course's maps into the
 * registries, and the registry rows those maps reach (a node, its parents;
 * a control, its chain to the standard), so the document holds everything
 * it renders without carrying the whole catalogue thirteen times over. The
 * catalogue itself is published once, in `content/ontology/`. The metric
 * catalogue and the words are platform-wide and travel whole.
 *
 * Lowercase only: this is the writer's helper, never a table.
 */
export function skillsSectionFor(course: Pick<Course, 'id' | 'tasks'>, forms: Pick<DeliverableDef, 'id' | 'standard'>[]): SkillRegistry & { AREAS: Record<string, string>; CONTROL_OF: Record<string, string[]>; METRICS: typeof METRICS; COPY: typeof SKILLS_COPY; LEVEL_LABEL: typeof LEVEL_LABEL; DIMENSION_LABEL: typeof DIMENSION_LABEL; KPI_FAMILIES: typeof KPI_FAMILIES; KPIS: typeof KPIS; WORK_ROLES: WorkRoleDef[]; WORK_ROLE_OF: Record<string, string[]>; DOMAINS: typeof SKILL_DOMAINS; CATEGORIES: typeof CATEGORY_DEFS; SCORING: typeof SCORES; TROUBLE_GROUPS: typeof TROUBLE_GROUPS; CHANGE_GROUPS: typeof CHANGE_GROUPS } {
  const id = course.id;
  const SKILL_OF = TASK_SKILLS[id] ?? {};
  const TOOL_OF = toolsByTask(course);
  const SOP_OF = DELIVERABLE_SOPS[id] ?? {};
  const SOP_OF_TASK = TASK_SOPS[id] ?? {};
  const TACTIC_OF = TASK_TACTICS[id] ?? {};
  const PRACTICE_OF = TASK_PRACTICES[id] ?? {};
  const values = (m: Record<string, string[]>) => new Set(Object.values(m).flat());

  const skillIds = values(SKILL_OF);
  for (const sid of [...skillIds]) for (let n = skillOf(sid); n?.parents?.length; n = skillOf(n.parents[0])) n.parents.forEach((p) => skillIds.add(p));
  const toolIds = values(TOOL_OF);
  const sopIds = new Set([...values(SOP_OF), ...values(SOP_OF_TASK)]);
  const tacticIds = values(TACTIC_OF);
  const practiceIds = values(PRACTICE_OF);
  // R108: the work roles this course's roles prepare for, and the course's own map into them.
  const WORK_ROLE_OF_COURSE = WORK_ROLE_OF[id] ?? {};
  const workRoleIds = values(WORK_ROLE_OF_COURSE);
  for (const f of forms) for (const p of CONTROL_EXCEPTIONS[f.standard] ?? []) practiceIds.add(p);

  // What each form cites, parsed once here so no reader needs the parser.
  const CONTROL_OF: Record<string, string[]> = {};
  for (const f of forms) {
    const codes = parseStandard(f.standard).map((r) => r.code);
    if (codes.length) CONTROL_OF[f.id] = codes;
  }
  // Every reference the included rows make: a control (with its chain) or a standard.
  const refs = new Set<string>();
  for (const codes of Object.values(CONTROL_OF)) codes.forEach((c) => refs.add(c));
  for (const s of SOPS) if (sopIds.has(s.id)) s.standardRefs.forEach((r) => refs.add(r));
  for (const p of PRACTICES) if (practiceIds.has(p.id)) refs.add(p.anchor);
  for (const n of SKILLS) if (skillIds.has(n.id)) n.objectiveRefs.forEach((r) => refs.add(r));
  const controlCodes = new Set<string>();
  const standardIds = new Set<string>();
  for (const t of course.tasks) [...t.frameworks, ...t.steps.flatMap((s) => s.frameworks ?? [])].forEach((fw) => standardIds.add(fw));
  for (const ref of refs) {
    for (let c = controlOf(ref); c; c = c.parent ? controlOf(c.parent) : undefined) {
      controlCodes.add(c.code);
      standardIds.add(c.standard);
    }
    if (standardOf(ref)) standardIds.add(ref);
  }

  return {
    SKILLS: SKILLS.filter((n) => skillIds.has(n.id)),
    SKILL_OF,
    AREAS: AREA_LABEL,
    TOOLS: TOOLS.filter((t) => toolIds.has(t.id)),
    TOOL_OF,
    STANDARDS: STANDARDS.filter((s) => standardIds.has(s.id)),
    CONTROLS: CONTROLS.filter((c) => controlCodes.has(c.code)),
    CONTROL_OF,
    SOPS: SOPS.filter((s) => sopIds.has(s.id)),
    SOP_OF,
    SOP_OF_TASK,
    TACTICS: TACTICS.filter((t) => tacticIds.has(t.id)),
    TACTIC_OF,
    PRACTICES: PRACTICES.filter((p) => practiceIds.has(p.id)),
    PRACTICE_OF,
    METRICS,
    COPY: SKILLS_COPY,
    LEVEL_LABEL,
    DIMENSION_LABEL,
    KPI_FAMILIES,
    KPIS,
    WORK_ROLES: WORK_ROLES.filter((w) => workRoleIds.has(w.id)),
    WORK_ROLE_OF: WORK_ROLE_OF_COURSE,
    // R132: the domains, categories and scores travel whole; the group reads only for this course's forms.
    DOMAINS: SKILL_DOMAINS,
    CATEGORIES: CATEGORY_DEFS,
    SCORING: SCORES,
    TROUBLE_GROUPS: TROUBLE_GROUPS.filter((g) => forms.some((f) => f.id === g.form || formBase(f.id) === g.form)),
    CHANGE_GROUPS: CHANGE_GROUPS.filter((g) => forms.some((f) => f.id === g.form || formBase(f.id) === g.form)),
  };
}

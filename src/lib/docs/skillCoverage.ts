import type { Course, Task } from '../types';
import type { DeliverableDef } from './types';
import { isSetupWeek } from '../course-helpers';
import { parseStandard, CONTROL_EXCEPTIONS } from './standards';
import type { SkillNode } from './skills';
import type { ToolDef } from './tools';
import type { StandardDef, ControlRef } from './standards';
import type { SopDef } from './sops';
import type { PracticeDef, TacticDef } from './tactics';

/**
 * R107 — what a course practises, per dimension: a projection over the
 * registry section a document carries and the course's graded tasks. Nothing
 * here is stored; `index.json` holds the counts and the skills sheet prints
 * the rows. Lowercase only: this module reaches no document.
 *
 * The registry arrives as a value (the `content.skills` section), never as an
 * import, so the reader side can call this over any document without pulling
 * the registries into its graph.
 */

/** The registry rows of `content.skills` this projection needs. */
export interface SkillRegistry {
  SKILLS: SkillNode[];
  SKILL_OF: Record<string, string[]>;
  TOOLS: ToolDef[];
  TOOL_OF: Record<string, string[]>;
  STANDARDS: StandardDef[];
  CONTROLS: ControlRef[];
  SOPS: SopDef[];
  SOP_OF: Record<string, string[]>;
  SOP_OF_TASK: Record<string, string[]>;
  TACTICS: TacticDef[];
  TACTIC_OF: Record<string, string[]>;
  PRACTICES: PracticeDef[];
  PRACTICE_OF: Record<string, string[]>;
}

export interface CoverageRow {
  id: string;
  label: string;
  /** Tasks of graded and advanced weeks that practise it, by id, in course order. */
  tasks: string[];
  /** Forms that are an instance of it (procedures) or cite it (standards, controls). */
  deliverables: string[];
}

export interface CourseCoverage {
  skills: CoverageRow[];
  tools: CoverageRow[];
  standards: CoverageRow[];
  controls: CoverageRow[];
  sops: CoverageRow[];
  tactics: CoverageRow[];
  practices: CoverageRow[];
  /** Tasks the mapping leaves out, per dimension. */
  unmapped: { skills: string[]; tools: string[]; practices: string[] };
}

/** The tasks a course teaches with: every week but setup, so an advanced week's skills count too. */
export const coveredTasks = (course: Pick<Course, 'tasks' | 'weeks'>): Task[] => course.tasks.filter((t) => !isSetupWeek(course as Course, t.week));

function rows<T extends { id: string }>(defs: T[], label: (d: T) => string, map: Record<string, string[]>, tasks: Task[], deliverables: Record<string, string[]> = {}): CoverageRow[] {
  const byId = new Map(defs.map((d) => [d.id, d]));
  const out = new Map<string, CoverageRow>();
  const row = (id: string): CoverageRow | undefined => {
    const def = byId.get(id);
    if (!def) return undefined;
    if (!out.has(id)) out.set(id, { id, label: label(def), tasks: [], deliverables: [] });
    return out.get(id);
  };
  for (const t of tasks) for (const id of map[t.id] ?? []) row(id)?.tasks.push(t.id);
  for (const [formId, ids] of Object.entries(deliverables)) for (const id of ids) row(id)?.deliverables.push(formId);
  return defs.filter((d) => out.has(d.id)).map((d) => out.get(d.id)!);
}

/** Standards and controls: tagged on graded tasks and their steps, or cited by a form's `standard`. */
function standardRows(reg: SkillRegistry, tasks: Task[], forms: Pick<DeliverableDef, 'id' | 'standard'>[]): { standards: CoverageRow[]; controls: CoverageRow[] } {
  const stdById = new Map(reg.STANDARDS.map((s) => [s.id, s]));
  const standards = new Map<string, CoverageRow>();
  const controls = new Map<string, CoverageRow>();
  const std = (id: string) => {
    const def = stdById.get(id);
    if (!def) return undefined;
    if (!standards.has(id)) standards.set(id, { id, label: def.label, tasks: [], deliverables: [] });
    return standards.get(id);
  };
  for (const t of tasks) {
    const ids = new Set<string>([...t.frameworks, ...t.steps.flatMap((s) => s.frameworks ?? [])]);
    for (const id of ids) std(id)?.tasks.push(t.id);
  }
  for (const f of forms) {
    for (const ref of parseStandard(f.standard)) {
      if (!controls.has(ref.code)) controls.set(ref.code, { id: ref.code, label: ref.label, tasks: [], deliverables: [] });
      controls.get(ref.code)!.deliverables.push(f.id);
      const s = std(ref.standard);
      if (s && !s.deliverables.includes(f.id)) s.deliverables.push(f.id);
    }
  }
  return {
    standards: reg.STANDARDS.filter((s) => standards.has(s.id)).map((s) => standards.get(s.id)!),
    controls: reg.CONTROLS.filter((c) => controls.has(c.code)).map((c) => controls.get(c.code)!),
  };
}

export function courseCoverage(course: Pick<Course, 'tasks' | 'weeks'>, reg: SkillRegistry, forms: Pick<DeliverableDef, 'id' | 'standard'>[]): CourseCoverage {
  const tasks = coveredTasks(course);
  const { standards, controls } = standardRows(reg, tasks, forms);
  const missing = (map: Record<string, string[]>) => tasks.filter((t) => !(map[t.id]?.length)).map((t) => t.id);
  return {
    skills: rows(reg.SKILLS, (d) => d.label, reg.SKILL_OF, tasks),
    tools: rows(reg.TOOLS, (d) => d.label, reg.TOOL_OF, tasks),
    standards,
    controls,
    sops: rows(reg.SOPS, (d) => d.label, reg.SOP_OF_TASK, tasks, reg.SOP_OF),
    tactics: rows(reg.TACTICS, (d) => `${d.label} (${d.id})`, reg.TACTIC_OF, tasks),
    practices: rows(reg.PRACTICES, (d) => d.label, reg.PRACTICE_OF, tasks),
    unmapped: { skills: missing(reg.SKILL_OF), tools: missing(reg.TOOL_OF), practices: missing(reg.PRACTICE_OF) },
  };
}

/** The practices a form's `standard` stands for when it cites no control. */
export function practicesOfForm(form: Pick<DeliverableDef, 'standard'>): string[] {
  return CONTROL_EXCEPTIONS[form.standard] ?? [];
}

/** The counts `index.json` carries: distinct ids the tasks (and the forms, for SOPs and controls) use. */
export function coverageCounts(cov: CourseCoverage): { skills: number; tools: number; standards: number; controls: number; sops: number; tactics: number; practices: number } {
  return { skills: cov.skills.length, tools: cov.tools.length, standards: cov.standards.length, controls: cov.controls.length, sops: cov.sops.length, tactics: cov.tactics.length, practices: cov.practices.length };
}

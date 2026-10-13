/**
 * R107 — the skills sheet: what a course teaches a person to do, with which
 * tools, to which standards and procedures, against which adversary tactics
 * and engineering practices, task by task. Generated from the course
 * document by `scripts/export-skill-sheets.ts` into
 * `docs/courses/skills/<id>.md`; `skillSheets.test.ts` fails when a registry
 * or a mapping changes without regenerating.
 */
import type { CourseDto } from '../content/dto';
import { deliverablesOf, skillsOf } from '../content/read';
import { courseCoverage, coveredTasks, practicesOfForm, type CoverageRow } from './skillCoverage';
import { isGradedWeek } from '../course-helpers';

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

export function skillSheet(doc: CourseDto): string {
  const course = doc.course;
  const reg = skillsOf(doc);
  const forms = deliverablesOf(doc);
  const cov = courseCoverage(course, reg, forms);
  const title = (id: string) => course.tasks.find((t) => t.id === id)?.title ?? id;
  const formTitle = (id: string) => forms.find((f) => f.id === id)?.title ?? id;
  const byTasks = (r: CoverageRow) => (r.tasks.length ? r.tasks.map((id) => cell(title(id))).join('; ') : '—');
  const byForms = (r: CoverageRow) => (r.deliverables.length ? r.deliverables.map((id) => cell(formTitle(id))).join('; ') : '—');
  const covered = coveredTasks(course);
  const graded = covered.filter((t) => isGradedWeek(course, t.week)).length;
  const advanced = covered.length - graded;
  const out: string[] = [
    `# ${course.title} — skills sheet`,
    '',
    `${graded} graded tasks${advanced ? ` and ${advanced} advanced` : ''} · ${cov.skills.length} skills · ${cov.tools.length} tools · ${cov.sops.length} procedures · ${cov.standards.length} standards (${cov.controls.length} controls cited) · ${cov.tactics.length} tactics · ${cov.practices.length} practices`,
    '',
    'Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.',
    '',
    '## Skills',
    '',
    '| Skill | Area | Anchored to | Practised by |',
    '| --- | --- | --- | --- |',
  ];
  const nodeById = new Map(reg.SKILLS.map((n) => [n.id, n]));
  for (const r of cov.skills) {
    const node = nodeById.get(r.id)!;
    out.push(`| ${cell(r.label)} \`${r.id}\` | ${reg.AREAS[node.area] ?? node.area} | ${node.objectiveRefs.join(', ')} | ${byTasks(r)} |`);
  }
  if (cov.unmapped.skills.length) out.push('', `Tasks not yet mapped to a skill: ${cov.unmapped.skills.join(', ')}.`);
  out.push('', '## Tools', '', '| Tool | Kind | Used by |', '| --- | --- | --- |');
  const toolById = new Map(reg.TOOLS.map((t) => [t.id, t]));
  for (const r of cov.tools) out.push(`| ${cell(r.label)} | ${toolById.get(r.id)?.kind ?? ''} | ${byTasks(r)} |`);
  out.push('', '## Procedures', '', 'Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.', '', '| Procedure | Kind | Standards | Forms | Executed by |', '| --- | --- | --- | --- | --- |');
  const sopById = new Map(reg.SOPS.map((s) => [s.id, s]));
  for (const r of cov.sops) {
    const def = sopById.get(r.id)!;
    out.push(`| ${cell(r.label)} | ${def.kind} | ${def.standardRefs.join(', ')} | ${byForms(r)} | ${byTasks(r)} |`);
  }
  out.push('', '## Standards', '', '| Standard | Tagged on tasks | Cited by forms |', '| --- | --- | --- |');
  for (const r of cov.standards) out.push(`| ${cell(r.label)} | ${byTasks(r)} | ${byForms(r)} |`);
  if (cov.controls.length) {
    out.push('', '| Control cited | Standard | By |', '| --- | --- | --- |');
    const ctlById = new Map(reg.CONTROLS.map((c) => [c.code, c]));
    for (const r of cov.controls) out.push(`| ${r.id} ${cell(r.label)} | ${ctlById.get(r.id)?.standard ?? ''} | ${byForms(r)} |`);
  }
  const practiceForms = forms.filter((f) => practicesOfForm(f).length);
  if (practiceForms.length) {
    out.push('', 'Forms whose standard names a practice rather than a control:', '');
    for (const f of practiceForms) out.push(`- ${cell(f.title)}: ${practicesOfForm(f).join(', ')}`);
  }
  out.push('', '## Tactics and practices', '');
  if (cov.tactics.length) {
    out.push('| Tactic | Practised or defended by |', '| --- | --- |');
    for (const r of cov.tactics) out.push(`| ${cell(r.label)} | ${byTasks(r)} |`);
  } else {
    out.push(reg.COPY.noTactics);
  }
  out.push('', '| Practice | Anchor | Asked for by |', '| --- | --- | --- |');
  const practiceById = new Map(reg.PRACTICES.map((p) => [p.id, p]));
  for (const r of cov.practices) out.push(`| ${cell(r.label)} | ${practiceById.get(r.id)?.anchor ?? ''} | ${byTasks(r)} |`);
  if (cov.unmapped.practices.length) out.push('', `Tasks not yet mapped to a practice: ${cov.unmapped.practices.join(', ')}.`);
  out.push('');
  return out.join('\n');
}

/**
 * R103 — the build sheet: a course's architecture, week by week, as Markdown.
 *
 * Generated from the course document by `scripts/export-build-sheets.ts`
 * into `docs/courses/build-sheets/<course>.md`, from the same `weekAdds`
 * the Tasks tab prints under the picture — so the docs can never describe
 * a different build from the one the app draws. `buildSheets.test.ts`
 * fails when a picture changed without regenerating.
 */
import type { CourseDto } from '../content/dto';
import { deliverablesOf, weekVisualsOf } from '../content/read';
import { weekAdds } from '../weekAdds';
import { roleFlow } from './roleFlow';

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

export function buildSheet(doc: CourseDto): string {
  const course = doc.course;
  const visuals = weekVisualsOf(doc);
  const out: string[] = [
    `# ${course.title} — build sheet`,
    '',
    'What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.',
    '',
  ];
  for (const v of visuals) {
    const adds = weekAdds(doc, v.week);
    const week = course.weeks.find((w) => w.number === v.week);
    out.push(`## Week ${v.week}${week?.title ? ` — ${cell(week.title)}` : ''}`, '');
    if (v.caption) out.push(`> ${cell(v.caption)}`, '');
    if (adds.rows.length) {
      out.push(`${adds.starting ? 'You start with' : 'This week adds'}:`, '', '| Part | Purpose | Recorded in |', '| --- | --- | --- |');
      for (const r of adds.rows) out.push(`| ${cell(r.label)} | ${cell(r.purpose)} | ${r.records ? cell(r.records.title) : '—'} |`);
      out.push('');
    } else {
      out.push(adds.starting ? 'Nothing is built yet.' : 'Nothing new is built this week; the process is drawn over the picture.', '');
    }
    if (v.process) {
      out.push(`**Process — ${cell(v.process.title)}:** ${v.process.steps.map((s) => `${s.from} → ${s.to} (${cell(s.label)})`).join('; ')}.`, '');
    }
  }
  // R105: the roles, derived from the RACI — the same rows the Guide's table shows.
  const defs = deliverablesOf(doc);
  const title = (id: string) => defs.find((d) => d.id === id)?.title ?? id;
  const roleName = (id: string) => course.roles.find((r) => r.id === id)?.name ?? id;
  const flow = roleFlow(course.roles, defs);
  if (flow.rows.length) {
    out.push('## The roles', '', '| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |', '| --- | --- | --- | --- | --- | --- | --- |');
    for (const r of flow.rows) {
      const list = (ids: string[]) => (ids.length ? ids.map(title).map(cell).join(', ') : '—');
      const who = (ids: string[]) => (ids.length ? ids.map(roleName).map(cell).join(', ') : '—');
      out.push(`| ${cell(r.role.name)} | ${cell(r.role.mission)} | ${list(r.drafts)} | ${list(r.reviews)} | ${list(r.approves)} | ${who(r.handsTo)} | ${who(r.waitsOn)} |`);
    }
    out.push('');
  }
  return out.join('\n');
}

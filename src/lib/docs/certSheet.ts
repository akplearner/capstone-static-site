/**
 * R106 — the certification sheet: what exam a course prepares for, which of
 * its domains each graded task practises, the gaps, the ladder around it,
 * and what it all costs. Generated from the course document by
 * `scripts/export-cert-sheets.ts` into `docs/courses/cert-coverage/<id>.md`;
 * `certSheets.test.ts` fails when the registry or the tasks change without
 * regenerating.
 */
import type { CourseDto } from '../content/dto';
import { certOf } from '../content/read';
import { coverageOf } from './certs';
import { costSummary, taskCostUsd } from './costs';

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const usd = (n: number) => (n ? `$${n % 1 ? n.toFixed(2) : n}` : '$0');

export function certSheet(doc: CourseDto): string {
  const course = doc.course;
  const { CERT, DOMAIN_OF, COSTS, LADDER } = certOf(doc);
  const out: string[] = [`# ${course.title} — certification and cost sheet`, ''];
  if (!CERT) {
    out.push('This course prepares for no certification.', '');
    return out.join('\n');
  }
  const cov = coverageOf(course, CERT, DOMAIN_OF);
  const title = (id: string) => course.tasks.find((t) => t.id === id)?.title ?? id;
  out.push(
    `**${CERT.vendor} ${CERT.name} (${CERT.code})** · ${CERT.vendorLevel ?? CERT.level} · ${CERT.exam ? `exam fee ${usd(CERT.examFeeUsd)} (list price, ${CERT.feeCheckedYear})` : 'no exam: an engagement'}`,
    '',
    'Generated from the certification registry and the course document by `npm run content:export`; edit `src/lib/docs/certs.ts`, `src/lib/docs/costs.ts` or the seed, not this file.',
    '',
    '## The ladder',
    '',
    LADDER.map((c) => (c.courseId === CERT.courseId ? `**${c.name} (${c.code})**` : `${c.name} (${c.code})`)).join(' → ') || CERT.name,
    '',
    `## Exam coverage — ${cov.coveredWeight}% of the exam weight is practised`,
    '',
    '| Domain | Weight | Practised by |',
    '| --- | --- | --- |'
  );
  for (const r of cov.rows) {
    const by = r.tasks.length ? r.tasks.map((id) => cell(title(id))).join('; ') : `— ${cell(r.domain.gapNote ?? 'not practised in this course')}`;
    out.push(`| ${cell(r.domain.name)} | ${r.domain.weightLabel ?? `${r.domain.weight}%`} | ${by} |`);
  }
  out.push('');
  if (cov.unmapped.length) out.push(`Graded tasks that name no domain: ${cov.unmapped.join(', ')}.`, '');
  const sum = costSummary(COSTS, CERT.examFeeUsd, course.tasks);
  out.push('## Cost', '', `Exam ${usd(sum.examFeeUsd)} · one-off ${usd(sum.onceUsd)} · monthly ceiling ${usd(sum.monthlyUsd)} · tasks ${usd(sum.tasksUsd)}`, '', '| Item | Kind | Cost | Note |', '| --- | --- | --- | --- |');
  for (const l of COSTS) out.push(`| ${cell(l.item)}${l.weeks ? ` (weeks ${l.weeks.join(', ')})` : ''} | ${l.kind} | ${usd(l.usd)}${l.per === 'once' ? '' : ` / ${l.per}`}${l.approx ? ' (approx.)' : ''} | ${cell(l.note)} |`);
  const paid = course.tasks.filter((t) => taskCostUsd(t) > 0);
  if (paid.length) {
    out.push('', '| Task | Runs for | Cost | Note |', '| --- | --- | --- | --- |');
    for (const t of paid) out.push(`| ${cell(t.title)} | ${t.estimatedTime ?? '—'} | ${usd(taskCostUsd(t))} | ${cell(t.cost?.note ?? '')} |`);
  }
  out.push('');
  return out.join('\n');
}

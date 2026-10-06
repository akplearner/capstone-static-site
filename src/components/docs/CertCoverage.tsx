'use client';

import type { Course } from '@/lib/types';
import { certOf } from '@/lib/content/read';
import { useCourseDocument } from '@/lib/useCourse';
import { coverageOf } from '@/lib/docs/certs';
import { costSummary, taskCostUsd } from '@/lib/docs/costs';

/**
 * R106: the exam and the cost, as two tables read off the course document —
 * the ladder this course sits on, each exam domain with its weight and the
 * graded tasks that practise it (a gap says so), and what the course costs:
 * the exam fee, the one-off kit, the monthly ceiling and what the tasks spend.
 */
const usd = (n: number) => (n ? `$${n % 1 ? n.toFixed(2) : n}` : '$0');

export function CertCoverage({ course }: { course: Course }) {
  const { CERT, DOMAIN_OF, COSTS, LADDER } = certOf(useCourseDocument());
  if (!CERT) return null;
  const cov = coverageOf(course, CERT, DOMAIN_OF);
  const ladder = LADDER;
  const sum = costSummary(COSTS, CERT.examFeeUsd, course.tasks);
  const title = (id: string) => course.tasks.find((t) => t.id === id)?.title ?? id;
  const paid = course.tasks.filter((t) => taskCostUsd(t) > 0);
  return (
    <div className="space-y-3" data-cert-coverage={CERT.code}>
      <ol className="flex flex-wrap items-center gap-1 text-xs" aria-label="Ladder">
        {ladder.map((c, i) => (
          <li key={c.courseId} className="flex items-center gap-1">
            <span className={`rounded-full px-2 py-0.5 ${c.courseId === CERT.courseId ? 'bg-accent text-accent-contrast font-semibold' : 'bg-panel-2 text-muted'}`} aria-current={c.courseId === CERT.courseId ? 'step' : undefined}>
              {c.code}
            </span>
            {i < ladder.length - 1 && <span aria-hidden className="text-muted">›</span>}
          </li>
        ))}
        <li className="ml-2 text-muted">
          {CERT.vendor} · {CERT.vendorLevel ?? CERT.level} · {CERT.exam ? `exam ${usd(CERT.examFeeUsd)}` : 'no exam'} · {cov.coveredWeight}% of the exam weight practised
        </li>
      </ol>
      <div className="overflow-x-auto rounded-lg depth-edge bg-panel">
        <table className="w-full min-w-[560px] text-left text-xs" data-domains>
          <thead>
            <tr className="text-2xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-3 py-2 font-semibold">Domain</th>
              <th scope="col" className="px-3 py-2 font-semibold">Weight</th>
              <th scope="col" className="px-3 py-2 font-semibold">Practised by</th>
            </tr>
          </thead>
          <tbody>
            {cov.rows.map((r) => (
              <tr key={r.domain.id} className="border-t border-line align-top" data-domain={r.domain.id} data-covered={r.tasks.length ? 'true' : 'false'}>
                <td className="px-3 py-2 font-semibold text-ink">{r.domain.name}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-muted">{r.domain.weightLabel ?? `${r.domain.weight}%`}</td>
                <td className="px-3 py-2 text-body">{r.tasks.length ? r.tasks.map(title).join(' · ') : <span className="text-muted">{r.domain.gapNote ?? 'Not practised here'}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="overflow-x-auto rounded-lg depth-edge bg-panel">
        <table className="w-full min-w-[560px] text-left text-xs" data-costs>
          <caption className="px-3 py-2 text-left text-2xs text-muted">
            Exam {usd(sum.examFeeUsd)} · one-off {usd(sum.onceUsd)} · monthly ceiling {usd(sum.monthlyUsd)} · tasks {usd(sum.tasksUsd)}
          </caption>
          <thead>
            <tr className="text-2xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-3 py-2 font-semibold">Item</th>
              <th scope="col" className="px-3 py-2 font-semibold">Cost</th>
              <th scope="col" className="px-3 py-2 font-semibold">Note</th>
            </tr>
          </thead>
          <tbody>
            {COSTS.map((l) => (
              <tr key={l.id} className="border-t border-line align-top" data-cost={l.id}>
                <td className="px-3 py-2 font-semibold text-ink">{l.item}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-body">
                  {usd(l.usd)}
                  {l.per !== 'once' && <span className="text-muted"> / {l.per}</span>}
                  {l.approx && <span className="text-muted"> ≈</span>}
                </td>
                <td className="px-3 py-2 text-muted">{l.note}</td>
              </tr>
            ))}
            {paid.map((t) => (
              <tr key={t.id} className="border-t border-line align-top" data-task-cost={t.id}>
                <td className="px-3 py-2 text-ink">{t.title}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-body">{usd(taskCostUsd(t))}</td>
                <td className="px-3 py-2 text-muted">{t.cost?.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

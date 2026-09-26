'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Download } from 'lucide-react';
import { CourseSubNav } from '@/components/CourseSubNav';
import { CourseEnrolGate } from '@/components/CourseEnrolGate';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { PixelBadge } from '@/components/ui/Pixel';
import { WeekRail } from '@/components/week/WeekRail';
import { Crumbs } from '@/components/SiteNav';
import { CopyButton } from '@/components/step/CommandBlock';
import { LedgerSkeleton } from '@/components/ui/Skeletons';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { useClientStore, EMPTY_OBJECT, EMPTY_ARRAY } from '@/lib/useClientStore';
import { evidenceRepo, progressRepo } from '@/lib/data';
import type { EvidenceArtifact, StepEvidence } from '@/lib/data/types';
import { courseMetrics } from '@/lib/metrics';
import { getTasksByRole, isAdvancedWeek } from '@/lib/course-helpers';
import { artifactRows, filterWeek, ledgerCsv, ledgerRows, type WeekFilter } from '@/lib/ledgerView';
import { downloadText } from '@/lib/download';
import { localDay, localStamp } from '@/lib/localDate';

/**
 * The evidence ledger, as a page.
 *
 * The ledger — every step verified from pasted output, every file hashed —
 * has been recorded since the ledger tables landed, and the only view of it
 * was an aggregate on the portfolio. This is the browser: filter by week,
 * re-verify a step (the deep link opens it), export the lot as CSV.
 *
 * Not a fifth sub-nav tab; reached from the Home status surface, the dashboard
 * card and the portfolio. Private, like every course sub-route.
 */
export default function LedgerPage() {
  const course = useCourse();
  const { member, loading } = useMember(course.id);
  const [week, setWeek] = useState<WeekFilter>('all');

  const memberId = member?.memberId ?? '';
  const evidence = useClientStore<Record<string, StepEvidence>>(
    () => (memberId ? evidenceRepo.getSteps(course.id, memberId) : EMPTY_OBJECT),
    EMPTY_OBJECT
  );
  const artifacts = useClientStore<EvidenceArtifact[]>(
    () => (memberId ? evidenceRepo.getArtifacts(course.id, memberId) : EMPTY_ARRAY),
    EMPTY_ARRAY
  );
  const taskPercent = useClientStore<Record<string, number>>(() => {
    if (!member) return EMPTY_OBJECT;
    const keys = progressRepo.getCompletionKeySet(course.id, member.memberId);
    const out: Record<string, number> = {};
    for (const t of getTasksByRole(course, member.role)) out[t.id] = progressRepo.getTaskPercent(course.id, member.memberId, t, keys);
    return out;
  }, EMPTY_OBJECT);

  if (loading) return <LedgerSkeleton />;
  if (!member) return <CourseEnrolGate courseId={course.id} what="the evidence ledger" />;

  const m = courseMetrics({ course, role: member.role, taskPercent, evidence, artifacts });
  const steps = filterWeek(ledgerRows(course, evidence), week);
  const files = filterWeek(artifactRows(artifacts), week);
  const weeks = [...course.weeks].sort((a, b) => a.number - b.number);

  const exportCsv = () =>
    downloadText(`${course.id}_evidence_ledger_${localDay()}.csv`, ledgerCsv(course, ledgerRows(course, evidence), artifactRows(artifacts)), 'text/csv;charset=utf-8');

  return (
    <div className="space-y-8">
      <CourseSubNav courseId={course.id} active="home" teamId={member.teamId} />

      <PageHeader
        eyebrow={<Crumbs items={[{ label: 'Home', href: '/' }, { label: course.title, href: `/courses/${course.id}` }, { label: 'Evidence ledger' }]} />}
        title="Evidence ledger"
        lede={
          m.verifiable > 0
            ? `${m.verified} of ${m.verifiable} checkable steps verified from pasted output (${m.verificationRate}%), ${m.artifacts} file${m.artifacts === 1 ? '' : 's'} hashed. Output matching a step's expected tokens was pasted, hashed and timestamped by this account — that is the claim, and no more.`
            : 'Nothing verifiable yet. Steps that carry expected output turn green when you paste what your machine printed; files you hash into the custody log land here too.'
        }
        trailing={
          <Button variant="secondary" size="sm" onClick={exportCsv} className="flex items-center gap-1.5" disabled={steps.length + files.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <WeekRail
        items={[
          { week: -1, label: 'All' },
          ...weeks.map((w) => ({ week: w.number, label: w.number === 0 ? 'Setup' : `Week ${w.number}`, advanced: isAdvancedWeek(course, w.number) })),
        ]}
        selected={week === 'all' ? -1 : week}
        onSelect={(w) => setWeek(w === -1 ? 'all' : w)}
        dots
        aria-label="Filter the ledger by week"
      />

      <section className="space-y-3" aria-labelledby="ledger-steps">
        <h2 id="ledger-steps" className="text-xl font-semibold tracking-tight text-ink">
          Steps <span className="text-base font-normal text-muted">· {steps.length}</span>
        </h2>
        <Surface padding="none" className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th scope="col" className="px-4 py-2.5">Week</th>
                <th scope="col" className="px-4 py-2.5">Task · step</th>
                <th scope="col" className="px-4 py-2.5">Method</th>
                <th scope="col" className="px-4 py-2.5 text-right">Matched</th>
                <th scope="col" className="px-4 py-2.5 text-right">Attempts</th>
                <th scope="col" className="px-4 py-2.5">When</th>
                <th scope="col" className="px-4 py-2.5"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {steps.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    No step records {week === 'all' ? 'yet' : 'for this week'}.
                  </td>
                </tr>
              )}
              {steps.map((r) => (
                <tr key={`${r.taskId}::${r.stepId}`} data-week={r.week}>
                  <td className="px-4 py-2.5 tabular-nums text-muted">{r.week}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-ink">{r.stepTitle}</div>
                    <div className="text-xs text-muted">{r.taskTitle}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <PixelBadge tone={r.verified ? 'accent' : 'muted'}>{r.method}</PixelBadge>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.total > 0 ? `${r.matched}/${r.total}` : '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.attempts}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted">{r.verifiedAt ? localStamp(r.verifiedAt) : '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={r.href} className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-accent hover:underline">
                      {r.verified ? 'Open' : 'Re-verify'} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      </section>

      <section className="space-y-3" aria-labelledby="ledger-files">
        <h2 id="ledger-files" className="text-xl font-semibold tracking-tight text-ink">
          Hashed files <span className="text-base font-normal text-muted">· {files.length}</span>
        </h2>
        <Surface padding="none" className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th scope="col" className="px-4 py-2.5">Week</th>
                <th scope="col" className="px-4 py-2.5">File</th>
                <th scope="col" className="px-4 py-2.5">SHA-256</th>
                <th scope="col" className="px-4 py-2.5">Named to convention</th>
                <th scope="col" className="px-4 py-2.5">Hashed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {files.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No hashed files {week === 'all' ? 'yet' : 'for this week'}. The Deliverables page hashes them.
                  </td>
                </tr>
              )}
              {files.map((a) => (
                <tr key={a.sha256}>
                  <td className="px-4 py-2.5 tabular-nums text-muted">{a.week ?? '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink">{a.filename}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-2 font-mono text-xs text-muted">
                      {a.sha256.slice(0, 12)}…
                      <CopyButton text={a.sha256} label="Copy hash" />
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <PixelBadge tone={a.nameOk ? 'accent' : 'muted'}>{a.nameOk ? 'Yes' : 'No'}</PixelBadge>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted">{a.hashedAt ? localStamp(a.hashedAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      </section>
    </div>
  );
}

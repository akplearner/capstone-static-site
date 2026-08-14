'use client';

import Link from 'next/link';
import { Download, Printer, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/Spinner';
import { DemoBanner } from '@/components/auth/DemoBanner';
import { CapstoneStone } from '@/components/quarry/CapstoneStone';
import { VerificationBar } from '@/components/catalog/VerificationBar';
import { courseRepo, progressRepo, docsRepo, evidenceRepo, pathRepo } from '@/lib/data';
import { deriveCrewProgress } from '@/lib/game';
import { isCapstoneFiled } from '@/lib/deliverableChain';
import { getTasksByRole } from '@/lib/course-helpers';
import { regionFor, seamFor, stoneStage } from '@/lib/quarry';
import { pathById } from '@/lib/catalog/paths';
import { courseMetrics, portfolioSummary, type CourseMetrics } from '@/lib/metrics';
import { getFrameworkLabel } from '@/lib/utils';
import { useClientStore, useHydrated, EMPTY_ARRAY } from '@/lib/useClientStore';
import { useAuth } from '@/lib/useAuth';
import { useUserSync } from '@/lib/useUserSync';
import type { EvidenceArtifact } from '@/lib/data';
import type { StoneStage } from '@/lib/quarry';

/**
 * The showcase — private by default, exported by choice.
 *
 * Everything here is derived from the ledger, so it can only say what the student
 * actually did. The claim it makes is bounded on purpose: a verified step means
 * output matching the expected tokens was pasted, hashed and timestamped, not
 * that a command provably ran on real hardware. Employers deserve the precise
 * version, and overstating it would make the whole record worthless.
 *
 * Print CSS turns this into a clean PDF via the browser's own "Save as PDF", so
 * there is no PDF dependency to carry.
 */
interface Row {
  courseTitle: string;
  courseId: string;
  role: string;
  stage: StoneStage;
  metrics: CourseMetrics;
  artifacts: EvidenceArtifact[];
  capstoneFiled: boolean;
  /** Palette keys for the row's capstone stone. This page draws the only
   *  genuinely derived stages 0–5 in the product, and until now it set neither
   *  attribute — so every stone here rendered in the fallback greys regardless of
   *  which vendor the capstone belonged to. */
  region: string;
  seam: string;
}

function buildRow(courseId: string): Row | null {
  const course = courseRepo.get(courseId);
  if (!course) return null;
  const member = progressRepo.getContext(course.id);
  if (!member) return null;

  const keySet = progressRepo.getCompletionKeySet(course.id, member.memberId);
  const weekStats: Record<number, number> = {};
  const taskStats: Record<string, number> = {};
  [...course.weeks]
    .sort((a, b) => a.number - b.number)
    .forEach((w) => {
      weekStats[w.number] = progressRepo.getWeekCompletion(course, member.memberId, member.role, w.number, keySet);
      getTasksByRole(course, member.role, w.number).forEach((t) => {
        taskStats[t.id] = progressRepo.getTaskPercent(course.id, member.memberId, t, keySet);
      });
    });

  const capstoneFiled = isCapstoneFiled(course.id, docsRepo.get(course.id, member.teamId));
  const crew = deriveCrewProgress(course, member.role, weekStats, taskStats, capstoneFiled);
  const roleName = course.roles.find((r) => r.id === member.role)?.name ?? member.role;
  return {
    courseTitle: course.title,
    courseId: course.id,
    role: roleName,
    stage: crew.stage,
    capstoneFiled,
    region: regionFor(course).key,
    seam: seamFor(course),
    metrics: courseMetrics({
      course,
      role: member.role,
      taskPercent: taskStats,
      evidence: evidenceRepo.getSteps(course.id, member.memberId),
      artifacts: evidenceRepo.getArtifacts(course.id, member.memberId),
    }),
    artifacts: evidenceRepo.getArtifacts(course.id, member.memberId),
  };
}

export default function PortfolioPage() {
  const hydrated = useHydrated();
  const { user } = useAuth();
  useUserSync();

  const rows = useClientStore<Row[]>(
    () => courseRepo.list().map((c) => buildRow(c.id)).filter((r): r is Row => r !== null),
    EMPTY_ARRAY
  );
  const memberId = useClientStore<string>(
    () => courseRepo.list().map((c) => progressRepo.getContext(c.id)?.memberId).find(Boolean) ?? 'local',
    'local'
  );
  const chosen = useClientStore<{ pathId: string; chosenAt: number } | null>(
    () => pathRepo.get(memberId),
    null
  );

  const summary = portfolioSummary(rows.map((r) => r.metrics));
  const path = chosen ? pathById(chosen.pathId) : undefined;
  const allArtifacts = rows.flatMap((r) => r.artifacts).sort((a, b) => b.hashedAt - a.hashedAt);
  const name = user?.email ?? 'Capstone portfolio';

  function exportJson() {
    const blob = new Blob(
      [JSON.stringify({ generatedAt: new Date().toISOString(), path: path?.id ?? null, summary, courses: rows }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'capstone-portfolio.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hydrated) return <Skeleton className="h-96 w-full" />;
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Nothing to show yet"
        message="Your portfolio fills up as you verify steps and hash evidence. Start a capstone first."
        href="/explore"
        cta="Explore certs"
      />
    );
  }

  return (
    <div className="space-y-8">
      <DemoBanner />
      {/* Controls — hidden when printing. */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Portfolio</h1>
          <p className="text-muted">Private to you. Export it when you want to show someone.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex items-center gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Save as PDF
          </Button>
          <Button variant="secondary" className="flex items-center gap-2" onClick={exportJson}>
            <Download className="h-4 w-4" /> Export JSON
          </Button>
        </div>
      </div>

      <article className="space-y-8 rounded-[var(--radius-card)] border border-line bg-panel p-8 print:border-0 print:p-0">
        <header className="border-b border-line pb-5">
          <p className="eyebrow">Capstone evidence record</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">{name}</h2>
          {path && (
            <p className="mt-1 text-muted">
              Path: <span className="font-medium text-ink">{path.name}</span> — {path.role}
            </p>
          )}
          <p className="mt-3 max-w-3xl text-sm text-muted">
            Each “verified” step below means output matching the expected result was pasted, hashed
            and timestamped at the time the work was done. Hashes are of the student’s own output
            and files; the files themselves stay on their machine and can be re-hashed to confirm
            they are unchanged.
          </p>
        </header>

        {/* Headline numbers. */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Fig label="Steps verified" value={`${summary.verified}`} sub={`of ${summary.verifiable} checkable`} />
          <Fig label="Overall rate" value={`${summary.verificationRate}%`} sub="verified from output" />
          <Fig label="Evidence files" value={`${summary.artifacts}`} sub="hashed into custody" />
          <Fig label="Capstones" value={`${rows.filter((r) => r.capstoneFiled).length}`} sub={`of ${rows.length} started`} />
        </section>

        {/* Skills actually proved. */}
        {summary.frameworksVerified.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-ink">Frameworks proved</h3>
            <p className="text-sm text-muted">
              Credited only where a verified step touched them — not merely attempted.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {summary.frameworksVerified.map((f) => (
                <span key={f} className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent-ink">
                  <ShieldCheck className="h-3.5 w-3.5" /> {getFrameworkLabel(f)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Per-capstone detail. */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-ink">Capstones</h3>
          {rows.map((r) => (
            <div
              key={r.courseId}
              data-region={r.region}
              data-seam={r.seam}
              className="rounded-lg border border-line p-4"
            >
              <div className="flex items-start gap-3">
                <CapstoneStone stage={r.stage} size={48} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="font-semibold text-ink">{r.courseTitle}</h4>
                    <span className="font-mono text-xs text-muted">{stoneStage(r.stage).name}</span>
                  </div>
                  <p className="text-sm text-muted">Role: {r.role}</p>
                  <div className="mt-3">
                    <VerificationBar m={r.metrics} />
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-muted">
                    {r.metrics.stepsDone}/{r.metrics.stepsTotal} steps · {r.metrics.artifacts} artifacts ·{' '}
                    {r.metrics.activeDays} days worked
                    {r.metrics.attempts > 0 && ` · ${r.metrics.attempts} verification attempts`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* The custody log — the part an assessor would actually check. */}
        {allArtifacts.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-ink">Evidence custody log</h3>
            <p className="text-sm text-muted">
              Files hashed at collection time. Re-hashing any of these must produce the same digest.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 pr-3 font-medium">File</th>
                    <th className="py-2 pr-3 font-medium">Hashed</th>
                    <th className="py-2 font-medium">SHA-256</th>
                  </tr>
                </thead>
                <tbody>
                  {allArtifacts.map((a) => (
                    <tr key={`${a.courseId}-${a.sha256}`} className="border-b border-line/60 align-top">
                      <td className="py-2 pr-3">
                        <span className="font-medium text-ink">{a.filename}</span>
                        {!a.nameOk && (
                          <span className="ml-2 rounded bg-panel-2 px-1.5 py-0.5 text-[10px] text-muted">
                            off-convention name
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap py-2 pr-3 text-muted">
                        {a.hashedAt ? new Date(a.hashedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2 font-mono text-[11px] break-all text-muted">{a.sha256}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <footer className="border-t border-line pt-4 text-xs text-muted">
          Generated {new Date().toLocaleDateString()} from this student’s own evidence ledger.
          Verification is client-side self-verification against expected output; it is not a claim
          that commands were executed on audited infrastructure.
        </footer>
      </article>

      <div className="print:hidden">
        <Link href="/dashboard">
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

function Fig({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <div className="eyebrow">{label}</div>
      <div className="mt-0.5 text-2xl font-bold text-ink">{value}</div>
      <div className="text-xs text-muted">{sub}</div>
    </div>
  );
}

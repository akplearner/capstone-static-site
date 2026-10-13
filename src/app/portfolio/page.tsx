'use client';

import Link from 'next/link';
import { Award, Download, Printer, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/Spinner';
import { DemoBanner } from '@/components/auth/DemoBanner';
import { CapstoneStone } from '@/components/quarry/CapstoneStone';
import { RelicTrophy, SealLedger } from '@/components/quarry/items';
import { VerificationBar } from '@/components/catalog/VerificationBar';
import { courseRepo, progressRepo, docsRepo, evidenceRepo, pathRepo, statusRepo, submissionsRepo, reviewRepo, taskReportsRepo, stepNotesRepo } from '@/lib/data';
import { courseDocument, bareDocument } from '@/lib/content/docs';
import { certOf, deliverablesOf, skillsOf } from '@/lib/content/read';
import { skillProfile, skillPortfolio, type SkillProfile } from '@/lib/skillProfile';
import { SkillsSections } from '@/components/skills/SkillsSections';
import { KpiTable } from '@/components/skills/KpiTable';
import { kpiBoard, workRoleMeasure, type KpiBoard } from '@/lib/kpiBoard';
import { sha256Text } from '@/lib/evidenceLedger';
import { MEMBER_PROFILE_SCHEMA, ONTOLOGY_VERSION } from '@/lib/docs/ontology';
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
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';

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
  /** Cleared vs total graded weeks — `buildRow` already derives the full crew
   *  progress for the stage; these two were being computed and thrown away. */
  weeksCleared: number;
  weeksTotal: number;
  /** R107: the member's standing against the course's registries. */
  skills: SkillProfile;
  /** R108: the sixteen KPIs, measured against the role's first work role; the work roles; the exam the course prepares for. */
  board: KpiBoard;
  workRoles: string[];
  examCode: string | null;
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

  const savedDocs = docsRepo.get(course.id, member.teamId);
  const capstoneFiled = isCapstoneFiled(course.id, savedDocs);
  const crew = deriveCrewProgress(course, member.role, weekStats, taskStats, capstoneFiled);
  const roleName = course.roles.find((r) => r.id === member.role)?.name ?? member.role;
  const doc = courseDocument(course.id) ?? bareDocument(course);
  const currentWeek = Math.max(0, ...course.weeks.filter((w) => (weekStats[w.number] ?? 0) > 0).map((w) => w.number));
  const skills = skillProfile({
    course,
    role: member.role,
    memberId: member.memberId,
    isStepDone: (t, s) => progressRepo.isStepComplete(course.id, member.memberId, t, s, keySet),
    evidence: evidenceRepo.getSteps(course.id, member.memberId),
    artifacts: evidenceRepo.getArtifacts(course.id, member.memberId),
    registry: skillsOf(doc),
    cert: certOf(doc),
    deliverables: deliverablesOf(doc),
    team: { docs: savedDocs ?? {}, status: statusRepo.list(course.id, member.teamId), submissions: submissionsRepo.list(course.id, member.teamId), reviews: reviewRepo.list(course.id, member.teamId), currentWeek },
    own: { notes: Object.values(stepNotesRepo.getAll(course.id, member.memberId)), reports: taskReportsRepo.list(course.id) },
  });
  const registry = skillsOf(doc);
  const workRoles = registry.WORK_ROLE_OF[member.role] ?? [];
  const firstRole = registry.WORK_ROLES.find((w) => w.id === workRoles[0]);
  const board = kpiBoard({
    profile: skills,
    registry,
    cert: certOf(doc),
    measure: firstRole ? workRoleMeasure(firstRole) : { kind: 'work-role', id: 'role.none', label: '—', requiredCompetencies: [] },
    outcome: { capstoneFiled, weeksCleared: crew.weeksCleared, weeksTotal: crew.weeksTotal },
    ontologyVersion: ONTOLOGY_VERSION,
  });
  return {
    skills,
    board,
    workRoles,
    examCode: certOf(doc).CERT?.code ?? null,
    courseTitle: course.title,
    courseId: course.id,
    role: roleName,
    stage: crew.stage,
    capstoneFiled,
    region: regionFor(course).key,
    seam: seamFor(course),
    weeksCleared: crew.weeksCleared,
    weeksTotal: crew.weeksTotal,
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
  const skills = skillPortfolio(rows.map((r) => r.skills));
  // The words of the skills sections, off a document (the same in every document).
  const firstCourse = rows[0] ? courseRepo.get(rows[0].courseId) : undefined;
  const words = firstCourse ? skillsOf(courseDocument(firstCourse.id) ?? bareDocument(firstCourse)) : undefined;
  const path = chosen ? pathById(chosen.pathId) : undefined;
  const allArtifacts = rows.flatMap((r) => r.artifacts).sort((a, b) => b.hashedAt - a.hashedAt);
  const name = user?.email ?? 'Capstone portfolio';

  // R107: the member-profile export, published as content/schemas/member-profile.schema.json. Unsigned: attestation needs validators.
  // R108: the courses carry the sixteen KPIs and the work roles they prepare for.
  const buildProfile = () => ({
    schema: MEMBER_PROFILE_SCHEMA,
    ontologyVersion: ONTOLOGY_VERSION,
    generatedAt: new Date().toISOString(),
    subject: { display: name },
    claim: words?.COPY.exportClaim ?? '',
    path: path?.id ?? null,
    summary: { ...summary, ...skills },
    courses: rows.map((r) => ({ courseId: r.courseId, title: r.courseTitle, role: r.role, stage: r.stage, capstoneFiled: r.capstoneFiled, metrics: r.metrics, skills: r.skills, artifacts: r.artifacts, workRoles: r.workRoles, kpis: r.board.kpis })),
    signature: null,
  });
  const download = (filename: string, body: unknown) => {
    const blob = new Blob([JSON.stringify(body, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  function exportJson() {
    download('capstone-portfolio.json', buildProfile());
  }

  // R108: an Open Badges 3.0 envelope around the same profile, published as
  // content/schemas/credential.schema.json. It carries no proof and the schema
  // admits none: unsigned by construction, and the claim says so.
  async function exportCredential() {
    if (!words) return;
    const profile = buildProfile();
    const digest = await sha256Text(JSON.stringify(profile));
    const origin = window.location.origin;
    const alignment = [
      ...rows.flatMap((r) => r.skills.rows.skills.filter((s) => s.level === 'verified' || s.level === 'reviewed').map((s) => ({ type: ['Alignment'], targetName: s.label, targetCode: s.id, targetFramework: 'capstone-ontology' }))),
      ...rows.flatMap((r) => (r.examCode ? r.skills.rows.domains.filter((d) => d.level === 'verified' || d.level === 'reviewed').map((d) => ({ type: ['Alignment'], targetName: d.label, targetCode: `${r.examCode}.${d.id}`, targetFramework: r.examCode as string })) : [])),
      ...rows.flatMap((r) => {
        const reg = skillsOf(courseDocument(r.courseId) ?? bareDocument(courseRepo.get(r.courseId)!));
        return r.workRoles.map((id) => reg.WORK_ROLES.find((w) => w.id === id)).filter((w): w is NonNullable<typeof w> => !!w).map((w) => ({ type: ['Alignment'], targetName: w.label, targetCode: w.niceId ?? w.id, targetFramework: 'NICE', targetUrl: w.url }));
      }),
    ];
    const seen = new Set<string>();
    download('capstone-credential.json', {
      '@context': ['https://www.w3.org/ns/credentials/v2', 'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json'],
      type: ['VerifiableCredential', 'OpenBadgeCredential'],
      issuer: { id: origin, type: 'Profile', name: words.COPY.board.issuer },
      validFrom: profile.generatedAt,
      credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
          id: `${origin}/achievements/member-profile`,
          type: ['Achievement'],
          name: words.COPY.board.credentialName,
          description: words.COPY.board.credentialClaim,
          criteria: { narrative: words.COPY.exportClaim },
          alignment: alignment.filter((a) => (seen.has(a.targetCode) ? false : (seen.add(a.targetCode), true))),
        },
        result: rows.flatMap((r) => r.board.kpis.map((k) => ({ type: ['Result'], resultDescription: `${r.courseId} ${k.id}`, value: k.loaded ? `${k.value} of ${k.of}` : '—' }))),
      },
      evidence: [{ type: ['Evidence'], id: `sha256:${digest}`, name: 'capstone-portfolio.json', description: words.COPY.exportSchemaNote }],
      claim: words.COPY.board.credentialClaim,
    });
  }

  if (!hydrated) return <Skeleton className="h-96 w-full" />;
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Nothing to show yet"
        message="Your portfolio fills up as you verify steps and hash evidence. Start a capstone first."
        miner="idle"
        href="/explore"
        cta="Explore certs"
      />
    );
  }

  return (
    <div className="space-y-8">
      <DemoBanner />
      {/* Controls — hidden when printing. */}
      <PageHeader
        className="print:hidden"
        title="Portfolio"
        lede="Private to you. Export it when you want to show someone."
        trailing={
          <>
            <Button variant="secondary" className="flex items-center gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Save as PDF
            </Button>
            <Button variant="secondary" className="flex items-center gap-2" onClick={exportJson}>
              <Download className="h-4 w-4" /> Export JSON
            </Button>
            <Button variant="secondary" className="flex items-center gap-2" onClick={() => void exportCredential()} data-export-credential>
              <Award className="h-4 w-4" /> {words?.COPY.board.exportCredential}
            </Button>
          </>
        }
      />

      <Surface as="article" padding="none" className="space-y-8 p-8 print:border-0 print:p-0">
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

        {/* R107: skills proved, tools used, procedures followed to standard, standards, exam domains, tactics and practices. */}
        {words && <SkillsSections courses={rows.map((r) => ({ courseId: r.courseId, title: r.courseTitle, profile: r.skills }))} portfolio={skills} content={words} />}

        {/* Per-capstone detail. */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-ink">Capstones</h3>
          {rows.map((r) => (
            <div
              key={r.courseId}
              data-region={r.region}
              data-seam={r.seam}
              className="rounded-lg depth-edge p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <CapstoneStone stage={r.stage} size={48} />
                  {/* One socket per graded week, sealed as each week clears. */}
                  {r.weeksTotal > 0 && (
                    <SealLedger sealed={r.weeksCleared} total={r.weeksTotal} size={44} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="font-semibold text-ink">{r.courseTitle}</h4>
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted">
                      {/* The trophy only exists once the capstone is actually
                          filed — delivered, not merely finished. */}
                      {r.capstoneFiled && <RelicTrophy size={22} className="shrink-0" />}
                      {stoneStage(r.stage).name}
                    </span>
                  </div>
                  <p className="text-sm text-muted">Role: {r.role}</p>
                  <div className="mt-3">
                    <VerificationBar m={r.metrics} />
                  </div>
                  <p className="mt-2 font-mono text-2xs text-muted">
                    {r.metrics.stepsDone}/{r.metrics.stepsTotal} steps · {r.metrics.artifacts} artifacts ·{' '}
                    {r.metrics.activeDays} days worked
                    {r.metrics.attempts > 0 && ` · ${r.metrics.attempts} verification attempts`}
                  </p>
                </div>
              </div>
              {/* R108: the sixteen as a table, per capstone; the Skill board is where they move. */}
              {words && (
                <div className="mt-4 break-inside-avoid" data-kpi-portfolio={r.courseId}>
                  <KpiTable board={r.board} defs={words.KPIS} families={words.KPI_FAMILIES} copy={words.COPY.board} title={`${words.COPY.board.tableTitle} · ${r.courseTitle}`} />
                  <Link href={`/courses/${r.courseId}/skills`} className="mt-2 inline-block text-sm font-medium text-accent hover:underline print:hidden">
                    {words.COPY.board.title} →
                  </Link>
                </div>
              )}
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
                    <th scope="col" className="py-2 pr-3 font-medium">File</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Hashed</th>
                    <th scope="col" className="py-2 font-medium">SHA-256</th>
                  </tr>
                </thead>
                <tbody>
                  {allArtifacts.map((a) => (
                    <tr key={`${a.courseId}-${a.sha256}`} className="border-b border-line/60 align-top">
                      <td className="py-2 pr-3">
                        <span className="font-medium text-ink">{a.filename}</span>
                        {!a.nameOk && (
                          <span className="ml-2 rounded bg-panel-2 px-1.5 py-0.5 text-3xs text-muted">
                            off-convention name
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap py-2 pr-3 text-muted">
                        {a.hashedAt ? new Date(a.hashedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2 font-mono text-2xs break-all text-muted">{a.sha256}</td>
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
      </Surface>

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
    <div className="rounded-lg depth-edge p-3">
      <div className="eyebrow">{label}</div>
      <div className="mt-0.5 text-2xl font-bold text-ink">{value}</div>
      <div className="text-xs text-muted">{sub}</div>
    </div>
  );
}

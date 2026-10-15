'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, FileCheck2, FolderGit2, ListChecks, ShieldCheck, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { RoleIcon } from '@/components/team/RoleIcon';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/Spinner';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { CapstoneStonePanel } from '@/components/quarry/CapstoneStone';
import { SealLedger } from '@/components/quarry/items';
import { SignInPanel } from '@/components/auth/SignInPanel';
import { DemoBanner } from '@/components/auth/DemoBanner';
import { PathRail, PathPicker } from '@/components/catalog/PathRail';
import { VerificationBar } from '@/components/catalog/VerificationBar';
import { courseRepo, progressRepo, docsRepo, evidenceRepo, pathRepo, statusRepo, submissionsRepo, reviewRepo, taskReportsRepo, stepNotesRepo } from '@/lib/data';
import { courseDocument, bareDocument } from '@/lib/content/docs';
import { certOf, deliverablesOf, skillsOf } from '@/lib/content/read';
import { skillProfile, skillPortfolio } from '@/lib/skillProfile';
import { defaultMeasure, kpiBoard, sumKpi } from '@/lib/kpiBoard';
import { MEMBER_PROFILE_SCHEMA, ONTOLOGY_VERSION } from '@/lib/docs/ontology';
import { buildCredential, buildMemberProfile, profileJson, CREDENTIAL_FILENAME, PROFILE_FILENAME, type MemberCourseRow } from '@/lib/memberExport';
import { sha256Text } from '@/lib/evidenceLedger';
import { downloadText } from '@/lib/download';
import { DomainStrip } from '@/components/skills/DomainStrip';
import { KpiPack } from '@/components/skills/KpiPack';
import { DtoChip } from '@/components/skills/DtoChip';
import { ShareLinkDialog } from '@/components/share/ShareLinkDialog';
import { deriveCrewProgress } from '@/lib/game';
import { isCapstoneFiled } from '@/lib/deliverableChain';
import { getTasksByRole, phaseTag } from '@/lib/course-helpers';
import { regionFor, seamFor, phaseForWeek } from '@/lib/quarry';
import { resolveActiveWeek } from '@/lib/resume';
import { entryForCourse } from '@/lib/catalog';
import { levelDef } from '@/lib/catalog/levels';
import { pathById } from '@/lib/catalog/paths';
import { courseMetrics, portfolioSummary } from '@/lib/metrics';
import { useClientStore, useHydrated, EMPTY_ARRAY } from '@/lib/useClientStore';
import { useAuth } from '@/lib/useAuth';
import { useUserSync } from '@/lib/useUserSync';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { Course, Member } from '@/lib/types';
import type { CrewProgress } from '@/lib/game';
import { PageHeader } from '@/components/ui/PageHeader';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { DUR, EASE } from '@/lib/motion';
import { Surface, surfaceVariants } from '@/components/ui/Surface';

// The signed-in home: every capstone you've started, how far each stone is cut,
// and — the number that actually matters — how much of it you proved against
// real output rather than ticking a box.
// R109: a card is an export row (metrics, skills, artifacts, the KPI board, the
// work roles) plus what only this page shows.
interface CourseCard extends MemberCourseRow {
  course: Course;
  member: Member;
  crew: CrewProgress;
  activeWeek: number;
  level?: string;
}

function buildCard(course: Course): CourseCard | null {
  const member = progressRepo.getContext(course.id);
  if (!member) return null;

  const keySet = progressRepo.getCompletionKeySet(course.id, member.memberId);
  const weekStats: Record<number, number> = {};
  const taskStats: Record<string, number> = {};
  [...course.weeks]
    .sort((a, b) => a.number - b.number)
    .forEach((w) => {
      weekStats[w.number] = progressRepo.getWeekCompletion(
        course,
        member.memberId,
        member.role,
        w.number,
        keySet
      );
      getTasksByRole(course, member.role, w.number).forEach((t) => {
        taskStats[t.id] = progressRepo.getTaskPercent(course.id, member.memberId, t, keySet);
      });
    });

  const savedDocs = docsRepo.get(course.id, member.teamId);
  const capstoneFiled = isCapstoneFiled(course.id, savedDocs);
  const crew = deriveCrewProgress(course, member.role, weekStats, taskStats, capstoneFiled);
  const artifacts = evidenceRepo.getArtifacts(course.id, member.memberId);
  // R113: the platform's receipts (null offline) and the member's re-hash checks.
  const receipts = evidenceRepo.getReceipts(course.id, member.memberId);
  const rehashes = evidenceRepo.getRehashes(course.id, member.memberId);
  const metrics = courseMetrics({
    course,
    role: member.role,
    taskPercent: taskStats,
    evidence: evidenceRepo.getSteps(course.id, member.memberId),
    artifacts,
    receipts,
    rehashes,
  });
  const activeWeek = resolveActiveWeek(course, member.role, weekStats, null);
  // R107: the registries come from the course document; the facts from the
  // repositories hydrateUser fills (team and own facts arrive with it).
  const doc = courseDocument(course.id) ?? bareDocument(course);
  const registry = skillsOf(doc);
  const cert = certOf(doc);
  const profile = skillProfile({
    course,
    role: member.role,
    memberId: member.memberId,
    isStepDone: (t, s) => progressRepo.isStepComplete(course.id, member.memberId, t, s, keySet),
    evidence: evidenceRepo.getSteps(course.id, member.memberId),
    artifacts,
    registry,
    cert,
    deliverables: deliverablesOf(doc),
    team: {
      docs: savedDocs ?? {},
      status: statusRepo.list(course.id, member.teamId),
      submissions: submissionsRepo.list(course.id, member.teamId),
      reviews: reviewRepo.list(course.id, member.teamId),
      currentWeek: activeWeek,
    },
    own: { notes: Object.values(stepNotesRepo.getAll(course.id, member.memberId)), reports: taskReportsRepo.list(course.id) },
    // R111: the currency flag needs the page's clock; buildCard is a plain function, not a component body.
    asOf: Date.now(),
    receipts,
    rehashes,
  });
  // R109: the sixteen KPIs against the role's default measure, and the work
  // roles as rows of this course's own document (the export writes their ids).
  const board = kpiBoard({
    profile,
    registry,
    cert,
    measure: defaultMeasure(registry, member.role),
    outcome: { capstoneFiled, weeksCleared: crew.weeksCleared, weeksTotal: crew.weeksTotal },
    ontologyVersion: ONTOLOGY_VERSION,
  });
  const workRoles = (registry.WORK_ROLE_OF[member.role] ?? []).flatMap((id) => registry.WORK_ROLES.filter((w) => w.id === id));
  const entry = entryForCourse(course.id);
  return {
    course,
    member,
    crew,
    metrics,
    skills: profile,
    artifacts,
    board,
    workRoles,
    courseId: course.id,
    title: course.title,
    role: course.roles.find((r) => r.id === member.role)?.name ?? member.role,
    stage: crew.stage,
    examCode: cert.CERT?.code ?? null,
    activeWeek,
    level: entry ? levelDef(entry.level).name : undefined,
    capstoneFiled,
  };
}

export default function DashboardPage() {
  const hydrated = useHydrated();
  const { user, loading, profile } = useAuth();
  // R114: the candidate-link dialog (cloud mode only).
  const [sharing, setSharing] = useState(false);
  // Cross-course hydration. Without this the cloud cache is only ever filled by
  // a course page, so a signed-in student landing here first saw an empty
  // dashboard — see src/lib/useUserSync.ts.
  useUserSync();

  const cards = useClientStore<CourseCard[]>(
    () => courseRepo.list().map(buildCard).filter((c): c is CourseCard => c !== null),
    EMPTY_ARRAY
  );
  const chosen = useClientStore<{ pathId: string; chosenAt: number } | null>(
    () => pathRepo.get(cards[0]?.member.memberId ?? 'local'),
    null
  );

  const needsSignIn = isSupabaseConfigured() && !loading && !user;
  const summary = portfolioSummary(cards.map((c) => c.metrics));
  const skills = skillPortfolio(cards.map((c) => c.skills));
  // R109: two of the sixteen, summed across every capstone started.
  const boards = cards.map((c) => c.board);
  const commands = sumKpi(boards, 'kpi.execution.commands-verified');
  const procedures = sumKpi(boards, 'kpi.procedure.followed-to-standard');
  // R111: distinct skills whose last verification is inside the currency window, across courses.
  const currentSkills = new Set(cards.flatMap((c) => c.skills.rows.skills.filter((r) => r.current).map((r) => r.id))).size;
  // The words of the skills surfaces, off the first course's document (they are the same in every document).
  const words = cards[0] ? skillsOf(courseDocument(cards[0].course.id) ?? bareDocument(cards[0].course)) : undefined;
  const completedCourseIds = new Set(cards.filter((c) => c.capstoneFiled).map((c) => c.course.id));
  const path = chosen ? pathById(chosen.pathId) : undefined;
  const memberId = cards[0]?.member.memberId ?? 'local';
  // R109: the member-profile export and the credential, built by the same
  // module as the portfolio's (src/lib/memberExport.ts), at the click.
  const exportInput = (copy: NonNullable<typeof words>['COPY']) => ({ subject: user?.email ?? 'Capstone portfolio', copy, pathId: path?.id ?? null, summary, skills, rows: cards, generatedAt: new Date().toISOString() });
  async function exportCredential() {
    if (!words) return;
    const profile = buildMemberProfile(exportInput(words.COPY));
    const digest = await sha256Text(profileJson(profile));
    downloadText(CREDENTIAL_FILENAME, JSON.stringify(buildCredential({ profile, rows: cards, copy: words.COPY, origin: window.location.origin, digest }), null, 2), 'application/json');
  }
  // R114: a link's copy carries the display name, never the email (the share function sets it again).
  const shareInput = (copy: NonNullable<typeof words>['COPY']) => ({ ...exportInput(copy), subject: profile?.displayName?.trim() || 'Capstone Quarry member' });
  const shareProfile = () => buildMemberProfile(shareInput(words!.COPY)) as unknown as Record<string, unknown>;
  const shareCredential = async () => {
    const shared = buildMemberProfile(shareInput(words!.COPY));
    const digest = await sha256Text(profileJson(shared));
    return buildCredential({ profile: shared, rows: cards, copy: words!.COPY, origin: window.location.origin, digest }) as unknown as Record<string, unknown>;
  };

  return (
    <div className="space-y-8">
      <DemoBanner />
      <PageHeader
        title="Your dashboard"
        lede="Every capstone you’ve started, how far the stone is cut, and how much of it you proved against real output."
      />

      {!hydrated ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : needsSignIn ? (
        <SignInPanel
          title="Sign in to see your dashboard"
          subtitle="Your capstones, verification record and evidence are saved to your account."
          next="/dashboard"
        />
      ) : cards.length === 0 ? (
        <EmptyState
          title="No capstones yet"
          message="You haven’t started a capstone. Explore the catalog and pick a cert to cut."
          miner="idle"
          href="/explore"
          cta="Explore certs"
        />
      ) : (
        <>
          <InstallPrompt />
          {/* What you've proved overall. The two stats that are ratios with a
              known denominator draw as rings — a 42-of-96 is legible at a
              glance where "42 / of 96 checkable" as two lines of text was not.
              Evidence and days have no denominator, so they stay numbers. */}
          <section aria-labelledby="dash-record" className="space-y-3">
            <SectionLabel id="dash-record">Your record</SectionLabel>
            {/* One flat strip, not four boxes: a summary should be readable,
                not the heaviest object on the page. */}
            <Surface as="dl" variant="flat" padding="none" className="grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
            <Stat
              icon={ShieldCheck}
              label="Steps verified"
              value={`${summary.verified}`}
              sub={summary.verifiable > 0 ? `of ${summary.verifiable} checkable${summary.receipted ? ` · ${summary.receipted} receipted` : ''}` : 'none checkable yet'}
              ring={summary.verifiable > 0 ? { value: summary.verified, max: summary.verifiable } : undefined}
            />
            <Stat
              icon={FileCheck2}
              label="Evidence hashed"
              value={`${summary.artifacts}`}
              sub="files in your custody log"
            />
            <Stat
              icon={FolderGit2}
              label="Capstones delivered"
              value={`${completedCourseIds.size}`}
              sub={`of ${cards.length} started`}
              ring={cards.length > 0 ? { value: completedCourseIds.size, max: cards.length } : undefined}
            />
            <Stat
              icon={Compass}
              label="Days worked"
              value={`${summary.activeDays}`}
              sub="measured, never scored"
            />
            {words && (
              <Stat
                icon={ShieldCheck}
                label={words.COPY.tiles.skillsVerified}
                value={`${skills.skillsVerified.length}`}
                sub={`${words.COPY.recordSkills} ${skills.skillsPractised.length} · ${currentSkills} ${words.COPY.board.current}`}
                ring={skills.skillsPractised.length > 0 ? { value: skills.skillsVerified.length, max: skills.skillsPractised.length } : undefined}
              />
            )}
            {words && (
              <Stat icon={FileCheck2} label={words.COPY.tiles.toolsUsed} value={`${skills.toolsUsed.length}`} sub={words.COPY.recordTools} />
            )}
            {/* R109: two of the sixteen KPIs across every capstone. A team fact
                not handed in says so rather than printing a zero. */}
            {words && (
              <Stat
                icon={Terminal}
                label={words.COPY.tiles.commandsVerified}
                value={`${commands.value}`}
                sub={commands.of > 0 ? `of ${commands.of} ${words.COPY.recordCommands}` : words.COPY.emptyDimension}
                ring={commands.of > 0 ? { value: commands.value, max: commands.of } : undefined}
              />
            )}
            {words && (
              <Stat
                icon={ListChecks}
                label={words.COPY.tiles.proceduresToStandard}
                value={procedures.loaded ? `${procedures.value}` : '—'}
                sub={!procedures.loaded ? words.COPY.loadedLater : procedures.of > 0 ? `of ${procedures.of} ${words.COPY.recordProcedures}` : words.COPY.emptyDimension}
                ring={procedures.loaded && procedures.of > 0 ? { value: procedures.value, max: procedures.of } : undefined}
              />
            )}
            </Surface>
            {/* R109: the member profile as the document an agent reads, and the credential around it. */}
            {words && (
              <DtoChip
                schema={MEMBER_PROFILE_SCHEMA}
                version={ONTOLOGY_VERSION}
                json={() => profileJson(buildMemberProfile(exportInput(words.COPY)))}
                filename={PROFILE_FILENAME}
                caption={words.COPY.exportSchemaNote}
                copy={words.COPY.board}
                onCredential={exportCredential}
                onShare={isSupabaseConfigured() && user ? () => setSharing(true) : undefined}
              />
            )}
            {words && isSupabaseConfigured() && user && <ShareLinkDialog open={sharing} onClose={() => setSharing(false)} buildProfile={shareProfile} buildCredential={shareCredential} />}
          </section>

          {/* R107: the member's skills per course, off the registries. */}
          {words && (
            <section aria-labelledby="dash-skills" className="space-y-3" data-skills-by-course>
              <SectionLabel id="dash-skills">{words.COPY.dashboardSection}</SectionLabel>
              <Surface variant="flat" padding="none">
              <ul className="divide-y divide-line">
                {cards.map((card) => {
                  const r = card.skills.rows;
                  const reached = (rows: { level: string }[]) => rows.filter((x) => x.level === 'verified' || x.level === 'reviewed').length;
                  return (
                    <li key={card.course.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3 text-sm" data-course={card.course.id}>
                      <span className="font-semibold text-ink">{card.course.title}</span>
                      <span className="tabular-nums text-muted">{reached(r.skills)}/{r.skills.length} {words.DIMENSION_LABEL.skills.toLowerCase()}</span>
                      <span className="tabular-nums text-muted">{r.tools.filter((x) => x.level !== 'not-started').length}/{r.tools.length} {words.DIMENSION_LABEL.tools.toLowerCase()}</span>
                      <span className="tabular-nums text-muted">{reached(r.procedures)}/{r.procedures.length} {words.DIMENSION_LABEL.procedures.toLowerCase()}</span>
                      <span className="tabular-nums text-muted">{r.standards.filter((x) => x.level !== 'not-started').length}/{r.standards.length} {words.DIMENSION_LABEL.standards.toLowerCase()}</span>
                      <span className="tabular-nums text-muted">{reached(r.domains)}/{r.domains.length} {words.DIMENSION_LABEL.domains.toLowerCase()}</span>
                    </li>
                  );
                })}
              </ul>
              </Surface>
              <p className="text-xs text-muted">{words.COPY.denominator} {words.COPY.loadedLater}</p>
            </section>
          )}

          <section aria-labelledby="dash-path" className="space-y-3">
            <SectionLabel id="dash-path">Your path</SectionLabel>
            {path ? (
              <PathRail
                path={path}
                completedCourseIds={completedCourseIds}
                onChange={() => pathRepo.clear(memberId)}
              />
            ) : (
              <PathPicker onPick={(id) => pathRepo.save(memberId, id)} />
            )}
          </section>

          <section aria-labelledby="dash-capstones" className="space-y-3">
            <SectionLabel id="dash-capstones">
              Your capstones{cards.length > 1 ? ` · ${cards.length}` : ''}
            </SectionLabel>
            <div className="grid gap-6 md:grid-cols-2">
              {cards.map((card, i) => (
                <DashboardCourseCard key={card.course.id} card={card} index={i} />
              ))}
            </div>
          </section>

          <Surface variant="inset" className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Ready to show this to someone? Your portfolio collects every verified step and hashed
              artifact into one page.
            </p>
            <div className="flex gap-2">
              <Link href="/portfolio">
                <Button className="flex items-center gap-2">
                  <FolderGit2 className="h-4 w-4" /> View portfolio
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="secondary" className="flex items-center gap-2">
                  <Compass className="h-4 w-4" /> Explore
                </Button>
              </Link>
            </div>
          </Surface>
        </>
      )}
    </div>
  );
}

/**
 * A group heading for the dashboard.
 *
 * The five blocks below the header — stats, path, course cards, the portfolio
 * prompt — sat in one flat `space-y-8` with nothing saying where one ended and
 * the next began, so the page read as a pile rather than as three answers to
 * three questions. Deliberately quiet: an `.eyebrow` with a rule, not another
 * heading competing with the course titles this round just promoted.
 */
function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="eyebrow-muted flex items-center gap-3">
      <span className="shrink-0">{children}</span>
      <span className="h-px flex-1 bg-line" aria-hidden />
    </h2>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  ring,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  sub: string;
  /** Present when the stat is a ratio — drawn as a ring with the value inside. */
  ring?: { value: number; max: number };
}) {
  return (
    <div className="px-4 py-3 sm:px-5">
      <dt className="flex items-center gap-2 text-sm text-muted">
        <Icon className="h-4 w-4 text-accent" aria-hidden />
        {label}
      </dt>
      {ring ? (
        <dd className="mt-2 flex items-center gap-3">
          <ProgressRing value={ring.value} max={ring.max} label={label} />
          <span className="text-sm text-muted">{sub}</span>
        </dd>
      ) : (
        <dd className="mt-1">
          <span className="block text-2xl font-semibold tabular-nums text-ink">{value}</span>
          <span className="text-sm text-muted">{sub}</span>
        </dd>
      )}
    </div>
  );
}

function DashboardCourseCard({ card, index }: { card: CourseCard; index: number }) {
  const { course, crew, metrics, activeWeek, level, skills, board } = card;
  const roleDef = course.roles.find((r) => r.id === card.member.role);
  const started = crew.stepsDone > 0;
  const words = skillsOf(courseDocument(course.id) ?? bareDocument(course));
  const skillsVerified = skills.rows.skills.filter((r) => r.level === 'verified' || r.level === 'reviewed').length;
  const lastWorked = metrics.lastActivity ? new Date(metrics.lastActivity).toLocaleDateString() : '—';
  return (
    // The interaction standard (ui/Card.tsx): border tint + 2px lift on hover.
    // The card already carried data-region/data-seam for per-vendor theming but
    // a plain border-line made the theme invisible here — the 3px left edge in
    // the region accent is what lets two vendors' cards read differently.
    <motion.div
      data-region={regionFor(course).key}
      data-seam={seamFor(course)}
      // The third theming attribute, beside the other two. `activeWeek` was
      // already in scope and used three times in this card; the left edge was
      // the one place that could say how far through the course the student is
      // and was painting every card the same accent regardless.
      data-week={activeWeek}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: DUR.reveal, ease: EASE.out }}
      // The week seam and the week glow: the card wears the phase the student
      // is in. Nothing lifts on hover; the border tints.
      className={`group flex flex-col ${surfaceVariants({ accent: 'week', glow: 'week', padding: 'lg' })}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold text-ink">{course.title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            {course.vendor && <span className="font-medium text-accent">{course.vendor}</span>}
            {level && <span className="rounded-full bg-panel-2 px-2 py-0.5 font-mono">{level}</span>}
            <Chip tone="accent" icon={<RoleIcon iconName={roleDef?.icon} className="h-3 w-3" color={roleDef?.color} />} title="Your role in this course">
              {card.role}
            </Chip>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <CapstoneStonePanel
          stage={crew.stage}
          nextPhase={phaseForWeek(course, activeWeek)}
          className="min-w-0 flex-1"
        />
        {/* The seal ledger: one gem socket per graded week, filled when the week
            is cleared — an empty socket shows the week number, so what's LEFT is
            as visible as what's done. */}
        {crew.weeksTotal > 0 && (
          <div className="flex shrink-0 flex-col items-center gap-1">
            <SealLedger sealed={crew.weeksCleared} total={crew.weeksTotal} size={64} />
            <span className="text-xs text-muted">
              {crew.weeksCleared}/{crew.weeksTotal} sealed
            </span>
          </div>
        )}
      </div>

      {/* The honest headline: proof, not tick-count. */}
      <div className="mt-4">
        <VerificationBar m={metrics} />
      </div>
      {/* R107: exam domains by level, and the skills verified. */}
      <div className="mt-3">
        <DomainStrip rows={skills.rows.domains} levelLabel={words.LEVEL_LABEL.domains} heading={words.DIMENSION_LABEL.domains} trailing={`${skillsVerified}/${skills.rows.skills.length} ${words.COPY.skillsByCourse}`} />
      </div>
      {/* R109: the sixteen KPIs as sockets, and the document they come from. */}
      <div className="mt-4 space-y-2 border-t border-line pt-3">
        <KpiPack board={board} defs={words.KPIS} families={words.KPI_FAMILIES} copy={words.COPY.board} href={`/courses/${course.id}/skills`} persistenceLabel={words.COPY.abilityLabels.persistence} />
        <DtoChip schema={board.schema} version={board.ontologyVersion} json={() => JSON.stringify(board, null, 2)} filename={`${course.id}-kpi-board.json`} caption={words.COPY.board.schemaNote} copy={words.COPY.board} />
      </div>

      {/* The three small figures, one line: the pack above is the card's second reading now. */}
      <p className="mt-3 font-mono text-2xs text-muted">
        {metrics.stepsDone}/{metrics.stepsTotal} steps · {metrics.artifacts} evidence · {lastWorked}
      </p>

      {/* The resume pointer. `activeWeek` was always computed here and then
          only used to label the stone — the card never said where you'd pick
          up, and Continue dropped you at the course root to find your own way
          back. Now it says the week and lands you on it. */}
      <div className="mt-5 flex flex-col gap-2">
        <Link href={started ? `/courses/${course.id}?tab=tasks&week=${activeWeek}` : `/courses/${course.id}`}>
          <Button className="flex w-full items-center justify-center gap-2">
            {started ? `Continue · ${phaseTag(course, activeWeek)}` : 'Start'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

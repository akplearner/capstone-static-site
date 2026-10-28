'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarCheck, CheckCheck, ClipboardCheck, Compass, FileCheck2, FolderGit2, GraduationCap, ListChecks, ShieldCheck, Terminal, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { RoleIcon } from '@/components/team/RoleIcon';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/Spinner';
import { CapstoneStonePanel } from '@/components/quarry/CapstoneStone';
import { SealLedger } from '@/components/quarry/items';
import { SignInPanel } from '@/components/auth/SignInPanel';
import { DemoBanner } from '@/components/auth/DemoBanner';
import { PathRail, PathPicker } from '@/components/catalog/PathRail';
import { VerificationBar } from '@/components/catalog/VerificationBar';
import { courseRepo, progressRepo, docsRepo, evidenceRepo, earnedRepo, pathRepo, validationRepo } from '@/lib/data';
import { courseDocument, bareDocument } from '@/lib/content/docs';
import { certOf, deliverablesOf, skillsOf } from '@/lib/content/read';
import { skillProfile, skillPortfolio } from '@/lib/skillProfile';
import { defaultMeasure, kpiBoard, sumKpi } from '@/lib/kpiBoard';
import { MEMBER_PROFILE_SCHEMA, ONTOLOGY_VERSION } from '@/lib/docs/ontology';
import { buildCredential, buildMemberProfile, profileJson, type MemberCourseRow } from '@/lib/memberExport';
import { shareProfileCopy } from '@/lib/shareCopy';
import { useBankEarned } from '@/lib/earnedBank';
import { applyEarned, earnedKey, keptFromEarlier } from '@/lib/earnedSkills';
import { categoryDetail, metricDetail, type MetricDetail, type RecordMetric } from '@/lib/recordDetail';
import { courseFactsOf, ownFactsOf, ownIssues, recordCourseInputOf, teamFactsOf, weekDueOf } from '@/lib/recordFacts';
import { recordCards, type RecordCategoryCard } from '@/lib/recordCard';
import type { RecordCategory } from '@/lib/docs/recordCategories';
import { RecordCategories } from '@/components/skills/RecordCategories';
import { buildRecordPdf, recordPdfName } from '@/lib/recordPdf';
import { RecordDetailPanel, RecordStrip, type RecordTile } from '@/components/skills/RecordStrip';
import { sha256Text } from '@/lib/evidenceLedger';
import { downloadBytes } from '@/lib/download';
import { DomainStrip } from '@/components/skills/DomainStrip';
import { KpiPack } from '@/components/skills/KpiPack';
import { DtoChip } from '@/components/skills/DtoChip';
import { ShareLinkDialog } from '@/components/share/ShareLinkDialog';
import { deriveCrewProgress } from '@/lib/game';
import { isCapstoneFiled } from '@/lib/deliverableChain';
import { getTasksByRole, isGradedWeek, phaseTag } from '@/lib/course-helpers';
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
  /** R126: tasks of the graded weeks that are done, over all of them: the record's "Tasks done". */
  tasksDone: number;
  tasksTotal: number;
  /** R126: the graded weeks cleared, by number, and the rows the ledger holds above the live run (R125): what the record's lists are built from. */
  clearedWeeks: number[];
  kept: string[];
}

/** Clock read hoisted to module scope: the purity lint treats a `Date.now()` inside a component-body function as render work, even when it only runs from a click. */
function nowMs(): number {
  return Date.now();
}

/** R133: the fourteen category cards across the courses started. A plain function: it reads the clock and the repositories. */
function buildCategoryCards(cards: CourseCard[]): RecordCategoryCard[] {
  return recordCards(cards.map(recordCourseInputOf), Date.now());
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
  // R125: the member's earned rows are laid over the live profile, so a retake reads at what was already earned.
  const live = skillProfile({
    course,
    role: member.role,
    memberId: member.memberId,
    isStepDone: (t, s) => progressRepo.isStepComplete(course.id, member.memberId, t, s, keySet),
    evidence: evidenceRepo.getSteps(course.id, member.memberId),
    artifacts,
    registry,
    cert,
    deliverables: deliverablesOf(doc),
    // R136: the one loader every profile caller uses; hydrateUser now fills the team's forms, the marks, the flag history and the calendars.
    team: teamFactsOf(course, member, activeWeek),
    own: ownFactsOf(course, member),
    weekDue: weekDueOf(course, member),
    // R111: the currency flag needs the page's clock; buildCard is a plain function, not a component body.
    asOf: Date.now(),
    receipts,
    rehashes,
  });
  const earned = earnedRepo.list(course.id);
  const profile = applyEarned(live, earned);
  // R126: what the record's lists need and the strip does not print.
  const gradedTasks = getTasksByRole(course, member.role).filter((t) => isGradedWeek(course, t.week) && t.steps.some((x) => !x.optional));
  const clearedWeeks = course.weeks
    .filter((w) => isGradedWeek(course, w.number) && getTasksByRole(course, member.role, w.number).length > 0 && (weekStats[w.number] ?? 0) >= 100)
    .map((w) => w.number);
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
    // R141: the member's answers, so the export carries the skill validation.
    validation: validationRepo.list(course.id, member.memberId),
    activeWeek,
    level: entry ? levelDef(entry.level).name : undefined,
    capstoneFiled,
    tasksDone: gradedTasks.filter((t) => (taskStats[t.id] ?? 0) >= 100).length,
    tasksTotal: gradedTasks.length,
    clearedWeeks,
    kept: keptFromEarlier(live, earned).map(earnedKey),
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
  const { ready } = useUserSync();

  // R126: the key stands in for each course's body (it is a whole course: every week, task and step), which
  // is the one thing in a card that is large and changes only when the course is edited or fixed. Everything
  // else is compared by value, so any change to the member's record still re-renders the page.
  const cards = useClientStore<CourseCard[]>(
    () => courseRepo.list().map(buildCard).filter((c): c is CourseCard => c !== null),
    EMPTY_ARRAY,
    (list) => JSON.stringify(list.map((c) => ({ ...c, course: `${c.course.id}:${c.course.updatedAt ?? 'seed'}:${c.course.revision ?? 0}` })))
  );
  // R126: the figure that is open, and the lists behind it. The facts are read when a figure is opened and
  // again whenever the store changes, so an open list is as live as the strip.
  const [openTile, setOpenTile] = useState<RecordMetric | null>(null);
  const [more, setMore] = useState<ReadonlySet<string>>(new Set());
  const detail = useClientStore<MetricDetail | null>(() => (openTile ? metricDetail(openTile, cards.map(courseFactsOf)) : null), null);
  const toggleTile = (id: RecordMetric) => {
    setOpenTile((cur) => (cur === id ? null : id));
    setOpenCategory(null);
    setMore(new Set());
  };
  // R133: the fourteen categories of the record, and the one that is open.
  const categoryCards = useClientStore<RecordCategoryCard[]>(() => buildCategoryCards(cards), EMPTY_ARRAY);
  const [openCategory, setOpenCategory] = useState<RecordCategory | null>(null);
  const categoryList = useClientStore<MetricDetail | null>(() => (openCategory ? categoryDetail(openCategory, cards.map(courseFactsOf)) : null), null);
  const toggleCategory = (id: RecordCategory) => {
    setOpenCategory((cur) => (cur === id ? null : id));
    setOpenTile(null);
    setMore(new Set());
  };
  const chosen = useClientStore<{ pathId: string; chosenAt: number } | null>(
    () => pathRepo.get(cards[0]?.member.memberId ?? 'local'),
    null
  );

  // R125: bank what the cards reach, after render, so a later reset or retake cannot take it back.
  useBankEarned(cards.map((c) => c.skills));

  const needsSignIn = isSupabaseConfigured() && !loading && !user;
  const summary = portfolioSummary(cards.map((c) => c.metrics));
  const skills = skillPortfolio(cards.map((c) => c.skills));
  // R109: two of the sixteen, summed across every capstone started.
  const boards = cards.map((c) => c.board);
  const commands = sumKpi(boards, 'kpi.technical.commands-verified');
  const procedures = sumKpi(boards, 'kpi.technical.procedures-to-standard');
  // R111: distinct skills whose last verification is inside the currency window, across courses.
  const currentSkills = new Set(cards.flatMap((c) => c.skills.rows.skills.filter((r) => r.current).map((r) => r.id))).size;
  // The words of the skills surfaces, off the first course's document (they are the same in every document).
  const words = cards[0] ? skillsOf(courseDocument(cards[0].course.id) ?? bareDocument(cards[0].course)) : undefined;
  const completedCourseIds = new Set(cards.filter((c) => c.capstoneFiled).map((c) => c.course.id));
  const path = chosen ? pathById(chosen.pathId) : undefined;
  const memberId = cards[0]?.member.memberId ?? 'local';
  // R126: the figures of the record, twelve, in the order a course is lived: progress, proof, then what it taught.
  const sum = (pick: (c: CourseCard) => number) => cards.reduce((n, c) => n + pick(c), 0);
  const ratio = (value: number, max: number) => (max > 0 ? { value, max } : undefined);
  const tiles: RecordTile[] = [
    { id: 'steps-done', icon: CheckCheck, label: 'Steps done', value: `${summary.stepsDone}`, sub: summary.stepsTotal > 0 ? `of ${summary.stepsTotal} required` : 'none yet', ring: ratio(summary.stepsDone, summary.stepsTotal) },
    { id: 'tasks-done', icon: ClipboardCheck, label: 'Tasks done', value: `${sum((c) => c.tasksDone)}`, sub: `of ${sum((c) => c.tasksTotal)} in graded weeks`, ring: ratio(sum((c) => c.tasksDone), sum((c) => c.tasksTotal)) },
    { id: 'weeks-sealed', icon: CalendarCheck, label: 'Weeks sealed', value: `${sum((c) => c.crew.weeksCleared)}`, sub: `of ${sum((c) => c.crew.weeksTotal)} graded weeks`, ring: ratio(sum((c) => c.crew.weeksCleared), sum((c) => c.crew.weeksTotal)) },
    { id: 'capstones', icon: FolderGit2, label: 'Capstones delivered', value: `${completedCourseIds.size}`, sub: `of ${cards.length} started`, ring: ratio(completedCourseIds.size, cards.length) },
    {
      id: 'steps-verified',
      icon: ShieldCheck,
      label: 'Steps verified',
      value: `${summary.verified}`,
      sub: summary.verifiable > 0 ? `of ${summary.verifiable} checkable${summary.receipted ? ` · ${summary.receipted} receipted` : ''}` : 'none checkable yet',
      ring: ratio(summary.verified, summary.verifiable),
    },
    ...(words
      ? [
          { id: 'commands' as const, icon: Terminal, label: words.COPY.tiles.commandsVerified, value: `${commands.value}`, sub: commands.of > 0 ? `of ${commands.of} ${words.COPY.recordCommands}` : words.COPY.emptyDimension, ring: ratio(commands.value, commands.of) },
        ]
      : []),
    { id: 'evidence', icon: FileCheck2, label: 'Evidence hashed', value: `${summary.artifacts}`, sub: 'files in the custody log' },
    { id: 'days', icon: Compass, label: 'Days worked', value: `${summary.activeDays}`, sub: 'distinct local days with activity' },
    ...(words
      ? [
          { id: 'skills' as const, icon: ShieldCheck, label: words.COPY.tiles.skillsVerified, value: `${skills.skillsVerified.length}`, sub: `${words.COPY.recordSkills} ${skills.skillsPractised.length} · ${currentSkills} ${words.COPY.board.current}`, ring: ratio(skills.skillsVerified.length, skills.skillsPractised.length) },
          { id: 'tools' as const, icon: Wrench, label: words.COPY.tiles.toolsUsed, value: `${skills.toolsUsed.length}`, sub: words.COPY.recordTools },
          { id: 'procedures' as const, icon: ListChecks, label: words.COPY.tiles.proceduresToStandard, value: procedures.loaded ? `${procedures.value}` : '—', sub: !procedures.loaded ? words.COPY.loadedLater : procedures.of > 0 ? `of ${procedures.of} ${words.COPY.recordProcedures}` : words.COPY.emptyDimension, ring: procedures.loaded ? ratio(procedures.value, procedures.of) : undefined },
          { id: 'domains' as const, icon: GraduationCap, label: 'Exam domains verified', value: `${skills.domainsVerified}`, sub: `of ${skills.domainsTotal} across the courses`, ring: ratio(skills.domainsVerified, skills.domainsTotal) },
        ]
      : []),
  ];
  // R109: the member profile the chip copies, and the profile a link carries, built by the same
  // module as the portfolio's (src/lib/memberExport.ts), at the click.
  const exportInput = (copy: NonNullable<typeof words>['COPY']) => ({ subject: user?.email ?? 'Capstone portfolio', copy, pathId: path?.id ?? null, summary, skills, rows: cards, generatedAt: new Date().toISOString(), categories: categoryCards });
  // R127: the record as a PDF, built at the click from the rows the strip counted: the same figures, the skills by
  // name, progress by course and the issues this member reported. One course when it is asked from that course's card.
  function exportPdf(only?: CourseCard) {
    const list = only ? [only] : cards;
    const now = nowMs();
    downloadBytes(
      recordPdfName(now, only?.course.id),
      buildRecordPdf({
        subject: profile?.displayName?.trim() || cards[0]?.member.displayName || user?.email || 'Capstone member',
        generatedAt: now,
        courses: list.map((c) => ({ ...c, scores: c.board.scores })),
        issues: ownIssues(list.map((c) => c.course.id)),
        workRoles: [...new Set(list.flatMap((c) => c.workRoles.map((w) => w.label)))],
        ...(only ? { scope: only.course.title } : { figures: tiles.map(({ label, value, sub }) => ({ label, value, sub })), categories: categoryCards.map((c) => ({ ...c, label: words?.CATEGORIES.find((d) => d.id === c.id)?.label ?? c.id })) }),
      })
    );
  }
  // R114: a link's copy carries the display name, never the email (the share function sets it again).
  const shareInput = (copy: NonNullable<typeof words>['COPY']) => ({ ...exportInput(copy), subject: profile?.displayName?.trim() || 'Capstone Quarry member' });
  // R124: the compact copy, for the courses the member picks in the dialog (all of them when none are named).
  const shareProfile = (ids?: readonly string[]) => shareProfileCopy(buildMemberProfile(shareInput(words!.COPY)), ids) as unknown as Record<string, unknown>;
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

      {!hydrated || !ready ? (
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
            {/* R133: the record leads with the fourteen categories a hiring reader asks about; the twelve
                progress figures follow, each still a button over its list. */}
            {words && (
              <>
                <p className="text-sm text-muted">{words.COPY.categoriesLede}</p>
                <RecordCategories cards={categoryCards} defs={words.CATEGORIES} copy={words.COPY} open={openCategory} onToggle={toggleCategory} panelId="dash-record-detail" />
                {openCategory && categoryList && (
                  <RecordDetailPanel
                    id="dash-record-detail"
                    title={words.CATEGORIES.find((d) => d.id === openCategory)?.label ?? openCategory}
                    detail={categoryList}
                    expanded={more}
                    onExpand={(section) => setMore((cur) => new Set(cur.has(section) ? [...cur].filter((x) => x !== section) : [...cur, section]))}
                    onClose={() => setOpenCategory(null)}
                  />
                )}
                <p className="text-2xs text-muted">{words.COPY.board.tierRule} {words.COPY.relevanceNote}</p>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{words.COPY.progressFigures}</h3>
              </>
            )}
            {/* One flat strip, not four boxes: a summary should be readable,
                not the heaviest object on the page. */}
            <RecordStrip tiles={tiles} open={openTile} onToggle={toggleTile} panelId="dash-record-detail" />
            {openTile && detail && (
              <RecordDetailPanel
                id="dash-record-detail"
                title={tiles.find((t) => t.id === openTile)?.label ?? ''}
                detail={detail}
                expanded={more}
                onExpand={(section) => setMore((cur) => new Set(cur.has(section) ? [...cur].filter((x) => x !== section) : [...cur, section]))}
                onClose={() => setOpenTile(null)}
              />
            )}
            {/* R109: the member profile as the document an agent reads, and the credential around it. */}
            {words && (
              <DtoChip
                schema={MEMBER_PROFILE_SCHEMA}
                version={ONTOLOGY_VERSION}
                json={() => profileJson(buildMemberProfile(exportInput(words.COPY)))}
                onPdf={() => exportPdf()}
                caption={words.COPY.exportSchemaNote}
                copy={words.COPY.board}
                onShare={isSupabaseConfigured() && user ? () => setSharing(true) : undefined}
              />
            )}
            {words && isSupabaseConfigured() && user && <ShareLinkDialog open={sharing} onClose={() => setSharing(false)} buildProfile={shareProfile} buildCredential={shareCredential} courses={cards.map((c) => ({ id: c.course.id, title: c.course.title }))} />}
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
                <DashboardCourseCard key={card.course.id} card={card} index={i} onPdf={() => exportPdf(card)} />
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

function DashboardCourseCard({ card, index, onPdf }: { card: CourseCard; index: number; onPdf: () => void }) {
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
        <DtoChip schema={board.schema} version={board.ontologyVersion} json={() => JSON.stringify(board, null, 2)} onPdf={onPdf} caption={words.COPY.board.schemaNote} copy={words.COPY.board} />
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

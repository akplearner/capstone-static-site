'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, FileCheck2, FolderGit2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/Spinner';
import { CapstoneStonePanel } from '@/components/quarry/CapstoneStone';
import { SignInPanel } from '@/components/auth/SignInPanel';
import { PathRail, PathPicker } from '@/components/catalog/PathRail';
import { VerificationBar } from '@/components/catalog/VerificationBar';
import { courseRepo, progressRepo, docsRepo, evidenceRepo, pathRepo } from '@/lib/data';
import { deriveCrewProgress } from '@/lib/game';
import { isCapstoneFiled } from '@/lib/deliverableChain';
import { getTasksByRole } from '@/lib/course-helpers';
import { regionFor, seamFor, phaseForWeek } from '@/lib/quarry';
import { resolveActiveWeek } from '@/lib/resume';
import { entryForCourse } from '@/lib/catalog';
import { levelDef } from '@/lib/catalog/levels';
import { pathById } from '@/lib/catalog/paths';
import { courseMetrics, portfolioSummary, type CourseMetrics } from '@/lib/metrics';
import { useClientStore, useHydrated, EMPTY_ARRAY } from '@/lib/useClientStore';
import { useAuth } from '@/lib/useAuth';
import { useUserSync } from '@/lib/useUserSync';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { Course, Member } from '@/lib/types';
import type { CrewProgress } from '@/lib/game';

// The signed-in home: every capstone you've started, how far each stone is cut,
// and — the number that actually matters — how much of it you proved against
// real output rather than ticking a box.
interface CourseCard {
  course: Course;
  member: Member;
  crew: CrewProgress;
  metrics: CourseMetrics;
  activeWeek: number;
  level?: string;
  capstoneFiled: boolean;
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
  const metrics = courseMetrics({
    course,
    role: member.role,
    taskPercent: taskStats,
    evidence: evidenceRepo.getSteps(course.id, member.memberId),
    artifacts: evidenceRepo.getArtifacts(course.id, member.memberId),
  });
  const activeWeek = resolveActiveWeek(course, member.role, weekStats, null);
  const entry = entryForCourse(course.id);
  return {
    course,
    member,
    crew,
    metrics,
    activeWeek,
    level: entry ? levelDef(entry.level).name : undefined,
    capstoneFiled,
  };
}

export default function DashboardPage() {
  const hydrated = useHydrated();
  const { user, loading } = useAuth();
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
  const completedCourseIds = new Set(cards.filter((c) => c.capstoneFiled).map((c) => c.course.id));
  const path = chosen ? pathById(chosen.pathId) : undefined;
  const memberId = cards[0]?.member.memberId ?? 'local';

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Your dashboard</h1>
        <p className="max-w-2xl text-muted">
          Every capstone you’ve started, how far the stone is cut, and how much of it you proved
          against real output.
        </p>
      </header>

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
          href="/explore"
          cta="Explore certs"
        />
      ) : (
        <>
          {/* What you've proved overall. */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              icon={ShieldCheck}
              label="Steps verified"
              value={`${summary.verified}`}
              sub={summary.verifiable > 0 ? `of ${summary.verifiable} checkable` : 'none checkable yet'}
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
            />
            <Stat
              icon={Compass}
              label="Days worked"
              value={`${summary.activeDays}`}
              sub="measured, never scored"
            />
          </section>

          {path ? (
            <PathRail
              path={path}
              completedCourseIds={completedCourseIds}
              onChange={() => pathRepo.clear(memberId)}
            />
          ) : (
            <PathPicker onPick={(id) => pathRepo.save(memberId, id)} />
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {cards.map((card, i) => (
              <DashboardCourseCard key={card.course.id} card={card} index={i} />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-panel-2 p-5">
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
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-panel p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" />
        <span className="eyebrow">{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold text-ink">{value}</div>
      <div className="text-xs text-muted">{sub}</div>
    </div>
  );
}

function DashboardCourseCard({ card, index }: { card: CourseCard; index: number }) {
  const { course, crew, metrics, activeWeek, level } = card;
  const started = crew.stepsDone > 0;
  return (
    <motion.div
      data-region={regionFor(course).key}
      data-seam={seamFor(course)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex flex-col rounded-[var(--radius-card)] border border-line bg-panel p-6 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-ink">{course.title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            {course.vendor && <span className="font-medium text-accent">{course.vendor}</span>}
            {level && <span className="rounded-full bg-panel-2 px-2 py-0.5 font-mono">{level}</span>}
          </div>
        </div>
      </div>

      <CapstoneStonePanel
        stage={crew.stage}
        nextPhase={phaseForWeek(course, activeWeek)}
        className="mt-4"
      />

      {/* The honest headline: proof, not tick-count. */}
      <div className="mt-4">
        <VerificationBar m={metrics} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
        <Mini label="Steps" value={`${metrics.stepsDone}/${metrics.stepsTotal}`} />
        <Mini label="Evidence" value={`${metrics.artifacts}`} />
        <Mini
          label="Last worked"
          value={metrics.lastActivity ? new Date(metrics.lastActivity).toLocaleDateString() : '—'}
        />
      </dl>

      <div className="mt-5">
        <Link href={`/courses/${course.id}`}>
          <Button className="flex w-full items-center justify-center gap-2">
            {started ? 'Continue' : 'Start'} <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">{label}</dt>
      <dd className="text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

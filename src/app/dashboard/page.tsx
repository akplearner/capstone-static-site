'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/Spinner';
import { StepTally } from '@/components/ui/Pixel';
import { CapstoneStonePanel } from '@/components/quarry/CapstoneStone';
import { SignInPanel } from '@/components/auth/SignInPanel';
import { courseRepo, progressRepo, docsRepo } from '@/lib/data';
import { deriveCrewProgress } from '@/lib/game';
import { isCapstoneFiled } from '@/lib/deliverableChain';
import { getTasksByRole } from '@/lib/course-helpers';
import { regionFor, seamFor, phaseForWeek } from '@/lib/quarry';
import { resolveActiveWeek } from '@/lib/resume';
import { entryForCourse } from '@/lib/catalog';
import { levelDef } from '@/lib/catalog/levels';
import { useClientStore, useHydrated, EMPTY_ARRAY } from '@/lib/useClientStore';
import { useAuth } from '@/lib/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { Course, Member } from '@/lib/types';
import type { CrewProgress } from '@/lib/game';

// The signed-in home: the capstones you're enrolled in, each as a stone at its
// real cut-stage, with where to pick back up. This round reads the same
// device/account enrolment the course pages write (progressRepo.getContext); the
// data source becomes cloud enrolments in round 27 with no change to this view.
interface CourseCard {
  course: Course;
  member: Member;
  crew: CrewProgress;
  /** The week the student is actively on, for the "continue" pointer. */
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
  const crew = deriveCrewProgress(
    course,
    member.role,
    weekStats,
    taskStats,
    isCapstoneFiled(course.id, savedDocs)
  );
  const activeWeek = resolveActiveWeek(course, member.role, weekStats, null);
  const entry = entryForCourse(course.id);
  return { course, member, crew, activeWeek, level: entry ? levelDef(entry.level).name : undefined };
}

export default function DashboardPage() {
  const hydrated = useHydrated();
  const { user, loading } = useAuth();
  const cards = useClientStore<CourseCard[]>(
    () => courseRepo.list().map(buildCard).filter((c): c is CourseCard => c !== null),
    EMPTY_ARRAY
  );

  // With Supabase configured, enrolments live in the account — a signed-out
  // visitor has nothing to read, so offer sign-in. In the local/demo build there
  // is no account and enrolment is device-local, so we skip straight to the list.
  const needsSignIn = isSupabaseConfigured() && !loading && !user;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Your dashboard</h1>
        <p className="max-w-2xl text-muted">
          The capstones you’ve started, each stone cut as far as your real progress has taken it.
        </p>
      </header>

      {!hydrated ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : needsSignIn ? (
        <SignInPanel
          title="Sign in to see your dashboard"
          subtitle="Your enrolled capstones and progress are saved to your account."
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
        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((card, i) => (
            <DashboardCourseCard key={card.course.id} card={card} index={i} />
          ))}
        </div>
      )}

      {cards.length > 0 && (
        <div className="flex items-center justify-between rounded-[var(--radius-card)] border border-line bg-panel-2 p-5">
          <p className="text-sm text-muted">Looking for your next credential?</p>
          <Link href="/explore">
            <Button variant="secondary" className="flex items-center gap-2">
              <Compass className="h-4 w-4" /> Explore certs
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function DashboardCourseCard({ card, index }: { card: CourseCard; index: number }) {
  const { course, crew, activeWeek, level } = card;
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
            {level && (
              <span className="rounded-full bg-panel-2 px-2 py-0.5 font-mono">{level}</span>
            )}
          </div>
        </div>
      </div>

      <CapstoneStonePanel
        stage={crew.stage}
        nextPhase={phaseForWeek(course, activeWeek)}
        className="mt-4"
      />

      <div className="mt-4">
        <StepTally done={crew.stepsDone} total={crew.stepsTotal} />
      </div>

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

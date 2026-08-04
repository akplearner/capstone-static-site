'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, GraduationCap, Layers, Lock, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RoleIcon } from '@/components/RoleIcon';
import { courseRepo, progressRepo } from '@/lib/data';
import { useClientStore, useHydrated, EMPTY_ARRAY } from '@/lib/useClientStore';
import { EmptyState } from '@/components/EmptyState';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { Skeleton } from '@/components/ui/Spinner';
import { Course } from '@/lib/types';

export default function HomePage() {
  const hydrated = useHydrated();
  const courses = useClientStore<Course[]>(() => courseRepo.list(), EMPTY_ARRAY);
  const enrolled = useMemo(() => {
    const map: Record<string, boolean> = {};
    courses.forEach((c) => {
      map[c.id] = !!progressRepo.getContext(c.id);
    });
    return map;
  }, [courses]);

  return (
    <div className="space-y-10">
      {/* Sign-in failures redirect here; without this the student just appears
          signed out with no idea why. */}
      <AuthErrorBanner />
      <div className="space-y-3 text-center">
        <div className="mx-auto inline-flex rounded-2xl bg-accent-soft p-3 text-accent">
          <GraduationCap className="h-8 w-8" />
        </div>
        <p className="eyebrow">Build the environment · Work the process · Prove the skill</p>
        <h1 className="text-4xl font-bold tracking-tight text-ink">Capstone Quarry</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted">
          Every vendor is its own region, and every crew cuts one capstone stone. Pick a region to begin, or open the instructor studio to build one.
        </p>
        <p className="mx-auto max-w-2xl text-sm text-muted">
          New here? Just press <span className="font-medium text-ink">Start</span> — the course opens with a
          step-by-step checklist. The <span className="font-medium text-ink">Guide</span> is a deep reference for
          whenever you want it.
        </p>
      </div>

      {!hydrated ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          message="No courses are available right now. If you're an instructor, open the studio to build one."
          href="/instructor"
          cta="Open Instructor Studio"
        />
      ) : (
      <div className="grid gap-6 md:grid-cols-2">
        {courses.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`flex flex-col rounded-[var(--radius-card)] border border-line bg-panel p-6 shadow-[var(--shadow-card)] ${
              course.locked ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-ink">{course.title}</h2>
              <div className="flex items-center gap-2">
                {course.locked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-panel-2 px-2 py-0.5 font-mono text-xs font-medium text-muted">
                    <Lock className="h-3 w-3" /> Locked
                  </span>
                )}
                {course.isSeed && (
                  <span className="rounded-full bg-panel-2 px-2 py-0.5 font-mono text-xs font-medium text-muted">
                    Built-in
                  </span>
                )}
              </div>
            </div>
            {course.audience && (
              <p className="mt-1 text-sm font-semibold text-accent">{course.audience}</p>
            )}
            <p className="mt-2 flex-1 text-sm text-muted">{course.description}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
              <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {course.weeks.length} weeks</span>
              <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {course.roles.length} roles</span>
              <span className="flex items-center gap-1">
                {course.roles.slice(0, 4).map((r) => (
                  <RoleIcon key={r.id} iconName={r.icon} className="h-4 w-4" color={r.color} />
                ))}
              </span>
            </div>

            {course.locked ? (
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-line bg-panel-2 px-4 py-2.5 text-sm text-muted">
                <Lock className="h-4 w-4" /> Locked by instructor
              </div>
            ) : (
              <div className="mt-5 flex gap-3">
                <Link href={`/courses/${course.id}`} className="flex-1">
                  <Button className="flex w-full items-center justify-center gap-2">
                    {enrolled[course.id] ? 'Continue' : 'Start'} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/courses/${course.id}/guide`}>
                  <Button variant="secondary" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Guide
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        ))}
      </div>
      )}

      <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-line bg-panel-2 p-8 text-center">
        <h2 className="text-xl font-bold text-ink">Are you an instructor?</h2>
        <p className="text-muted">Build and maintain courses, roles, weeks, tasks, and gates.</p>
        <Link href="/instructor">
          <Button variant="secondary" size="lg">Open Instructor Studio</Button>
        </Link>
      </div>
    </div>
  );
}

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import { GuidedTaskRunner } from '@/components/GuidedTaskRunner';
import { GuidedStepper, StepperItem } from '@/components/GuidedStepper';
import { EmptyState } from '@/components/EmptyState';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { progressRepo } from '@/lib/data';
import { getRoleDef, getTasksByRole, getWeekDef, getWeekNumbers } from '@/lib/course-helpers';

export default function WeekDetailPage() {
  const course = useCourse();
  const params = useParams();
  const router = useRouter();
  const role = params.role as string;
  const week = parseInt(params.week as string);
  const { member, loading } = useMember(course.id);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!loading && !member) router.push(`/courses/${course.id}/settings`);
  }, [member, loading, router, course.id]);

  useEffect(() => {
    if (member && member.role !== role) {
      router.push(`/courses/${course.id}/roles/${member.role}/week-${week || 1}`);
    }
  }, [member, role, week, router, course.id]);

  const onProgressChange = useCallback(() => setRefresh((r) => r + 1), []);

  const weekStepperItems: StepperItem[] = useMemo(() => {
    if (!member) return [];
    const keySet = progressRepo.getCompletionKeySet(course.id, member.memberId);
    return course.weeks.map((w) => {
      const pct = progressRepo.getWeekCompletion(course, member.memberId, role, w.number, keySet);
      return {
        label: `Week ${w.number}`,
        sublabel: `${pct}%`,
        status: pct === 100 ? 'done' : w.number === week ? 'current' : 'upcoming',
      } as StepperItem;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member, course, role, week, refresh]);

  if (loading || !member) return <div className="py-12 text-center text-gray-500">Loading…</div>;

  const roleDef = getRoleDef(course, role);
  const weekDef = getWeekDef(course, week);
  if (!roleDef || !weekDef) {
    return (
      <EmptyState
        title="Not found"
        message="That role or week doesn’t exist in this course."
        href={`/courses/${course.id}/dashboard`}
        cta="Back to dashboard"
      />
    );
  }

  const tasksForWeek = getTasksByRole(course, role, week);
  const weekNumbers = getWeekNumbers(course);
  const prevWeek = weekNumbers.filter((w) => w < week).pop();
  const nextWeek = weekNumbers.find((w) => w > week);

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="space-y-3">
        <Link href={`/courses/${course.id}/roles/${role}`} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Back to {roleDef.name}
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{weekDef.title}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">{weekDef.theme}</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">{weekDef.objective}</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <GuidedStepper
          items={weekStepperItems}
          onSelect={(i) => router.push(`/courses/${course.id}/roles/${role}/week-${course.weeks[i]?.number ?? 1}`)}
        />
      </div>

      <div className="space-y-6">
        {tasksForWeek.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400">No tasks for this week yet.</p>
        )}
        {tasksForWeek.map((task, taskIdx) => (
          <motion.div
            key={task.id}
            id={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: taskIdx * 0.1 }}
            className="scroll-mt-24 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{task.title}</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{task.objective}</p>
              {task.deliverables.length > 0 && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                    <FileText className="h-4 w-4" /> Deliverables to produce
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {task.deliverables.map((d) => (
                      <li key={d} className="rounded bg-white px-2 py-1 font-mono text-xs text-amber-800 dark:bg-gray-800 dark:text-amber-300">
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <GuidedTaskRunner task={task} courseId={course.id} memberId={member.memberId} onProgressChange={onProgressChange} />
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between">
        {prevWeek != null ? (
          <Link href={`/courses/${course.id}/roles/${role}/week-${prevWeek}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
            <ArrowLeft className="h-4 w-4" /> Previous Week
          </Link>
        ) : (
          <div />
        )}
        {nextWeek != null ? (
          <Link href={`/courses/${course.id}/roles/${role}/week-${nextWeek}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
            Next Week <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </motion.div>
  );
}

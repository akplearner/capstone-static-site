'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStudentContext, getWeekCompletion } from '@/lib/storage';
import { GuidedTaskRunner } from '@/components/GuidedTaskRunner';
import { GuidedStepper, StepperItem } from '@/components/GuidedStepper';
import { getTasksByRole, WEEKS } from '@/lib/content-data';
import { Role } from '@/lib/types';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';

export default function WeekDetailPage() {
  const params = useParams();
  const router = useRouter();
  const role = params.role as Role;
  const week = parseInt(params.week as string);
  const { context, loading } = useStudentContext();
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!loading && !context) router.push('/settings');
  }, [context, loading, router]);

  useEffect(() => {
    if (context && context.role !== role) {
      router.push(`/roles/${context.role}/week-${week || 1}`);
    }
  }, [context, role, week, router]);

  const onProgressChange = useCallback(() => setRefresh((r) => r + 1), []);

  const weekStepperItems: StepperItem[] = useMemo(() => {
    if (!context) return [];
    return [1, 2, 3, 4].map((w) => {
      const pct = getWeekCompletion(context.memberId, role, w);
      return {
        label: `Week ${w}`,
        sublabel: `${pct}%`,
        status: pct === 100 ? 'done' : w === week ? 'current' : 'upcoming',
      } as StepperItem;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, role, week, refresh]);

  if (loading || !context) {
    return <div className="py-12 text-center text-gray-500">Loading…</div>;
  }

  const tasksForWeek = getTasksByRole(role, week);
  const weekData = WEEKS[week as 1 | 2 | 3 | 4];

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="space-y-3">
        <Link href={`/roles/${role}`} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Back to Role Hub
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{weekData.title}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">{weekData.theme}</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">{weekData.objective}</p>
      </div>

      {/* Week stepper navigation */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <GuidedStepper
          items={weekStepperItems}
          onSelect={(i) => router.push(`/roles/${role}/week-${i + 1}`)}
        />
      </div>

      {/* Tasks */}
      <div className="space-y-6">
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

            <GuidedTaskRunner task={task} memberId={context.memberId} onProgressChange={onProgressChange} />
          </motion.div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between">
        {week > 1 ? (
          <Link href={`/roles/${role}/week-${week - 1}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
            <ArrowLeft className="h-4 w-4" /> Previous Week
          </Link>
        ) : (
          <div />
        )}
        {week < 4 ? (
          <Link href={`/roles/${role}/week-${week + 1}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
            Next Week <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </motion.div>
  );
}

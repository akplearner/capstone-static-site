'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useStudentContext, getTaskCompletionPercent, getWeekCompletion } from '@/lib/storage';
import { TaskCard } from '@/components/TaskComponents';
import { RoleWorkflow } from '@/components/diagrams/RoleWorkflow';
import { getTasksByRole, WEEKS } from '@/lib/content-data';
import { getRoleName, getRoleMission } from '@/lib/utils';
import { Role } from '@/lib/types';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Target, Shield, ClipboardList } from 'lucide-react';

function RoleIcon({ role, className }: { role: string; className?: string }) {
  if (role === 'red') return <Target className={className} />;
  if (role === 'blue') return <Shield className={className} />;
  return <ClipboardList className={className} />;
}

export default function RoleHubPage() {
  const params = useParams();
  const router = useRouter();
  const role = params.role as Role;
  const { context, loading } = useStudentContext();
  const [activeWeek, setActiveWeek] = useState(1);
  const [weekStats, setWeekStats] = useState<Record<number, number>>({});
  const [taskStats, setTaskStats] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!loading && !context) router.push('/settings');
  }, [context, loading, router]);

  useEffect(() => {
    if (context && context.role !== role) router.push(`/roles/${context.role}`);
  }, [context, role, router]);

  useEffect(() => {
    if (!context) return;
    const weeks: Record<number, number> = {};
    const tasks: Record<string, number> = {};
    for (let w = 1; w <= 4; w++) {
      weeks[w] = getWeekCompletion(context.memberId, role, w);
      getTasksByRole(role, w).forEach((t) => {
        tasks[t.id] = getTaskCompletionPercent(context.memberId, t);
      });
    }
    setWeekStats(weeks);
    setTaskStats(tasks);
  }, [context, role]);

  if (loading || !context) {
    return <div className="py-12 text-center text-gray-500">Loading…</div>;
  }

  const tasksForWeek = getTasksByRole(role, activeWeek);
  const weekData = WEEKS[activeWeek as 1 | 2 | 3 | 4];

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
          <RoleIcon role={role} className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getRoleName(role)}</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{getRoleMission(role)}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* Role workflow diagram */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Workflow</h2>
          <RoleWorkflow role={role} weekProgress={weekStats} currentWeek={activeWeek} />
        </div>

        {/* Week tabs + tasks */}
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((w) => (
              <button
                key={w}
                onClick={() => setActiveWeek(w)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeWeek === w
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Week {w} · {weekStats[w] ?? 0}%
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{weekData.title}</h2>
            <p className="text-gray-600 dark:text-gray-400">{weekData.theme}</p>
          </div>

          <div className="space-y-4">
            {tasksForWeek.map((task) => (
              <Link key={task.id} href={`/roles/${role}/week-${activeWeek}#${task.id}`}>
                <TaskCard task={task} completionPercent={taskStats[task.id] ?? 0} />
              </Link>
            ))}
          </div>

          <Link
            href={`/roles/${role}/week-${activeWeek}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Open {weekData.title} step-by-step →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

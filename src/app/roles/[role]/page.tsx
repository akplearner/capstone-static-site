'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useStudentContext } from '@/lib/storage';
import { Button, Tabs } from '@/components/ui/Button';
import { TaskCard } from '@/components/TaskComponents';
import { getTasksByRole, WEEKS } from '@/lib/content-data';
import { calculateProgress, getRoleLabel } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function RoleHubPage() {
  const params = useParams();
  const router = useRouter();
  const role = params.role as 'red' | 'blue' | 'grc';
  const { context, loading } = useStudentContext();
  const [activeWeek, setActiveWeek] = useState('1');
  const [completionStats, setCompletionStats] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!loading && !context) {
      router.push('/settings');
    }
  }, [context, loading, router]);

  useEffect(() => {
    if (context?.role !== role) {
      router.push(`/roles/${context?.role || 'red'}`);
    }
  }, [context, role, router]);

  useEffect(() => {
    if (!context) return;

    const stats: Record<number, number> = {};
    for (let week = 1; week <= 4; week++) {
      const tasksForWeek = getTasksByRole(role, week as any);
      const totalSteps = tasksForWeek.reduce((sum, task) => sum + task.steps.length, 0);

      let completedSteps = 0;
      tasksForWeek.forEach((task) => {
        task.steps.forEach((step) => {
          const key = `capstone_completion_${context.memberId}_${task.id}_${step.id}`;
          if (typeof window !== 'undefined' && localStorage.getItem(key)) {
            completedSteps++;
          }
        });
      });

      stats[week] = totalSteps > 0 ? calculateProgress(completedSteps, totalSteps) : 0;
    }
    setCompletionStats(stats);
  }, [context, role]);

  if (loading || !context) {
    return <div>Loading...</div>;
  }

  const tasksForWeek = getTasksByRole(role, parseInt(activeWeek) as any);
  const weekData = WEEKS[parseInt(activeWeek) as 1 | 2 | 3 | 4];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-block text-4xl">
          {role === 'red' && '🏃'}
          {role === 'blue' && '🛡️'}
          {role === 'grc' && '📋'}
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          {getRoleLabel(role)}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Collaborate with other {getRoleLabel(role).split('(')[1]?.split(')')[0] || ''} members across all teams
        </p>
      </div>

      {/* Week Tabs */}
      <div className="space-y-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[1, 2, 3, 4].map((week) => (
            <motion.button
              key={week}
              onClick={() => setActiveWeek(week.toString())}
              whileHover={{ opacity: 0.8 }}
              className={`px-6 py-3 font-medium transition-colors ${
                activeWeek === week.toString()
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Week {week}
            </motion.button>
          ))}
        </div>

        {/* Week Content */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">
          {/* Week Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {weekData.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{weekData.theme}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">{weekData.runs}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Week Progress
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {completionStats[parseInt(activeWeek)] || 0}%
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionStats[parseInt(activeWeek)] || 0}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full bg-blue-600"
              />
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-4">
            {tasksForWeek.map((task, idx) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link href={`/roles/${role}/week-${activeWeek}#${task.id}`}>
                  <TaskCard
                    task={task}
                    completionPercent={completionStats[parseInt(activeWeek)] || 0}
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Collaboration Panel Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 dark:border-gray-600 dark:bg-gray-800/50"
      >
        <h3 className="font-bold text-gray-900 dark:text-white">Role Cohort Collaboration</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          💡 Phase 2 feature coming soon: Share notes, ask questions, and learn from other {role}s across all teams.
        </p>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
          This will integrate with your team chat or Discord for seamless collaboration.
        </p>
      </motion.div>
    </motion.div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentContext, useGateStatus } from '@/lib/storage';
import { Button, Tabs, Collapsible } from '@/components/ui/Button';
import { GateBadge, TaskCard } from '@/components/TaskComponents';
import { getTasksByRole, GATES, ALL_TASKS } from '@/lib/content-data';
import { calculateProgress, getRoleLabel, getWeekTitle, getGateStatusLabel } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();
  const { context, loading } = useStudentContext();
  const [completionStats, setCompletionStats] = useState<Record<number, number>>({});
  const [activeWeek, setActiveWeek] = useState('1');

  useEffect(() => {
    if (!loading && !context) {
      router.push('/settings');
    }
  }, [context, loading, router]);

  useEffect(() => {
    if (!context) return;

    // Calculate completion percentage for each week
    const stats: Record<number, number> = {};
    for (let week = 1; week <= 4; week++) {
      const tasksForWeek = getTasksByRole(context.role, week as any);
      const totalSteps = tasksForWeek.reduce((sum, task) => sum + task.steps.length, 0);

      // Count completed steps from localStorage
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
  }, [context]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!context) {
    return null;
  }

  const tasksThisWeek = getTasksByRole(context.role, parseInt(activeWeek) as any);
  const weekGates = GATES.filter((g) => g.week === parseInt(activeWeek));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Identity Badge */}
      <motion.div
        variants={itemVariants}
        className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{context.displayName}</h1>
            <p className="mt-2 text-blue-100">
              {getRoleLabel(context.role)} • Team {context.teamId} • {context.cohort}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl">
              {context.role === 'red' && '🏃'}
              {context.role === 'blue' && '🛡️'}
              {context.role === 'grc' && '📋'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Week Overview Grid */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Progress</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((week) => (
            <motion.button
              key={week}
              onClick={() => setActiveWeek(week.toString())}
              whileHover={{ scale: 1.05 }}
              className={`rounded-lg border-2 p-4 text-left transition-colors ${
                activeWeek === week.toString()
                  ? 'border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Week {week}
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {completionStats[week]}%
              </div>
              <div className="mt-2 h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${completionStats[week]}%` }}
                />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Gate Status for Current Week */}
      {weekGates.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gate Status</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {weekGates.map((gate) => {
              const { status } = useGateStatus(context.teamId, gate.id);
              const gateCompletion = completionStats[gate.week] || 0;
              return (
                <GateBadge
                  key={gate.id}
                  gateId={gate.id}
                  status={status}
                  completionPercent={gateCompletion}
                />
              );
            })}
          </div>
        </motion.div>
      )}

      {/* This Week's Tasks */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getWeekTitle(parseInt(activeWeek))}
        </h2>

        <div className="space-y-4">
          {tasksThisWeek.map((task, idx) => (
            <motion.div
              key={task.id}
              variants={itemVariants}
              transition={{ delay: idx * 0.1 }}
            >
              <Link href={`/roles/${context.role}/week-${activeWeek}#${task.id}`}>
                <TaskCard
                  task={task}
                  completionPercent={completionStats[parseInt(activeWeek)] || 0}
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Links */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Links</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href={`/roles/${context.role}`} className="block">
            <Button variant="secondary" className="w-full">
              View My Role Hub
            </Button>
          </Link>
          <Link href={`/team/${context.teamId}`} className="block">
            <Button variant="secondary" className="w-full">
              Team Space
            </Button>
          </Link>
          <Link href="/settings" className="block">
            <Button variant="secondary" className="w-full">
              Change Profile
            </Button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

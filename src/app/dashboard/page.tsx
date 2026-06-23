'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentContext, deriveGateStatus, getTaskCompletionPercent } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { GateBadge, TaskCard } from '@/components/TaskComponents';
import { GuidedStepper, StepperItem } from '@/components/GuidedStepper';
import { LifecycleFlow } from '@/components/diagrams/LifecycleFlow';
import { getTasksByRole, GATES } from '@/lib/content-data';
import { calculateProgress, getRoleName, getWeekTitle } from '@/lib/utils';
import { GateStatus } from '@/lib/types';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Target, Shield, ClipboardList, ArrowRight, Users, Settings as SettingsIcon, Compass } from 'lucide-react';

function RoleIcon({ role, className }: { role: string; className?: string }) {
  if (role === 'red') return <Target className={className} />;
  if (role === 'blue') return <Shield className={className} />;
  return <ClipboardList className={className} />;
}

export default function DashboardPage() {
  const router = useRouter();
  const { context, loading } = useStudentContext();
  const [completionStats, setCompletionStats] = useState<Record<number, number>>({});
  const [taskStats, setTaskStats] = useState<Record<string, number>>({});
  const [activeWeek, setActiveWeek] = useState(1);

  useEffect(() => {
    if (!loading && !context) {
      router.push('/settings');
    }
  }, [context, loading, router]);

  useEffect(() => {
    if (!context) return;

    const weekStats: Record<number, number> = {};
    const perTask: Record<string, number> = {};
    let firstIncompleteWeek = 1;
    let foundIncomplete = false;

    for (let week = 1; week <= 4; week++) {
      const tasksForWeek = getTasksByRole(context.role, week);
      const totalSteps = tasksForWeek.reduce((sum, task) => sum + task.steps.length, 0);
      let completedSteps = 0;
      tasksForWeek.forEach((task) => {
        perTask[task.id] = getTaskCompletionPercent(context.memberId, task);
        task.steps.forEach((step) => {
          const key = `capstone_completion_${context.memberId}_${task.id}_${step.id}`;
          if (typeof window !== 'undefined' && localStorage.getItem(key)) completedSteps++;
        });
      });
      const pct = totalSteps > 0 ? calculateProgress(completedSteps, totalSteps) : 0;
      weekStats[week] = pct;
      if (!foundIncomplete && pct < 100) {
        firstIncompleteWeek = week;
        foundIncomplete = true;
      }
    }
    setCompletionStats(weekStats);
    setTaskStats(perTask);
    setActiveWeek(firstIncompleteWeek);
  }, [context]);

  // Derived gate statuses (pure — no hooks in loops).
  const gateStatusMap = useMemo(() => {
    const map: Record<number, GateStatus> = {};
    if (context) {
      GATES.forEach((g) => {
        map[g.id] = deriveGateStatus(context.memberId, context.role, g);
      });
    }
    return map;
    // completionStats is loaded in the same effect pass as context; recompute on context.
  }, [context, completionStats]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="py-12 text-center text-gray-500">Loading…</div>;
  if (!context) return null;

  const tasksThisWeek = getTasksByRole(context.role, activeWeek);
  const weekGates = GATES.filter((g) => g.week === activeWeek);

  const weekStepperItems: StepperItem[] = [1, 2, 3, 4].map((w) => ({
    label: `Week ${w}`,
    sublabel: `${completionStats[w] ?? 0}%`,
    status:
      (completionStats[w] ?? 0) === 100
        ? 'done'
        : w === activeWeek
        ? 'current'
        : 'upcoming',
  }));

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div className="space-y-8" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
      {/* Identity Badge */}
      <motion.div variants={itemVariants} className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{context.displayName}</h1>
            <p className="mt-2 text-blue-100">
              {getRoleName(context.role)} • Team {context.teamId} • {context.cohort}
            </p>
          </div>
          <RoleIcon role={context.role} className="h-12 w-12 text-white/90" />
        </div>
      </motion.div>

      {/* Lifecycle diagram */}
      <motion.div variants={itemVariants} className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your 4-Week Journey</h2>
          <Link href="/guide" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
            <Compass className="h-4 w-4" /> How it works
          </Link>
        </div>
        <LifecycleFlow weekProgress={completionStats} gateStatus={gateStatusMap} currentWeek={activeWeek} />
      </motion.div>

      {/* Continue CTA */}
      <motion.div variants={itemVariants}>
        <Link href={`/roles/${context.role}/week-${activeWeek}`}>
          <div className="flex items-center justify-between rounded-lg border-2 border-blue-200 bg-blue-50 p-5 transition-colors hover:border-blue-400 dark:border-blue-800 dark:bg-blue-900/20">
            <div>
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Continue where you left off</div>
              <div className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">{getWeekTitle(activeWeek)}</div>
            </div>
            <ArrowRight className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </Link>
      </motion.div>

      {/* Week selector stepper */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Progress</h2>
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <GuidedStepper items={weekStepperItems} onSelect={(i) => setActiveWeek(i + 1)} />
        </div>
      </motion.div>

      {/* Gate Status for Current Week */}
      {weekGates.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gate Status</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {weekGates.map((gate) => (
              <GateBadge
                key={gate.id}
                gateId={gate.id}
                status={gateStatusMap[gate.id] || 'locked'}
                completionPercent={completionStats[gate.week] || 0}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* This Week's Tasks */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{getWeekTitle(activeWeek)}</h2>
        <div className="space-y-4">
          {tasksThisWeek.map((task) => (
            <Link key={task.id} href={`/roles/${context.role}/week-${activeWeek}#${task.id}`}>
              <TaskCard task={task} completionPercent={taskStats[task.id] ?? 0} />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Quick Links */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Links</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href={`/roles/${context.role}`} className="block">
            <Button variant="secondary" className="flex w-full items-center justify-center gap-2">
              <RoleIcon role={context.role} className="h-4 w-4" /> My Role Hub
            </Button>
          </Link>
          <Link href={`/team/${context.teamId}`} className="block">
            <Button variant="secondary" className="flex w-full items-center justify-center gap-2">
              <Users className="h-4 w-4" /> Team Space
            </Button>
          </Link>
          <Link href="/settings" className="block">
            <Button variant="secondary" className="flex w-full items-center justify-center gap-2">
              <SettingsIcon className="h-4 w-4" /> Change Profile
            </Button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

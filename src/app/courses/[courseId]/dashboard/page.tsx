'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Users, Settings as SettingsIcon, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GateBadge, TaskCard } from '@/components/TaskComponents';
import { GuidedStepper, StepperItem } from '@/components/GuidedStepper';
import { RoleIcon } from '@/components/RoleIcon';
import { LifecycleFlow } from '@/components/diagrams/LifecycleFlow';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { progressRepo } from '@/lib/data';
import { getRoleDef, getTasksByRole, getWeekDef } from '@/lib/course-helpers';
import { GateStatus } from '@/lib/types';

export default function CourseDashboardPage() {
  const course = useCourse();
  const router = useRouter();
  const { member, loading } = useMember(course.id);

  const [weekStats, setWeekStats] = useState<Record<number, number>>({});
  const [taskStats, setTaskStats] = useState<Record<string, number>>({});
  const [gateStats, setGateStats] = useState<Record<number, GateStatus>>({});
  const [activeWeek, setActiveWeek] = useState(course.weeks[0]?.number ?? 1);

  useEffect(() => {
    if (!loading && !member) router.push(`/courses/${course.id}/settings`);
  }, [member, loading, router, course.id]);

  useEffect(() => {
    if (!member) return;
    // One batched localStorage scan for all derivations below.
    const keySet = progressRepo.getCompletionKeySet(course.id, member.memberId);
    const weeks: Record<number, number> = {};
    const tasks: Record<string, number> = {};
    let firstIncomplete = course.weeks[0]?.number ?? 1;
    let found = false;
    course.weeks.forEach((w) => {
      const pct = progressRepo.getWeekCompletion(course, member.memberId, member.role, w.number, keySet);
      weeks[w.number] = pct;
      getTasksByRole(course, member.role, w.number).forEach((t) => {
        tasks[t.id] = progressRepo.getTaskPercent(course.id, member.memberId, t, keySet);
      });
      if (!found && pct < 100) {
        firstIncomplete = w.number;
        found = true;
      }
    });
    const gates: Record<number, GateStatus> = {};
    course.gates.forEach((g) => {
      gates[g.id] = progressRepo.deriveGateStatus(course, member.memberId, member.role, g, keySet);
    });
    setWeekStats(weeks);
    setTaskStats(tasks);
    setGateStats(gates);
    setActiveWeek(firstIncomplete);
  }, [member, course]);

  const weekStepperItems: StepperItem[] = useMemo(
    () =>
      course.weeks.map((w) => ({
        label: `Week ${w.number}`,
        sublabel: `${weekStats[w.number] ?? 0}%`,
        status:
          (weekStats[w.number] ?? 0) === 100 ? 'done' : w.number === activeWeek ? 'current' : 'upcoming',
      })),
    [course.weeks, weekStats, activeWeek]
  );

  if (loading) return <div className="py-12 text-center text-gray-500">Loading…</div>;
  if (!member) return null;

  const roleDef = getRoleDef(course, member.role);
  const weekDef = getWeekDef(course, activeWeek);
  const tasksThisWeek = getTasksByRole(course, member.role, activeWeek);
  const weekGates = course.gates.filter((g) => g.week === activeWeek);

  const handleReset = () => {
    if (confirm('Reset all your progress for this course? This cannot be undone.')) {
      progressRepo.resetCourse(course.id, member.memberId);
      router.refresh();
      setWeekStats({});
      setTaskStats({});
      setGateStats({});
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div className="space-y-8" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={itemVariants} className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{member.displayName}</h1>
            <p className="mt-2 text-blue-100">
              {roleDef?.name ?? member.role} • Team {member.teamId} • {member.cohort}
            </p>
            <p className="mt-1 text-sm text-blue-200">{course.title}</p>
          </div>
          <RoleIcon iconName={roleDef?.icon} className="h-12 w-12 text-white/90" />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Journey</h2>
          <Link href={`/courses/${course.id}/guide`} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
            <Compass className="h-4 w-4" /> How it works
          </Link>
        </div>
        <LifecycleFlow
          weeks={course.weeks}
          gates={course.gates}
          weekProgress={weekStats}
          gateStatus={gateStats}
          currentWeek={activeWeek}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Link href={`/courses/${course.id}/roles/${member.role}/week-${activeWeek}`}>
          <div className="flex items-center justify-between rounded-lg border-2 border-blue-200 bg-blue-50 p-5 transition-colors hover:border-blue-400 dark:border-blue-800 dark:bg-blue-900/20">
            <div>
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Continue where you left off</div>
              <div className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">
                Week {activeWeek}{weekDef ? `: ${weekDef.title}` : ''}
              </div>
            </div>
            <ArrowRight className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </Link>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Progress</h2>
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <GuidedStepper
            items={weekStepperItems}
            onSelect={(i) => setActiveWeek(course.weeks[i]?.number ?? 1)}
          />
        </div>
      </motion.div>

      {weekGates.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gate Status</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {weekGates.map((gate) => (
              <GateBadge
                key={gate.id}
                gateId={gate.id}
                status={gateStats[gate.id] || 'locked'}
                completionPercent={weekStats[gate.week] || 0}
              />
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Week {activeWeek}{weekDef ? `: ${weekDef.title}` : ''}
        </h2>
        <div className="space-y-4">
          {tasksThisWeek.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">No tasks defined for this week yet.</p>
          )}
          {tasksThisWeek.map((task) => (
            <Link key={task.id} href={`/courses/${course.id}/roles/${member.role}/week-${activeWeek}#${task.id}`}>
              <TaskCard task={task} completionPercent={taskStats[task.id] ?? 0} />
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Links</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href={`/courses/${course.id}/roles/${member.role}`} className="block">
            <Button variant="secondary" className="flex w-full items-center justify-center gap-2">
              <RoleIcon iconName={roleDef?.icon} className="h-4 w-4" /> My Role Hub
            </Button>
          </Link>
          <Link href={`/courses/${course.id}/team/${member.teamId}`} className="block">
            <Button variant="secondary" className="flex w-full items-center justify-center gap-2">
              <Users className="h-4 w-4" /> Team Space
            </Button>
          </Link>
          <Link href={`/courses/${course.id}/settings`} className="block">
            <Button variant="secondary" className="flex w-full items-center justify-center gap-2">
              <SettingsIcon className="h-4 w-4" /> Change Profile
            </Button>
          </Link>
        </div>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
        >
          <RotateCcw className="h-4 w-4" /> Reset my progress for this course
        </button>
      </motion.div>
    </motion.div>
  );
}

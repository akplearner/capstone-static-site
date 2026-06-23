'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TaskCard } from '@/components/TaskComponents';
import { RoleIcon } from '@/components/RoleIcon';
import { RoleWorkflow } from '@/components/diagrams/RoleWorkflow';
import { EmptyState } from '@/components/EmptyState';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { progressRepo } from '@/lib/data';
import { getRoleDef, getTasksByRole, getWeekDef } from '@/lib/course-helpers';

export default function RoleHubPage() {
  const course = useCourse();
  const params = useParams();
  const router = useRouter();
  const role = params.role as string;
  const { member, loading } = useMember(course.id);
  const [activeWeek, setActiveWeek] = useState(course.weeks[0]?.number ?? 1);
  const [weekStats, setWeekStats] = useState<Record<number, number>>({});
  const [taskStats, setTaskStats] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!loading && !member) router.push(`/courses/${course.id}/settings`);
  }, [member, loading, router, course.id]);

  useEffect(() => {
    if (member && member.role !== role) router.push(`/courses/${course.id}/roles/${member.role}`);
  }, [member, role, router, course.id]);

  useEffect(() => {
    if (!member) return;
    const keySet = progressRepo.getCompletionKeySet(course.id, member.memberId);
    const weeks: Record<number, number> = {};
    const tasks: Record<string, number> = {};
    course.weeks.forEach((w) => {
      weeks[w.number] = progressRepo.getWeekCompletion(course, member.memberId, role, w.number, keySet);
      getTasksByRole(course, role, w.number).forEach((t) => {
        tasks[t.id] = progressRepo.getTaskPercent(course.id, member.memberId, t, keySet);
      });
    });
    setWeekStats(weeks);
    setTaskStats(tasks);
  }, [member, course, role]);

  if (loading || !member) return <div className="py-12 text-center text-gray-500">Loading…</div>;

  const roleDef = getRoleDef(course, role);
  if (!roleDef) {
    return (
      <EmptyState
        title="Unknown role"
        message={`“${role}” is not a role in this course.`}
        href={`/courses/${course.id}/dashboard`}
        cta="Back to dashboard"
      />
    );
  }

  const weekDef = getWeekDef(course, activeWeek);
  const tasksForWeek = getTasksByRole(course, role, activeWeek);

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
          <RoleIcon iconName={roleDef.icon} className="h-8 w-8" color={roleDef.color} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{roleDef.name}</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{roleDef.mission}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Workflow</h2>
          <RoleWorkflow course={course} role={role} weekProgress={weekStats} currentWeek={activeWeek} />
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {course.weeks.map((w) => (
              <button
                key={w.number}
                onClick={() => setActiveWeek(w.number)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeWeek === w.number
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Week {w.number} · {weekStats[w.number] ?? 0}%
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {weekDef ? weekDef.title : `Week ${activeWeek}`}
            </h2>
            {weekDef && <p className="text-gray-600 dark:text-gray-400">{weekDef.theme}</p>}
          </div>

          <div className="space-y-4">
            {tasksForWeek.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400">No tasks for this week yet.</p>
            )}
            {tasksForWeek.map((task) => (
              <Link key={task.id} href={`/courses/${course.id}/roles/${role}/week-${activeWeek}#${task.id}`}>
                <TaskCard task={task} completionPercent={taskStats[task.id] ?? 0} />
              </Link>
            ))}
          </div>

          <Link
            href={`/courses/${course.id}/roles/${role}/week-${activeWeek}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Open {weekDef ? weekDef.title : `Week ${activeWeek}`} step-by-step →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

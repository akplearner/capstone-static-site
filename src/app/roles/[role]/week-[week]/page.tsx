'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useStudentContext, useTaskCompletion } from '@/lib/storage';
import { Collapsible } from '@/components/ui/Button';
import { ChecklistItem } from '@/components/TaskComponents';
import { getTasksByRole, WEEKS } from '@/lib/content-data';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function WeekDetailPage() {
  const params = useParams();
  const router = useRouter();
  const role = params.role as 'red' | 'blue' | 'grc';
  const week = parseInt(params.week as string);
  const { context, loading } = useStudentContext();

  useEffect(() => {
    if (!loading && !context) {
      router.push('/settings');
    }
  }, [context, loading, router]);

  useEffect(() => {
    if (context?.role !== role) {
      router.push(`/roles/${context?.role || 'red'}/week-1`);
    }
  }, [context, role, router]);

  if (loading || !context) {
    return <div>Loading...</div>;
  }

  const tasksForWeek = getTasksByRole(role, week as any);
  const weekData = WEEKS[week as 1 | 2 | 3 | 4];

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
      {/* Header with Navigation */}
      <div className="space-y-4">
        <Link href={`/roles/${role}`} className="text-blue-600 hover:underline dark:text-blue-400">
          ← Back to {role.toUpperCase()} Hub
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{weekData.title}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">{weekData.theme}</p>
      </div>

      {/* Week Navigation */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((w) => (
          <Link
            key={w}
            href={`/roles/${role}/week-${w}`}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              week === w
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Week {w}
          </Link>
        ))}
      </div>

      {/* Tasks */}
      <div className="space-y-6">
        {tasksForWeek.map((task, taskIdx) => (
          <motion.div
            key={task.id}
            id={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: taskIdx * 0.15 }}
            className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{task.title}</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{task.objective}</p>
              <div className="mt-4 space-y-1">
                {task.deliverables.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Deliverables:</p>
                    <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {task.deliverables.map((d, idx) => (
                        <li key={idx}>• {d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Steps:</h3>
              <TaskStepsList
                taskId={task.id}
                steps={task.steps}
                memberId={context.memberId}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between">
        {week > 1 ? (
          <Link
            href={`/roles/${role}/week-${week - 1}`}
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Previous Week
          </Link>
        ) : (
          <div />
        )}
        {week < 4 ? (
          <Link
            href={`/roles/${role}/week-${week + 1}`}
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Next Week →
          </Link>
        ) : (
          <div />
        )}
      </div>
    </motion.div>
  );
}

function TaskStepsList({
  taskId,
  steps,
  memberId,
}: {
  taskId: string;
  steps: any[];
  memberId: string;
}) {
  return (
    <div className="space-y-3">
      {steps.map((step, stepIdx) => (
        <StepItem
          key={step.id}
          step={step}
          taskId={taskId}
          memberId={memberId}
          stepIdx={stepIdx}
        />
      ))}
    </div>
  );
}

function StepItem({
  step,
  taskId,
  memberId,
  stepIdx,
}: {
  step: any;
  taskId: string;
  memberId: string;
  stepIdx: number;
}) {
  const completion = useTaskCompletion(memberId, taskId, step.id);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: stepIdx * 0.05 }}
    >
      <ChecklistItem
        stepId={step.id}
        title={step.title}
        command={step.command}
        expectedOutput={step.expectedOutput}
        whatItMeans={step.whatItMeans}
        isComplete={completion.isComplete}
        onToggle={(checked) => {
          if (checked) {
            completion.markComplete({
              taskId,
              memberId,
              stepId: step.id,
              completedAt: Date.now(),
            });
          }
        }}
        frameworks={step.frameworks}
      />
    </motion.div>
  );
}

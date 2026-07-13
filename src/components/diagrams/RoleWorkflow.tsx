'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, MapPin } from 'lucide-react';
import { Course } from '@/lib/types';
import { getRoleDef, getTasksByRole, phaseTag } from '@/lib/course-helpers';
import { roleTint } from '@/lib/utils';

interface RoleWorkflowProps {
  course: Course;
  role: string;
  weekProgress?: Record<number, number>;
  currentWeek?: number;
}

/**
 * Vertical workflow of a single role's weekly tasks, showing the correct order
 * and where the viewer currently is. Works for any number of weeks.
 */
export function RoleWorkflow({ course, role, weekProgress = {}, currentWeek }: RoleWorkflowProps) {
  const roleDef = getRoleDef(course, role);
  const rows = [...course.weeks]
    .sort((a, b) => a.number - b.number)
    .map((w) => ({
      week: w,
      task: getTasksByRole(course, role, w.number)[0],
      pct: weekProgress[w.number] || 0,
    }));

  return (
    <ol className="relative space-y-4">
      {rows.map(({ week, task, pct }, i) => {
        const done = pct === 100;
        const isCurrent = currentWeek === week.number;
        const isLast = i === rows.length - 1;
        return (
          <motion.li
            key={week.number}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative flex gap-4"
          >
            {!isLast && (
              <span className="absolute left-[15px] top-8 h-[calc(100%+0.5rem)] w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden />
            )}
            <div className="z-10 mt-1 shrink-0">
              {done ? (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              ) : isCurrent ? (
                <MapPin className="h-8 w-8 text-blue-600" />
              ) : (
                <Circle className="h-8 w-8 text-gray-300 dark:text-gray-600" />
              )}
            </div>
            <div
              className="flex-1 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
              style={isCurrent && roleDef ? roleTint(roleDef.color, '14') : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {phaseTag(course, week.number)} · {week.title}
                </span>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{pct}%</span>
              </div>
              <div className="mt-0.5 font-medium text-gray-900 dark:text-white">{task ? task.title : '—'}</div>
              {task && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{task.objective}</p>}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}

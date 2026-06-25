'use client';

import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { Course } from '@/lib/types';
import { getDeliverablesForWeek, getWeekDef } from '@/lib/course-helpers';
import { RoleIcon } from '../RoleIcon';
import { DiagramFrame } from './DiagramFrame';

interface DeliverablesMatrixProps {
  course: Course;
  /** Restrict to a single week (e.g. inside a week panel). Default: all weeks. */
  week?: number;
  /** Viewer's role id — its column is highlighted. */
  highlightRole?: string;
  className?: string;
}

/**
 * A week × role grid of the documents each role produces — "who documents what,
 * when". Built from each task's deliverables via getDeliverablesForWeek.
 */
export function DeliverablesMatrix({ course, week, highlightRole }: DeliverablesMatrixProps) {
  const weeks = (week != null ? [week] : course.weeks.map((w) => w.number)).sort((a, b) => a - b);
  const roles = course.roles;

  return (
    <DiagramFrame
      title="Documentation by week & role"
      subtitle="The artifacts each role saves each week — your evidence for the gates and final report."
      howToRead="Rows are weeks, columns are roles. Each cell lists the files that role should produce that week. Your role's column is highlighted."
    >
      <div className="min-w-[560px]">
        {/* Header */}
        <div className="grid" style={{ gridTemplateColumns: `90px repeat(${roles.length}, 1fr)` }}>
          <div />
          {roles.map((r) => (
            <div
              key={r.id}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold ${
                highlightRole === r.id ? 'rounded-t-lg bg-gray-100 dark:bg-gray-700/50' : ''
              }`}
            >
              <RoleIcon iconName={r.icon} className="h-4 w-4" color={r.color} />
              <span className="text-gray-900 dark:text-white">{r.name.split('(')[0].trim()}</span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {weeks.map((w, wi) => {
          const wd = getWeekDef(course, w);
          return (
            <motion.div
              key={w}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: wi * 0.05 }}
              className="grid border-t border-gray-200 dark:border-gray-700"
              style={{ gridTemplateColumns: `90px repeat(${roles.length}, 1fr)` }}
            >
              <div className="px-3 py-3">
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {w === 0 ? 'Setup' : `Week ${w}`}
                </div>
                {wd && <div className="text-[11px] text-gray-400">{wd.title}</div>}
              </div>
              {roles.map((r) => {
                const docs = getDeliverablesForWeek(course, r.id, w);
                return (
                  <div
                    key={r.id}
                    className={`px-3 py-3 ${highlightRole === r.id ? 'bg-gray-50 dark:bg-gray-700/30' : ''}`}
                  >
                    {docs.length === 0 ? (
                      <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                    ) : (
                      <ul className="space-y-1">
                        {docs.map((d) => (
                          <li key={d} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <FileText className="h-3 w-3 shrink-0 text-amber-500" />
                            <span className="truncate font-mono">{d}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </motion.div>
          );
        })}
      </div>
    </DiagramFrame>
  );
}

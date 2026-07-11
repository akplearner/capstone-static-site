'use client';

import { motion } from 'framer-motion';
import { FileText, SquarePen } from 'lucide-react';
import { Course } from '@/lib/types';
import { getDeliverablesForWeek, getWeekDef } from '@/lib/course-helpers';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { RoleIcon } from '../RoleIcon';
import { DiagramFrame } from './DiagramFrame';

/** The form-generated documents a role produces in a given week, scoped to the course. */
function documentsForWeek(courseId: string, role: string, week: number): string[] {
  return deliverablesForCourse(courseId)
    .filter((d) => d.owner === role && d.weeks.includes(week))
    .map((d) => d.title);
}

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
      subtitle="Each cell shows the Document (filled in a website form) and the raw Evidence (captured in the terminal) for that role and week."
      howToRead="Rows are weeks, columns are roles. The violet Document is produced by filling that form on the Deliverables page; the amber Evidence files are raw tool output that back it up. Your role's column is highlighted."
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
                const documents = documentsForWeek(course.id, r.id, w);
                const evidence = getDeliverablesForWeek(course, r.id, w);
                const empty = documents.length === 0 && evidence.length === 0;
                return (
                  <div
                    key={r.id}
                    className={`px-3 py-3 ${highlightRole === r.id ? 'bg-gray-50 dark:bg-gray-700/30' : ''}`}
                  >
                    {empty ? (
                      <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                    ) : (
                      <div className="space-y-2">
                        {documents.length > 0 && (
                          <ul className="space-y-1">
                            {documents.map((d) => (
                              <li key={d} className="flex items-start gap-1.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                                <SquarePen className="mt-0.5 h-3 w-3 shrink-0" />
                                <span>{d} <span className="font-normal text-violet-400 dark:text-violet-500">· form</span></span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {evidence.length > 0 && (
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Evidence</div>
                            <ul className="mt-0.5 space-y-0.5">
                              {evidence.map((d) => (
                                <li key={d} className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                                  <FileText className="h-2.5 w-2.5 shrink-0 text-amber-500" />
                                  <span className="truncate font-mono">{d}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
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

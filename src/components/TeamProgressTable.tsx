'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { Course } from '@/lib/types';
import { getRoleDef } from '@/lib/course-helpers';
import { RoleIcon } from './RoleIcon';

export interface MemberProgress {
  memberId: string;
  displayName: string;
  role: string;
  overall: number;
  weeks: { week: number; pct: number }[];
  isYou: boolean;
}

export interface DeliverableStatus {
  id: string;
  title: string;
  owner: string;
  complete: boolean;
}

function pctColor(p: number) {
  if (p >= 100) return 'bg-green-500';
  if (p > 0) return 'bg-blue-500';
  return 'bg-gray-300 dark:bg-gray-600';
}

/** Roster + per-member week progress and the team's 8 deliverable completions.
 *  Pure presentational — the page computes the rows from the (cloud-hydrated) repos. */
export function TeamProgressTable({
  course,
  rows,
  deliverables,
}: {
  course: Course;
  rows: MemberProgress[];
  deliverables: DeliverableStatus[];
}) {
  const weeks = [...course.weeks].map((w) => w.number).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <th className="px-4 py-2.5">Member</th>
              <th className="px-4 py-2.5">Overall</th>
              {weeks.map((w) => (
                <th key={w} className="px-3 py-2.5 text-center">W{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={2 + weeks.length} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  No teammates yet. As people join this team they&apos;ll appear here.
                </td>
              </tr>
            )}
            {rows.map((m) => {
              const rd = getRoleDef(course, m.role);
              return (
                <tr key={m.memberId} className="border-b border-gray-100 last:border-0 dark:border-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RoleIcon iconName={rd?.icon} className="h-4 w-4 shrink-0" color={rd?.color} />
                      <span className="font-medium text-gray-900 dark:text-white">{m.displayName || 'Unnamed'}</span>
                      {m.isYou && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          You
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{rd?.name ?? m.role}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div className={`h-full rounded-full ${pctColor(m.overall)}`} style={{ width: `${m.overall}%` }} />
                      </div>
                      <span className="tabular-nums text-xs text-gray-600 dark:text-gray-400">{m.overall}%</span>
                    </div>
                  </td>
                  {weeks.map((w) => {
                    const pct = m.weeks.find((x) => x.week === w)?.pct ?? 0;
                    return (
                      <td key={w} className="px-3 py-3 text-center">
                        <span
                          className={`inline-block min-w-[2.5rem] rounded-full px-2 py-0.5 text-xs tabular-nums ${
                            pct >= 100
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                              : pct > 0
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'text-gray-400 dark:text-gray-600'
                          }`}
                        >
                          {pct}%
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Team deliverables</h3>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          The graded documents and whether your team has filled them in.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {deliverables.map((d) => {
            const rd = getRoleDef(course, d.owner);
            return (
              <div
                key={d.id}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              >
                {d.complete ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
                )}
                <span className={`flex-1 text-sm ${d.complete ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                  {d.title}
                </span>
                <span className="flex items-center gap-1 text-[11px] uppercase text-gray-400">
                  <RoleIcon iconName={rd?.icon} className="h-3 w-3" color={rd?.color} />
                  {d.owner}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

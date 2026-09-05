'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import { Course } from '@/lib/types';
import { getRoleDef } from '@/lib/course-helpers';
import { RoleIcon } from './RoleIcon';
import { meter } from '@/lib/motion';

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
  if (p >= 100) return 'bg-ok';
  if (p > 0) return 'bg-accent';
  return 'bg-line';
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
      <div className="overflow-x-auto rounded-lg border border-line bg-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-4 py-2.5">Member</th>
              <th scope="col" className="px-4 py-2.5">Overall</th>
              {weeks.map((w) => (
                <th key={w} scope="col" className="px-3 py-2.5 text-center">W{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={2 + weeks.length} className="px-4 py-6 text-center text-muted">
                  No teammates yet. As people join this team they&apos;ll appear here.
                </td>
              </tr>
            )}
            {rows.map((m) => {
              const rd = getRoleDef(course, m.role);
              return (
                <tr key={m.memberId} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RoleIcon iconName={rd?.icon} className="h-4 w-4 shrink-0" color={rd?.color} />
                      <span className="font-medium text-ink">{m.displayName || 'Unnamed'}</span>
                      {m.isYou && (
                        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-3xs font-medium text-accent-ink">
                          You
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted">{rd?.name ?? m.role}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="relative h-1.5 w-20 overflow-hidden rounded-full bg-line">
                        <motion.div
                          className={`absolute inset-0 origin-left rounded-full ${pctColor(m.overall)}`}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: m.overall / 100 }}
                          transition={meter}
                        />
                      </div>
                      <span className="tabular-nums text-xs text-muted">{m.overall}%</span>
                    </div>
                  </td>
                  {weeks.map((w) => {
                    const pct = m.weeks.find((x) => x.week === w)?.pct ?? 0;
                    return (
                      <td key={w} className="px-3 py-3 text-center">
                        <span
                          className={`inline-block min-w-[2.5rem] rounded-full px-2 py-0.5 text-xs tabular-nums ${
                            pct >= 100
                              ? 'bg-ok-soft text-ok'
                              : pct > 0
                                ? 'bg-accent-soft text-accent-ink'
                                : 'text-muted opacity-60'
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
        <h3 className="text-sm font-semibold text-ink">Team deliverables</h3>
        <p className="mt-0.5 text-xs text-muted">
          The graded documents and whether your team has filled them in.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {deliverables.map((d) => {
            const rd = getRoleDef(course, d.owner);
            return (
              <div
                key={d.id}
                className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2"
              >
                {d.complete ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-line" />
                )}
                <span className={`flex-1 text-sm ${d.complete ? 'text-muted' : 'text-ink'}`}>
                  {d.title}
                </span>
                <span className="flex items-center gap-1 text-2xs text-muted">
                  <RoleIcon iconName={rd?.icon} className="h-3 w-3" color={rd?.color} />
                  {rd?.name ?? d.owner}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

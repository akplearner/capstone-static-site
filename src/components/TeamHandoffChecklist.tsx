'use client';

import { ArrowRight, Handshake } from 'lucide-react';
import { Course } from '@/lib/types';
import { getRoleDef } from '@/lib/course-helpers';

/**
 * An info-only "how the work connects" list for a team, grouped by week. Reads
 * each week's cross-role hand-offs (from → to, artifact) purely as guidance — no
 * gates, no check-off, no "who owes whom" pressure. The point is simply to show
 * how one role's output helps the next role start.
 */

interface HandoffRow {
  key: string;
  week: number;
  from: string;
  to: string;
  artifact?: string;
  label: string;
}

export function TeamHandoffChecklist({ course }: { course: Course; teamId?: string }) {
  const rows: HandoffRow[] = course.gates.flatMap((g) =>
    (g.handoffs ?? []).map((h, i) => ({
      key: `w${g.week}-${i}`,
      week: g.week,
      from: h.from,
      to: h.to,
      artifact: h.artifact,
      label: h.label,
    }))
  );

  if (rows.length === 0) return null;

  const weeks = [...new Set(rows.map((r) => r.week))].sort((a, b) => a - b);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
        <Handshake className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> How your work connects
      </h2>
      <p className="mt-1 text-sm text-muted">
        Week by week, whose output helps the next role. This is guidance, not a gate — every week is open, and you
        can work in any order.
      </p>
      <div className="mt-3 space-y-4">
        {weeks.map((week) => (
          <div key={week}>
            <div className="eyebrow-muted">
              {week === 0 ? 'Setup' : `Week ${week}`}
            </div>
            <ul className="mt-1.5 space-y-1.5">
              {rows
                .filter((r) => r.week === week)
                .map((r) => {
                  const from = getRoleDef(course, r.from);
                  const to = getRoleDef(course, r.to);
                  return (
                    <li key={r.key} className="flex items-start gap-2 text-sm text-body">
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span>
                        <span className="font-semibold" style={{ color: from?.color }}>{from?.name ?? r.from}</span>
                        <ArrowRight className="mx-1 inline h-3 w-3 text-gray-400" />
                        <span className="font-semibold" style={{ color: to?.color }}>{to?.name ?? r.to}</span>
                        {r.artifact && <span className="ml-1 font-mono text-xs">{r.artifact}</span>} — {r.label}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

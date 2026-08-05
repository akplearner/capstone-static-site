'use client';

import { ArrowRight, FileText } from 'lucide-react';
import { Course } from '@/lib/types';
import { getTasksByRole, getRoleDef, phaseTitle, getWeekNumbers } from '@/lib/course-helpers';

/**
 * Week-by-week "who does what, and how the team supports each other" diagram.
 * For each working week it shows one card per role (their task + the evidence /
 * deliverable they produce), then the hand-offs between roles for that week
 * (drawn from the week's gate `handoffs`) as labelled support arrows. Fully
 * data-driven, so it stays correct for any course as tasks/gates change.
 */
export function RoleSupportFlow({ course, highlightRole }: { course: Course; highlightRole?: string }) {
  const weeks = getWeekNumbers(course).filter((n) => n > 0);
  const roles = course.roles;

  return (
    <div className="space-y-5">
      {weeks.map((w) => {
        const gate = course.gates.find((g) => g.week === w);
        const handoffs = gate?.handoffs ?? [];
        return (
          <div key={w} className="rounded-lg border border-line bg-panel p-4">
            <div className="text-sm font-semibold text-ink">{phaseTitle(course, w)}</div>

            {/* One card per role: their task + the evidence they produce. */}
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {roles.map((role) => {
                const tasks = getTasksByRole(course, role.id, w);
                const produces = Array.from(new Set(tasks.flatMap((t) => t.deliverables))).filter(Boolean);
                const dim = highlightRole && highlightRole !== role.id;
                return (
                  <div
                    key={role.id}
                    className={`lane rounded-md py-2.5 pr-3 ${dim ? 'opacity-50' : ''}`}
                    style={{ '--lane-color': role.color } as React.CSSProperties}
                  >
                    <div className="text-sm font-semibold" style={{ color: role.color }}>
                      {role.name}
                    </div>
                    {tasks.length > 0 ? (
                      <ul className="mt-1 space-y-0.5 text-sm text-ink">
                        {tasks.map((t) => (
                          <li key={t.id}>{t.title}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-1 text-sm italic text-muted">— nothing this week</div>
                    )}
                    {produces.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {produces.map((d) => (
                          <div key={d} className="flex items-start gap-1 text-xs text-muted">
                            <FileText className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                            <span className="break-all">{d}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* How the roles support each other this week (the gate hand-offs). */}
            {handoffs.length > 0 && (
              <div className="mt-3 border-t border-line pt-3">
                <div className="font-mono text-[10px] font-semibold uppercase tracking-wide text-muted">
                  How the team supports each other this week
                </div>
                <ul className="mt-1.5 space-y-1.5">
                  {handoffs.map((h, i) => {
                    const from = getRoleDef(course, h.from);
                    const to = getRoleDef(course, h.to);
                    return (
                      <li key={`${h.from}-${h.to}-${i}`} className="flex flex-wrap items-center gap-1.5 text-sm">
                        <span className="font-semibold" style={{ color: from?.color }}>
                          {from?.name ?? h.from}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted" />
                        <span className="font-semibold" style={{ color: to?.color }}>
                          {to?.name ?? h.to}
                        </span>
                        {h.artifact && (
                          <span className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[11px] text-ink ring-1 ring-line">
                            {h.artifact}
                          </span>
                        )}
                        <span className="text-muted">— {h.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

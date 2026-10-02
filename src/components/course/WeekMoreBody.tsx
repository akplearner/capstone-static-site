'use client';

import type { ReactNode } from 'react';
import type { Course, Task, WeekDef } from '@/lib/types';
import { Alert } from '@/components/ui/Alert';
import { LabAccessPanel } from '@/components/week/LabAccessPanel';
import { socTopology, SOC_LOGIN_LABEL, SOC_URL } from '@/lib/labTopology';

/**
 * What the week's one disclosure holds: the "do once" setup strip and the
 * lab-access form. The bar itself (and its hint) stays in `TasksTab`, so the
 * one-disclosure-per-level rule is still read off that file.
 */
export function WeekMoreBody({
  course,
  setupWeeks,
  setupTasks,
  setupPct,
  labAccess,
  row,
}: {
  course: Course;
  setupWeeks: WeekDef[];
  setupTasks: Task[];
  setupPct: number;
  labAccess: boolean;
  row: (task: Task) => ReactNode;
}) {
  return (
    <div className="space-y-4 py-1">
      {/* Setup is "do once", not a week. In class the lab already exists. */}
      {setupTasks.length > 0 && (
        <section id="setup-strip" className="scroll-under-chrome space-y-2">
          <h3 className="text-sm font-semibold text-ink">
            Do once — {setupWeeks.map((w) => w.title).join(' · ')}
            <span className="ml-2 font-normal text-muted">{setupPct}%</span>
          </h3>
          {/* SOC-course banner only: it names the shared Wazuh SOC and its
              login, which is meaningless on a course whose setup is required
              prep rather than a home-lab build. */}
          {!!socTopology(course.id) && (
            <Alert variant="info" title="The classroom SOC is already set up.">
              Sign in at <span className="font-mono text-xs">{SOC_URL}</span> ({SOC_LOGIN_LABEL}) and start at <span className="font-semibold">Week 1</span>. The build
              steps here are only for students setting up their own lab at home — opening them asks you to confirm first.
            </Alert>
          )}
          <div className="space-y-1.5">{setupTasks.map((task) => row(task))}</div>
        </section>
      )}
      {labAccess && <LabAccessPanel courseId={course.id} bare />}
    </div>
  );
}

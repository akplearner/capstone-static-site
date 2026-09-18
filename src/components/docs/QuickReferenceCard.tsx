'use client';

import { FileStack, ClipboardList, Wrench, Tag, GraduationCap } from 'lucide-react';
import { Runs, fillRuns } from '@/components/docs/Runs';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { COURSE_TOOLS, QUICK_REFERENCE as COPY } from '@/lib/docs/manual';
import { EVIDENCE_NAMING_PNG } from '@/lib/evidence';
import type { Run } from '@/lib/docs/securityContent';

/**
 * The one-screen cheat sheet: five panels a student can glance at — the files,
 * the universal form flow, the tools, the naming rules, and what the grade is
 * actually based on.
 *
 * Every word of it is content (`docs/manual.ts`); the file list and the count in
 * the heading are computed from the course's own deliverables, and the naming
 * rule comes from `evidence.ts`, so none of the three can drift.
 */

export function QuickReferenceCard({ courseId = 'security-plus' }: { courseId?: string }) {
  const defs = deliverablesForCourse(courseId);
  const tools = COURSE_TOOLS[courseId] ?? COURSE_TOOLS['security-plus'];
  const panels = [
    {
      icon: FileStack,
      title: COPY.filesTitle.replace('{n}', String(defs.length)),
      body: (
        <ol className="space-y-0.5">
          {defs.map((d) => (
            <li key={d.id}>
              <span className="text-muted">{d.num}.</span> {d.title}
            </li>
          ))}
        </ol>
      ),
    },
    {
      icon: ClipboardList,
      title: COPY.everyFormTitle,
      body: (
        <p>
          <Runs runs={COPY.everyForm as readonly Run[]} />
        </p>
      ),
    },
    {
      icon: Wrench,
      title: COPY.everyToolTitle,
      body: <p className="font-mono text-2xs leading-relaxed">{tools}</p>,
    },
    {
      icon: Tag,
      title: COPY.nameItTitle,
      body: (
        <p>
          <Runs
            runs={fillRuns(COPY.nameIt as readonly Run[], { evidence: EVIDENCE_NAMING_PNG })}
            codeClass="font-mono text-2xs"
          />
        </p>
      ),
    },
    {
      icon: GraduationCap,
      title: COPY.gradedOnTitle,
      body: <p>{COPY.gradedOn}</p>,
    },
  ];

  return (
    <div className="rounded-lg border border-line bg-panel p-5">
      <h3 className="text-sm font-semibold text-ink">{COPY.title}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {panels.map((p) => (
          <div
            key={p.title}
            className="rounded-lg border border-line bg-panel-2 p-3"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-info">
              <p.icon className="h-4 w-4" />
              {p.title}
            </div>
            <div className="mt-2 text-sm text-body">{p.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

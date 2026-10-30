'use client';

import { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { WeekBuildDiagram, type WeekBuildCourse } from '@/components/diagrams/WeekBuildDiagram';
import { LabNetworkPanel } from '@/components/diagrams/LabNetworkPanel';
import { Chip } from '@/components/ui/Chip';
import { useCourseDocument } from '@/lib/useCourse';
import { networkOf } from '@/lib/content/read';
import { WeekAddsList } from './WeekAddsList';

/**
 * R99: the week's picture on the Tasks tab — the build as it stands at the end of this week, with this
 * week's additions glowing and the week's process over it. R100: a thumbnail by default; Expand opens
 * it full size; `fill` (the split view's empty pane) draws it full size with no toggle.
 *
 * R152: a course that carries a lab network (Security+) gets a Build | Network switch — "Build" is this
 * picture, "Network" is the hosts, ports, controls and the week's numbered attacks with Blue's answers,
 * with a Before | After toggle. The switch shows only expanded (the thumbnail stays the build band).
 */
export function WeekVisualPanel({ course, week, fill = false, built }: { course: WeekBuildCourse; week: number; fill?: boolean; /** R151: team-wide build state, threaded to the picture. */ built?: Record<string, number> }) {
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState<'build' | 'network'>('build');
  const open = fill || expanded;
  const hasNet = networkOf(useCourseDocument()).hosts.length > 0;
  const showNet = hasNet && open && view === 'network';
  return (
    <section className="space-y-2" data-week-visual-panel={week} data-expanded={open ? 'true' : 'false'} aria-label="What you build this week">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">What you build this week</h3>
        <div className="flex items-center gap-2">
          {hasNet && open && (
            <div className="inline-flex overflow-hidden rounded-[var(--radius-control)] depth-edge" role="group" aria-label="Picture">
              {(['build', 'network'] as const).map((v) => (
                <button key={v} type="button" data-picture-pick={v} aria-pressed={view === v} onClick={() => setView(v)} className={`px-2.5 py-1 text-xs font-medium capitalize transition-colors ${view === v ? 'bg-accent-soft text-accent-ink' : 'bg-panel text-muted hover:text-ink'}`}>
                  {v}
                </button>
              ))}
            </div>
          )}
          {!fill && (
            <Chip as="button" tone="link" aria-expanded={expanded} onClick={() => setExpanded((e) => !e)} icon={expanded ? <Minimize2 /> : <Maximize2 />}>
              {expanded ? 'Shrink' : 'Expand'}
            </Chip>
          )}
        </div>
      </div>
      {showNet ? (
        <LabNetworkPanel week={week} built={built} />
      ) : (
        <>
          <WeekBuildDiagram course={course} week={week} compact={!open} built={built} />
          {/* R103: the weekly breakdown — what arrives, what it is for, where it is recorded. */}
          <WeekAddsList courseId={course.id} week={week} limit={open ? undefined : 3} />
        </>
      )}
    </section>
  );
}

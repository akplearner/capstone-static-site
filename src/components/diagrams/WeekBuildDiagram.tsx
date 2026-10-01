'use client';

import { useState } from 'react';
import type { Course } from '@/lib/types';
import { socTopology } from '@/lib/labTopology';
import { useCourseDocument } from '@/lib/useCourse';
import { cloudOf, weekVisualsOf } from '@/lib/content/read';
import { Surface } from '@/components/ui/Surface';
import { WeekPills } from '@/components/week/WeekPills';
import { CloudTopology } from './cloud/CloudTopology';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { SocTopologyDiagram } from './SocTopologyDiagram';
import { ServerTopologyDiagram } from './ServerTopologyDiagram';
import { CcnaTopologyDiagram } from './CcnaTopologyDiagram';
import { EngagementDiagram } from './EngagementDiagram';

/**
 * R99: "What you build this week", for any course.
 *
 * One switch on the course's own picture (`topologyPicture`), fed by the
 * week visual the course document carries for the selected week: what is
 * built by then, what arrives this week (glowing), and the week's process
 * drawn over it. The Tasks tab pins it to the week on screen; the Guide adds
 * the week pills; a deliverable form pins it to the form's week.
 */
export type WeekBuildCourse = Pick<Course, 'id' | 'topologyPicture' | 'roles' | 'weeks'>;

export function WeekBuildDiagram({
  course,
  week,
  controls = false,
  onWeekChange,
  business,
  highlightRole,
}: {
  course: WeekBuildCourse;
  /** The course's own week number. */
  week: number;
  /** Show the week pills. Uncontrolled unless `onWeekChange` is given. */
  controls?: boolean;
  onWeekChange?: (week: number) => void;
  /** The rack picture names the team's business. */
  business?: { name?: string; industry?: string };
  /** The lab picture keeps the viewer's role bright. */
  highlightRole?: string;
}) {
  const doc = useCourseDocument();
  const visuals = weekVisualsOf(useCourseDocument());
  const [inner, setInner] = useState(week);
  const current = onWeekChange ? week : controls ? inner : week;
  const setWeek = onWeekChange ?? setInner;
  const v = visuals.find((x) => x.week === current) ?? visuals.find((x) => x.week === week);
  if (!v) return null;
  const weeks = visuals.map((x) => x.week);
  const status = v.highlight.length > 0 ? `${v.highlight.length} new this week` : 'nothing new · the process is drawn';
  const picture = course.topologyPicture ?? (socTopology(course.id) ? 'soc' : 'lab');

  let drawing: React.ReactNode = null;
  if (picture === 'cloud') {
    const cloud = cloudOf(doc);
    drawing = cloud ? (
      <CloudTopology topology={cloud.topology} week={v.builtThrough} weekRange={cloud.block.weeks} process={v.process} controls={false} title="What you build this week" />
    ) : null;
  } else if (picture === 'rack') {
    drawing = <ServerTopologyDiagram builtThrough={v.builtThrough} glow={v.highlight} process={v.process} business={business} />;
  } else if (picture === 'campus') {
    drawing = <CcnaTopologyDiagram builtThrough={v.builtThrough} glow={v.highlight} process={v.process} />;
  } else if (picture === 'soc') {
    const topo = socTopology(course.id);
    drawing = topo ? <SocTopologyDiagram topo={topo} builtThrough={v.builtThrough} glow={v.highlight} process={v.process} /> : null;
  } else if (picture === 'engagement') {
    drawing = <EngagementDiagram builtThrough={v.builtThrough} glow={v.highlight} process={v.process} />;
  } else {
    drawing = <ArchitectureDiagram roles={course.roles} highlightRole={highlightRole} week={v.builtThrough} builtThrough={v.builtThrough} glow={v.highlight} process={v.process} />;
  }

  return (
    <div data-week-visual={v.week} data-built-through={v.builtThrough}>
      {controls && <WeekPills weeks={weeks} selected={current} onSelect={setWeek} status={status} />}
      {picture === 'rack' || picture === 'campus' ? <Surface>{drawing}</Surface> : drawing}
      <p className="mt-2 text-sm text-body" data-caption>
        {v.caption}
      </p>
    </div>
  );
}

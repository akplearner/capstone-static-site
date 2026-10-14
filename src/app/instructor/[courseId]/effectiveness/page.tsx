'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { CohortSkeleton } from '@/components/ui/Skeletons';
import { Crumbs } from '@/components/SiteNav';
import { FunnelPanel } from '@/components/instructor/FunnelPanel';
import { FrictionPanel } from '@/components/instructor/FrictionPanel';
import { courseRepo } from '@/lib/data';
import { loadCohort, isStepDoneIn, type CohortData } from '@/lib/data/cohortLoader';
import { useClientStore, subscribeStore } from '@/lib/useClientStore';
import { courseDocument, bareDocument } from '@/lib/content/docs';
import { deliverablesOf } from '@/lib/content/read';
import { funnelCsv, funnelReport } from '@/lib/funnel';
import { frictionCsv, frictionReport } from '@/lib/friction';
import { downloadText } from '@/lib/download';
import { localDay } from '@/lib/localDate';
import type { Course } from '@/lib/types';

/**
 * R112 — how well the course works, for its instructors: the funnel from
 * enrolment to a filed capstone, the active-weeks bands, and the steps where
 * members tick without output, get stuck or stop. The same loader as the
 * cohort page (the whole course, not the caller's cache); two pure reports;
 * counts only, nobody named; a CSV each.
 */
export default function EffectivenessPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const course = useClientStore<Course | null>(() => courseRepo.get(courseId) ?? null, null);
  const [data, setData] = useState<CohortData | null>(null);

  const reload = useCallback(() => {
    if (!course) return;
    void loadCohort(course).then(setData);
  }, [course]);
  useEffect(() => {
    reload();
  }, [reload]);
  useEffect(() => subscribeStore(reload), [reload]);

  const funnel = useMemo(() => {
    if (!course || !data) return null;
    return funnelReport({
      course,
      roster: data.roster,
      deliverables: deliverablesOf(courseDocument(course.id) ?? bareDocument(course)),
      facts: {
        isStepDone: (m, t, s) => isStepDoneIn(data, course.id, m, t, s),
        evidenceFor: (m) => data.evidence[m] ?? {},
        docsFor: (t) => data.docs[t] ?? {},
      },
    });
  }, [course, data]);

  const friction = useMemo(() => {
    if (!course || !data) return null;
    return frictionReport({
      course,
      roster: data.roster,
      facts: {
        isStepDone: (m, t, s) => isStepDoneIn(data, course.id, m, t, s),
        evidenceFor: (m) => data.evidence[m] ?? {},
        stuck: data.stuck,
      },
    });
  }, [course, data]);

  if (!course || !data || !funnel || !friction) return <CohortSkeleton />;

  const exportFunnel = () => downloadText(`${course.id}_funnel_${localDay()}.csv`, funnelCsv(funnel, course), 'text/csv;charset=utf-8');
  const exportFriction = () => downloadText(`${course.id}_step_friction_${localDay()}.csv`, frictionCsv(friction, course), 'text/csv;charset=utf-8');

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={<Crumbs items={[{ label: 'Home', href: '/' }, { label: 'Instructor', href: '/instructor' }, { label: course.title }, { label: 'Effectiveness' }]} />}
        title="Effectiveness"
        lede={
          data.mode === 'cloud'
            ? `Live from the platform: ${data.roster.length} member${data.roster.length === 1 ? '' : 's'} on this course. Counts only; nobody is named.`
            : `This device only (${data.roster.length} member${data.roster.length === 1 ? '' : 's'}). Connect the platform to its backend to see the whole class.`
        }
        trailing={
          <>
            <Button variant="secondary" size="sm" onClick={reload} className="flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button size="sm" onClick={exportFunnel} className="flex items-center gap-1.5" disabled={data.roster.length === 0}>
              <Download className="h-4 w-4" /> Funnel CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={exportFriction} className="flex items-center gap-1.5" disabled={data.roster.length === 0}>
              <Download className="h-4 w-4" /> Friction CSV
            </Button>
          </>
        }
      />
      <FunnelPanel report={funnel} />
      <FrictionPanel report={friction} />
    </div>
  );
}

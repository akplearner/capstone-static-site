'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { CohortSkeleton } from '@/components/ui/Skeletons';
import { Crumbs } from '@/components/SiteNav';
import { ProjectRecordPanel } from '@/components/instructor/ProjectRecordPanel';
import { courseRepo } from '@/lib/data';
import { loadCohort, type CohortData } from '@/lib/data/cohortLoader';
import { loadTeamHistory, teamRecordFacts } from '@/lib/data/projectRecordLoader';
import { teamRecordView } from '@/lib/teamRecord';
import { bareDocument, courseDocument } from '@/lib/content/docs';
import { CourseContext, CourseDocumentContext } from '@/lib/useCourse';
import { useClientStore } from '@/lib/useClientStore';
import { downloadText } from '@/lib/download';
import { teamLabel } from '@/lib/team';
import { markedWeeks } from '@/lib/rubric';
import type { Course } from '@/lib/types';
import type { DeliverableVersion } from '@/lib/data/types';

/**
 * R141 — the record console: one team's hidden validation layer, for the instructor.
 * The page loads the facts (the cohort loader, the team's history) and hands a pure
 * view to a props-only panel. The learner's pages show none of this.
 */
export default function RecordConsolePage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const course = useClientStore<Course | null>(() => courseRepo.get(courseId) ?? null, null);
  const [data, setData] = useState<CohortData | null>(null);
  const [teamId, setTeamId] = useState<string>('');
  const [history, setHistory] = useState<DeliverableVersion[]>([]);

  const reload = useCallback(() => {
    if (!course) return;
    void loadCohort(course).then(setData);
  }, [course]);
  useEffect(() => {
    reload();
  }, [reload]);

  const teams = useMemo(() => [...new Set((data?.roster ?? []).map((m) => m.teamId))].sort(), [data]);
  // The first team until one is picked: derived, never set from an effect.
  const selected = teamId && teams.includes(teamId) ? teamId : teams[0] ?? '';
  useEffect(() => {
    if (!course || !selected) return;
    let on = true;
    void loadTeamHistory(course, selected).then((h) => {
      if (on) setHistory(h);
    });
    return () => {
      on = false;
    };
  }, [course, selected]);

  const view = useMemo(() => {
    if (!course || !data || !selected) return null;
    const week = markedWeeks(course).at(-1)?.week ?? 1;
    return teamRecordView(teamRecordFacts(course, data, selected, history, week));
  }, [course, data, selected, history]);

  if (!course) return <CohortSkeleton />;
  const doc = courseDocument(course.id) ?? bareDocument(course);
  const download = (kind: 'architecture' | 'infrastructure') => {
    if (!view) return;
    const dto = kind === 'architecture' ? view.architecture : view.infrastructure;
    downloadText(`capstone-project-${kind}_${course.id}_${selected}.json`, JSON.stringify(dto, null, 2), 'application/json');
  };

  return (
    <CourseContext.Provider value={course}>
      <CourseDocumentContext.Provider value={doc}>
        <div className="space-y-6">
          <Crumbs items={[{ label: 'Instructor', href: '/instructor' }, { label: course.title, href: `/instructor/${course.id}` }, { label: 'Record' }]} />
          <PageHeader
            eyebrow="Instructor"
            title="The project record"
            lede="What one team actually recorded, the versions that replaced each other, the conflicts the record finds, the answers to the validation activities, and each member's competency facets and skill validation. Nothing here ranks anyone."
            trailing={
              teams.length > 0 ? (
                <label className="flex items-center gap-2 text-sm text-muted">
                  Team
                  <select value={selected} onChange={(e) => setTeamId(e.target.value)} className="rounded-md border border-line bg-panel px-2 py-1 text-sm text-ink" data-team-picker>
                    {teams.map((t) => (
                      <option key={t} value={t}>
                        {teamLabel(t)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : undefined
            }
          />
          {data?.mode === 'local' && <Alert variant="info">Offline: the record reads whoever joined on this device; the history is this device’s.</Alert>}
          {!data ? <CohortSkeleton /> : teams.length === 0 ? <Alert variant="info">Nobody has joined this course yet.</Alert> : view ? <ProjectRecordPanel view={view} teamLabel={teamLabel(selected)} onDownload={download} /> : <CohortSkeleton />}
        </div>
      </CourseDocumentContext.Provider>
    </CourseContext.Provider>
  );
}

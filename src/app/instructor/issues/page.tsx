'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { toast } from '@/components/ui/Toast';
import { CohortSkeleton } from '@/components/ui/Skeletons';
import { Crumbs } from '@/components/SiteNav';
import { IssuesBoard } from '@/components/instructor/IssuesBoard';
import { courseRepo, taskReportsRepo } from '@/lib/data';
import { loadIssues, type IssuesData } from '@/lib/data/issuesLoader';
import { useClientStore, EMPTY_ARRAY, subscribeStore } from '@/lib/useClientStore';
import { issueTab, type IssueDto, type IssueFilter } from '@/lib/issueInbox';
import type { Course } from '@/lib/types';

/** `?course=<id>` and `?tab=pending|complete|wont_fix|all`, so the instructor home and the cohort page can link straight to a filtered view. */
function initialFilter(): Partial<IssueFilter> {
  if (typeof window === 'undefined') return {};
  const p = new URLSearchParams(window.location.search);
  const tab = p.get('tab');
  return {
    courseId: p.get('course') || undefined,
    tab: tab === 'pending' || tab === 'complete' || tab === 'wont_fix' || tab === 'all' ? tab : undefined,
  };
}

/**
 * Reported issues (R120): every report from every course in one place, with who,
 * when, where, in what role and on which version, and a status the instructor can move.
 * Instructors triage here; fixing the wording is the admin's (R121).
 */
export default function IssuesPage() {
  const courses = useClientStore<Course[]>(() => courseRepo.list(), EMPTY_ARRAY);
  const [data, setData] = useState<IssuesData | null>(null);
  // Read after mount: on a client-side navigation the address is not the new one yet during the first render.
  const [initial, setInitial] = useState<Partial<IssueFilter> | null>(null);
  useEffect(() => {
    const read = () => setInitial(initialFilter());
    read();
  }, []);

  const reload = useCallback(() => {
    void loadIssues(courses).then(setData);
  }, [courses]);
  useEffect(() => {
    reload();
  }, [reload]);
  // Offline, any write on this device re-reads. In the cloud the board re-reads after its own writes and on Refresh.
  const mode = data?.mode;
  useEffect(() => (mode === 'local' ? subscribeStore(reload) : undefined), [mode, reload]);

  const save = async (issue: IssueDto, patch: { status: IssueDto['status']; note: string }): Promise<boolean> => {
    const ok = await taskReportsRepo.update(issue.courseId, issue.id, { status: patch.status, note: patch.note });
    if (ok) {
      toast({ message: issueTab(patch.status) === 'pending' ? 'Saved.' : `Saved: ${patch.status === 'resolved' ? 'resolved' : 'closed without a change'}.`, variant: 'success' });
      reload();
    }
    return ok;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<Crumbs items={[{ label: 'Home', href: '/' }, { label: 'Instructor', href: '/instructor' }, { label: 'Reported issues' }]} />}
        title="Reported issues"
        lede="Who reported what, where in the course, in which role and on which version, and where it stands."
      />
      {data && initial ? <IssuesBoard courses={courses} data={data} onSave={save} onRefresh={reload} initial={initial} /> : <CohortSkeleton />}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { toast } from '@/components/ui/Toast';
import { CohortSkeleton } from '@/components/ui/Skeletons';
import { Crumbs } from '@/components/SiteNav';
import { IssuesBoard } from '@/components/instructor/IssuesBoard';
import { FixTextPanel } from '@/components/instructor/FixTextPanel';
import { FixesLedger } from '@/components/instructor/FixesLedger';
import { baseCourse, courseDocument } from '@/lib/content/docs';
import { contentFixesRepo, courseRepo, taskReportsRepo } from '@/lib/data';
import { loadIssues, type IssuesData } from '@/lib/data/issuesLoader';
import { downloadText } from '@/lib/download';
import { localDay } from '@/lib/localDate';
import { LAB_FIELDS } from '@/lib/labAccess';
import { NO_FIXES, currentVersion, fixBundle, fixVersion, foldDraft, ledger, revertDraft, type ContentFix, type FixDraft } from '@/lib/contentFix';
import { isPendingReport } from '@/lib/reportKinds';
import { buildIssues, issueTab, type IssueDto, type IssueFilter } from '@/lib/issueInbox';
import { useAuth } from '@/lib/useAuth';
import { useClientStore, EMPTY_ARRAY, subscribeStore } from '@/lib/useClientStore';
import { useInstructorAuth } from '@/lib/useInstructorAuth';
import type { Course } from '@/lib/types';

type View = 'reports' | 'fixes';

/** `?course=<id>`, `?tab=pending|complete|wont_fix|all` and `?view=fixes`, so the instructor home and the cohort page can link straight to a filtered view. */
function initialFilter(): { filter: Partial<IssueFilter>; view: View } {
  if (typeof window === 'undefined') return { filter: {}, view: 'reports' };
  const p = new URLSearchParams(window.location.search);
  const tab = p.get('tab');
  return {
    filter: {
      courseId: p.get('course') || undefined,
      tab: tab === 'pending' || tab === 'complete' || tab === 'wont_fix' || tab === 'all' ? tab : undefined,
    },
    view: p.get('view') === 'fixes' ? 'fixes' : 'reports',
  };
}

/** The placeholders the course fills in from the lab-access panel: a fix may add one of these and no other. */
const LAB_TOKENS: ReadonlySet<string> = new Set(LAB_FIELDS.flatMap((f) => f.tokens).map((t) => t.toLowerCase()));

const VIEWS: { id: View; label: string }[] = [
  { id: 'reports', label: 'Reports' },
  { id: 'fixes', label: 'Fixes' },
];

/**
 * Reported issues (R120): every report from every course in one place, with who,
 * when, where, in what role and on which version, and a status the instructor can move.
 * Instructors triage here. The admin also fixes the wording (R121): a Fix the text panel under
 * each report, and the Fixes view, the ledger of every correction with its version.
 */
export default function IssuesPage() {
  const courses = useClientStore<Course[]>(() => courseRepo.list(), EMPTY_ARRAY);
  const { isAdmin } = useInstructorAuth();
  const { profile } = useAuth();
  const by = profile?.displayName || 'Instructor';
  const [data, setData] = useState<IssuesData | null>(null);
  // Read after mount: on a client-side navigation the address is not the new one yet during the first render.
  const [initial, setInitial] = useState<ReturnType<typeof initialFilter> | null>(null);
  const [view, setView] = useState<View>('reports');
  const [ledgerCourse, setLedgerCourse] = useState('');
  // Whether the fix ledger could be read: a database that has not had migration 0017 says so here.
  const [ledgerState, setLedgerState] = useState<{ ok: boolean; needsUpdate: boolean } | null>(null);
  useEffect(() => {
    const read = () => {
      const first = initialFilter();
      setInitial(first);
      setView(first.view);
      setLedgerCourse(first.filter.courseId ?? '');
    };
    read();
  }, []);
  useEffect(() => {
    if (!isAdmin) return;
    const load = () => void contentFixesRepo.load().then(setLedgerState);
    load();
  }, [isAdmin]);

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

  // A fix: one entry in the course's ledger, then the reports it answers closed against its revision.
  const saveFix = async (issue: IssueDto, draft: FixDraft, resolution: { resolveIds: string[]; note: string }): Promise<boolean> => {
    const fix = await contentFixesRepo.add(issue.courseId, draft, by);
    if (!fix) return false;
    let failed = 0;
    for (const id of resolution.resolveIds) {
      const ok = await taskReportsRepo.update(issue.courseId, id, { status: 'resolved', note: resolution.note, fixRevision: fix.revision });
      if (!ok) failed++;
    }
    toast({
      message: `Saved as revision ${fix.revision} (v${fixVersion(fix)}). The new text is live for students.${failed > 0 ? ` ${failed} report${failed === 1 ? '' : 's'} could not be closed: close ${failed === 1 ? 'it' : 'them'} from the list.` : ''}`,
      variant: failed > 0 ? 'warning' : 'success',
    });
    reload();
    return true;
  };

  const renderFix = (issue: IssueDto, all: readonly IssueDto[]) => {
    const course = courses.find((c) => c.id === issue.courseId);
    if (!course) return null;
    const others = all.filter((o) => o.id !== issue.id && o.courseId === issue.courseId && o.taskId === issue.taskId && o.stepId === issue.stepId && isPendingReport(o.status));
    return <FixTextPanel course={course} issue={issue} others={others} labTokens={LAB_TOKENS} onSave={(draft, resolution) => saveFix(issue, draft, resolution)} />;
  };

  // The Fixes view: one course's ledger. Its default is the course the address names, else the first course with a fix, else the first course.
  const withFixes = useClientStore(() => courses.filter((c) => contentFixesRepo.list(c.id).length > 0).map((c) => c.id).join(','), '');
  const ledgerId = courses.some((c) => c.id === ledgerCourse) ? ledgerCourse : (withFixes.split(',')[0] || courses[0]?.id || '');
  const ledgerCourseDef = courses.find((c) => c.id === ledgerId);
  const fixes = useClientStore<readonly ContentFix[]>(() => contentFixesRepo.list(ledgerId), NO_FIXES);
  const base = baseCourse(ledgerId);
  const rows = useMemo(() => (base ? ledger(base, fixes) : []), [base, fixes]);
  const names = useMemo(() => {
    const byId = new Map(buildIssues(courses, data?.reports ?? [], data?.people ?? { nameOf: () => undefined, roleOf: () => undefined, resolverName: () => undefined }).map((r) => [r.id, r.reporter.name]));
    return (id: string) => byId.get(id);
  }, [courses, data]);

  const record = async (draft: FixDraft, message: (revision: number, version: string) => string): Promise<boolean> => {
    const fix = await contentFixesRepo.add(ledgerId, draft, by);
    if (fix) toast({ message: message(fix.revision, fixVersion(fix)), variant: 'success' });
    return !!fix;
  };

  const showFixes = isAdmin && view === 'fixes';
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<Crumbs items={[{ label: 'Home', href: '/' }, { label: 'Instructor', href: '/instructor' }, { label: 'Reported issues' }]} />}
        title="Reported issues"
        lede="Who reported what, where in the course, in which role and on which version, and where it stands."
      />
      {isAdmin && (
        <div role="tablist" aria-label="Reports or fixes" className="flex flex-wrap gap-1.5">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={view === v.id}
              data-issues-view={v.id}
              onClick={() => setView(v.id)}
              className={`focusable rounded-md px-3 py-1.5 text-sm font-medium ${view === v.id ? 'bg-accent text-accent-contrast' : 'depth-edge bg-panel text-body hover:bg-panel-2'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
      {showFixes ? (
        ledgerCourseDef && base ? (
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="block font-medium text-body">Course</span>
              <select value={ledgerId} onChange={(e) => setLedgerCourse(e.target.value)} className="mt-1 max-w-full text-sm" data-fixes-course>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <FixesLedger
              course={ledgerCourseDef}
              rows={rows}
              reporters={names}
              canEdit={isAdmin}
              needsUpdate={!!ledgerState?.needsUpdate}
              local={mode === 'local'}
              onRevert={(fix) => record(revertDraft(fix), (n, v) => `Reverted revision ${fix.revision}. Saved as revision ${n} (v${v}).`)}
              onFold={(revisions, foldedIn) => record(foldDraft(revisions, foldedIn), (n, v) => `Marked in code. Saved as revision ${n} (v${v}).`)}
              onBundle={() => downloadText(`${ledgerId}_fixes_v${currentVersion(ledgerCourseDef)}_${localDay()}.json`, JSON.stringify(fixBundle(base, fixes, { seedFile: courseDocument(ledgerId)?.generatedFrom[0] ?? null }), null, 2) + '\n', 'application/json')}
              onDocument={() => downloadText(`${ledgerId}_document_v${currentVersion(ledgerCourseDef)}_${localDay()}.json`, JSON.stringify(courseDocument(ledgerId), null, 2) + '\n', 'application/json')}
            />
          </div>
        ) : (
          <CohortSkeleton />
        )
      ) : data && initial ? (
        <div className="space-y-4">
          {isAdmin && ledgerState?.needsUpdate && (
            <div data-fixes-update>
              <p className="text-sm text-muted">Fixes need migration 0017 (supabase/setup.sql). Until it is applied, a fix cannot be saved.</p>
            </div>
          )}
          <IssuesBoard courses={courses} data={data} onSave={save} onRefresh={reload} initial={initial.filter} renderExtra={isAdmin ? renderFix : undefined} />
        </div>
      ) : (
        <CohortSkeleton />
      )}
    </div>
  );
}

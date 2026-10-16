'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Download, Layers, RefreshCw, Search } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Surface } from '@/components/ui/Surface';
import { downloadText } from '@/lib/download';
import { localDay } from '@/lib/localDate';
import { reportKindLabel, type ReportStatus } from '@/lib/reportKinds';
import { buildIssues, filterIssues, groupByTask, issueCounts, issueFacets, issuesCsv, type IssueDto, type IssueFilter, type IssueTab } from '@/lib/issueInbox';
import type { IssuesData } from '@/lib/data/issuesLoader';
import type { Course } from '@/lib/types';
import { IssueCard } from './IssueCard';

const TABS: { id: IssueTab; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'complete', label: 'Complete' },
  { id: 'wont_fix', label: 'Won’t fix' },
  { id: 'all', label: 'All' },
];

/** The words the board prints, in one place. */
export const ISSUES_COPY = {
  none: 'Nothing has been reported yet. Students report from any task, with Report an issue.',
  noMatch: 'No report matches these filters.',
  update: 'Database update needed. Reports are being filed without their step, role and version, and the In progress and Won’t fix statuses are not available yet. Open the Supabase SQL Editor, paste supabase/setup.sql and press Run (it is safe to repeat). SUPABASE_SETUP.md has the steps.',
  local: 'This device only: the reports stored in this browser. Connect the platform to its backend to see every report.',
} as const;

/**
 * The issues inbox (R120): every report from every course, newest first, on four tabs
 * (pending, complete, won't fix, all), with filters for course, week, the reporter's
 * role, the task's role, kind and reporter, a search box, and a group-by-task view that
 * puts the tasks with the most pending reports first, which is where content needs
 * fixing. Each card carries who, when, where, in what role and on which version; the
 * instructor's move is a status and a note. `renderExtra` is where the admin's fix panel
 * sits (R121). Props only: the page loads the rows and stores the changes.
 */
export function IssuesBoard({
  courses,
  data,
  onSave,
  onRefresh,
  initial,
  renderExtra,
}: {
  courses: readonly Course[];
  data: IssuesData;
  onSave: (issue: IssueDto, patch: { status: ReportStatus; note: string }) => Promise<boolean>;
  onRefresh: () => void;
  initial?: Partial<IssueFilter>;
  renderExtra?: (issue: IssueDto) => ReactNode;
}) {
  const [tab, setTab] = useState<IssueTab>(initial?.tab ?? 'pending');
  const [filters, setFilters] = useState<Omit<IssueFilter, 'tab'>>({ courseId: initial?.courseId, q: initial?.q });
  const [grouped, setGrouped] = useState(true);

  const rows = useMemo(() => buildIssues(courses, data.reports, data.people), [courses, data.reports, data.people]);
  const facets = useMemo(() => issueFacets(rows), [rows]);
  // The tabs count what the other filters leave, so "Pending 3" is true of what is on screen.
  const counts = useMemo(() => issueCounts(filterIssues(rows, { ...filters, tab: 'all' })), [rows, filters]);
  const shown = useMemo(() => filterIssues(rows, { ...filters, tab }), [rows, filters, tab]);
  const groups = useMemo(() => groupByTask(shown), [shown]);
  const active = Object.values(filters).some((v) => v !== undefined && v !== '');
  const set = <K extends keyof typeof filters>(k: K, v: (typeof filters)[K]) => setFilters((f) => ({ ...f, [k]: v === '' ? undefined : v }));

  const card = (i: IssueDto) => (
    <IssueCard key={`${i.id}:${i.status}:${i.resolution?.note ?? ''}`} issue={i} onSave={(_id, patch) => onSave(i, patch)} extra={renderExtra?.(i)} />
  );
  const stamp = localDay();

  return (
    <div className="space-y-4" data-issues-board>
      {data.needsUpdate && (
        <div data-issues-update>
          <Alert variant="warning">{ISSUES_COPY.update}</Alert>
        </div>
      )}
      {data.mode === 'local' && <p className="text-sm text-muted">{ISSUES_COPY.local}</p>}

      <div role="tablist" aria-label="Report status" className="flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const n = t.id === 'pending' ? counts.pending : t.id === 'complete' ? counts.complete : t.id === 'wont_fix' ? counts.wontFix : counts.total;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              data-issues-tab={t.id}
              onClick={() => setTab(t.id)}
              className={`focusable rounded-md px-3 py-1.5 text-sm font-medium ${tab === t.id ? 'bg-accent text-accent-contrast' : 'depth-edge bg-panel text-body hover:bg-panel-2'}`}
            >
              {t.label} <span className="font-mono text-xs" data-issues-count={t.id}>{n}</span>
            </button>
          );
        })}
        <span className="ml-auto flex flex-wrap items-center gap-1.5">
          <Button variant="secondary" size="sm" onClick={onRefresh} className="flex items-center gap-1.5">
            <RefreshCw className="h-4 w-4" aria-hidden /> Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={() => downloadText(`issues_${stamp}.csv`, issuesCsv(shown), 'text/csv;charset=utf-8')} disabled={shown.length === 0} className="flex items-center gap-1.5" data-issues-csv>
            <Download className="h-4 w-4" aria-hidden /> CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => downloadText(`issues_${stamp}.json`, JSON.stringify(shown, null, 2) + '\n', 'application/json')} disabled={shown.length === 0} className="flex items-center gap-1.5" data-issues-json>
            <Download className="h-4 w-4" aria-hidden /> JSON
          </Button>
        </span>
      </div>

      <Surface as="section" variant="inset" className="space-y-3" aria-label="Filters">
        <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:items-end">
          <Pick label="Course" value={filters.courseId} onChange={(v) => set('courseId', v)} options={facets.courses.map((c) => [c.id, c.title])} all="All courses" />
          <Pick label="Week" value={filters.week === undefined ? undefined : String(filters.week)} onChange={(v) => set('week', v === '' ? undefined : Number(v))} options={facets.weeks.map((w) => [String(w), `Week ${w}`])} all="Any week" />
          <Pick label="Reporter’s role" value={filters.reporterRole} onChange={(v) => set('reporterRole', v)} options={facets.reporterRoles.map((r) => [r.id, r.name])} all="Any role" />
          <Pick label="Task’s role" value={filters.taskRole} onChange={(v) => set('taskRole', v)} options={facets.taskRoles.map((r) => [r.id, r.name])} all="Any role" />
          <Pick label="Kind" value={filters.kind} onChange={(v) => set('kind', v)} options={facets.kinds.map((k) => [k.id, k.label])} all="Any kind" />
          <Pick label="Reporter" value={filters.reporter} onChange={(v) => set('reporter', v)} options={facets.reporters.map((n) => [n, n])} all="Anyone" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-w-0 flex-1 basis-60 items-center gap-2">
            <span className="sr-only">Search the reports</span>
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            <input
              type="search"
              value={filters.q ?? ''}
              onChange={(e) => set('q', e.target.value)}
              placeholder="Search the note, the task, the step, the reporter"
              className="min-w-0 flex-1 text-sm placeholder:text-muted"
              data-issues-search
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-body">
            <input type="checkbox" checked={grouped} onChange={(e) => setGrouped(e.target.checked)} className="accent-[var(--color-accent)]" data-issues-group />
            <Layers className="h-4 w-4 text-muted" aria-hidden /> Group by task
          </label>
          {active && (
            <button type="button" onClick={() => setFilters({})} className="focusable text-sm font-medium text-accent hover:underline" data-issues-clear>
              Clear filters
            </button>
          )}
        </div>
      </Surface>

      <p className="text-sm text-muted" aria-live="polite" data-issues-shown>
        {shown.length} report{shown.length === 1 ? '' : 's'}
      </p>

      {shown.length === 0 ? (
        <Alert variant="info">{rows.length === 0 ? ISSUES_COPY.none : ISSUES_COPY.noMatch}</Alert>
      ) : grouped ? (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.key} className="space-y-2" aria-label={g.taskTitle} data-issue-group={g.taskId}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-base font-semibold text-ink">
                  <span className="text-muted">
                    {g.courseTitle}
                    {g.week !== null && ` › Week ${g.week} › `}
                    {g.week === null && ' › '}
                  </span>
                  {g.taskTitle}
                </h2>
                <span className="text-sm text-muted">
                  {g.pending} pending of {g.total}
                </span>
                {Object.entries(g.kinds).map(([k, n]) => (
                  <Chip key={k} tone="muted">
                    {n} {reportKindLabel(k).toLowerCase()}
                  </Chip>
                ))}
              </div>
              <ul className="space-y-2">{g.issues.map(card)}</ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">{shown.map(card)}</ul>
      )}
    </div>
  );
}

function Pick({ label, value, onChange, options, all }: { label: string; value: string | undefined; onChange: (v: string) => void; options: [string, string][]; all: string }) {
  return (
    <label className="min-w-0 text-sm">
      <span className="block font-medium text-body">{label}</span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full text-sm md:w-auto md:max-w-60" disabled={options.length === 0}>
        <option value="">{all}</option>
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

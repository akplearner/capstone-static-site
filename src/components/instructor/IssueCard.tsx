'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { CheckCircle2, CircleDashed, CircleDot, ExternalLink, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Chip, type ChipTone } from '@/components/ui/Chip';
import { REPORT_STATUSES, reportKindLabel, reportStatusLabel, type ReportStatus } from '@/lib/reportKinds';
import { splitRoleName } from '@/lib/docs/roles';
import { teamLabel } from '@/lib/team';
import type { IssueDto } from '@/lib/issueInbox';

/** One status, one icon and one word, never colour alone (R120). */
export const STATUS_LOOK: Record<ReportStatus, { icon: ReactNode; tone: ChipTone }> = {
  open: { icon: <CircleDashed />, tone: 'warn' },
  in_progress: { icon: <CircleDot />, tone: 'info' },
  resolved: { icon: <CheckCircle2 />, tone: 'ok' },
  wont_fix: { icon: <XCircle />, tone: 'muted' },
};

export function StatusChip({ status }: { status: ReportStatus }) {
  const look = STATUS_LOOK[status];
  return (
    <Chip tone={look.tone} icon={look.icon} data-issue-status={status}>
      {reportStatusLabel(status)}
    </Chip>
  );
}

export const when = (iso: string) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Time not recorded');

/** Where the student saw it, as a link a staff member can follow. Not offered once the task is gone. */
export function taskHref(i: IssueDto): string | null {
  if (i.orphan && i.taskTitle === i.taskId) return null;
  return `/courses/${i.courseId}?tab=tasks${i.week !== null ? `&week=${i.week}` : ''}&task=${i.taskId}${i.stepId && i.stepTitle ? `&step=${i.stepId}` : ''}`;
}

/**
 * One reported issue (R120): who, when, where, in what role, on which version, what
 * they said, where it stands, and the instructor's move — a status and a note for the
 * reporter. Every fact is the one recorded when it was filed. `extra` is where the
 * admin's fix panel sits (R121), under the report it answers.
 */
export function IssueCard({ issue, onSave, extra }: { issue: IssueDto; onSave: (id: string, patch: { status: ReportStatus; note: string }) => Promise<boolean>; extra?: ReactNode }) {
  const [status, setStatus] = useState<ReportStatus>(issue.status);
  const [note, setNote] = useState(issue.resolution?.note ?? '');
  const [busy, setBusy] = useState(false);
  const dirty = status !== issue.status || note.trim() !== (issue.resolution?.note ?? '').trim();
  const href = taskHref(issue);
  const role = issue.reporter.roleName ? splitRoleName(issue.reporter.roleName).fn : null;

  const save = async () => {
    setBusy(true);
    await onSave(issue.id, { status, note: note.trim() });
    setBusy(false);
  };

  return (
    <li className="space-y-2 rounded-lg depth-edge bg-panel p-4 text-sm" data-issue={issue.id} data-issue-state={issue.status}>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusChip status={issue.status} />
        <Chip tone="neutral" data-issue-kind={issue.kind}>
          {reportKindLabel(issue.kind)}
        </Chip>
        {issue.contentVersion && (
          <Chip tone="muted" title="The version of the course the reporter was looking at" data-issue-version>
            saw v{issue.contentVersion}
          </Chip>
        )}
        {issue.resolution?.fixRevision != null && (
          <Chip tone="ok" title="The content fix that resolved this report" data-issue-fix>
            fixed in revision {issue.resolution.fixRevision}
          </Chip>
        )}
        {issue.orphan && (
          <Chip tone="warn" title="The task or step this report names is no longer in the course" data-issue-orphan>
            {issue.taskTitle === issue.taskId ? 'Task removed' : 'Step removed'}
          </Chip>
        )}
      </div>

      <p className="text-xs text-muted" data-issue-meta>
        <span className="font-medium text-body">{issue.reporter.name}</span>
        {role && <> · {role}</>}
        {issue.reporter.teamId && <> · {teamLabel(issue.reporter.teamId)}</>} · reported {when(issue.reportedAt)}
      </p>

      <p className="text-ink" data-issue-where>
        <span className="text-muted">{issue.courseTitle}</span>
        {issue.week !== null && <span className="text-muted"> › Week {issue.week}</span>}
        <span className="text-muted"> › </span>
        <span className="font-medium">{issue.taskTitle}</span>
        {issue.stepTitle && (
          <>
            <span className="text-muted"> › </span>
            <span className="font-medium">
              Step {issue.stepNumber}: {issue.stepTitle}
            </span>
          </>
        )}
        {issue.taskRoleName && <span className="text-muted"> · task for {splitRoleName(issue.taskRoleName).fn}</span>}
      </p>

      {issue.note ? <p className="whitespace-pre-wrap break-words text-body" data-issue-note>{issue.note}</p> : <p className="text-muted">No note.</p>}

      {issue.resolution && issue.status !== 'open' && issue.status !== 'in_progress' && (
        <p className="rounded-md bg-panel-2 px-3 py-2 text-xs text-body" data-issue-resolution>
          <span className="font-medium">{reportStatusLabel(issue.status)}</span>
          {issue.resolution.by && <> by {issue.resolution.by}</>}
          {issue.resolution.at && <> · {when(issue.resolution.at)}</>}
          {issue.resolution.note && <>: {issue.resolution.note}</>}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-2 pt-1" data-issue-controls>
        <label className="text-xs">
          <span className="block font-medium text-body">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as ReportStatus)} className="mt-1 text-sm" aria-label={`Status of the report by ${issue.reporter.name}`}>
            {REPORT_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 flex-1 basis-56 text-xs">
          <span className="block font-medium text-body">Note for the reporter</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="What changed, or why it stays as written"
            className="mt-1 w-full rounded-md bg-panel-2 px-2 py-1.5 text-sm text-ink placeholder-muted"
          />
        </label>
        <Button size="sm" onClick={() => void save()} disabled={!dirty || busy} data-issue-save>
          {busy ? 'Saving…' : 'Save'}
        </Button>
        {href && (
          <Link href={href} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-panel-2 hover:underline" data-issue-open>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Open task
          </Link>
        )}
      </div>

      {extra}
    </li>
  );
}

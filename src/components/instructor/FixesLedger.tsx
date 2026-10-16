'use client';

import { useState, type ReactNode } from 'react';
import { AlertTriangle, CircleDot, Download, GitMerge, Undo2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Chip, type ChipTone } from '@/components/ui/Chip';
import { Dialog } from '@/components/ui/Dialog';
import { FIX_KIND_LABEL, FIX_STATE_LABEL, currentVersion, fieldLabel, fixVersion, ledgerSummary, type ContentFix, type FixState, type LedgerRow } from '@/lib/contentFix';
import type { Course } from '@/lib/types';
import { when } from './IssueCard';

/** The words the ledger prints, in one place. */
export const LEDGER_COPY = {
  none: 'No fixes yet for this course. Fix the text from a report in the Reports view.',
  update: 'Database update needed. Fixes cannot be saved or read until migration 0017 is applied. Open the Supabase SQL Editor, paste supabase/setup.sql and press Run (it is safe to repeat). SUPABASE_SETUP.md has the steps.',
  local: 'This device only: the fixes stored in this browser.',
  liveOne: '1 live fix is not in the code yet.',
  liveMany: '{n} live fixes are not in the code yet.',
  liveHow: 'Download the fix bundle, make the same changes in the course file, deploy, then mark them In code.',
  revertTitle: 'Revert this fix?',
  revertBody: 'The text goes back to what it was. This is saved as a new revision; the history stays.',
  foldTitle: 'Mark as in code',
  foldBody: 'Record that the selected fixes are now part of the code. This changes no text; it only moves them out of the live list.',
  foldedIn: 'Shipped in (a commit or a deploy)',
  foldedPlaceholder: 'e.g. deploy of 20 October',
  changedAgain: 'Changed again in revision {n}. Revert that first.',
  skipped: 'Part of this fix no longer applies: the text changed underneath it.',
  moved: 'The text has changed since.',
  was: 'Was',
  now: 'Now',
  empty: '(empty)',
} as const;

const STATE_LOOK: Record<FixState, { icon: ReactNode; tone: ChipTone }> = {
  live: { icon: <CircleDot />, tone: 'ok' },
  reverted: { icon: <Undo2 />, tone: 'muted' },
  in_code: { icon: <GitMerge />, tone: 'info' },
  stale: { icon: <AlertTriangle />, tone: 'warn' },
};

const fill = (t: string, vars: Record<string, string>) => t.replace(/\{(\w+)\}/g, (w, k: string) => vars[k] ?? w);

/** Where in the course a change is, by the titles a person knows. */
function placeOf(course: Course, c: { taskId: string; stepId?: string }): string {
  const task = course.tasks.find((t) => t.id === c.taskId);
  if (!task) return c.taskId;
  if (c.stepId === undefined) return task.title;
  const i = task.steps.findIndex((s) => s.id === c.stepId);
  return i < 0 ? `${task.title} › ${c.stepId}` : `${task.title} › Step ${i + 1}: ${task.steps[i].title}`;
}

/**
 * One course's fix ledger (R121): every revision with who, when, where, what changed and where it
 * stands (Live, Reverted, In code or Stale), newest first, with the two moves an admin has: revert
 * a fix, and record that fixes have been folded into the code. Downloads are the fix bundle a
 * developer folds from and the live course document. Props only: the page loads the ledger and
 * stores what is saved.
 */
export function FixesLedger({
  course,
  rows,
  reporters,
  canEdit,
  needsUpdate,
  local,
  onRevert,
  onFold,
  onBundle,
  onDocument,
}: {
  /** The course as students read it now: its titles name the places, its version heads the list. */
  course: Course;
  /** The ledger, oldest first (`ledger()`). */
  rows: readonly LedgerRow[];
  /** The people a fix answers, by the report ids it carries. */
  reporters: (issueId: string) => string | undefined;
  canEdit: boolean;
  needsUpdate: boolean;
  local: boolean;
  onRevert: (fix: ContentFix) => Promise<boolean>;
  onFold: (revisions: number[], foldedIn: string) => Promise<boolean>;
  onBundle: () => void;
  onDocument: () => void;
}) {
  const [revert, setRevert] = useState<ContentFix | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [folding, setFolding] = useState(false);
  const [foldedIn, setFoldedIn] = useState('');
  const [busy, setBusy] = useState(false);

  const summary = ledgerSummary(rows);
  const newestFirst = [...rows].reverse();
  const toggle = (rev: number) => setPicked((p) => (p.includes(rev) ? p.filter((r) => r !== rev) : [...p, rev]));

  const doRevert = async () => {
    if (!revert) return;
    setBusy(true);
    await onRevert(revert);
    setBusy(false);
    setRevert(null);
  };
  const doFold = async () => {
    setBusy(true);
    const ok = await onFold(picked, foldedIn);
    setBusy(false);
    if (ok) {
      setFolding(false);
      setPicked([]);
      setFoldedIn('');
    }
  };

  return (
    <div className="space-y-4" data-fixes-ledger>
      {needsUpdate && (
        <div data-fixes-update>
          <Alert variant="warning">{LEDGER_COPY.update}</Alert>
        </div>
      )}
      {local && <p className="text-sm text-muted">{LEDGER_COPY.local}</p>}

      <div className="flex flex-wrap items-center gap-1.5" data-fixes-summary>
        <Chip tone="neutral" title="The course’s content version: the document’s, then the ledger’s revision" data-fixes-version>
          v{currentVersion(course)}
        </Chip>
        <Chip tone="ok" icon={STATE_LOOK.live.icon} data-fixes-count="live">
          {summary.live} live
        </Chip>
        <Chip tone="info" icon={STATE_LOOK.in_code.icon} data-fixes-count="in_code">
          {summary.inCode} in code
        </Chip>
        <Chip tone="muted" icon={STATE_LOOK.reverted.icon} data-fixes-count="reverted">
          {summary.reverted} reverted
        </Chip>
        {summary.stale > 0 && (
          <Chip tone="warn" icon={STATE_LOOK.stale.icon} data-fixes-count="stale">
            {summary.stale} stale
          </Chip>
        )}
        <span className="ml-auto flex flex-wrap items-center gap-1.5">
          <Button variant="secondary" size="sm" onClick={onBundle} disabled={rows.length === 0} className="flex items-center gap-1.5" data-fixes-bundle>
            <Download className="h-4 w-4" aria-hidden /> Fix bundle
          </Button>
          <Button variant="secondary" size="sm" onClick={onDocument} className="flex items-center gap-1.5" data-fixes-document>
            <Download className="h-4 w-4" aria-hidden /> Live course document
          </Button>
          {canEdit && (
            <Button size="sm" onClick={() => setFolding(true)} disabled={picked.length === 0} data-fixes-fold>
              Mark in code{picked.length > 0 ? ` (${picked.length})` : ''}
            </Button>
          )}
        </span>
      </div>

      {summary.live > 0 && (
        <div data-fixes-banner>
          <Alert variant="info">
            {summary.live === 1 ? LEDGER_COPY.liveOne : fill(LEDGER_COPY.liveMany, { n: String(summary.live) })} {LEDGER_COPY.liveHow}
          </Alert>
        </div>
      )}

      {rows.length === 0 ? (
        <Alert variant="info">{LEDGER_COPY.none}</Alert>
      ) : (
        <ul className="space-y-2">
          {newestFirst.map((r) => {
            const { fix } = r;
            const look = r.state ? STATE_LOOK[r.state] : null;
            const names = [...new Set(fix.issueIds.map(reporters).filter((n): n is string => !!n))];
            const blocked = r.state === 'live' && !r.canRevert ? (r.blockedBy ? fill(LEDGER_COPY.changedAgain, { n: String(r.blockedBy) }) : r.skipped > 0 ? LEDGER_COPY.skipped : LEDGER_COPY.moved) : null;
            return (
              <li key={fix.id} className="space-y-2 rounded-lg depth-edge bg-panel p-4 text-sm" data-fix-row={fix.revision} data-fix-kind={fix.kind} data-fix-state={r.state ?? undefined}>
                <div className="flex flex-wrap items-center gap-1.5">
                  {canEdit && r.state === 'live' && (
                    <input type="checkbox" checked={picked.includes(fix.revision)} onChange={() => toggle(fix.revision)} aria-label={`Select revision ${fix.revision} to mark in code`} className="accent-[var(--color-accent)]" data-fix-pick />
                  )}
                  <Chip tone="neutral" title="Version, then revision" data-fix-version>
                    v{fixVersion(fix)}
                  </Chip>
                  <Chip tone="neutral">{FIX_KIND_LABEL[fix.kind]}</Chip>
                  {r.state && look && (
                    <Chip tone={look.tone} icon={look.icon} data-fix-state-chip={r.state}>
                      {FIX_STATE_LABEL[r.state]}
                    </Chip>
                  )}
                  {r.skipped > 0 && r.state === 'live' && <Chip tone="warn">{r.skipped} skipped</Chip>}
                </div>
                <p className="text-xs text-muted">
                  {when(fix.at)} · by <span className="font-medium text-body">{fix.by || 'Unnamed'}</span>
                  {names.length > 0 && (
                    <>
                      {' '}
                      · answers {names.join(', ')}
                      {fix.issueIds.length > names.length && ` (${fix.issueIds.length} reports)`}
                    </>
                  )}
                  {names.length === 0 && fix.issueIds.length > 0 && <> · answers {fix.issueIds.length} report{fix.issueIds.length === 1 ? '' : 's'}</>}
                </p>
                <p className="font-medium text-ink">{fix.summary}</p>
                {fix.kind === 'fold' && (
                  <p className="text-xs text-body">
                    Revisions {fix.folds.join(', ')}
                    {fix.foldedIn && <> · shipped in {fix.foldedIn}</>}
                  </p>
                )}
                {fix.changes.length > 0 && (
                  <details className="text-xs" data-fix-changes>
                    <summary className="focusable cursor-pointer font-medium text-accent">
                      {fix.changes.length} change{fix.changes.length === 1 ? '' : 's'}
                    </summary>
                    <ul className="mt-2 space-y-3">
                      {fix.changes.map((c, i) => (
                        <li key={i} data-fix-change>
                          <p className="text-muted">
                            {placeOf(course, c)} › <span className="font-medium text-body">{fieldLabel(c.field, c.stepId === undefined ? 'task' : 'step')}</span>
                          </p>
                          <div className="mt-1 grid gap-2 sm:grid-cols-2">
                            <div>
                              <p className="text-2xs font-semibold uppercase tracking-wide text-muted">{LEDGER_COPY.was}</p>
                              <div className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-danger-soft p-2 font-mono text-xs text-ink" data-fix-was>{c.before || LEDGER_COPY.empty}</div>
                            </div>
                            <div>
                              <p className="text-2xs font-semibold uppercase tracking-wide text-muted">{LEDGER_COPY.now}</p>
                              <div className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-ok-soft p-2 font-mono text-xs text-ink" data-fix-now>{c.after || LEDGER_COPY.empty}</div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {canEdit && r.state === 'live' && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button variant="secondary" size="sm" onClick={() => setRevert(fix)} disabled={!r.canRevert} className="flex items-center gap-1.5" data-fix-revert>
                      <Undo2 className="h-4 w-4" aria-hidden /> Revert
                    </Button>
                    {blocked && (
                      <span className="text-xs text-muted" data-fix-blocked>
                        {blocked}
                      </span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={revert !== null} onClose={() => setRevert(null)} title={LEDGER_COPY.revertTitle}>
        <div className="space-y-3 text-sm text-body">
          {revert && (
            <p>
              <span className="font-medium text-ink">
                v{fixVersion(revert)}: {revert.summary}
              </span>
            </p>
          )}
          <p>{LEDGER_COPY.revertBody}</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRevert(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={() => void doRevert()} disabled={busy} data-fix-revert-confirm>
              {busy ? 'Reverting…' : 'Revert'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={folding} onClose={() => setFolding(false)} title={LEDGER_COPY.foldTitle}>
        <div className="space-y-3 text-sm text-body">
          <p>{LEDGER_COPY.foldBody}</p>
          <label className="block text-xs">
            <span className="block font-medium text-body">{LEDGER_COPY.foldedIn}</span>
            <input value={foldedIn} maxLength={200} onChange={(e) => setFoldedIn(e.target.value)} placeholder={LEDGER_COPY.foldedPlaceholder} className="mt-1 w-full rounded-md bg-panel-2 px-2 py-1.5 text-sm text-ink placeholder-muted" data-fold-in />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setFolding(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void doFold()} disabled={busy || picked.length === 0} data-fix-fold-confirm>
              {busy ? 'Saving…' : `Mark ${picked.length} in code`}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

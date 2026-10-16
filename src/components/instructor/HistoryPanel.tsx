'use client';

import { useState } from 'react';
import { Download, History, RotateCcw } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Dialog } from '@/components/ui/Dialog';
import type { CourseVersionEntry } from '@/lib/data/types';

/** The words the studio's history and its warnings print, in one place. */
export const HISTORY_COPY = {
  none: 'No saved versions yet. Every save of this course is kept here, and any version can be restored.',
  builtIn: 'This course has not been edited: it is the built-in version. The first save makes an edited copy, and from then on every save is numbered here.',
  update: 'Database update needed. Versions are kept from migration 0018. Open the Supabase SQL Editor, paste supabase/setup.sql and press Run (it is safe to repeat). SUPABASE_SETUP.md has the steps.',
  local: 'This device keeps the last 8 saves. The cloud database keeps every one.',
  restoreTitle: 'Restore this version?',
  restoreBody: 'It is saved as a new version, so nothing is lost: the version being left stays in this list.',
  forkCloud: 'Saving here forks this built-in course for every student: later updates to the built-in course will not reach the copy.',
  forkLocal: 'Saving here forks this built-in course on this device: later updates to the built-in course will not reach the copy.',
  forkHow: 'To correct wording, use Fix the text on a reported issue instead: it keeps the built-in course and is numbered. To build a course of its own, duplicate this one.',
  copy: 'This is an edited copy of a built-in course. Updates to the built-in course no longer reach it. Every save is numbered in History.',
  confirmTitle: 'Save an edited copy?',
  confirmButton: 'Save an edited copy',
  idsLocked: 'Ids already saved cannot change: progress is recorded against them.',
} as const;

const kb = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
const when = (ms: number) => (ms ? new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Time not recorded');

/**
 * The course's history (R122): every save of it in the studio, newest first, each with its
 * number, who saved it, when and how large it was. Download keeps a copy of any version; Restore
 * saves an old version again as a NEW one, after asking, so nothing is lost. Props only: the page
 * loads the list and does the restoring.
 */
export function HistoryPanel({
  versions,
  loaded,
  current,
  builtIn,
  needsUpdate,
  local,
  onRestore,
  onDownload,
}: {
  versions: readonly CourseVersionEntry[];
  /** The list has come back (an empty one is a real answer). */
  loaded: boolean;
  /** The version the course is at now. */
  current: number | null;
  /** The course is the built-in one, not yet edited. */
  builtIn: boolean;
  needsUpdate: boolean;
  local: boolean;
  onRestore: (version: number) => Promise<boolean>;
  onDownload: (version: number) => void;
}) {
  const [asking, setAsking] = useState<CourseVersionEntry | null>(null);
  const [busy, setBusy] = useState(false);

  const restore = async () => {
    if (!asking) return;
    setBusy(true);
    await onRestore(asking.version);
    setBusy(false);
    setAsking(null);
  };

  return (
    <div className="max-w-3xl space-y-4" data-history>
      {needsUpdate && (
        <div data-history-update>
          <Alert variant="warning">{HISTORY_COPY.update}</Alert>
        </div>
      )}
      {local && <p className="text-sm text-muted">{HISTORY_COPY.local}</p>}
      {builtIn && versions.length === 0 && <Alert variant="info">{HISTORY_COPY.builtIn}</Alert>}
      {!builtIn && loaded && !needsUpdate && versions.length === 0 && <Alert variant="info">{HISTORY_COPY.none}</Alert>}

      {versions.length > 0 && (
        <ul className="space-y-2">
          {versions.map((v) => {
            const isCurrent = v.version === current;
            return (
              <li key={v.version} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg depth-edge bg-panel p-3 text-sm" data-history-row={v.version} data-history-current={isCurrent || undefined}>
                <Chip tone="neutral" icon={<History />}>
                  v{v.version}
                </Chip>
                {isCurrent && <Chip tone="ok">Current</Chip>}
                <span className="min-w-0 flex-1 basis-48">
                  <span className="block truncate font-medium text-ink">{v.title || 'Untitled course'}</span>
                  <span className="block text-xs text-muted">
                    {when(v.savedAt)} · by {v.by || 'Unnamed'} · {kb(v.bytes)}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Button variant="secondary" size="sm" onClick={() => onDownload(v.version)} className="flex items-center gap-1.5" data-history-download>
                    <Download className="h-4 w-4" aria-hidden /> Download
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setAsking(v)} disabled={isCurrent} className="flex items-center gap-1.5" data-history-restore>
                    <RotateCcw className="h-4 w-4" aria-hidden /> Restore
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={asking !== null} onClose={() => setAsking(null)} title={HISTORY_COPY.restoreTitle}>
        <div className="space-y-3 text-sm text-body">
          {asking && (
            <p className="font-medium text-ink">
              v{asking.version}: {asking.title || 'Untitled course'}
            </p>
          )}
          <p>{HISTORY_COPY.restoreBody}</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setAsking(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void restore()} disabled={busy} data-history-restore-confirm>
              {busy ? 'Restoring…' : 'Restore'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

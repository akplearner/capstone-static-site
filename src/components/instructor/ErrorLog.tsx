'use client';

import { useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Surface } from '@/components/ui/Surface';
import { supportTime } from '@/lib/reportError';
import type { ErrorLogData } from '@/lib/data/errorLogLoader';

/** The words of the log, in one place. */
export const ERROR_LOG_COPY = {
  title: 'Support errors',
  lede: 'What failed for a student, kept here and nowhere else. They are shown only the code and the time: paste the code below to find the row.',
  none: 'Nothing has failed.',
  noMatch: 'No error has that code.',
  update: 'Database update needed. Open the Supabase SQL Editor, paste supabase/setup.sql and press Run (it is safe to repeat). SUPABASE_SETUP.md has the steps.',
} as const;

/**
 * The support log (R129), admin only: every failure a student was given a code for, newest first, with who
 * it happened to, where, and the database's own words. Props only: the page loads the rows.
 */
export function ErrorLog({ data, onRefresh }: { data: ErrorLogData; onRefresh: () => void }) {
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const rows = needle ? data.rows.filter((r) => [r.code, r.email, r.area, r.reason, r.dbCode, r.message, r.path].some((v) => v?.toLowerCase().includes(needle))) : data.rows;
  return (
    <section aria-labelledby="error-log-title" className="space-y-3" data-error-log>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="error-log-title" className="text-lg font-bold text-ink">{ERROR_LOG_COPY.title}</h2>
          <p className="text-sm text-muted">{ERROR_LOG_COPY.lede}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onRefresh} className="flex items-center gap-1.5">
          <RefreshCw className="h-4 w-4" aria-hidden /> Refresh
        </Button>
      </div>
      {data.needsUpdate && (
        <div data-error-log-update>
          <Alert variant="warning">{ERROR_LOG_COPY.update}</Alert>
        </div>
      )}
      <label className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted" aria-hidden />
        <span className="sr-only">Find an error by code, email, area or page</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Code, email, area or page" className="min-w-0 flex-1 text-sm" />
      </label>
      {rows.length === 0 ? (
        <p className="text-sm text-muted" data-error-log-empty>{data.rows.length === 0 ? ERROR_LOG_COPY.none : ERROR_LOG_COPY.noMatch}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} data-error-row={r.code}>
              <Surface variant="inset" className="space-y-1 text-sm">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <code className="font-mono font-semibold text-ink">{r.code}</code>
                  <span className="text-xs text-muted">{supportTime(r.at)}</span>
                  <Chip tone="neutral">{r.area}</Chip>
                  {r.reason && <Chip tone="muted">{r.reason}</Chip>}
                  <span className="text-xs text-muted">{r.email ?? 'signed out'}</span>
                </div>
                <p className="font-mono text-xs text-body">{[r.dbCode, r.status, r.message].filter((v) => v !== null && v !== '').join(' · ') || 'no detail'}</p>
                {r.details && <p className="font-mono text-2xs text-muted">{r.details}</p>}
                {r.path && <p className="text-2xs text-muted">{r.path}</p>}
              </Surface>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

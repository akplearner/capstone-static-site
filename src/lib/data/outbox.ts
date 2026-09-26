'use client';

import { getBrowserClient } from '../supabase/client';

/**
 * The deliverables outbox (R82).
 *
 * A deliverable form is the one piece of TEAM work a student writes, so a
 * failed upsert must not evaporate: before this, the edit lived only in the
 * in-memory cache and the toast claimed it was "saved locally" — a reload
 * re-hydrated from the server and the teammate never saw it.
 *
 * On upsert failure the row is queued here (localStorage, deduped newest-wins
 * per deliverable) and re-sent when connectivity returns: after every course
 * hydrate, when the realtime channel (re)subscribes, and on window `online`.
 * The row keeps its original `updated_at`, so a teammate's later edit still
 * reads as later.
 */

const KEY = 'capstone_outbox_deliverables';

export interface OutboxRow {
  course_id: string;
  team_id: string;
  deliverable_id: string;
  data: unknown;
  updated_by: string | null;
  updated_at: string;
}

function read(): OutboxRow[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OutboxRow[]) : [];
  } catch {
    return [];
  }
}

function write(rows: OutboxRow[]): void {
  try {
    if (rows.length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* private window: the in-memory cache and the failure toast still exist */
  }
}

export function queueDeliverable(row: OutboxRow): void {
  const keep = read().filter(
    (r) => !(r.course_id === row.course_id && r.team_id === row.team_id && r.deliverable_id === row.deliverable_id)
  );
  keep.push(row);
  write(keep);
}

let flushing = false;

/** Re-send everything owed. Safe to call often; no-ops when empty or offline. */
export async function flushDeliverableOutbox(): Promise<void> {
  if (flushing || typeof window === 'undefined') return;
  const rows = read();
  if (rows.length === 0) return;
  const supabase = getBrowserClient();
  if (!supabase) return;
  flushing = true;
  try {
    const { error } = await supabase
      .from('deliverables')
      .upsert(rows, { onConflict: 'course_id,team_id,deliverable_id' });
    if (!error) write([]);
    else console.error('outbox flush failed', error.message);
  } finally {
    flushing = false;
  }
}

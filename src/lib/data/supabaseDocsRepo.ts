'use client';

import type { DeliverableData } from '../docs/types';
import { getBrowserClient } from '../supabase/client';
import { notifyStore } from '../useClientStore';
import { DocsRepository } from './types';
import { cache, getCurrentUserId, markDocPending, clearDocPending } from './supabaseCache';
import { queueDeliverable, flushDeliverableOutbox } from './outbox';
import { toast } from '@/lib/toastBus';

// Supabase-backed DocsRepository. Deliverable forms are team-scoped, so every member
// of a team reads and writes the same rows (RLS enforces team-only access). Reads are
// synchronous off the cache.
//
// R82: writes are per-deliverable and honest.
//   * `save` (imports, hand-offs) used to upsert EVERY entry of the map it was
//     given, so any stale tab's autosave rewrote the whole team's forms with its
//     own old copies. It now diffs against the cache and sends only what changed.
//   * A failed upsert used to exist only in memory while the toast claimed it was
//     "saved locally". It now goes to a real outbox (localStorage) that is
//     re-sent on reconnect — see outbox.ts.
//   * While an upsert is in flight the row is marked pending, so a concurrent
//     hydrate can't put the server's older copy back over the student's typing.

const FAIL_MESSAGE =
  'Couldn’t reach the cloud — your form is kept on this device and will be re-sent automatically when you’re back online.';

function row(courseId: string, teamId: string, deliverableId: string, d: DeliverableData) {
  return {
    course_id: courseId,
    team_id: teamId,
    deliverable_id: deliverableId,
    data: d,
    updated_by: getCurrentUserId(),
    updated_at: new Date().toISOString(),
  };
}

async function send(courseId: string, teamId: string, rows: ReturnType<typeof row>[]): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase || rows.length === 0) return !rows.length;
  rows.forEach((r) => markDocPending(courseId, teamId, r.deliverable_id));
  const { error } = await supabase
    .from('deliverables')
    .upsert(rows, { onConflict: 'course_id,team_id,deliverable_id' });
  rows.forEach((r) => clearDocPending(courseId, teamId, r.deliverable_id));
  if (error) {
    console.error('docs save failed', error.message);
    rows.forEach((r) => queueDeliverable(r));
    toast({ message: FAIL_MESSAGE, variant: 'warning', duration: 6000 });
    return false;
  }
  return true;
}

export const supabaseDocsRepo: DocsRepository = {
  get(courseId: string, teamId: string): Record<string, DeliverableData> | null {
    return cache.docs(courseId, teamId);
  },

  save(courseId: string, teamId: string, data: Record<string, DeliverableData>): void {
    // Diff BEFORE the cache is replaced: only what this call actually changed
    // goes over the wire.
    const prev = cache.docs(courseId, teamId) ?? {};
    const changed = Object.entries(data).filter(
      ([id, d]) => JSON.stringify(prev[id]) !== JSON.stringify(d)
    );
    cache.setDocs(courseId, teamId, data);
    notifyStore();
    void send(courseId, teamId, changed.map(([id, d]) => row(courseId, teamId, id, d)));
  },

  saveOne(courseId: string, teamId: string, deliverableId: string, data: DeliverableData): Promise<boolean> {
    const current = cache.docs(courseId, teamId) ?? {};
    cache.setDocs(courseId, teamId, { ...current, [deliverableId]: data });
    notifyStore();
    // Anything owed from an earlier failure rides along on the next edit.
    void flushDeliverableOutbox();
    return send(courseId, teamId, [row(courseId, teamId, deliverableId, data)]);
  },
};

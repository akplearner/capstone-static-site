'use client';

import type { DeliverableData } from '../docs/types';
import { getBrowserClient } from '../supabase/client';
import { notifyStore } from '../useClientStore';
import { DocsRepository } from './types';
import { cache, getCurrentUserId } from './supabaseCache';

// Supabase-backed DocsRepository. Deliverable forms are team-scoped, so every member
// of a team reads and writes the same rows (RLS enforces team-only access). Reads are
// synchronous off the cache; save() updates the cache + notifies, then upserts one row
// per deliverable.
export const supabaseDocsRepo: DocsRepository = {
  get(courseId: string, teamId: string): Record<string, DeliverableData> | null {
    return cache.docs(courseId, teamId);
  },

  save(courseId: string, teamId: string, data: Record<string, DeliverableData>): void {
    cache.setDocs(courseId, teamId, data);
    notifyStore();
    const supabase = getBrowserClient();
    if (!supabase) return;
    const updated_by = getCurrentUserId();
    const rows = Object.entries(data).map(([deliverable_id, d]) => ({
      course_id: courseId,
      team_id: teamId,
      deliverable_id,
      data: d,
      updated_by,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length === 0) return;
    void supabase
      .from('deliverables')
      .upsert(rows, { onConflict: 'course_id,team_id,deliverable_id' })
      .then(({ error }) => {
        if (error) console.error('docs save failed', error.message);
      });
  },
};

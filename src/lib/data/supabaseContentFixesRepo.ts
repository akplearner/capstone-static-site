'use client';

import type { ContentFixesRepository } from './types';
import { baseCourse } from '../content/docs';
import { getBrowserClient } from '../supabase/client';
import { notifyStore } from '../useClientStore';
import { toast } from '@/lib/toastBus';
import { cache, contentFixFromRow, getCurrentUserId, hydrateContentFixes } from './supabaseCache';
import { isMissingSchema } from './schemaErrors';

/**
 * The content fix ledger, cloud-backed (R121): `content_fixes`, append-only, written by an admin
 * and read by every signed-in member (the corrected words are what a student renders).
 *
 * Reads are synchronous off the cache like every other repo. A write is NOT fire-and-forget: the
 * revision is the database's to assign, so the caller awaits the row it gets back, and a refusal is
 * said out loud rather than leaving a fix on this page that no student will ever see.
 */
export const supabaseContentFixesRepo: ContentFixesRepository = {
  list: (courseId) => cache.contentFixes(courseId),
  version: () => cache.contentFixesVersion(),
  load: () => hydrateContentFixes(),

  async add(courseId, draft, by) {
    const supabase = getBrowserClient();
    const created_by = getCurrentUserId();
    if (!supabase || !created_by) {
      toast({ message: 'Sign in with an admin account to save a fix.', variant: 'warning', duration: 6000 });
      return null;
    }
    const { data, error } = await supabase
      .from('content_fixes')
      .insert({
        course_id: courseId,
        kind: draft.kind,
        summary: draft.summary,
        changes: draft.changes,
        issue_ids: draft.issueIds,
        reverts: draft.reverts,
        folds: draft.folds,
        folded_in: draft.foldedIn,
        doc_version: baseCourse(courseId)?.version ?? 1,
        author_name: by,
        created_by,
      })
      .select()
      .single();
    if (error || !data) {
      console.error('content fix save failed', error?.message);
      toast({
        message: isMissingSchema(error)
          ? 'The database needs its latest update (re-run supabase/setup.sql) before fixes can be saved.'
          : error?.code === '23505'
            ? 'That fix was already reverted.'
            : 'Couldn’t save the fix — check your access and connection.',
        variant: 'warning',
        duration: 6000,
      });
      return null;
    }
    const fix = contentFixFromRow(data as Record<string, unknown>);
    cache.addContentFix(fix);
    notifyStore();
    return fix;
  },
};

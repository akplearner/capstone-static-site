'use client';

import type { CourseDto } from '../content/dto';
import type { CourseHistoryRepository } from './types';
import { getBrowserClient } from '../supabase/client';
import { notifyStore } from '../useClientStore';
import { toast } from '@/lib/toastBus';
import { cache, getCurrentUserId } from './supabaseCache';
import { isMissingSchema } from './schemaErrors';

/**
 * The history of a course's studio saves, cloud-backed (R122): `course_document_versions`, which
 * the database writes on every save of `course_documents` and only an admin reads. The list asks
 * for the columns that describe a version, never the documents, which are large; one document is
 * fetched when it is downloaded or restored.
 */
export const supabaseCourseHistoryRepo: CourseHistoryRepository = {
  async list(courseId) {
    const supabase = getBrowserClient();
    if (!supabase) return { ok: false, needsUpdate: false, versions: [] };
    const { data, error } = await supabase
      .from('course_document_versions')
      .select('version, saved_by_name, saved_at, title, bytes')
      .eq('course_id', courseId)
      .order('version', { ascending: false });
    if (error) {
      const needsUpdate = isMissingSchema(error);
      if (!needsUpdate) console.error('[content] course_document_versions load failed:', error.message);
      return { ok: false, needsUpdate, versions: [] };
    }
    return {
      ok: true,
      needsUpdate: false,
      versions: (data ?? []).map((r) => ({
        version: Number(r.version),
        savedAt: r.saved_at ? Date.parse(String(r.saved_at)) : 0,
        by: String(r.saved_by_name ?? ''),
        title: String(r.title ?? ''),
        bytes: Number(r.bytes ?? 0),
      })),
    };
  },

  async get(courseId, version) {
    const supabase = getBrowserClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from('course_document_versions').select('doc').eq('course_id', courseId).eq('version', version).maybeSingle();
    if (error || !data?.doc) return null;
    return data.doc as CourseDto;
  },

  // An ordinary save of the old document: the database gives it the next number and keeps the old one where it was.
  async restore(courseId, version) {
    const supabase = getBrowserClient();
    const updated_by = getCurrentUserId();
    if (!supabase || !updated_by) {
      toast({ message: 'Sign in with an admin account to restore a version.', variant: 'warning', duration: 6000 });
      return null;
    }
    const doc = await supabaseCourseHistoryRepo.get(courseId, version);
    if (!doc) {
      toast({ message: 'That version could not be read.', variant: 'warning', duration: 6000 });
      return null;
    }
    const prior = (cache.courseDocument(courseId)?.course as { version?: number } | undefined)?.version ?? 0;
    const { data, error } = await supabase
      .from('course_documents')
      .upsert({ course_id: courseId, schema: doc.schema, doc, version: prior + 1, updated_by }, { onConflict: 'course_id' })
      .select('doc, version')
      .single();
    if (error || !data) {
      console.error('course restore failed', error?.message);
      toast({ message: 'Couldn’t restore that version — check your access and connection.', variant: 'warning', duration: 6000 });
      return null;
    }
    cache.setCourseDocument(data.doc as CourseDto);
    notifyStore();
    return Number(data.version);
  },
};

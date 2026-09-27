'use client';

import { getBrowserClient } from '../supabase/client';
import { notifyStore } from '../useClientStore';
import type {
  Cohort,
  CohortRepository,
  DeliverableReview,
  ReviewRepository,
  StepNote,
  StepNotesRepository,
  StuckFlag,
  TaskReport,
  TaskReportsRepository,
} from './types';
import { cache, getCurrentUserId } from './supabaseCache';
import { toast } from '@/lib/toastBus';

// Supabase-backed R68 stores. The house pattern throughout: synchronous read
// off the cache, optimistic write into it, fire-and-forget upsert with a toast
// on failure. Every read happens during render, so none of this can be async.

function report(what: string, message: string) {
  return ({ error }: { error: { message: string } | null }) => {
    if (error) {
      console.error(`${what} save failed`, error.message);
      toast({ message, variant: 'warning', duration: 6000 });
    }
  };
}

export const supabaseReviewRepo: ReviewRepository = {
  list(courseId: string, teamId: string): DeliverableReview[] {
    return cache.reviews(courseId, teamId);
  },

  save(review: DeliverableReview): void {
    cache.setReview(review);
    notifyStore();
    const supabase = getBrowserClient();
    if (!supabase) return;
    const reviewer_id = getCurrentUserId();
    if (!reviewer_id) return;
    void supabase
      .from('deliverable_reviews')
      .upsert(
        {
          course_id: review.courseId,
          team_id: review.teamId,
          deliverable_id: review.deliverableId,
          week: review.week,
          status: review.status,
          comment: review.comment,
          reviewer: review.reviewer,
          reviewer_id,
          reviewed_at: new Date(review.at).toISOString(),
        },
        { onConflict: 'course_id,team_id,deliverable_id,week' }
      )
      .then((res) => {
        report('review', 'Couldn’t save the review to the cloud — check your connection and submit it again.')(res);
        // The cohort dashboard reloads its cloud rows on store notifications;
        // notifying again once the upsert LANDED is what makes the
        // instructor's own verdict read back as saved (R82).
        if (!res.error) notifyStore();
      });
  },
};

export const supabaseCohortRepo: CohortRepository = {
  get(courseId: string, cohort: string): Cohort | null {
    return cache.cohort(courseId, cohort);
  },

  save(cohort: Cohort): void {
    cache.setCohort(cohort);
    notifyStore();
    const supabase = getBrowserClient();
    if (!supabase) return;
    const set_by = getCurrentUserId();
    if (!set_by) return;
    void supabase
      .from('cohorts')
      .upsert(
        { course_id: cohort.courseId, cohort: cohort.cohort, starts_on: cohort.startsOn, set_by, updated_at: new Date().toISOString() },
        { onConflict: 'course_id,cohort' }
      )
      .then(report('cohort', 'Couldn’t save the cohort start date — try again after a reload.'));
  },
};

// `memberId` is accepted for the shared interface and deliberately unused on
// writes: the row is keyed by the authenticated session.
export const supabaseStepNotesRepo: StepNotesRepository = {
  getAll(courseId: string): Record<string, StepNote> {
    return cache.stepNotes(courseId);
  },

  save(_memberId: string, note: StepNote): void {
    cache.setStepNote(note);
    notifyStore();
    const supabase = getBrowserClient();
    if (!supabase) return;
    const user_id = getCurrentUserId();
    if (!user_id) return;
    const at = new Date(note.at).toISOString();
    const key = { user_id, course_id: note.courseId, task_id: note.taskId, step_id: note.stepId };
    // Two tables on purpose: the note is owner-only, the flag is team-readable.
    // RLS is row-level, so the split is the only way teammates can see "stuck"
    // without being able to read the note.
    void supabase
      .from('step_notes')
      .upsert({ ...key, note: note.note, updated_at: at }, { onConflict: 'user_id,course_id,task_id,step_id' })
      .then(report('step note', 'Couldn’t save your note to the cloud — it is held locally until you reload.'));
    void supabase
      .from('step_flags')
      .upsert({ ...key, stuck: note.stuck, updated_at: at }, { onConflict: 'user_id,course_id,task_id,step_id' })
      .then(report('stuck flag', 'Couldn’t share your stuck flag with the team — try again after a reload.'));
  },

  teamStuck(courseId: string, teamId: string): StuckFlag[] {
    const team = new Set(cache.roster(courseId).filter((m) => m.teamId === teamId).map((m) => m.memberId));
    return cache.stuckFlags(courseId).filter((f) => team.has(f.memberId));
  },

  resetCourse(courseId: string): void {
    cache.clearStepNotes(courseId);
    notifyStore();
    const supabase = getBrowserClient();
    const user_id = getCurrentUserId();
    if (!supabase || !user_id) return;
    void supabase.from('step_notes').delete().eq('user_id', user_id).eq('course_id', courseId).then(report('step notes reset', 'Couldn’t clear your notes in the cloud.'));
    void supabase.from('step_flags').delete().eq('user_id', user_id).eq('course_id', courseId).then(report('stuck flags reset', 'Couldn’t clear your stuck flags in the cloud.'));
  },
};

// R83: task issue reports. Optimistic into the cache, insert over the wire;
// resolution is instructor-only (RLS). After a successful insert the optional
// report-notify Edge Function is invoked fire-and-forget — silently a no-op
// when the instructor hasn't deployed it.
export const supabaseTaskReportsRepo: TaskReportsRepository = {
  list(courseId: string): TaskReport[] {
    return cache.taskReports(courseId);
  },

  save(report: TaskReport): void {
    cache.setTaskReport(report);
    notifyStore();
    const supabase = getBrowserClient();
    if (!supabase) return;
    const user_id = getCurrentUserId();
    if (!user_id) return;
    void supabase
      .from('task_reports')
      .insert({
        id: report.id,
        user_id,
        course_id: report.courseId,
        task_id: report.taskId,
        team_id: report.teamId,
        kind: report.kind,
        note: report.note,
        status: 'open',
        created_at: new Date(report.at).toISOString(),
      })
      .then(({ error }) => {
        if (error) {
          console.error('task report save failed', error.message);
          toast({ message: 'Couldn’t file the report — check your connection and send it again.', variant: 'warning', duration: 6000 });
          return;
        }
        void supabase.functions
          .invoke('report-notify', { body: { courseId: report.courseId, taskId: report.taskId, kind: report.kind, note: report.note } })
          .catch(() => {});
      });
  },

  resolve(courseId: string, id: string): void {
    cache.resolveTaskReport(courseId, id);
    notifyStore();
    const supabase = getBrowserClient();
    if (!supabase) return;
    void supabase
      .from('task_reports')
      .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: getCurrentUserId() })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('task report resolve failed', error.message);
        else notifyStore();
      });
  },
};

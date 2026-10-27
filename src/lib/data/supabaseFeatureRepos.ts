'use client';

import { isMissingSchema } from './schemaErrors';
import { getBrowserClient } from '../supabase/client';
import { notifyStore } from '../useClientStore';
import type {
  Cohort,
  CohortRepository,
  DeliverableReview,
  DeliverableReviewMark,
  DeliverableStatus,
  DeliverableSubmission,
  PeerReviewRow,
  ReviewPacket,
  ReviewQueueItem,
  ReviewRepository,
  StatusRepository,
  StepNote,
  StepNotesRepository,
  StuckFlag,
  StepFlagEvent,
  SubmissionProgress,
  SubmissionsRepository,
  TaskReport,
  TaskReportsRepository,
  TaskReportUpdate,
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

  // R132: one row per category per verdict, appended; the database stamps them.
  marks(courseId: string, teamId: string): DeliverableReviewMark[] {
    return cache.reviewMarks(courseId, teamId);
  },

  saveMarks(marks: DeliverableReviewMark[]): void {
    if (!marks.length) return;
    cache.addReviewMarks(marks);
    notifyStore();
    const supabase = getBrowserClient();
    const reviewer_id = getCurrentUserId();
    if (!supabase || !reviewer_id) return;
    void supabase
      .from('deliverable_review_marks')
      .insert(marks.map((m) => ({ course_id: m.courseId, team_id: m.teamId, deliverable_id: m.deliverableId, week: m.week, category: m.category, ok: m.ok, note: m.note, reviewer: m.reviewer, reviewer_id })))
      .then(report('review marks', 'Couldn’t save the category marks to the cloud — the database may need supabase/setup.sql re-run (0021).'));
  },
};

/** R103: lifecycle transitions — optimistic into the cache, then an insert
 *  (the table is append-only; a failed insert is reported, not retried). */
export const supabaseStatusRepo: StatusRepository = {
  list(courseId: string, teamId: string): DeliverableStatus[] {
    return cache.docStatus(courseId, teamId);
  },
  save(row: DeliverableStatus): void {
    cache.setDocStatus(row);
    notifyStore();
    const supabase = getBrowserClient();
    const changed_by = getCurrentUserId();
    if (!supabase || !changed_by) return;
    void supabase
      .from('deliverable_status')
      .insert({
        course_id: row.courseId,
        team_id: row.teamId,
        deliverable_id: row.deliverableId,
        status: row.status,
        changed_by,
        role: row.role,
        note: row.note ?? '',
        version: row.version,
        created_at: new Date(row.at).toISOString(),
      })
      .then(report('document status', 'Couldn’t record the document’s status in the cloud — check your connection and try again.'));
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
    // R132: a change of the flag leaves an event beside the overwritten flag.
    const before = cache.stepNotes(note.courseId)[`${note.taskId}::${note.stepId}`]?.stuck ?? false;
    const me = getCurrentUserId();
    const flagged = before !== note.stuck;
    cache.setStepNote(note);
    if (flagged && me) cache.addFlagEvent({ courseId: note.courseId, memberId: me, taskId: note.taskId, stepId: note.stepId, kind: note.stuck ? 'raised' : 'cleared', at: note.at });
    notifyStore();
    const supabase = getBrowserClient();
    if (!supabase) return;
    const user_id = getCurrentUserId();
    if (!user_id) return;
    const at = new Date(note.at).toISOString();
    if (flagged) {
      void supabase
        .from('step_flag_events')
        .insert({ user_id, course_id: note.courseId, task_id: note.taskId, step_id: note.stepId, kind: note.stuck ? 'raised' : 'cleared' })
        .then(report('flag history', 'Couldn’t record the flag change — the database may need supabase/setup.sql re-run (0022).'));
    }
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

  flagEvents(courseId: string, memberId: string): StepFlagEvent[] {
    return cache.flagEvents(courseId).filter((e) => e.memberId === memberId);
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
    const legacy = {
      id: report.id,
      user_id,
      course_id: report.courseId,
      task_id: report.taskId,
      team_id: report.teamId,
      kind: report.kind,
      note: report.note,
      status: 'open',
      created_at: new Date(report.at).toISOString(),
    };
    // R120: where, who and which version, as filed.
    const full = {
      ...legacy,
      step_id: report.stepId ?? null,
      week: report.week ?? null,
      reporter_name: report.reporterName ?? '',
      reporter_role: report.reporterRole ?? '',
      content_version: report.contentVersion ?? '',
    };
    void (async () => {
      let { error } = await supabase.from('task_reports').insert(full);
      if (error && isMissingSchema(error)) {
        // The database has not had 0016 yet: file the report with the columns it holds.
        console.warn('task report filed without its context: re-run supabase/setup.sql to record the step, role and version');
        ({ error } = await supabase.from('task_reports').insert(legacy));
      }
      if (error) {
        console.error('task report save failed', error.message);
        toast({ message: 'Couldn’t file the report — check your connection and send it again.', variant: 'warning', duration: 6000 });
        return;
      }
      void supabase.functions
        .invoke('report-notify', { body: { courseId: report.courseId, taskId: report.taskId, kind: report.kind, note: report.note, displayName: report.reporterName } })
        .catch(() => {});
    })();
  },

  resolve(courseId: string, id: string): void {
    void supabaseTaskReportsRepo.update(courseId, id, { status: 'resolved' });
  },

  // R120: the instructor's move. Optimistic into the cache, awaited over the wire so the
  // inbox can say when it did not land; who, what, when and which version are frozen by 0016.
  async update(courseId: string, id: string, patch: TaskReportUpdate): Promise<boolean> {
    const supabase = getBrowserClient();
    if (!supabase) return false;
    const closed = patch.status === 'resolved' || patch.status === 'wont_fix';
    const me = getCurrentUserId();
    const before = cache.taskReports(courseId).find((r) => r.id === id);
    cache.updateTaskReport(courseId, id, {
      status: patch.status,
      ...(patch.note !== undefined ? { resolutionNote: patch.note } : {}),
      ...(patch.fixRevision !== undefined ? { fixRevision: patch.fixRevision } : {}),
      resolvedAt: closed ? Date.now() : undefined,
      resolvedBy: closed ? (me ?? undefined) : undefined,
    });
    notifyStore();
    const resolved_at = closed ? new Date().toISOString() : null;
    const resolved_by = closed ? me : null;
    const { error } = await supabase
      .from('task_reports')
      .update({
        status: patch.status,
        resolved_at,
        resolved_by,
        ...(patch.note !== undefined ? { resolution_note: patch.note } : {}),
        ...(patch.fixRevision !== undefined ? { fix_revision: patch.fixRevision } : {}),
      })
      .eq('id', id);
    if (!error) {
      notifyStore();
      return true;
    }
    console.error('task report update failed', error.message);
    if (before) cache.updateTaskReport(courseId, id, before);
    notifyStore();
    // 0016 not applied yet: the new columns and the two new statuses do not exist.
    const old = isMissingSchema(error) || error.code === '23514';
    toast({
      message: old ? 'The database needs its latest update (re-run supabase/setup.sql) before this can be saved.' : 'Couldn’t save the change — check your access and connection.',
      variant: 'warning',
      duration: 6000,
    });
    return false;
  },
};

// R84: frozen submissions and blind review. Submitting is the one write in
// the app that is NOT fire-and-forget: the caller awaits the insert and the
// reviewer assignment, because "submitted" is a promise the page must not
// make until the database has frozen the row. The review verbs are thin
// wrappers over the four security-definer RPCs — the first `supabase.rpc`
// calls in the codebase, because blindness means the tables themselves are
// deliberately unreadable.
export const supabaseSubmissionsRepo: SubmissionsRepository = {
  list(courseId: string, teamId: string): DeliverableSubmission[] {
    return cache.submissions(courseId, teamId);
  },

  reviewsFor(courseId: string, submissionId: string): PeerReviewRow[] {
    return cache.peerReviews(courseId).filter((r) => r.submissionId === submissionId);
  },

  async submit(submission: DeliverableSubmission): Promise<number | null> {
    const supabase = getBrowserClient();
    const user_id = getCurrentUserId();
    if (!supabase || !user_id) return null;
    const { error } = await supabase.from('deliverable_submissions').insert({
      id: submission.id,
      course_id: submission.courseId,
      team_id: submission.teamId,
      deliverable_id: submission.deliverableId,
      week: submission.week,
      version: submission.version,
      submitted_by: user_id,
      content_sha256: submission.contentSha256,
      snapshot: submission.snapshot,
      created_at: new Date(submission.at).toISOString(),
    });
    if (error) {
      console.error('submission failed', error.message);
      toast({ message: 'Couldn’t freeze the submission — check your connection and submit again.', variant: 'warning', duration: 6000 });
      return null;
    }
    // Only after the row is frozen does it enter the cache as truth.
    cache.setSubmission(submission);
    notifyStore();
    const assigned = await supabase.rpc('assign_peer_reviews', { p_submission: submission.id });
    if (assigned.error) {
      console.error('reviewer assignment failed', assigned.error.message);
      return null;
    }
    return Number(assigned.data ?? 0);
  },

  async progress(submissionId: string): Promise<SubmissionProgress | null> {
    const supabase = getBrowserClient();
    if (!supabase) return null;
    const { data, error } = await supabase.rpc('get_submission_progress', { p_submission: submissionId });
    if (error || !data) return null;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return { assigned: Number(row.assigned ?? 0), reviewed: Number(row.reviewed ?? 0), confirms: Number(row.confirms ?? 0) };
  },

  async queue(): Promise<ReviewQueueItem[]> {
    const supabase = getBrowserClient();
    if (!supabase || !getCurrentUserId()) return [];
    const { data, error } = await supabase.rpc('get_review_queue');
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((r) => ({
      assignmentId: String(r.assignment_id),
      courseId: String(r.course_id),
      deliverableId: String(r.deliverable_id),
      week: Number(r.week ?? 0),
      assignedAt: r.assigned_at ? Date.parse(String(r.assigned_at)) : 0,
      done: !!r.done,
    }));
  },

  async packet(assignmentId: string): Promise<ReviewPacket | null> {
    const supabase = getBrowserClient();
    if (!supabase) return null;
    const { data, error } = await supabase.rpc('get_review_packet', { p_assignment: assignmentId });
    if (error || !data) return null;
    const p = data as Record<string, unknown>;
    return {
      assignmentId: String(p.assignmentId),
      courseId: String(p.courseId),
      deliverableId: String(p.deliverableId),
      week: Number(p.week ?? 0),
      version: Number(p.version ?? 1),
      contentSha256: String(p.contentSha256 ?? ''),
      snapshot: p.snapshot as ReviewPacket['snapshot'],
      submittedAt: p.submittedAt ? Date.parse(String(p.submittedAt)) : 0,
    };
  },

  async submitReview(assignmentId: string, answers: Record<string, boolean>, confirm: boolean): Promise<boolean> {
    const supabase = getBrowserClient();
    if (!supabase) return false;
    const { error } = await supabase.rpc('submit_peer_review', { p_assignment: assignmentId, p_answers: answers, p_confirm: confirm });
    if (error) {
      console.error('peer review failed', error.message);
      toast({ message: 'Couldn’t send the review — it may already be recorded.', variant: 'warning', duration: 6000 });
      return false;
    }
    notifyStore();
    return true;
  },
};

// R86: the last-seen heartbeat, called (throttled) by usePresenceBeacon. It
// lives here with the other wire timestamps: the caller's own row, one column.
export function stampLastSeen(userId: string): void {
  const supabase = getBrowserClient();
  if (!supabase) return;
  void supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', userId);
}

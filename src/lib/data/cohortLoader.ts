'use client';

import { getBrowserClient } from '../supabase/client';
import { isSupabaseConfigured } from '../supabase/config';
import type { Course, RosterEntry } from '../types';
import type { DeliverableData } from '../docs/types';
import type { DeliverableStatus } from '../docs/lifecycle';
import type { Cohort, DeliverableReview, DeliverableSubmission, EvidenceArtifact, PeerReviewRow, StepEvidence, StuckFlag, TaskReport, DeliverableReviewMark, StepFlagEvent } from './types';
import { rosterFromRow, stepEvidenceFromRow, reviewFromRow, taskReportFromRow, submissionFromRow, peerReviewFromRow, docStatusFromRow, artifactFromRow, reviewMarkFromRow, flagEventFromRow, earnedFromRow } from './supabaseCache';
import { localStorageEarnedRepo } from './localStorageEarnedRepo';
import type { EarnedRow } from '../earnedSkills';
import { localStorageProgressRepo } from './localStorageProgressRepo';
import { localStorageEvidenceRepo } from './localStorageEvidenceRepo';
import { localStorageDocsRepo } from './localStorageDocsRepo';
import { localStorageStepNotesRepo, localStorageReviewRepo, localStorageTaskReportsRepo, localStorageSubmissionsRepo, localStorageCohortRepo, localStorageStatusRepo } from './localStorageFeatureRepos';
import { KEYS } from './keys';
import { getTasksByRole } from '../course-helpers';
import { selectAll } from './selectAll';

/**
 * Everything the cohort dashboard needs for one course, whichever storage
 * mode is live.
 *
 * This deliberately bypasses `supabaseCache`: the cache keys step evidence by
 * course+task+step with NO user id (it only ever held the caller's own
 * ledger), and an instructor who is not a member of the course has no
 * context row for it. The instructor policies in 0001/0004 let this read the
 * whole course; six selects and the rows are shaped here.
 *
 * localStorage mode reads whatever this browser holds — the roster and
 * completions of whoever joined on this device — and the page says so.
 */
export interface CohortData {
  mode: 'local' | 'cloud';
  roster: RosterEntry[];
  /** completion keys, in `KEYS.completion` shape, for `isStepDone` */
  completions: Set<string>;
  evidence: Record<string, Record<string, StepEvidence>>; // memberId → key → record
  docs: Record<string, Record<string, DeliverableData>>; // teamId → deliverableId → data
  stuck: StuckFlag[];
  reviews: DeliverableReview[];
  /** Task issue reports, newest first (R83). */
  reports: TaskReport[];
  /** R85: names and pictures for the registrations view, keyed by member id.
   *  Cloud: every profile the instructor may read; local: what the roster says. */
  profiles: Record<string, { displayName: string; avatarUrl?: string }>;
  /** R85: the course's frozen submissions and the anonymous verdict rows —
   *  what the peer-review columns derive from. */
  submissions: DeliverableSubmission[];
  peerReviews: PeerReviewRow[];
  /** R85: how many reviewers each submission was assigned (feeds verdictOf's
   *  eligible-reviewer count; identities stay in the database). */
  assignedCounts: Record<string, number>;
  /** R85: cohort start dates — handed to the calendar as data, because on a
   *  fresh /instructor load nothing has hydrated the shared cache it would
   *  otherwise read from. */
  cohortDates: Cohort[];
  /** R108: the lifecycle rows per team and the hashed files per member, for the KPI bands (0012 and 0004 let the instructor read both). */
  status: Record<string, DeliverableStatus[]>;
  artifacts: Record<string, EvidenceArtifact[]>;
  /** R136: the instructor's marks per team, every member's flag history, and each member's blind-review counts,
   *  so the cohort's figures stand on the same facts as the member's own pages. */
  marks: Record<string, DeliverableReviewMark[]>;
  flagEvents: Record<string, StepFlagEvent[]>;
  peerReviewCounts: Record<string, { done: number; assigned: number }>;
  /** R137: each member's earned ledger (0019; the instructor reads every member's rows). */
  earned: Record<string, EarnedRow[]>;
}

export function isStepDoneIn(data: CohortData, courseId: string, memberId: string, taskId: string, stepId: string): boolean {
  return data.completions.has(KEYS.completion(courseId, memberId, taskId, stepId));
}

export function loadCohortLocal(course: Course): CohortData {
  const roster = localStorageProgressRepo.getRoster(course.id);
  const completions = new Set<string>();
  const evidence: CohortData['evidence'] = {};
  const teams = new Set<string>();
  for (const m of roster) {
    for (const k of localStorageProgressRepo.getCompletionKeySet(course.id, m.memberId)) completions.add(k);
    evidence[m.memberId] = localStorageEvidenceRepo.getSteps(course.id, m.memberId);
    teams.add(m.teamId);
  }
  const docs: CohortData['docs'] = {};
  const stuck: StuckFlag[] = [];
  const reviews: DeliverableReview[] = [];
  const status: CohortData['status'] = {};
  const artifacts: CohortData['artifacts'] = {};
  const marks: CohortData['marks'] = {};
  const flagEvents: CohortData['flagEvents'] = {};
  const peerReviewCounts: CohortData['peerReviewCounts'] = {};
  const earned: CohortData['earned'] = {};
  for (const t of teams) {
    docs[t] = localStorageDocsRepo.get(course.id, t) ?? {};
    stuck.push(...localStorageStepNotesRepo.teamStuck(course.id, t));
    reviews.push(...localStorageReviewRepo.list(course.id, t));
    status[t] = localStorageStatusRepo.list(course.id, t);
    marks[t] = localStorageReviewRepo.marks(course.id, t);
  }
  for (const m of roster) {
    artifacts[m.memberId] = localStorageEvidenceRepo.getArtifacts(course.id, m.memberId);
    flagEvents[m.memberId] = localStorageStepNotesRepo.flagEvents(course.id, m.memberId);
    // One device has no peers: nothing assigned, nothing owed.
    peerReviewCounts[m.memberId] = { done: 0, assigned: 0 };
    // One device keeps one ledger; offline the roster is whoever joined on this browser.
    earned[m.memberId] = localStorageEarnedRepo.list(course.id);
  }
  // `getTasksByRole` is imported so a course with no tasks for a role still
  // resolves cleanly in the page's derived rows; nothing else to do here.
  void getTasksByRole;
  const reports = [...localStorageTaskReportsRepo.list(course.id)].sort((a, b) => b.at - a.at);
  const profiles: CohortData['profiles'] = {};
  const submissions: DeliverableSubmission[] = [];
  for (const m of roster) profiles[m.memberId] = { displayName: m.displayName };
  for (const t of teams) submissions.push(...localStorageSubmissionsRepo.list(course.id, t));
  const cohortDates = [...new Set(roster.map((m) => m.cohort))]
    .map((c) => localStorageCohortRepo.get(course.id, c))
    .filter((c): c is Cohort => !!c);
  // Offline has no peers on one device, so there are no verdict rows to show.
  return { mode: 'local', roster, completions, evidence, docs, stuck, reviews, reports, profiles, submissions, peerReviews: [], assignedCounts: {}, cohortDates, status, artifacts, marks, flagEvents, peerReviewCounts, earned };
}

export async function loadCohortCloud(course: Course): Promise<CohortData> {
  const supabase = getBrowserClient();
  if (!supabase) return loadCohortLocal(course);
  const [memberships, completions, evidence, deliverables, flags, reviews, reports, profileRows, submissionRows, peerReviewRows, assignmentRows, cohortRows, statusRows, artifactRows, markRows, flagEventRows, earnedRows] = await Promise.all([
    supabase.from('memberships').select('*').eq('course_id', course.id),
    // R112: the two tables that grow with every step are read a page at a time, past the PostgREST row cap.
    selectAll((from, to) => supabase.from('step_completions').select('*').eq('course_id', course.id).order('user_id').order('task_id').order('step_id').range(from, to)),
    selectAll((from, to) => supabase.from('step_evidence').select('*').eq('course_id', course.id).order('user_id').order('task_id').order('step_id').range(from, to)),
    supabase.from('deliverables').select('*').eq('course_id', course.id),
    supabase.from('step_flags').select('*').eq('course_id', course.id).eq('stuck', true),
    supabase.from('deliverable_reviews').select('*').eq('course_id', course.id),
    supabase.from('task_reports').select('*').eq('course_id', course.id),
    // R85: the instructor reads every profile (0010) — name + picture only.
    supabase.from('profiles').select('id, display_name, avatar_url'),
    supabase.from('deliverable_submissions').select('*').eq('course_id', course.id),
    // peer_reviews carries no course_id (anonymity) — the instructor reads
    // all of them and this filters to the course's submissions below.
    supabase.from('peer_reviews').select('*'),
    // R136: the reviewer too, so each member's reviews done over assigned can be counted here (the instructor reads every assignment; identities never leave the loader).
    supabase.from('peer_review_assignments').select('id, submission_id, reviewer_id'),
    supabase.from('cohorts').select('*').eq('course_id', course.id),
    // R108: the lifecycle rows and the hashed files, for the KPI bands.
    supabase.from('deliverable_status').select('*').eq('course_id', course.id),
    supabase.from('evidence_artifacts').select('*').eq('course_id', course.id),
    // R136: the marks and the flag history (0021, 0022; an older database answers with an error, read as none).
    supabase.from('deliverable_review_marks').select('*').eq('course_id', course.id),
    supabase.from('step_flag_events').select('*').eq('course_id', course.id),
    // R137: the earned ledger, so the cohort's figures are the members' own.
    supabase.from('earned_skills').select('*').eq('course_id', course.id),
  ]);
  const profiles: CohortData['profiles'] = {};
  for (const p of profileRows.data ?? []) {
    profiles[String(p.id)] = {
      displayName: String(p.display_name ?? ''),
      ...(p.avatar_url ? { avatarUrl: String(p.avatar_url) } : {}),
    };
  }
  const roster = (memberships.data ?? []).map((r) => rosterFromRow(r, profiles[String(r.user_id)]?.avatarUrl));
  const keys = new Set<string>();
  for (const c of completions.data ?? []) keys.add(KEYS.completion(course.id, String(c.user_id), String(c.task_id), String(c.step_id)));
  const ev: CohortData['evidence'] = {};
  for (const r of evidence.data ?? []) {
    const rec = stepEvidenceFromRow(r);
    const m = String(r.user_id);
    (ev[m] ??= {})[`${rec.taskId}::${rec.stepId}`] = rec;
  }
  const docs: CohortData['docs'] = {};
  for (const d of deliverables.data ?? []) {
    (docs[String(d.team_id)] ??= {})[String(d.deliverable_id)] = (d.data ?? { fields: {}, groups: {} }) as DeliverableData;
  }
  const stuck: StuckFlag[] = (flags.data ?? []).map((r) => ({
    memberId: String(r.user_id),
    taskId: String(r.task_id),
    stepId: String(r.step_id),
    at: r.updated_at ? Date.parse(String(r.updated_at)) : 0,
  }));
  const submissions = (submissionRows.data ?? []).map(submissionFromRow);
  const submissionIds = new Set(submissions.map((x) => x.id));
  const peerReviews = (peerReviewRows.data ?? []).map(peerReviewFromRow).filter((r) => submissionIds.has(r.submissionId));
  const assignedCounts: Record<string, number> = {};
  const peerReviewCounts: CohortData['peerReviewCounts'] = {};
  const doneAssignments = new Set((peerReviewRows.data ?? []).map((r) => String(r.assignment_id)));
  for (const a of assignmentRows.data ?? []) {
    const sid = String(a.submission_id);
    if (!submissionIds.has(sid)) continue;
    assignedCounts[sid] = (assignedCounts[sid] ?? 0) + 1;
    const reviewer = String(a.reviewer_id ?? '');
    if (!reviewer) continue;
    const c = (peerReviewCounts[reviewer] ??= { done: 0, assigned: 0 });
    c.assigned += 1;
    if (doneAssignments.has(String(a.id))) c.done += 1;
  }
  const cohortDates: Cohort[] = (cohortRows.data ?? []).map((r) => ({ courseId: course.id, cohort: String(r.cohort), startsOn: String(r.starts_on) }));
  const status: CohortData['status'] = {};
  for (const r of statusRows.data ?? []) {
    const row = docStatusFromRow(r);
    (status[row.teamId] ??= []).push(row);
  }
  const artifacts: CohortData['artifacts'] = {};
  for (const r of artifactRows.data ?? []) (artifacts[String(r.user_id)] ??= []).push(artifactFromRow(r));
  const marks: CohortData['marks'] = {};
  for (const r of markRows.data ?? []) {
    const m = reviewMarkFromRow(r);
    (marks[m.teamId] ??= []).push(m);
  }
  const flagEvents: CohortData['flagEvents'] = {};
  for (const r of flagEventRows.data ?? []) {
    const e = flagEventFromRow(r);
    (flagEvents[e.memberId] ??= []).push(e);
  }
  const earned: CohortData['earned'] = {};
  for (const r of earnedRows.data ?? []) {
    const row = earnedFromRow(r);
    if (row) (earned[String(r.user_id)] ??= []).push(row);
  }
  return {
    mode: 'cloud',
    roster,
    completions: keys,
    evidence: ev,
    docs,
    stuck,
    reviews: (reviews.data ?? []).map(reviewFromRow),
    reports: (reports.data ?? []).map(taskReportFromRow).sort((a, b) => b.at - a.at),
    profiles,
    submissions,
    peerReviews,
    assignedCounts,
    cohortDates,
    status,
    artifacts,
    marks,
    flagEvents,
    peerReviewCounts,
    earned,
  };
}

export function loadCohort(course: Course): Promise<CohortData> {
  return isSupabaseConfigured() ? loadCohortCloud(course) : Promise.resolve(loadCohortLocal(course));
}

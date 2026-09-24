'use client';

import { getBrowserClient } from '../supabase/client';
import { isSupabaseConfigured } from '../supabase/config';
import type { Course, RosterEntry } from '../types';
import type { DeliverableData } from '../docs/types';
import type { DeliverableReview, StepEvidence, StuckFlag } from './types';
import { rosterFromRow, stepEvidenceFromRow, reviewFromRow } from './supabaseCache';
import { localStorageProgressRepo } from './localStorageProgressRepo';
import { localStorageEvidenceRepo } from './localStorageEvidenceRepo';
import { localStorageDocsRepo } from './localStorageDocsRepo';
import { localStorageStepNotesRepo, localStorageReviewRepo } from './localStorageFeatureRepos';
import { KEYS } from './keys';
import { getTasksByRole } from '../course-helpers';

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
  for (const t of teams) {
    docs[t] = localStorageDocsRepo.get(course.id, t) ?? {};
    stuck.push(...localStorageStepNotesRepo.teamStuck(course.id, t));
    reviews.push(...localStorageReviewRepo.list(course.id, t));
  }
  // `getTasksByRole` is imported so a course with no tasks for a role still
  // resolves cleanly in the page's derived rows; nothing else to do here.
  void getTasksByRole;
  return { mode: 'local', roster, completions, evidence, docs, stuck, reviews };
}

export async function loadCohortCloud(course: Course): Promise<CohortData> {
  const supabase = getBrowserClient();
  if (!supabase) return loadCohortLocal(course);
  const [memberships, completions, evidence, deliverables, flags, reviews] = await Promise.all([
    supabase.from('memberships').select('*').eq('course_id', course.id),
    supabase.from('step_completions').select('*').eq('course_id', course.id),
    supabase.from('step_evidence').select('*').eq('course_id', course.id),
    supabase.from('deliverables').select('*').eq('course_id', course.id),
    supabase.from('step_flags').select('*').eq('course_id', course.id).eq('stuck', true),
    supabase.from('deliverable_reviews').select('*').eq('course_id', course.id),
  ]);
  const roster = (memberships.data ?? []).map((r) => rosterFromRow(r));
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
  return { mode: 'cloud', roster, completions: keys, evidence: ev, docs, stuck, reviews: (reviews.data ?? []).map(reviewFromRow) };
}

export function loadCohort(course: Course): Promise<CohortData> {
  return isSupabaseConfigured() ? loadCohortCloud(course) : Promise.resolve(loadCohortLocal(course));
}

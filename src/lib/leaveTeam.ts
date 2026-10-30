'use client';

import { evidenceRepo, progressRepo, stepNotesRepo, userStateRepo } from './data';
import type { JoinResult } from './data/types';
import { bankProfile } from './earnedBank';
import { courseProfileFor } from './courseProfile';
import { clearResume } from './resume';
import { notifyStore } from './useClientStore';
import type { Course, Member } from './types';

/**
 * R150 — leaving a team, and moving to a later class session.
 *
 * The owner's rule: what a student has EARNED stays on their account; the capstone WORK of a session
 * belongs to that session's team and starts again with the next. So leaving is three steps, in order:
 *
 *   1. BANK — the member's live profile is written into the earned-skills ledger (`earned_skills`,
 *      R125). The pages bank lazily as they render, so a student who leaves straight from the Home
 *      tab could otherwise lose what the last week reached. Nothing is ever lowered.
 *   2. RESET — the member's own work on the course goes, the way "Reset my progress" does it: step
 *      completions, the evidence ledger and artifacts, step notes, the resume pointer, the task
 *      timers and the mine counter. The ledger is not touched (page-shape pins that a reset never
 *      names it). Team-keyed work (the forms, gates, reviews, submissions) stays with the OLD team by
 *      construction: it is keyed by the team id, and the student loses read access to it on leaving.
 *   3. LEAVE — the roster entry and the member context go; the cloud confirms the delete landed
 *      (and rolls back if not). The database raises the cohort floor so a rejoin can only go forward.
 *
 * Preserved on the account: earned_skills, user_paths, consents, learner outcomes, agreement
 * acceptances, lab access, the Week-0 acknowledgement, and the append-only records (receipts,
 * re-hash checks, validation answers, flag events).
 *
 * A switch is a leave followed by a join into the chosen session, under the SAME member id, so the
 * account keeps everything above. Changing team or role WITHIN a session is not this: that is the
 * join panel's in-place upsert (R119), and progress stays.
 */
export async function leaveCourseTeam(course: Course, member: Member): Promise<boolean> {
  bankProfile(courseProfileFor(course, member));
  progressRepo.resetCourse(course.id, member.memberId);
  evidenceRepo.resetCourse(course.id, member.memberId);
  stepNotesRepo.resetCourse(course.id, member.memberId);
  clearResume(course.id, member.memberId);
  userStateRepo.patch(course.id, member.memberId, { resume: undefined, timers: undefined, paused: undefined, mineSeen: undefined });
  const left = await Promise.resolve(progressRepo.leaveTeam(course.id, member.memberId));
  notifyStore();
  return left;
}

/** Leave the current team, then join `next` (a later session), keeping the member id. */
export async function switchCohortTeam(course: Course, member: Member, next: Member): Promise<JoinResult> {
  const left = await leaveCourseTeam(course, member);
  if (!left) return { ok: false, reason: 'network' };
  return Promise.resolve(progressRepo.joinTeam(course, { ...next, memberId: member.memberId }));
}

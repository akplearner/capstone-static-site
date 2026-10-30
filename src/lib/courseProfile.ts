'use client';

import type { Course, Member } from './types';
import { certOf, deliverablesOf, skillsOf } from './content/read';
import { bareDocument, courseDocument } from './content/docs';
import type { CourseDto } from './content/dto';
import { skillProfile, type SkillProfile } from './skillProfile';
import { withEarned } from './earnedBank';
import { evidenceRepo, progressRepo } from './data';
import { ownFactsOf, teamFactsOf, weekDueOf } from './recordFacts';
import { resolveActiveWeek } from './resume';

/**
 * R150 — the member's live skill profile for a course, built the one way every page builds it
 * (the Skills card's input, extracted). Pure over the repositories; no React. `leaveCourseTeam`
 * banks this before it resets the course so nothing earned is lost; the Skills card reads the same
 * shape, so what is banked on leaving is exactly what the page would have shown.
 */
export function courseProfileFor(course: Course, member: Member, opts: { activeWeek?: number; asOf?: number; doc?: CourseDto } = {}): SkillProfile {
  const { activeWeek, asOf = Date.now() } = opts;
  const doc = opts.doc ?? courseDocument(course.id) ?? bareDocument(course);
  const registry = skillsOf(doc);
  const cert = certOf(doc);
  const deliverables = deliverablesOf(doc);
  const keySet = progressRepo.getCompletionKeySet(course.id, member.memberId);
  const week = activeWeek ?? activeWeekOf(course, member, keySet);
  return withEarned(
    skillProfile({
      course,
      role: member.role,
      memberId: member.memberId,
      isStepDone: (t, s) => progressRepo.isStepComplete(course.id, member.memberId, t, s, keySet),
      evidence: evidenceRepo.getSteps(course.id, member.memberId),
      artifacts: evidenceRepo.getArtifacts(course.id, member.memberId),
      registry,
      cert,
      deliverables,
      team: teamFactsOf(course, member, week),
      own: ownFactsOf(course, member),
      weekDue: weekDueOf(course, member),
      asOf,
      receipts: evidenceRepo.getReceipts(course.id, member.memberId),
      rehashes: evidenceRepo.getRehashes(course.id, member.memberId),
    })
  );
}

/** The week the member is on, from their own completion, the way the course page resolves it. */
export function activeWeekOf(course: Course, member: Member, keySet = progressRepo.getCompletionKeySet(course.id, member.memberId)): number {
  const weekStats: Record<number, number> = {};
  for (const w of course.weeks) weekStats[w.number] = progressRepo.getWeekCompletion(course, member.memberId, member.role, w.number, keySet);
  return resolveActiveWeek(course, member.role, weekStats, null);
}

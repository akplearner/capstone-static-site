'use client';

import { bareDocument, courseDocument } from '@/lib/content/docs';
import { skillsOf } from '@/lib/content/read';
import { earnedRepo, evidenceRepo, progressRepo } from '@/lib/data';
import type { CourseFacts } from '@/lib/recordDetail';
import type { SkillProfile } from '@/lib/skillProfile';
import type { Course, Member } from '@/lib/types';

/**
 * R126 — the facts one course's figures were counted from, read from the repositories at the moment a
 * figure is opened (never at render of the strip, which holds only the numbers). `lib/recordDetail.ts`
 * is the pure half; this is the half that reads.
 */
export interface RecordCard {
  course: Course;
  member: Member;
  /** The profile the page counted, with the member's earned rows laid over it. */
  skills: SkillProfile;
  capstoneFiled: boolean;
  clearedWeeks: number[];
  /** `dimension:id` of the rows the ledger holds above what the live run reads. */
  kept: string[];
}

export function courseFactsOf(card: RecordCard): CourseFacts {
  const { course, member } = card;
  const keySet = progressRepo.getCompletionKeySet(course.id, member.memberId);
  const controls = skillsOf(courseDocument(course.id) ?? bareDocument(course)).CONTROL_OF;
  return {
    course,
    role: member.role,
    profile: card.skills,
    isStepDone: (taskId, stepId) => progressRepo.isStepComplete(course.id, member.memberId, taskId, stepId, keySet),
    evidence: evidenceRepo.getSteps(course.id, member.memberId),
    receipts: evidenceRepo.getReceipts(course.id, member.memberId),
    artifacts: evidenceRepo.getArtifacts(course.id, member.memberId),
    earned: earnedRepo.list(course.id),
    kept: card.kept,
    capstoneFiled: card.capstoneFiled,
    clearedWeeks: card.clearedWeeks,
    cites: (row) => row.deliverables.some((id) => (controls[id] ?? []).length > 0),
  };
}

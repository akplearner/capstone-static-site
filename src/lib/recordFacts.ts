'use client';

import { bareDocument, courseDocument } from '@/lib/content/docs';
import { skillsOf } from '@/lib/content/read';
import { courseRepo, earnedRepo, evidenceRepo, progressRepo, taskReportsRepo } from '@/lib/data';
import { buildIssues, type IssueDto, type IssuePeople } from '@/lib/issueInbox';
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

/** A report records the name and the role it was filed under, so nobody needs looking up to print it. */
const RECORDED: IssuePeople = { nameOf: () => undefined, roleOf: () => undefined, resolverName: () => undefined };

/**
 * R127 — the issues this member reported in these courses, newest first, joined to the course, week, task and
 * step as the inbox joins them. Read when an export is made, not at render: a team's reports are visible to the
 * whole team, so each is kept only if this member filed it.
 */
export function ownIssues(courseIds: readonly string[]): IssueDto[] {
  const courses: Course[] = [];
  const reports = courseIds.flatMap((id) => {
    const course = courseRepo.get(id);
    const member = progressRepo.getContext(id);
    if (!course || !member) return [];
    courses.push(course);
    return taskReportsRepo.list(id).filter((r) => r.memberId === member.memberId);
  });
  return buildIssues(courses, reports, RECORDED);
}

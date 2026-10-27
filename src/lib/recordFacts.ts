'use client';

import { bareDocument, courseDocument } from '@/lib/content/docs';
import { skillsOf } from '@/lib/content/read';
import { courseRepo, docsRepo, earnedRepo, evidenceRepo, progressRepo, statusRepo, taskReportsRepo } from '@/lib/data';
import { deliverablesOf } from '@/lib/content/read';
import { categoryForms, categoryTaskIds } from '@/lib/recordCard';
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
  const doc = courseDocument(course.id) ?? bareDocument(course);
  const registry = skillsOf(doc);
  const controls = registry.CONTROL_OF;
  const deliverables = deliverablesOf(doc);
  const input = { course, role: member.role, profile: card.skills, registry, deliverables, status: statusRepo.list(course.id, member.teamId) };
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
    // R133: the tasks and forms of each category, as the cards count them.
    categories: { tasks: categoryTaskIds(input), forms: categoryForms(input) },
  };
}

/** R133: one course as the fourteen cards count it, read from the repositories at the moment the page builds them. */
export function recordCourseInputOf(card: RecordCard & { capstoneFiled: boolean; clearedWeeks: number[] }) {
  const { course, member } = card;
  const doc = courseDocument(course.id) ?? bareDocument(course);
  const registry = skillsOf(doc);
  const keySet = progressRepo.getCompletionKeySet(course.id, member.memberId);
  return {
    course,
    role: member.role,
    profile: card.skills,
    evidence: evidenceRepo.getSteps(course.id, member.memberId),
    receipts: evidenceRepo.getReceipts(course.id, member.memberId),
    artifacts: evidenceRepo.getArtifacts(course.id, member.memberId),
    isStepDone: (taskId: string, stepId: string) => progressRepo.isStepComplete(course.id, member.memberId, taskId, stepId, keySet),
    registry,
    deliverables: deliverablesOf(doc),
    status: statusRepo.list(course.id, member.teamId),
    docs: docsRepo.get(course.id, member.teamId) ?? {},
    capstoneFiled: card.capstoneFiled,
    clearedWeeks: card.clearedWeeks,
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

'use client';

import { progressRepo } from './data';
import type { JoinResult } from './data/types';
import type { Course, Member } from './types';

/**
 * Take another role on the same team (R119): the join panel's own call, with
 * the member's team, cohort and name unchanged and only the role replaced.
 * Ticks, evidence and notes are keyed by the member, never by the role, so they
 * stay; the cloud repo confirms the membership row landed before it resolves
 * (R82), so `ok` means the database agrees. Resolves with the member as they
 * now are, for the caller to hand to `onJoined`.
 */
export async function takeRole(course: Course, member: Member, roleId: string): Promise<{ result: JoinResult; member: Member }> {
  const next: Member = { ...member, role: roleId };
  const result = await Promise.resolve(progressRepo.joinTeam(course, next));
  return { result, member: next };
}

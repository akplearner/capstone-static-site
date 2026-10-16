'use client';

import { useEffect, useRef } from 'react';
import { courseRepo, earnedRepo, evidenceRepo, progressRepo } from '@/lib/data';
import { EARNED_DIMENSIONS, applyEarned, candidatesFrom } from '@/lib/earnedSkills';
import { levelRank, type SkillProfile } from '@/lib/skillProfile';

/**
 * R125 — the earned-skills ledger, where the pages meet it (`lib/earnedSkills.ts` is the rule).
 *
 * `withEarned` lays what the member has earned over a live profile, so a retake reads at the levels
 * already reached; every surface that builds a profile for the member passes it through. `useBankEarned`
 * writes what a profile says is reached into the ledger, after render and only when something new is
 * reached, so it adds and raises and never lowers: the pages bank as they show, which is also what
 * keeps the ledger current before "Reset my progress" empties the progress it was earned with.
 */

/** The profile with the member's earned rows laid over it. */
export function withEarned(profile: SkillProfile): SkillProfile {
  return applyEarned(profile, earnedRepo.list(profile.courseId));
}

/** Bank what the profile says is reached: the ledger adds what is new and raises what is higher. */
export function bankProfile(profile: SkillProfile, now: number = Date.now()): void {
  const course = courseRepo.get(profile.courseId);
  const member = progressRepo.getContext(profile.courseId);
  if (!course || !member) return;
  const keySet = progressRepo.getCompletionKeySet(course.id, member.memberId);
  const facts = {
    isStepDone: (taskId: string, stepId: string) => progressRepo.isStepComplete(course.id, member.memberId, taskId, stepId, keySet),
    evidence: evidenceRepo.getSteps(course.id, member.memberId),
  };
  earnedRepo.bank(candidatesFrom(profile, course, facts, now));
}

/** What a profile has reached, as a short string: it changes when a row is reached or raised. */
function reachedSignature(profile: SkillProfile): string {
  const rows = EARNED_DIMENSIONS.flatMap((d) => profile.rows[d]).filter((r) => r.level !== 'not-started');
  return `${profile.courseId}:${rows.map((r) => `${r.id}${levelRank(r.level)}`).join(',')}`;
}

/** Bank the profiles a page shows, when they reach something not yet banked. Never during render. */
export function useBankEarned(profiles: readonly SkillProfile[]): void {
  const latest = useRef(profiles);
  useEffect(() => {
    latest.current = profiles;
  });
  const signature = profiles.map(reachedSignature).join('|');
  useEffect(() => {
    for (const profile of latest.current) bankProfile(profile);
  }, [signature]);
}

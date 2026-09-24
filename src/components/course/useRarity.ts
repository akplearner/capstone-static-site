'use client';

import type { Course, Member, Task } from '@/lib/types';
import type { Cohort } from '@/lib/data';
import { evidenceRepo } from '@/lib/data';
import { weekDue } from '@/lib/calendar';
import { taskRarity, type Rarity } from '@/lib/rarity';

/**
 * The rarity of every task's gem for this student, from what is already
 * recorded: completion (`taskStats`), the evidence ledger, and the cohort's
 * due dates. A read, not a store — the page re-renders when any of them change.
 */
export function useRarity(course: Course, member: Member | null, taskStats: Record<string, number>, cohortCal: Cohort | null) {
  const evidence = member ? evidenceRepo.getSteps(course.id, member.memberId) : {};
  return (task: Task): Rarity | null =>
    taskRarity({
      task,
      percent: taskStats[task.id] ?? 0,
      evidence,
      dueDay: cohortCal ? weekDue(cohortCal.startsOn, task.week) : undefined,
    });
}

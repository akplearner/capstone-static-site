import type { Task } from './types';
import type { StepEvidence } from './data/types';
import { getRequiredSteps } from './course-helpers';

/**
 * The rarity of the gem a finished task earns — earned by proof, never random
 * (R80, the instructor's rule):
 *
 *   Common     the task is done.
 *   Rare       done by the end of its week's due date. With no cohort calendar
 *              there is no deadline to miss, so a done task is on time.
 *   Epic       every required step that CAN be verified was verified against
 *              pasted output. A task with no verifiable step cannot be Epic —
 *              there is nothing to prove it with.
 *   Legendary  Epic, on time, and no required step was self-attested.
 *
 * Pure: the caller hands in the task, its percent, the student's evidence
 * records for the course (keyed `taskId::stepId`) and the due day, if any.
 */
export type Rarity = 0 | 1 | 2 | 3;

export function taskRarity({
  task,
  percent,
  evidence,
  dueDay,
}: {
  task: Task;
  percent: number;
  evidence: Record<string, StepEvidence>;
  /** `YYYY-MM-DD`, the last day of the task's week; undefined when there is no calendar. */
  dueDay?: string;
}): Rarity | null {
  if (percent < 100) return null;
  const required = getRequiredSteps(task);
  const records = required.map((s) => evidence[`${task.id}::${s.id}`]).filter((r): r is StepEvidence => !!r);
  const latest = Math.max(0, ...records.map((r) => r.verifiedAt ?? r.firstAttemptAt ?? 0));
  const onTime = !dueDay || latest === 0 || latest <= Date.parse(`${dueDay}T23:59:59`);
  const verifiable = required.filter((s) => (s.verify?.length ?? 0) > 0);
  const allVerified = verifiable.length > 0 && verifiable.every((s) => evidence[`${task.id}::${s.id}`]?.verified);
  const anySelfAttested = records.some((r) => r.method === 'self-attested');
  if (allVerified && onTime && !anySelfAttested) return 3;
  if (allVerified) return 2;
  if (onTime) return 1;
  return 0;
}

/** The week's gem is only as good as its weakest task. */
export function weekRarity(rarities: (Rarity | null)[]): Rarity | null {
  if (rarities.length === 0 || rarities.some((r) => r === null)) return null;
  return Math.min(...(rarities as Rarity[])) as Rarity;
}

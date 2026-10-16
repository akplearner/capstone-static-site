'use client';

import { useBankEarned } from '@/lib/earnedBank';
import type { SkillProfile } from '@/lib/skillProfile';

/**
 * R125 — banks what the profiles reach into the earned-skills ledger, for a page whose profile is
 * only built after an early return (a hook cannot be called there). Renders nothing.
 */
export function BankEarned({ profiles }: { profiles: readonly SkillProfile[] }) {
  useBankEarned(profiles);
  return null;
}

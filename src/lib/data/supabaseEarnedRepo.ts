'use client';

import type { EarnedSkillsRepository } from './types';
import { KEYS } from './keys';
import { getBrowserClient } from '../supabase/client';
import { notifyStore } from '../useClientStore';
import { cache, getCurrentUserId } from './supabaseCache';
import { earnedStore } from './localStorageEarnedRepo';
import { isMissingSchema } from './schemaErrors';
import { earnedKey, mergeLedger, type EarnedRow } from '../earnedSkills';

/**
 * The earned-skills ledger, cloud-backed (R125): `earned_skills`, one row per member, dimension
 * and id, written only by the member and held by the database to the rule that a row is added and
 * raised, never lowered, rewritten or re-dated (0019).
 *
 * Reads are synchronous off the cache like every other repo. A write is optimistic: the cache and
 * the page have it at once, and the upsert follows. A write that fails is kept and tried again with
 * the next `bank`, so a dropped connection costs a delay, not a skill; a database without the table
 * (0019 not applied) keeps the ledger on this device, per account, so a retake still never costs a
 * member what they earned. The server stamps the times; this module sends none.
 */
const pending = new Map<string, EarnedRow>();
let inFlight = false;

/** The per-account copy kept on this device while the database has no table for the ledger. */
const deviceCopy = earnedStore(() => {
  const id = getCurrentUserId();
  return id ? KEYS.earnedSkillsFor(id) : null;
});

async function flush(): Promise<void> {
  const supabase = getBrowserClient();
  const userId = getCurrentUserId();
  if (inFlight || !supabase || !userId || pending.size === 0) return;
  inFlight = true;
  const batch = [...pending.values()];
  try {
    const { error } = await supabase.from('earned_skills').upsert(
      batch.map((r) => ({ user_id: userId, dimension: r.dimension, skill_id: r.id, course_id: r.courseId, level: r.level, via: r.via })),
      { onConflict: 'user_id,dimension,skill_id' }
    );
    if (!error) {
      for (const r of batch) if (pending.get(earnedKey(r)) === r) pending.delete(earnedKey(r));
    } else if (isMissingSchema(error)) {
      // No table yet: the ledger lives on this device until the database is updated.
      cache.markEarnedMissing();
      deviceCopy.bank(batch);
      pending.clear();
      notifyStore();
    } else {
      console.error('[earned] earned_skills save failed, will retry:', error.message);
    }
  } catch (e) {
    console.error('[earned] earned_skills save failed, will retry:', e);
  } finally {
    inFlight = false;
  }
}

export const supabaseEarnedRepo: EarnedSkillsRepository = {
  list(courseId) {
    return cache.earnedMissing() ? deviceCopy.list(courseId) : cache.earned(courseId);
  },

  bank(candidates) {
    if (!getCurrentUserId()) return [];
    if (cache.earnedMissing()) return deviceCopy.bank(candidates);
    const { changed } = mergeLedger(cache.earned(), candidates);
    if (changed.length === 0) {
      if (pending.size > 0) void flush();
      return [];
    }
    cache.setEarned(changed);
    for (const r of changed) pending.set(earnedKey(r), r);
    notifyStore();
    void flush();
    return changed;
  },
};

/** For tests: forget what is waiting to be written. */
export function resetEarnedPending(): void {
  pending.clear();
  inFlight = false;
}

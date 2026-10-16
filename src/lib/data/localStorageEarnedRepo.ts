import type { EarnedSkillsRepository } from './types';
import { KEYS } from './keys';
import { safeSetItem } from './safeStorage';
import { asEarnedRow, mergeLedger, type EarnedRow } from '../earnedSkills';
import { notifyStore } from '../useClientStore';

/**
 * The earned-skills ledger on this device (R125): one blob under one key, read whole.
 *
 * `earnedStore` is a factory because there are two homes for the same ledger: this device's own
 * key (offline), and a per-account key the cloud repo falls back to while the database has no
 * table for it (0019 not applied yet), so a retake never costs a member their skills in the
 * meantime. The blob is parsed again only when its text changes, so `list()` is cheap to call in
 * a render and returns the same array while nothing was banked.
 */
function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

export function earnedStore(keyOf: () => string | null): EarnedSkillsRepository {
  let lastKey: string | null = null;
  let lastRaw: string | null | undefined;
  let lastList: EarnedRow[] = [];

  const read = (): EarnedRow[] => {
    const key = keyOf();
    if (!hasWindow() || !key) return [];
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      return lastList;
    }
    if (key === lastKey && raw === lastRaw) return lastList;
    let list: EarnedRow[] = [];
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      list = (Array.isArray(parsed) ? parsed : []).map(asEarnedRow).filter((r): r is EarnedRow => r !== null);
    } catch {
      list = [];
    }
    lastKey = key;
    lastRaw = raw;
    lastList = list;
    return list;
  };

  return {
    list(courseId) {
      const all = read();
      return courseId ? all.filter((e) => e.courseId === courseId) : all;
    },
    bank(candidates) {
      const key = keyOf();
      if (!hasWindow() || !key) return [];
      const { ledger, changed } = mergeLedger(read(), candidates);
      if (changed.length === 0) return [];
      safeSetItem(key, JSON.stringify(ledger));
      notifyStore();
      return changed;
    },
  };
}

export const localStorageEarnedRepo = earnedStore(() => KEYS.earnedSkills);

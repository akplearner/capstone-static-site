import { DeliverableData } from '../docs/types';
import { DeliverableVersion, DocsRepository } from './types';
import { KEYS } from './keys';
import { safeSetItem } from './safeStorage';

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

/** R139: a version is a sitting, not a keystroke — the same rule as the database trigger. */
export const HISTORY_SITTING_MS = 5 * 60_000;
/** Offline, a device keeps this many versions per team; the oldest fall off. */
export const HISTORY_CAP = 60;

function readHistory(courseId: string, teamId: string): DeliverableVersion[] {
  const raw = localStorage.getItem(KEYS.docsHistory(courseId, teamId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as DeliverableVersion[]) : [];
  } catch {
    return [];
  }
}

/**
 * Append the version a form held before `next` replaced it. Pure over its inputs
 * (exported for the test): nothing when the data did not change, nothing when
 * the same author saved this form within the sitting, the cap kept.
 */
export function appendVersion(
  history: DeliverableVersion[],
  deliverableId: string,
  previous: DeliverableData | undefined,
  next: DeliverableData,
  by: string | null,
  now: number
): DeliverableVersion[] {
  if (!previous || JSON.stringify(previous) === JSON.stringify(next)) return history;
  const last = [...history].reverse().find((v) => v.deliverableId === deliverableId);
  if (last && last.replacedBy === by && now - last.replacedAt < HISTORY_SITTING_MS) return history;
  const version: DeliverableVersion = { deliverableId, data: previous, updatedBy: last?.replacedBy ?? null, updatedAt: last?.replacedAt ?? now, replacedBy: by, replacedAt: now };
  const out = [...history, version];
  return out.length > HISTORY_CAP ? out.slice(out.length - HISTORY_CAP) : out;
}

function record(courseId: string, teamId: string, deliverableId: string, previous: DeliverableData | undefined, next: DeliverableData) {
  const history = appendVersion(readHistory(courseId, teamId), deliverableId, previous, next, null, Date.now());
  safeSetItem(KEYS.docsHistory(courseId, teamId), JSON.stringify(history));
}

// Team-scoped deliverable-form storage (Master Package). localStorage today;
// same seam as the other repos so a backend can be swapped in for accounts.
export const localStorageDocsRepo: DocsRepository = {
  get(courseId, teamId): Record<string, DeliverableData> | null {
    if (!hasWindow()) return null;
    const raw = localStorage.getItem(KEYS.docs(courseId, teamId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Record<string, DeliverableData>;
    } catch {
      return null;
    }
  },
  save(courseId, teamId, data): void {
    if (!hasWindow()) return;
    const current = localStorageDocsRepo.get(courseId, teamId) ?? {};
    for (const [id, d] of Object.entries(data)) record(courseId, teamId, id, current[id], d);
    safeSetItem(KEYS.docs(courseId, teamId), JSON.stringify(data));
  },
  saveOne(courseId, teamId, deliverableId, data): Promise<boolean> {
    if (!hasWindow()) return Promise.resolve(false);
    const current = localStorageDocsRepo.get(courseId, teamId) ?? {};
    record(courseId, teamId, deliverableId, current[deliverableId], data);
    safeSetItem(KEYS.docs(courseId, teamId), JSON.stringify({ ...current, [deliverableId]: data }));
    return Promise.resolve(true);
  },
  history(courseId, teamId): Promise<DeliverableVersion[]> {
    if (!hasWindow()) return Promise.resolve([]);
    return Promise.resolve([...readHistory(courseId, teamId)].reverse());
  },
};

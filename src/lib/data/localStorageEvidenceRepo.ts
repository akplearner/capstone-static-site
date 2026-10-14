import { KEYS } from './keys';
import { safeSetItem } from './safeStorage';
import { notifyStore } from '../useClientStore';
import {
  EvidenceArtifact,
  EvidenceRepository,
  PathRepository,
  RehashCheck,
  StepEvidence,
} from './types';

// localStorage implementations of the evidence ledger and the chosen career path,
// used when Supabase isn't configured (the offline/guest path CI builds against).
//
// Both stores are per (course, member) blobs rather than a key per record: the
// metrics projections always read the whole set at once, so one parse beats a
// scan over hundreds of keys — the opposite trade-off to `completion`, which is
// probed one key at a time.

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** The composite key for one step's record. */
export function stepEvidenceKey(taskId: string, stepId: string): string {
  return `${taskId}::${stepId}`;
}

export const localStorageEvidenceRepo: EvidenceRepository = {
  getSteps(courseId: string, memberId: string): Record<string, StepEvidence> {
    return readJson<Record<string, StepEvidence>>(KEYS.stepEvidence(courseId, memberId), {});
  },

  saveStep(memberId: string, evidence: StepEvidence): void {
    if (!hasWindow()) return;
    const key = KEYS.stepEvidence(evidence.courseId, memberId);
    const all = readJson<Record<string, StepEvidence>>(key, {});
    all[stepEvidenceKey(evidence.taskId, evidence.stepId)] = evidence;
    safeSetItem(key, JSON.stringify(all));
    // Like the cloud repo: every reader of the ledger (the ledger page, the
    // dashboard, the portfolio) re-reads now, not at the next unrelated write.
    notifyStore();
  },

  getArtifacts(courseId: string, memberId: string): EvidenceArtifact[] {
    return readJson<EvidenceArtifact[]>(KEYS.evidenceArtifacts(courseId, memberId), []);
  },

  saveArtifact(memberId: string, artifact: EvidenceArtifact): void {
    if (!hasWindow()) return;
    const key = KEYS.evidenceArtifacts(artifact.courseId, memberId);
    const all = readJson<EvidenceArtifact[]>(key, []);
    // Keyed by hash: re-hashing the same file updates the record in place rather
    // than counting the artifact twice.
    const next = all.filter((a) => a.sha256 !== artifact.sha256);
    next.push(artifact);
    safeSetItem(key, JSON.stringify(next));
    notifyStore();
  },

  resetCourse(courseId: string, memberId: string): void {
    if (!hasWindow()) return;
    localStorage.removeItem(KEYS.stepEvidence(courseId, memberId));
    localStorage.removeItem(KEYS.evidenceArtifacts(courseId, memberId));
    localStorage.removeItem(KEYS.rehashChecks(courseId, memberId));
    notifyStore();
  },

  // R113: receipts are the platform's record of a stamp it issued; offline
  // there is no platform, so there are none, and `null` says so.
  getReceipts(): null {
    return null;
  },

  getRehashes(courseId: string, memberId: string): RehashCheck[] {
    return readJson<RehashCheck[]>(KEYS.rehashChecks(courseId, memberId), []);
  },

  saveRehash(memberId: string, check: RehashCheck): void {
    if (!hasWindow()) return;
    const key = KEYS.rehashChecks(check.courseId, memberId);
    // Append-only, like the cloud table: a later check is a new row.
    safeSetItem(key, JSON.stringify([...readJson<RehashCheck[]>(key, []), check]));
    notifyStore();
  },
};

export const localStoragePathRepo: PathRepository = {
  get(memberId: string): { pathId: string; chosenAt: number } | null {
    return readJson<{ pathId: string; chosenAt: number } | null>(KEYS.path(memberId), null);
  },

  save(memberId: string, pathId: string): void {
    if (!hasWindow()) return;
    safeSetItem(KEYS.path(memberId), JSON.stringify({ pathId, chosenAt: Date.now() }));
  },

  clear(memberId: string): void {
    if (!hasWindow()) return;
    localStorage.removeItem(KEYS.path(memberId));
  },
};

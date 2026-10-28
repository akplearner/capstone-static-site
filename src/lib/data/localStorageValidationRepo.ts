import { KEYS } from './keys';
import { safeSetItem } from './safeStorage';
import { notifyStore } from '../useClientStore';
import { localStorageProgressRepo } from './localStorageProgressRepo';
import type { ValidationAnswer, ValidationRepository } from './types';

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

function readAll(courseId: string, memberId: string): ValidationAnswer[] {
  if (!hasWindow()) return [];
  const raw = localStorage.getItem(KEYS.validation(courseId, memberId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ValidationAnswer[]) : [];
  } catch {
    return [];
  }
}

/** R140: the member's validation answers, one blob per (course, member), append-only like the flag history. */
export const localStorageValidationRepo: ValidationRepository = {
  list(courseId, memberId): ValidationAnswer[] {
    return readAll(courseId, memberId);
  },
  // On one device the team is whoever joined on this browser.
  listTeam(courseId, teamId): ValidationAnswer[] {
    if (!hasWindow()) return [];
    return localStorageProgressRepo
      .getRoster(courseId)
      .filter((m) => m.teamId === teamId)
      .flatMap((m) => readAll(courseId, m.memberId));
  },
  save(answer): void {
    if (!hasWindow()) return;
    const key = KEYS.validation(answer.courseId, answer.memberId);
    safeSetItem(key, JSON.stringify([...readAll(answer.courseId, answer.memberId), answer]));
    notifyStore();
  },
};

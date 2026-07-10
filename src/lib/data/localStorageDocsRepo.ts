import { DeliverableData } from '../docs/types';
import { DocsRepository } from './types';
import { KEYS } from './keys';
import { safeSetItem } from './safeStorage';

function hasWindow(): boolean {
  return typeof window !== 'undefined';
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
    safeSetItem(KEYS.docs(courseId, teamId), JSON.stringify(data));
  },
};

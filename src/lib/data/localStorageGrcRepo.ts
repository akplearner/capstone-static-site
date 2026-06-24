import { GrcData } from '../types';
import { GrcRepository } from './types';
import { KEYS } from './keys';

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

// Team-scoped GRC Workspace storage. localStorage today (per-device); the
// interface matches the other repos so a backend can be swapped in for the
// accounts/SSO phase without touching the page.
export const localStorageGrcRepo: GrcRepository = {
  get(courseId, teamId): GrcData | null {
    if (!hasWindow()) return null;
    const raw = localStorage.getItem(KEYS.grc(courseId, teamId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as GrcData;
    } catch {
      return null;
    }
  },
  save(courseId, teamId, data): void {
    if (!hasWindow()) return;
    localStorage.setItem(KEYS.grc(courseId, teamId), JSON.stringify(data));
  },
};

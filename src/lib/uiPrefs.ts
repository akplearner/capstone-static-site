import { KEYS } from './data/keys';
import { safeSetItem } from './data/safeStorage';
import { notifyStore } from './useClientStore';

/**
 * R100 — small per-device UI preferences, like the theme: not progress, not
 * team data, so they never go to the cloud. Read through `useClientStore`
 * (`notifyStore()` wakes every reader).
 */
export function getFocusMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(KEYS.focusMode) === '1';
  } catch {
    return false;
  }
}

export function setFocusMode(on: boolean): void {
  if (typeof window === 'undefined') return;
  if (on) safeSetItem(KEYS.focusMode, '1');
  else localStorage.removeItem(KEYS.focusMode);
  notifyStore();
}

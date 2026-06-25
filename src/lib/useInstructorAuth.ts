'use client';

import { KEYS } from './data/keys';
import { useClientStore, useHydrated, notifyStore } from './useClientStore';

// Lightweight, client-only gate for the instructor area. This is intentionally a
// stub to be replaced by real authentication when a backend is added.
const PASSCODE = process.env.NEXT_PUBLIC_INSTRUCTOR_PASSCODE || 'instructor';

export function useInstructorAuth() {
  const unlocked = useClientStore(
    () => typeof window !== 'undefined' && localStorage.getItem(KEYS.instructorUnlocked) === '1',
    false
  );
  const ready = useHydrated();

  const unlock = (code: string): boolean => {
    if (code === PASSCODE) {
      if (typeof window !== 'undefined') localStorage.setItem(KEYS.instructorUnlocked, '1');
      notifyStore();
      return true;
    }
    return false;
  };

  const lock = () => {
    if (typeof window !== 'undefined') localStorage.removeItem(KEYS.instructorUnlocked);
    notifyStore();
  };

  return { unlocked, ready, unlock, lock };
}

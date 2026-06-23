'use client';

import { useEffect, useState } from 'react';
import { KEYS } from './data/keys';

// Lightweight, client-only gate for the instructor area. This is intentionally a
// stub to be replaced by real authentication when a backend is added.
const PASSCODE = process.env.NEXT_PUBLIC_INSTRUCTOR_PASSCODE || 'instructor';

export function useInstructorAuth() {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUnlocked(localStorage.getItem(KEYS.instructorUnlocked) === '1');
    }
    setReady(true);
  }, []);

  const unlock = (code: string): boolean => {
    if (code === PASSCODE) {
      if (typeof window !== 'undefined') localStorage.setItem(KEYS.instructorUnlocked, '1');
      setUnlocked(true);
      return true;
    }
    return false;
  };

  const lock = () => {
    if (typeof window !== 'undefined') localStorage.removeItem(KEYS.instructorUnlocked);
    setUnlocked(false);
  };

  return { unlocked, ready, unlock, lock };
}

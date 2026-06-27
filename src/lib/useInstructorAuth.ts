'use client';

import { KEYS } from './data/keys';
import { useClientStore, useHydrated, notifyStore } from './useClientStore';
import { useAuth } from './useAuth';
import { isSupabaseConfigured } from './supabase/config';

// Instructor gate.
//   • Supabase configured → real auth: `unlocked` is the signed-in user's
//     `profiles.is_instructor` flag (set in the Supabase dashboard). The passcode
//     path is disabled.
//   • Not configured (local/dev) → the original passcode stub, so the studio still
//     opens offline.
const PASSCODE = process.env.NEXT_PUBLIC_INSTRUCTOR_PASSCODE || 'instructor';

export function useInstructorAuth() {
  const configured = isSupabaseConfigured();
  const { user, loading, isInstructor } = useAuth();
  const hydrated = useHydrated();

  const localUnlocked = useClientStore(
    () => typeof window !== 'undefined' && localStorage.getItem(KEYS.instructorUnlocked) === '1',
    false
  );

  if (configured) {
    return {
      mode: 'auth' as const,
      unlocked: isInstructor,
      ready: !loading,
      signedIn: !!user,
      // Passcode no-ops in auth mode; access is granted via the profile flag.
      unlock: () => false,
      lock: () => {},
    };
  }

  return {
    mode: 'passcode' as const,
    unlocked: localUnlocked,
    ready: hydrated,
    signedIn: false,
    unlock: (code: string): boolean => {
      if (code === PASSCODE) {
        if (typeof window !== 'undefined') localStorage.setItem(KEYS.instructorUnlocked, '1');
        notifyStore();
        return true;
      }
      return false;
    },
    lock: () => {
      if (typeof window !== 'undefined') localStorage.removeItem(KEYS.instructorUnlocked);
      notifyStore();
    },
  };
}

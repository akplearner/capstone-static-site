'use client';

import { KEYS } from './data/keys';
import { useClientStore, useHydrated, notifyStore } from './useClientStore';
import { useAuth } from './useAuth';
import { isSupabaseConfigured } from './supabase/config';

// Instructor gate.
//   • Supabase configured → real auth: `unlocked` is the signed-in user's
//     `profiles.is_instructor` flag (set in the Supabase dashboard). The passcode
//     path is disabled.
//   • Not configured (local/dev) → a passcode stub, so the studio still opens
//     offline — but ONLY if the author has set a passcode. There is deliberately
//     no default: an unset passcode leaves the studio locked (and `unlock` a
//     no-op) rather than open to anyone who guesses the old literal.
const PASSCODE = process.env.NEXT_PUBLIC_INSTRUCTOR_PASSCODE || '';
const PASSCODE_SET = PASSCODE.length > 0;

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
    // With no passcode configured the studio can't be unlocked at all, so an
    // orphaned localStorage flag never counts as access.
    unlocked: PASSCODE_SET && localUnlocked,
    ready: hydrated,
    signedIn: false,
    // True only when a passcode exists to enter; drives the gate's copy.
    passcodeSet: PASSCODE_SET,
    unlock: (code: string): boolean => {
      if (PASSCODE_SET && code === PASSCODE) {
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

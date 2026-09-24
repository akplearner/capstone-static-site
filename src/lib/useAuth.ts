'use client';

import { useSyncExternalStore } from 'react';
import type { User } from '@supabase/supabase-js';
import { getBrowserClient } from './supabase/client';
import { setCurrentUserId } from './data/supabaseCache';
import { clearOfflineCaches } from './pwa';

// Auth state as a module-level external store (same pattern as useClientStore):
// one Supabase auth listener is shared app-wide, and useSyncExternalStore keeps it
// lint-clean (no set-state-in-effect). When Supabase isn't configured the store
// settles to { user: null, loading: false } so the UI just shows the open/guest path.

export type Profile = { displayName: string; avatarUrl: string | null };
type AuthState = { user: User | null; loading: boolean; isInstructor: boolean; profile: Profile | null };

const INITIAL: AuthState = { user: null, loading: true, isInstructor: false, profile: null };
let state: AuthState = INITIAL;
const listeners = new Set<() => void>();
let started = false;

function emit(next: AuthState) {
  state = next;
  listeners.forEach((l) => l());
}

// Load the profile row — the instructor flag, and (R81) the name and picture
// the signup trigger took from Google or GitHub — then re-emit so gates and
// the account page update.
export function loadProfile(user: User | null) {
  if (!user) return;
  const supabase = getBrowserClient();
  if (!supabase) return;
  supabase
    .from('profiles')
    .select('is_instructor, display_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()
    .then(({ data }) => {
      emit({
        user,
        loading: false,
        isInstructor: !!data?.is_instructor,
        profile: data ? { displayName: String(data.display_name ?? ''), avatarUrl: data.avatar_url ? String(data.avatar_url) : null } : null,
      });
    });
}

function ensureStarted() {
  if (started) return;
  started = true;
  const supabase = getBrowserClient();
  if (!supabase) {
    state = { user: null, loading: false, isInstructor: false, profile: null };
    return;
  }
  supabase.auth.getSession().then(({ data }) => {
    const user = data.session?.user ?? null;
    emit({ user, loading: false, isInstructor: false, profile: null });
    loadProfile(user);
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null;
    // A token refresh fires this too; keep the profile we have rather than
    // blanking the name for a frame.
    emit({ user, loading: false, isInstructor: user && state.user?.id === user.id ? state.isInstructor : false, profile: user && state.user?.id === user.id ? state.profile : null });
    loadProfile(user);
  });
}

function subscribe(cb: () => void) {
  ensureStarted();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useAuth() {
  const snap = useSyncExternalStore(
    subscribe,
    () => state,
    () => INITIAL
  );
  return {
    user: snap.user,
    loading: snap.loading,
    isInstructor: snap.isInstructor,
    profile: snap.profile,
    signOut: async () => {
      const supabase = getBrowserClient();
      await supabase?.auth.signOut();
      // Drop the cached rows immediately rather than waiting for a course page to
      // remount and run useSupabaseSync. On a shared classroom machine, signing
      // out from anywhere but a course page previously left the next student
      // briefly looking at the previous student's cached progress.
      setCurrentUserId(null);
      // And the worker's page cache, for the same reason.
      clearOfflineCaches();
    },
  };
}

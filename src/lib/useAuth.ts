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
type AuthState = { user: User | null; loading: boolean; isInstructor: boolean; isAdmin: boolean; profile: Profile | null };

const INITIAL: AuthState = { user: null, loading: true, isInstructor: false, isAdmin: false, profile: null };
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
    .select('is_instructor, is_admin, display_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()
    .then(({ data, error }) => {
      // A database that predates migration 0010 has no is_admin column and
      // errors the whole select. Retry without it rather than silently
      // locking every instructor out until setup.sql is re-run.
      if (error && /is_admin/.test(error.message)) {
        void supabase
          .from('profiles')
          .select('is_instructor, display_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle()
          .then(({ data: old }) => {
            emit({
              user,
              loading: false,
              isInstructor: !!old?.is_instructor,
              isAdmin: false,
              profile: old ? { displayName: String(old.display_name ?? ''), avatarUrl: old.avatar_url ? String(old.avatar_url) : null } : null,
            });
          });
        return;
      }
      emit({
        user,
        loading: false,
        // R85: an admin IS an instructor everywhere the UI asks — the same
        // inheritance the database's is_instructor() helper applies.
        isInstructor: !!data?.is_instructor || !!data?.is_admin,
        isAdmin: !!data?.is_admin,
        profile: data ? { displayName: String(data.display_name ?? ''), avatarUrl: data.avatar_url ? String(data.avatar_url) : null } : null,
      });
    });
}

function ensureStarted() {
  if (started) return;
  started = true;
  const supabase = getBrowserClient();
  if (!supabase) {
    state = { user: null, loading: false, isInstructor: false, isAdmin: false, profile: null };
    return;
  }
  supabase.auth.getSession().then(({ data }) => {
    const user = data.session?.user ?? null;
    emit({ user, loading: false, isInstructor: false, isAdmin: false, profile: null });
    loadProfile(user);
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null;
    // A token refresh fires this too; keep the profile we have rather than
    // blanking the name for a frame.
    const sameUser = user && state.user?.id === user.id;
    emit({ user, loading: false, isInstructor: sameUser ? state.isInstructor : false, isAdmin: sameUser ? state.isAdmin : false, profile: sameUser ? state.profile : null });
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
    isAdmin: snap.isAdmin,
    profile: snap.profile,
    signOut: async () => {
      const supabase = getBrowserClient();
      // scope 'local': the default 'global' revoked EVERY session, so signing
      // out of a classroom PC also signed the student out on their phone (R82).
      await supabase?.auth.signOut({ scope: 'local' });
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

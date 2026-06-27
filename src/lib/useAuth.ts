'use client';

import { useSyncExternalStore } from 'react';
import type { User } from '@supabase/supabase-js';
import { getBrowserClient } from './supabase/client';

// Auth state as a module-level external store (same pattern as useClientStore):
// one Supabase auth listener is shared app-wide, and useSyncExternalStore keeps it
// lint-clean (no set-state-in-effect). When Supabase isn't configured the store
// settles to { user: null, loading: false } so the UI just shows the open/guest path.

type AuthState = { user: User | null; loading: boolean };

const INITIAL: AuthState = { user: null, loading: true };
let state: AuthState = INITIAL;
const listeners = new Set<() => void>();
let started = false;

function emit(next: AuthState) {
  state = next;
  listeners.forEach((l) => l());
}

function ensureStarted() {
  if (started) return;
  started = true;
  const supabase = getBrowserClient();
  if (!supabase) {
    state = { user: null, loading: false };
    return;
  }
  supabase.auth.getSession().then(({ data }) => {
    emit({ user: data.session?.user ?? null, loading: false });
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    emit({ user: session?.user ?? null, loading: false });
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
    signOut: async () => {
      const supabase = getBrowserClient();
      await supabase?.auth.signOut();
    },
  };
}

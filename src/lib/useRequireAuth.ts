'use client';

import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { isSupabaseConfigured } from './supabase/config';
import { toast } from './toastBus';

/**
 * "Reading is open; saving needs an account."
 *
 * Browsing the course, the guide and the reference material never asks for
 * anything. But a write — ticking a step, joining a team, editing a deliverable
 * or a GRC register — has to be attributable to a student, or it is lost the
 * moment they change device and it can't appear on the team page.
 *
 * This wraps a write instead of scattering `if (!user)` through every handler.
 * The important property is that it is a **pass-through when Supabase isn't
 * configured**: the offline/localStorage build (which is what CI exercises, and
 * what a self-study student may use) behaves exactly as before.
 *
 * Note this is a UX guard, not a security control. The real enforcement is
 * row-level security in Postgres: a signed-out client has no session, so its
 * writes are rejected by the database regardless of what the UI allows. This
 * exists so a student gets a clear prompt instead of a silent failure.
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const cloud = isSupabaseConfigured();

  /** True when a write would be rejected — i.e. cloud mode with no session. */
  const blocked = cloud && !loading && !user;

  /**
   * Run `write` if it can succeed; otherwise prompt and return false.
   * `what` completes the sentence "Sign in to …" — keep it short and concrete.
   */
  const guard = useCallback(
    (what: string, write: () => void): boolean => {
      if (!cloud || user) {
        write();
        return true;
      }
      // Still resolving the session: refuse rather than write into a void, but
      // say something that won't read as an error if it settles a moment later.
      if (loading) {
        toast({ message: 'Just a moment — still checking your sign-in…', variant: 'info' });
        return false;
      }
      toast({
        message: `Sign in to ${what}. Your work is saved to your account so it follows you between devices.`,
        variant: 'warning',
        duration: 6000,
      });
      return false;
    },
    [cloud, user, loading]
  );

  return { guard, blocked, signedIn: !!user, cloud };
}

'use client';

import { useState } from 'react';
import { Lock, LogOut, ShieldAlert } from 'lucide-react';
import { Button } from './ui/Button';
import { AuthCardSkeleton } from './ui/Skeletons';
import { SignInPanel } from './auth/SignInPanel';
import { useInstructorAuth } from '@/lib/useInstructorAuth';
import { useUserSync } from '@/lib/useUserSync';

/**
 * R85: content authoring (the Studio home and course editor) is admin-only in
 * cloud mode; the cohort dashboard stays open to any instructor. Rendered
 * INSIDE InstructorGate (the layout applies that one), so this only asks the
 * one extra question — an instructor at an admin door learns which key is
 * missing instead of getting a generic lock.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const auth = useInstructorAuth();
  if (!auth.ready) return <AuthCardSkeleton />;
  if (!auth.isAdmin) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-16 text-center">
        <div className="mx-auto inline-flex rounded-full bg-panel-2 p-3 text-muted">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-3 text-2xl font-bold text-ink">Admin only</h1>
        <p className="text-sm text-muted">
          Editing course content needs the <strong>admin</strong> role. Your account has
          instructor access — the cohort dashboard is yours — but content changes are made by
          an admin account. Ask yours to be granted{' '}
          <code className="rounded bg-panel-2 px-1 py-0.5 text-xs">is_admin</code>.
        </p>
      </div>
    );
  }
  return children;
}

export function InstructorGate({ children }: { children: React.ReactNode }) {
  const auth = useInstructorAuth();
  // R85: instructor pages used to be the only surface that never set the
  // current user id — so on a fresh load of /instructor, saving a grade,
  // resolving a report or setting a cohort date SILENTLY skipped the cloud
  // write. This one call is what makes every instructor write real.
  useUserSync();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  if (!auth.ready) return <AuthCardSkeleton />;

  if (!auth.unlocked) {
    // Real-auth mode: instructor access comes from the account's profile flag.
    if (auth.mode === 'auth') {
      return (
        <div className="mx-auto max-w-md space-y-5 py-16">
          <div className="text-center">
            <div className="mx-auto inline-flex rounded-full bg-panel-2 p-3 text-muted">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="mt-3 text-2xl font-bold text-ink">Instructor Studio</h1>
            <p className="mt-1 text-sm text-muted">
              {auth.signedIn
                ? 'Your account doesn’t have instructor access. Ask an administrator to enable it for you.'
                : 'Sign in with an instructor account to continue.'}
            </p>
          </div>
          {!auth.signedIn && <SignInPanel title="Sign in" subtitle="Instructor access is granted per account." />}
        </div>
      );
    }

    // Local/dev passcode mode with no passcode configured → the studio is
    // sealed, not open. There is nothing to type; the author enables it by
    // setting the env var (or by connecting Supabase for account-based access).
    if (!auth.passcodeSet) {
      return (
        <div className="mx-auto max-w-md space-y-5 py-16 text-center">
          <div className="mx-auto inline-flex rounded-full bg-panel-2 p-3 text-muted">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-bold text-ink">Instructor Studio</h1>
          <p className="mt-1 text-sm text-muted">
            The studio is locked. To enable it, set{' '}
            <code className="rounded bg-panel-2 px-1 py-0.5 text-xs">
              NEXT_PUBLIC_INSTRUCTOR_PASSCODE
            </code>{' '}
            for local use, or connect Supabase for account-based instructor access.
          </p>
        </div>
      );
    }

    // Local/dev passcode mode.
    return (
      <div className="mx-auto max-w-sm space-y-5 py-16">
        <div className="text-center">
          <div className="mx-auto inline-flex rounded-full bg-panel-2 p-3 text-muted">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-bold text-ink">Instructor Studio</h1>
          <p className="mt-1 text-sm text-muted">Enter the instructor passcode to continue.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!auth.unlock(code)) setError(true);
          }}
          className="space-y-3"
        >
          <input
            type="password"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(false);
            }}
            placeholder="Passcode"
            aria-invalid={error}
            className={`w-full rounded-lg border bg-panel px-4 py-2 text-ink ${
              error ? 'border-danger' : 'border-line'
            }`}
          />
          {error && <p className="text-sm text-danger">Incorrect passcode.</p>}
          <Button type="submit" className="w-full">Unlock</Button>
        </form>
        <p className="text-center text-xs text-muted">
          This is a temporary gate. Set Supabase env vars to switch to account-based instructor access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {auth.mode === 'passcode' && (
        <div className="flex justify-end">
          <button
            onClick={auth.lock}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
          >
            <LogOut className="h-4 w-4" /> Lock studio
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

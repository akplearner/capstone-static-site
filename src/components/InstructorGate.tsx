'use client';

import { useState } from 'react';
import { Lock, LogOut, ShieldAlert } from 'lucide-react';
import { Button } from './ui/Button';
import { SignInPanel } from './auth/SignInPanel';
import { useInstructorAuth } from '@/lib/useInstructorAuth';

export function InstructorGate({ children }: { children: React.ReactNode }) {
  const auth = useInstructorAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  if (!auth.ready) return <div className="py-12 text-center text-gray-500">Loading…</div>;

  if (!auth.unlocked) {
    // Real-auth mode: instructor access comes from the account's profile flag.
    if (auth.mode === 'auth') {
      return (
        <div className="mx-auto max-w-md space-y-5 py-16">
          <div className="text-center">
            <div className="mx-auto inline-flex rounded-full bg-gray-100 p-3 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Instructor Studio</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {auth.signedIn
                ? 'Your account doesn’t have instructor access. Ask an administrator to enable it for you.'
                : 'Sign in with an instructor account to continue.'}
            </p>
          </div>
          {!auth.signedIn && <SignInPanel title="Sign in" subtitle="Instructor access is granted per account." />}
        </div>
      );
    }

    // Local/dev passcode mode.
    return (
      <div className="mx-auto max-w-sm space-y-5 py-16">
        <div className="text-center">
          <div className="mx-auto inline-flex rounded-full bg-gray-100 p-3 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Instructor Studio</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Enter the instructor passcode to continue.</p>
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
            className={`w-full rounded-lg border bg-white px-4 py-2 dark:bg-gray-700 dark:text-white ${
              error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">Incorrect passcode.</p>}
          <Button type="submit" className="w-full">Unlock</Button>
        </form>
        <p className="text-center text-xs text-gray-400">
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
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Lock studio
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase/client';
import { isMethodEnabled } from '@/lib/supabase/config';
import { useAuth } from '@/lib/useAuth';

/**
 * Password reset — one route handling both halves of the flow.
 *
 * Request half: signed out, enter your email, Supabase sends a recovery link.
 * Update half: the recovery link goes through `/auth/callback`, which exchanges
 * the code for a session and lands you back here — now *with* a user — so the
 * same page can take the new password. Reusing the existing callback route means
 * no new redirect target to register in the Supabase allow-list.
 *
 * Only reachable when `password` is in NEXT_PUBLIC_AUTH_METHODS. It isn't by
 * default, and its only inbound link ("Forgot password?") is hidden with it — but
 * the route still resolves, so an old bookmark or an old recovery email would
 * otherwise land on a form that cannot work. Those get sent to /login instead.
 */
export default function ResetPage() {
  const supabase = getBrowserClient();
  const { user, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // After the hooks, never before — an early return above them would change the
  // hook call order between renders.
  if (!isMethodEnabled('password')) {
    return (
      <Shell title="Password sign-in is off">
        <p className="text-sm text-muted">
          This deployment doesn’t use passwords.{' '}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Go to sign in
          </Link>
          .
        </p>
      </Shell>
    );
  }

  if (!supabase) {
    return (
      <Shell title="Reset password">
        <p className="text-sm text-muted">Accounts aren’t configured on this deployment.</p>
      </Shell>
    );
  }

  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  const update = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(error.message);
    else setDone(true);
  };

  // A session here means they arrived via the recovery link, so ask for the new
  // password rather than emailing another link to someone already holding one.
  const inRecovery = !loading && !!user;

  return (
    <Shell title={inRecovery ? 'Choose a new password' : 'Reset your password'}>
      {done ? (
        <Notice ok>
          Password updated. <Link href="/dashboard" className="font-medium underline">Go to your dashboard</Link>.
        </Notice>
      ) : inRecovery ? (
        <form onSubmit={update} className="space-y-3">
          <label className="block">
            <span className="eyebrow-muted">New password</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink placeholder-muted focus:border-accent focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast hover:bg-accent-strong disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Update password
          </button>
        </form>
      ) : sent ? (
        <Notice ok>
          If an account exists for <span className="font-medium">{email}</span>, a reset link is on its way.
        </Notice>
      ) : (
        <form onSubmit={request} className="space-y-3">
          <p className="text-sm text-muted">
            Enter your email and we’ll send you a link to set a new password.
          </p>
          <label className="block">
            <span className="eyebrow-muted">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink placeholder-muted focus:border-accent focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast hover:bg-accent-strong disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Send reset link
          </button>
        </form>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-muted hover:text-ink hover:underline">Back to sign in</Link>
      </p>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-5 text-center text-2xl font-bold tracking-tight text-ink">{title}</h1>
      <div className="rounded-[var(--radius-card)] border border-line bg-panel p-6 shadow-[var(--shadow-card)]">
        {children}
      </div>
    </div>
  );
}

function Notice({ ok, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-line bg-panel-2 px-3 py-2 text-sm text-ink">
      {ok && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />}
      <span>{children}</span>
    </div>
  );
}

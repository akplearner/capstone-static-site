'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail } from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase/client';
import { GITHUB_OAUTH_ENABLED, GOOGLE_OAUTH_ENABLED } from '@/lib/supabase/config';

/**
 * The one sign-in/registration surface.
 *
 * Both the dedicated /login and /register pages and the contextual `SignInPanel`
 * render this, so the two can never drift into offering different providers or
 * disagreeing about what a password needs to be.
 *
 * Four ways in, deliberately: email + password is what people expect when told to
 * "register"; Google and GitHub are one click and suit a technical audience;
 * magic link is the fallback for anyone who has neither and won't make a password.
 *
 * Styling uses the design tokens (`--color-accent`, `--color-line`, …) rather than
 * hardcoded Tailwind palette classes, so this surface re-themes with the rest of
 * the app instead of being the one blue island in a red or purple course.
 */

type Mode = 'signin' | 'register';
type Busy = null | 'google' | 'github' | 'password' | 'magic';

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

/** Inlined because this lucide build ships no brand icons (verified: no `Github`
 *  export among its 5,951 names), and the Google mark above is already inline for
 *  the same reason. Single path, so it costs nothing. */
function GithubMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function AuthForm({
  mode,
  next,
  onSwitchMode,
}: {
  mode: Mode;
  /** Where to land after auth. Defaults to the current path. */
  next?: string;
  /** Rendered as links when omitted (the pages); panels can pass a handler. */
  onSwitchMode?: (mode: Mode) => void;
}) {
  const supabase = getBrowserClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  if (!supabase) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        Accounts aren’t configured on this deployment yet, so there’s nothing to sign in to. Your work
        is being saved locally on this device only.
      </div>
    );
  }

  const redirectTo = () => {
    const origin = window.location.origin;
    const back = next ?? window.location.pathname;
    return `${origin}/auth/callback?next=${encodeURIComponent(back)}`;
  };

  const oauth = async (provider: 'google' | 'github') => {
    setError(null);
    setBusy(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo() },
    });
    if (error) {
      setError(error.message);
      setBusy(null);
    }
    // On success the browser navigates away.
  };

  const withPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy('password');

    if (mode === 'register') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo() },
      });
      setBusy(null);
      if (error) return setError(error.message);
      // With "Confirm email" on, Supabase returns a user but no session — the
      // account exists but can't be used until the link is clicked. Saying so is
      // the difference between "nothing happened" and "go check your inbox".
      if (data.user && !data.session) {
        return setNotice(`Account created. Check ${email} for a confirmation link before signing in.`);
      }
      window.location.assign(next ?? '/dashboard');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(null);
    if (error) return setError(error.message);
    window.location.assign(next ?? '/dashboard');
  };

  const magicLink = async () => {
    if (!email) return setError('Enter your email address first.');
    setError(null);
    setNotice(null);
    setBusy('magic');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });
    setBusy(null);
    if (error) setError(error.message);
    else setMagicSent(true);
  };

  const anyOauth = GOOGLE_OAUTH_ENABLED || GITHUB_OAUTH_ENABLED;

  return (
    <div className="space-y-4">
      {anyOauth && (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {GOOGLE_OAUTH_ENABLED && (
              <button
                type="button"
                onClick={() => oauth('google')}
                disabled={!!busy}
                className="flex items-center justify-center gap-2 rounded-lg border border-line bg-panel px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-panel-2 disabled:opacity-60"
              >
                {busy === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
                Google
              </button>
            )}
            {GITHUB_OAUTH_ENABLED && (
              <button
                type="button"
                onClick={() => oauth('github')}
                disabled={!!busy}
                className="flex items-center justify-center gap-2 rounded-lg border border-line bg-panel px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-panel-2 disabled:opacity-60"
              >
                {busy === 'github' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GithubMark />}
                GitHub
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form onSubmit={withPassword} className="space-y-3">
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

        <label className="block">
          <span className="eyebrow-muted">Password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
            className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink placeholder-muted focus:border-accent focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={!!busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          {busy === 'password' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          {mode === 'register' ? 'Create account' : 'Sign in'}
        </button>
      </form>

      {/* Passwordless fallback — same email field, no second form to fill in. */}
      {magicSent ? (
        <div className="flex items-center gap-2 rounded-md border border-line bg-panel-2 px-3 py-2 text-sm text-ink">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
          Check <span className="font-medium">{email}</span> for a sign-in link.
        </div>
      ) : (
        <button
          type="button"
          onClick={magicLink}
          disabled={!!busy}
          className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-accent hover:underline disabled:opacity-60"
        >
          {busy === 'magic' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Email me a sign-in link instead
        </button>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-sm">
        {mode === 'signin' ? (
          <>
            <Switcher
              label="New here?"
              cta="Create an account"
              to="register"
              next={next}
              onSwitchMode={onSwitchMode}
            />
            <Link href="/auth/reset" className="text-muted hover:text-ink hover:underline">
              Forgot password?
            </Link>
          </>
        ) : (
          <Switcher
            label="Already have an account?"
            cta="Sign in"
            to="signin"
            next={next}
            onSwitchMode={onSwitchMode}
          />
        )}
      </div>

      {notice && (
        <div className="flex items-start gap-2 rounded-md border border-line bg-panel-2 px-3 py-2 text-sm text-ink">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {notice}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}
    </div>
  );
}

function Switcher({
  label,
  cta,
  to,
  next,
  onSwitchMode,
}: {
  label: string;
  cta: string;
  to: Mode;
  next?: string;
  onSwitchMode?: (mode: Mode) => void;
}) {
  const href = `/${to === 'register' ? 'register' : 'login'}${next ? `?next=${encodeURIComponent(next)}` : ''}`;
  return (
    <span className="text-muted">
      {label}{' '}
      {onSwitchMode ? (
        <button type="button" onClick={() => onSwitchMode(to)} className="font-medium text-accent hover:underline">
          {cta}
        </button>
      ) : (
        <Link href={href} className="font-medium text-accent hover:underline">
          {cta}
        </Link>
      )}
    </span>
  );
}

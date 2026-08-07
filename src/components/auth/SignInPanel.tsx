'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase/client';

// Sign-in entry: Google OAuth and passwordless magic-link email — the two
// providers enabled in the Supabase project. A provider is only offered here if
// it is actually enabled server-side; offering one that isn't produces an opaque
// error the moment a student clicks it, which is worse than not offering it.
// Rendered wherever a signed-out user tries to write. Browsing never shows this.

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

export function SignInPanel({
  title = 'Sign in to save your progress',
  subtitle = 'Your progress and your team’s forms are saved to your account so you can pick up on any device.',
  next,
}: {
  title?: string;
  subtitle?: string;
  /** Path to return to after auth (defaults to the current location). */
  next?: string;
}) {
  const supabase = getBrowserClient();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState<null | 'google' | 'email'>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If Supabase isn't configured, sign-in can't work — say so plainly rather than
  // showing dead buttons. (In configured deploys this never renders.)
  if (!supabase) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        Sign-in isn&apos;t configured yet. Your progress is being saved locally on this device.
      </div>
    );
  }

  const redirectTo = () => {
    const origin = window.location.origin;
    const back = next ?? window.location.pathname;
    return `${origin}/auth/callback?next=${encodeURIComponent(back)}`;
  };

  const oauth = async (provider: 'google') => {
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
    // On success the browser redirects away.
  };

  const magicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setBusy('email');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });
    setBusy(null);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-800 dark:bg-blue-900/15"
    >
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>

      <div className="mt-4">
        <button
          onClick={() => oauth('google')}
          disabled={!!busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {busy === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
          Continue with Google
        </button>
      </div>

      <div className="my-3 flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" /> or email me a link
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>

      {sent ? (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Check <span className="font-medium">{email}</span> for a sign-in link.
        </div>
      ) : (
        <form onSubmit={magicLink} className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={!!busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy === 'email' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Send link
          </button>
        </form>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
    </motion.div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

// The auth routes redirect here with `?auth_error=<reason>` when sign-in fails.
// Before this existed the parameter was written and read by nothing, so a student
// whose magic link had expired was dropped on the homepage with no explanation and
// no reason to think anything had gone wrong — they'd just appear signed out.

const REASONS: Record<string, string> = {
  // Fires for BOTH a stale magic link and a failed Google/GitHub code exchange
  // (see auth/callback/route.ts), so it must not name one method: on the default
  // Google-only deployment there are no magic links to talk about.
  expired:
    'That sign-in didn’t complete — the link had already been used or had expired. Please sign in again.',
  missing_code:
    'That sign-in link was incomplete. Open the most recent link in your email, and make sure your mail client didn’t truncate it.',
  missing_token:
    'That confirmation link was incomplete. Open the most recent link in your email, and make sure your mail client didn’t truncate it.',
  unconfigured:
    'Sign-in isn’t configured on this deployment yet, so your work is being saved on this device only.',
  // The provider refused before a session existed: Cancel on the consent
  // screen, signups disabled, or a GitHub account with no verified email.
  provider:
    'The sign-in provider didn’t complete your sign-in — this happens if you pressed Cancel, or your GitHub account has no verified email address. Please try again.',
  // PKCE verifier missing: sign-in started inside an in-app browser.
  browser:
    'Sign-in started in a different browser — this usually means the page was opened inside another app. Open the site in Chrome or Safari itself and sign in there.',
};

const FALLBACK = 'Sign-in didn’t complete. Please try again.';

export function AuthErrorBanner() {
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const value = new URLSearchParams(window.location.search).get('auth_error');
    if (!value) return;
    // One-shot sync from the URL on mount, mirroring the ?tab= handling in the
    // course page: the query string is an external system, read once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReason(value);
    // Drop the parameter so a refresh (or a shared URL) doesn't replay the error.
    const url = new URL(window.location.href);
    url.searchParams.delete('auth_error');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }, []);

  if (!reason) return null;

  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-2 rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm text-ink"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
      <span className="flex-1">{REASONS[reason] ?? FALLBACK}</span>
      <button
        type="button"
        onClick={() => setReason(null)}
        aria-label="Dismiss"
        className="shrink-0 rounded p-0.5 text-danger hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

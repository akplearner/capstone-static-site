// Single source of truth for Supabase connection config.
//
// The app must keep working with ZERO Supabase env vars (pure localStorage mode),
// so nothing here throws at import time. `isSupabaseConfigured()` is the switch the
// data seam (src/lib/data/index.ts), the auth hook, and the proxy all consult before
// touching Supabase. When it returns false the app behaves exactly as it did before
// auth was added.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

let warned = false;
function isValidUrl(u: string): boolean {
  try {
    const parsed = new URL(u);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * The switch the data seam, auth hook and proxy consult before touching Supabase.
 * Requires BOTH env vars AND a well-formed URL — a malformed NEXT_PUBLIC_SUPABASE_URL
 * would otherwise throw late inside createBrowserClient with no nearby boundary. When
 * the URL is malformed we fall back to localStorage mode and warn once.
 */
export function isSupabaseConfigured(): boolean {
  if (SUPABASE_URL.length === 0 || SUPABASE_ANON_KEY.length < 10) return false;
  if (!isValidUrl(SUPABASE_URL)) {
    if (!warned) {
      warned = true;
      console.warn(
        'NEXT_PUBLIC_SUPABASE_URL is not a valid URL — running in localStorage mode. Fix it to enable accounts.'
      );
    }
    return false;
  }
  return true;
}

/**
 * Which sign-in methods the UI may offer.
 *
 * ONE variable, because the alternative was four booleans that all had to be set
 * to `false` to reach the intended setup — more configuration to get less. The
 * default (`google`) is the shipped setup, so the happy path needs no env var at
 * all:
 *
 *   NEXT_PUBLIC_AUTH_METHODS=google              # default — Google SSO only
 *   NEXT_PUBLIC_AUTH_METHODS=google,magic        # add emailed sign-in links
 *   NEXT_PUBLIC_AUTH_METHODS=google,github,magic,password
 *
 * Google is the default because it is the only method that needs no email
 * delivery at all: Google authenticates the user and hands back a verified
 * address, so there is no SMTP, no confirmation step and no rate limit anywhere
 * in the system. `magic` and `password` both depend on Supabase sending mail.
 *
 * ⚠️ This controls what is OFFERED, not what is POSSIBLE. Supabase's Email
 * provider stays live in the API until you switch it off in the dashboard — so
 * turning `password` off here hides the form but does not close the door. Both
 * halves are in SUPABASE_SETUP.md, in that order.
 *
 * A method is only worth offering if it is actually enabled in Supabase:
 * offering one that isn't produces an opaque error the instant a student clicks
 * it, which is worse than not offering it at all.
 */
export type AuthMethod = 'google' | 'github' | 'magic' | 'password';

const ALL_METHODS: readonly AuthMethod[] = ['google', 'github', 'magic', 'password'];
const DEFAULT_METHODS: readonly AuthMethod[] = ['google'];

function parseAuthMethods(raw: string | undefined): readonly AuthMethod[] {
  const named = (raw ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is AuthMethod => (ALL_METHODS as readonly string[]).includes(s));
  // Unknown entries are ignored, and a value that names nothing valid falls back
  // to the default. An auth screen with zero buttons is never the right answer to
  // a typo — it would lock everyone out of a working deployment.
  return named.length > 0 ? named : DEFAULT_METHODS;
}

export const AUTH_METHODS = parseAuthMethods(process.env.NEXT_PUBLIC_AUTH_METHODS);

export function isMethodEnabled(method: AuthMethod): boolean {
  return AUTH_METHODS.includes(method);
}

/** True when any method needs the shared email field (magic link or password). */
export function needsEmailField(): boolean {
  return isMethodEnabled('magic') || isMethodEnabled('password');
}

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
 * Which OAuth providers the sign-in UI may offer.
 *
 * A provider button is only worth showing if the provider is actually enabled in
 * the Supabase dashboard: offering one that isn't produces an opaque error the
 * instant a student clicks it, which is worse than not offering it at all. These
 * default to ON because the launch checklist enables both — set the env var to
 * 'false' to hide a button you haven't turned on yet.
 * See docs/OPERATIONS.md.
 */
function flagEnabled(value: string | undefined): boolean {
  return value !== 'false' && value !== '0';
}

export const GOOGLE_OAUTH_ENABLED = flagEnabled(process.env.NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH);
export const GITHUB_OAUTH_ENABLED = flagEnabled(process.env.NEXT_PUBLIC_ENABLE_GITHUB_OAUTH);

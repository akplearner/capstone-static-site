// Single source of truth for Supabase connection config.
//
// The app must keep working with ZERO Supabase env vars (pure localStorage mode),
// so nothing here throws at import time. `isSupabaseConfigured()` is the switch the
// data seam (src/lib/data/index.ts), the auth hook, and the proxy all consult before
// touching Supabase. When it returns false the app behaves exactly as it did before
// auth was added.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

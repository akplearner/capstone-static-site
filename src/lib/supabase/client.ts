'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config';

// Browser Supabase client. Memoized so the single auth/realtime listener is shared
// across the app (creating one per call would duplicate subscriptions).
//
// Returns null when Supabase isn't configured, so every caller must null-check and
// fall back to the localStorage path.
let cached: SupabaseClient | null | undefined;

export function getBrowserClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  cached = isSupabaseConfigured()
    ? createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
  return cached;
}

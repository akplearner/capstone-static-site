import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config';

// Server Supabase client for Route Handlers and Server Components.
//
// Next.js 16: `cookies()` is async (node_modules/next/dist/docs/.../cookies.md), so
// this factory is async. Cookie writes only succeed inside a Route Handler or Server
// Action; during a Server Component render `set` throws, so `setAll` swallows it —
// src/proxy.ts refreshes the session cookie instead.
export async function createServerSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render — ignore; the proxy handles refresh.
        }
      },
    },
  });
}

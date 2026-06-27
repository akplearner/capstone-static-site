import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/supabase/config';

// Next.js 16 renamed `middleware` to `proxy` (node_modules/next/dist/docs/.../proxy.md).
// This refreshes the Supabase auth session cookie on navigation so server reads see a
// valid session. It must NOT export a `runtime` (proxy is Node-only; setting runtime
// throws) and must NOT gate routes — browsing stays open; RLS + UI gate writes.
//
// When Supabase isn't configured the proxy is a pass-through, so local dev without env
// vars behaves exactly as before.
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Touch the session so @supabase/ssr can rotate the cookie if needed.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on everything except static assets and image files.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};

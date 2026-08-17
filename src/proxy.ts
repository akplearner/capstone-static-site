import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/supabase/config';
import { isProtected } from '@/lib/routeGate';

// Next.js 16 renamed `middleware` to `proxy` (node_modules/next/dist/docs/.../proxy.md).
// It must NOT export a `runtime` (proxy is Node-only; setting runtime throws).
//
// Two jobs:
//  1. Refresh the Supabase auth session cookie on navigation so server reads see a
//     valid session.
//  2. Gate the app. Marketing surfaces (`/`, `/explore`) and each course's
//     DASHBOARD (`/courses/<id>`) stay public and indexable — a prospective
//     student has to be able to see what they'd be enrolling in. Course material
//     (everything below the dashboard) and anything holding a learner's own work
//     requires an account. The rules live in `lib/routeGate.ts`.
//
// This is authentication only, and only the outer of two layers:
//
//   here          is there a session at all?      server-side, unskippable
//   in-page       is this user enrolled HERE?     `useMember` + `CourseEnrolGate`
//
// Enrolment is deliberately not checked here: it would put a database round trip
// in front of every navigation, and it would be redundant, since RLS already
// returns zero rows to a non-member. `useRequireAuth` still guards writes
// client-side as defence in depth, but a redirect here is the one a user can't
// skip by disabling JavaScript.
//
// When Supabase isn't configured the proxy is a pass-through and NOTHING is gated:
// that is the offline/demo mode the app is built around, and it keeps local dev and
// CI (which build with no env vars) working exactly as before.

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

  // Touch the session so @supabase/ssr can rotate the cookie if needed. The same
  // call gives us the identity the gate below needs, so gating costs no extra
  // round trip. `getUser()` (not `getSession()`) is deliberate: it validates the
  // token with the auth server rather than trusting a cookie the client could forge.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  if (!user && isProtected(pathname)) {
    const login = new URL('/login', request.url);
    // Send them back where they were aiming once they're in.
    login.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  // Already signed in and staring at the sign-in form: skip it.
  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  // Run on everything except static assets and image files.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};

import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/safeRedirect';

// OAuth (Google) and PKCE magic-link redirect target. Supabase appends
// `?code=...`; we exchange it for a session cookie, then return the user where they
// were (`next`). Next 16 Route Handler: Web Request in, Response out.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // `next` comes from the URL, so it must be sanitised before we redirect to it.
  const next = safeNextPath(searchParams.get('next'), '/dashboard');

  // The provider said no BEFORE any code existed: the student pressed Cancel on
  // Google, signups are disabled, GitHub has no verified email, the profile
  // trigger failed. These all used to fall through to `missing_code`, whose
  // banner talks about email links — nonsense on an OAuth deployment — and
  // nothing was logged, so the operator's logs showed a healthy site (R82).
  const providerError = searchParams.get('error_description') ?? searchParams.get('error');
  if (providerError) {
    console.error('[auth] provider returned an error at the callback:', providerError);
    return NextResponse.redirect(`${origin}/?auth_error=provider`);
  }

  if (code) {
    const supabase = await createServerSupabase();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}${next}`);
      console.error('[auth] exchangeCodeForSession failed:', error.message);
      // A missing PKCE verifier means sign-in started in a different browser —
      // almost always an in-app browser (a link opened inside another app).
      if (/code verifier/i.test(error.message)) {
        return NextResponse.redirect(`${origin}/?auth_error=browser`);
      }
      // Otherwise overwhelmingly an expired or already-used link. Pass a reason
      // so the homepage can say so instead of silently dropping the student.
      return NextResponse.redirect(`${origin}/?auth_error=expired`);
    }
    return NextResponse.redirect(`${origin}/?auth_error=unconfigured`);
  }
  return NextResponse.redirect(`${origin}/?auth_error=missing_code`);
}

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
  const next = safeNextPath(searchParams.get('next'));

  if (code) {
    const supabase = await createServerSupabase();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}${next}`);
      // Overwhelmingly this is an expired or already-used link. Pass a reason so
      // the homepage can say so instead of silently dropping the student there.
      return NextResponse.redirect(`${origin}/?auth_error=expired`);
    }
    return NextResponse.redirect(`${origin}/?auth_error=unconfigured`);
  }
  return NextResponse.redirect(`${origin}/?auth_error=missing_code`);
}

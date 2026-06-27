import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

// OAuth (Google/GitHub) and PKCE magic-link redirect target. Supabase appends
// `?code=...`; we exchange it for a session cookie, then return the user where they
// were (`next`). Next 16 Route Handler: Web Request in, Response out.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createServerSupabase();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/?auth_error=1`);
}

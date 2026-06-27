import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

// Magic-link email confirmation via the token-hash flow (`?token_hash=...&type=...`),
// the alternative to the PKCE `?code=` flow handled in callback/route.ts. Supabase's
// email template can point at either; supporting both keeps sign-in robust.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  if (token_hash && type) {
    const supabase = await createServerSupabase();
    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash });
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/?auth_error=1`);
}

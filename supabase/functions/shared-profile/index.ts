// shared-profile — serves one live candidate link by its token (R114).
//
// Whoever holds the link reads it, signed in or not, and that is the point of
// a link. The platform's JWT check can stay on (the default): a signed-out
// reader's request carries the project's public key, which the check accepts,
// so no flag is needed at deploy time. The token is 256 random bits;
// the function looks it up by its SHA-256 and returns the frozen copy only
// while the link is unrevoked and unexpired. An unknown, revoked or expired
// token gets the same 404 body, so a link's history cannot be probed, and the
// token is never logged. Responses are not cached.
//
// DEPLOY (you, once): paste supabase/dashboard/shared-profile.ts into the
// Supabase dashboard (SUPABASE_SETUP.md), or run
// `supabase functions deploy shared-profile`. No secrets (_shared/env.ts).

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json, preflight } from '../_shared/cors.ts';
import { projectKey } from '../_shared/env.ts';
import { TOKEN_RE, sha256HexText } from '../_shared/shareGuard.ts';

const NOT_AVAILABLE = { error: 'not-available' };
const NO_STORE = { 'Cache-Control': 'no-store' };
const env = (name: string) => Deno.env.get(name);

Deno.serve(async (req: Request) => {
  const origin = env('APP_ORIGIN');
  const pre = preflight(req, origin);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method-not-allowed' }, 405, req, origin);

  const body = await req.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token : '';
  if (!TOKEN_RE.test(token)) return json(NOT_AVAILABLE, 404, req, origin, NO_STORE);

  const url = env('SUPABASE_URL');
  const serviceRole = projectKey('secret', env);
  if (!url || !serviceRole) return json({ error: 'not-configured' }, 503, req, origin, NO_STORE);
  const admin = createClient(url, serviceRole);
  const { data } = await admin
    .from('profile_shares')
    .select('kind, snapshot, measured_against, created_at, expires_at')
    .eq('token_hash', await sha256HexText(token))
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (!data) return json(NOT_AVAILABLE, 404, req, origin, NO_STORE);
  return json(
    { kind: data.kind, snapshot: data.snapshot, measuredAgainst: data.measured_against, createdAt: data.created_at, expiresAt: data.expires_at },
    200,
    req,
    origin,
    NO_STORE
  );
});

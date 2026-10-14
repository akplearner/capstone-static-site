// shared-profile — serves one live candidate link by its token (R114).
//
// Deployed WITHOUT JWT verification: whoever holds the link reads it, signed
// in or not, and that is the point of a link. The token is 256 random bits;
// the function looks it up by its SHA-256 and returns the frozen copy only
// while the link is unrevoked and unexpired. An unknown, revoked or expired
// token gets the same 404 body, so a link's history cannot be probed, and the
// token is never logged. Responses are not cached.
//
// DEPLOY (you, once):
//   supabase functions deploy shared-profile --no-verify-jwt

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json, preflight } from '../_shared/cors.ts';
import { TOKEN_RE, sha256HexText } from '../_shared/shareGuard.ts';

const NOT_AVAILABLE = { error: 'not-available' };
const NO_STORE = { 'Cache-Control': 'no-store' };

Deno.serve(async (req: Request) => {
  const origin = Deno.env.get('APP_ORIGIN');
  const pre = preflight(req, origin);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method-not-allowed' }, 405, req, origin);

  const body = await req.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token : '';
  if (!TOKEN_RE.test(token)) return json(NOT_AVAILABLE, 404, req, origin, NO_STORE);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SERVICE_ROLE_KEY')!);
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

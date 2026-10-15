// share — creates an expiring, revocable link to a frozen copy of the
// member's portfolio export or unsigned credential (R114).
//
// The caller comes from their own token, never the body. They must hold the
// share-employer consent (the latest consent_grants row says granted). The
// copy must be one of the two published shapes, carry no identity and fit in
// 256 KB (_shared/shareGuard.ts); a profile's subject is set here to the
// member's display name, never the email. The token is 32 random bytes,
// returned once; only its SHA-256 is stored, so nobody, the platform
// included, can rebuild a lost link. The member revokes or deletes it from
// the account page; it expires on its own after 7, 30 or 90 days.
//
// DEPLOY (you, once): paste supabase/dashboard/share.ts into the Supabase
// dashboard (SUPABASE_SETUP.md), or run `supabase functions deploy share`.
// No secrets (_shared/env.ts); APP_ORIGIN is optional.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json, preflight } from '../_shared/cors.ts';
import { projectKey } from '../_shared/env.ts';
import { identityLeaks, newToken, sha256HexText, shareProblem, withSubject, type ShareRequest } from '../_shared/shareGuard.ts';

const env = (name: string) => Deno.env.get(name);

Deno.serve(async (req: Request) => {
  const origin = env('APP_ORIGIN');
  const pre = preflight(req, origin);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method-not-allowed' }, 405, req, origin);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'missing-token' }, 401, req, origin);

  const url = env('SUPABASE_URL');
  const anonKey = projectKey('public', env);
  const serviceRole = projectKey('secret', env);
  if (!url || !anonKey || !serviceRole) return json({ error: 'not-configured' }, 503, req, origin);
  const asCaller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const {
    data: { user },
  } = await asCaller.auth.getUser();
  if (!user) return json({ error: 'invalid-session' }, 401, req, origin);

  const body = await req.json().catch(() => null);
  const problem = shareProblem(body);
  if (problem) return json({ error: problem }, problem === 'too-large' ? 413 : 400, req, origin);
  const input = body as ShareRequest;

  const admin = createClient(url, serviceRole);
  const { data: granted, error: consentError } = await admin.rpc('has_consent', { u: user.id, g: 'share-employer' });
  if (consentError) return json({ error: 'share-unavailable' }, 503, req, origin);
  if (granted !== true) return json({ error: 'consent-required' }, 403, req, origin);

  let snapshot = input.snapshot;
  if (input.kind === 'profile') {
    const { data: profile } = await admin.from('profiles').select('display_name').eq('id', user.id).maybeSingle();
    snapshot = withSubject(snapshot, String(profile?.display_name ?? '').trim() || 'Capstone Quarry member');
    if (identityLeaks(snapshot).length) return json({ error: 'identity-in-snapshot' }, 400, req, origin);
  }

  // One clock for both ends, so a 90-day link meets the table's 90-day check exactly.
  const now = Date.now();
  const token = newToken();
  const { data, error } = await admin
    .from('profile_shares')
    .insert({
      user_id: user.id,
      token_hash: await sha256HexText(token),
      kind: input.kind,
      label: input.label,
      snapshot,
      measured_against: input.measuredAgainst ?? '',
      created_at: new Date(now).toISOString(),
      expires_at: new Date(now + input.days * 86_400_000).toISOString(),
    })
    .select('id, expires_at')
    .single();
  if (error || !data) return json({ error: 'share-failed' }, 500, req, origin);
  return json({ id: data.id, token, expiresAt: data.expires_at }, 200, req, origin, { 'Cache-Control': 'no-store' });
});

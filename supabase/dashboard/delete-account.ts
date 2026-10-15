// delete-account: paste-ready copy for the Supabase dashboard. GENERATED, DO NOT EDIT.
//
// Built from supabase/functions/delete-account/index.ts, with the shared helpers it
// imports copied in, by `npm run functions:dashboard`. To deploy it without
// the CLI: Supabase → Edge Functions → Deploy a new function → Via Editor;
// replace everything in the editor with this whole file; name the function
// exactly `delete-account` BEFORE clicking Deploy function: the name becomes its
// address (…/functions/v1/delete-account), and renaming it later changes only the
// label. No secrets to set, and JWT verification stays on. SUPABASE_SETUP.md
// has the steps.

// delete-account — removes the caller's auth identity.
//
// WHY THIS EXISTS: deleting a row from `auth.users` requires the service-role
// key, and that key must never be shipped to a browser. The account page already
// deletes every application row using the user's own credentials (RLS scopes each
// delete to them); this function does the one step they cannot do themselves.
//
// It deletes ONLY the caller. The user id comes from verifying the caller's JWT
// server-side — never from the request body — so a valid token for account A can
// never be used to delete account B.
//
// DEPLOY (you, once): paste supabase/dashboard/delete-account.ts into the
// Supabase dashboard (SUPABASE_SETUP.md), or run
// `supabase functions deploy delete-account`. No secrets: Supabase gives every
// function the project's URL and keys, the service-role one included
// (_shared/env.ts), and it never leaves the server.
// The function is invoked from src/app/account/page.tsx. Until it is deployed the
// account page tells the user their data was removed but their login was not,
// which is the truth — it does not claim success it didn't achieve.

import { createClient } from 'jsr:@supabase/supabase-js@2';
// R113: answer the browser preflight, and carry the CORS headers on every reply.
// ─── supabase/functions/_shared/cors.ts, copied in ────────────────────
// cors.ts — the browser preflight every function must answer (R113).
//
// `supabase.functions.invoke` from the app sends an OPTIONS preflight before
// the POST; a function that answers it with 405 fails in the browser before
// it runs. Pure: no Deno API here, so it is unit-tested anywhere. The caller
// passes the configured app origin (`APP_ORIGIN`); without one the request's
// own origin is echoed, which is safe because every function authenticates
// by the caller's bearer token, never by a cookie.

export const CORS_ALLOW_HEADERS = 'authorization, apikey, content-type, x-client-info';

export function corsHeaders(requestOrigin: string | null, allowedOrigin?: string): Record<string, string> {
  const origin = allowedOrigin && allowedOrigin.trim() !== '' ? allowedOrigin.trim() : requestOrigin ?? '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': CORS_ALLOW_HEADERS,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

/** The 204 answer to a preflight, or null for any other method. */
export function preflight(req: Request, allowedOrigin?: string): Response | null {
  if (req.method !== 'OPTIONS') return null;
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('Origin'), allowedOrigin) });
}

/** A JSON response that carries the CORS headers (and any extra headers, such as Cache-Control). */
export function json(body: unknown, status: number, req: Request, allowedOrigin?: string, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req.headers.get('Origin'), allowedOrigin), ...extra },
  });
}
// ─── end of supabase/functions/_shared/cors.ts ────────────────────
// ─── supabase/functions/_shared/env.ts, copied in ────────────────────
// env.ts — the project's own keys, which Supabase gives every function (R115).
//
// No secret has to be set for them, so a function deploys from the dashboard
// by pasting one file. Hosted functions receive the new keys as JSON
// dictionaries (`SUPABASE_SECRET_KEYS`, `SUPABASE_PUBLISHABLE_KEYS`; the
// `default` entry is the project's key) and, while a project keeps them, the
// legacy `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY`. A project set up
// with an earlier version of the guide may also hold a `SERVICE_ROLE_KEY`
// secret; it is read last. Pure: the caller passes the lookup
// (`(name) => Deno.env.get(name)`), so it is unit-tested anywhere.

export type KeyKind = 'secret' | 'public';

function dictionaryDefault(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const key = (JSON.parse(raw) as Record<string, unknown> | null)?.default;
    return typeof key === 'string' && key !== '' ? key : null;
  } catch {
    // Not JSON: fall through to the single-key names.
    return null;
  }
}

/** The project's key of one kind: the secret one bypasses RLS, the public one does not. Null when the environment holds none. */
export function projectKey(kind: KeyKind, get: (name: string) => string | undefined): string | null {
  const fromDictionary = dictionaryDefault(get(kind === 'secret' ? 'SUPABASE_SECRET_KEYS' : 'SUPABASE_PUBLISHABLE_KEYS'));
  if (fromDictionary) return fromDictionary;
  for (const name of kind === 'secret' ? ['SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY'] : ['SUPABASE_ANON_KEY']) {
    const value = get(name);
    if (value) return value;
  }
  return null;
}
// ─── end of supabase/functions/_shared/env.ts ────────────────────

const env = (name: string) => Deno.env.get(name);

Deno.serve(async (req: Request) => {
  const origin = env('APP_ORIGIN');
  const pre = preflight(req, origin);
  if (pre) return pre;
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, req, origin);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Missing bearer token' }, 401, req, origin);
  }

  const url = env('SUPABASE_URL');
  const serviceRole = projectKey('secret', env);
  const anonKey = projectKey('public', env);
  if (!url || !serviceRole || !anonKey) {
    return json({ error: 'not-configured' }, 503, req, origin);
  }

  // Verify the caller with their OWN token. This is the identity we delete —
  // taking a user id from the request body instead would be an account-takeover
  // primitive: any signed-in user could delete anyone.
  const asCaller = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: whoami,
  } = await asCaller.auth.getUser();

  if (whoami || !user) {
    return json({ error: 'Invalid session' }, 401, req, origin);
  }

  const admin = createClient(url, serviceRole);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return json({ error: error.message }, 500, req, origin);
  }

  return json({ deleted: user.id }, 200, req, origin);
});

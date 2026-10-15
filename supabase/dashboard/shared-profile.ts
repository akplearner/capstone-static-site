// shared-profile: paste-ready copy for the Supabase dashboard. GENERATED, DO NOT EDIT.
//
// Built from supabase/functions/shared-profile/index.ts, with the shared helpers it
// imports copied in, by `npm run functions:dashboard`. To deploy it without
// the CLI: Supabase → Edge Functions → Deploy a new function → Via Editor;
// replace everything in the editor with this whole file; name the function
// exactly `shared-profile`; click Deploy function. No secrets to set, and JWT
// verification stays on. SUPABASE_SETUP.md has the steps.

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
// ─── supabase/functions/_shared/shareGuard.ts, copied in ────────────────────
// shareGuard.ts — what a candidate link may carry, and its token (R114).
//
// A link serves a frozen copy of the member's portfolio export or unsigned
// credential to whoever holds it. The server cannot recompute the numbers,
// so its job is narrower: accept only those two shapes, keep identity out of
// the copy (no member, user or team id, no submitter, no email address in
// any key or value), cap the size, and make the token unguessable. The token
// is shown once; only its SHA-256 is stored. Pure: no Deno API here, so the
// app runs the same checks before it asks (src/lib/shares.ts).

export const SHARE_DAYS = [7, 30, 90] as const;
export const SHARE_MAX_BYTES = 256 * 1024;
export const LABEL_MAX = 60;
export const MEASURE_MAX = 120;
/** 32 random bytes, base64url, no padding. */
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
export const PROFILE_SCHEMA = 'capstone-member-profile/1';

const FORBIDDEN_KEYS = new Set(['memberId', 'userId', 'user_id', 'email', 'teamId', 'submittedBy']);
const EMAIL_RE = /[^\s@"'<>()]+@[^\s@"'<>()]+\.[a-z]{2,}/i;
const REQUEST_KEYS = new Set(['kind', 'days', 'label', 'measuredAgainst', 'snapshot']);

export type ShareKind = 'profile' | 'credential';

export interface ShareRequest {
  kind: ShareKind;
  days: (typeof SHARE_DAYS)[number];
  label: string;
  measuredAgainst?: string;
  snapshot: Record<string, unknown>;
}

/** Where the copy would name someone: a forbidden key, or an email-shaped key or value. */
export function identityLeaks(value: unknown, path = '$'): string[] {
  if (typeof value === 'string') return EMAIL_RE.test(value) ? [path] : [];
  if (Array.isArray(value)) return value.flatMap((v, i) => identityLeaks(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => [
      ...(FORBIDDEN_KEYS.has(k) || EMAIL_RE.test(k) ? [`${path}.${k}`] : []),
      ...identityLeaks(v, `${path}.${k}`),
    ]);
  }
  return [];
}

const byteLength = (s: string) => new TextEncoder().encode(s).length;
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Why a share request is refused, or null. Any field beyond the five is refused. */
export function shareProblem(body: unknown): string | null {
  if (!isObject(body)) return 'bad-request';
  if (Object.keys(body).some((k) => !REQUEST_KEYS.has(k))) return 'bad-request';
  if (body.kind !== 'profile' && body.kind !== 'credential') return 'bad-kind';
  if (!(SHARE_DAYS as readonly unknown[]).includes(body.days)) return 'bad-days';
  if (typeof body.label !== 'string' || body.label.length > LABEL_MAX) return 'bad-label';
  if (body.measuredAgainst !== undefined && (typeof body.measuredAgainst !== 'string' || body.measuredAgainst.length > MEASURE_MAX)) return 'bad-measure';
  const snap = body.snapshot;
  if (!isObject(snap)) return 'bad-snapshot';
  if (byteLength(JSON.stringify(snap)) > SHARE_MAX_BYTES) return 'too-large';
  if (body.kind === 'profile') {
    if (snap.schema !== PROFILE_SCHEMA || snap.signature !== null || !isObject(snap.subject) || typeof snap.subject.display !== 'string') return 'bad-snapshot';
  } else {
    if (!Array.isArray(snap.type) || !snap.type.includes('OpenBadgeCredential') || 'proof' in snap) return 'bad-snapshot';
  }
  if (identityLeaks(snap).length) return 'identity-in-snapshot';
  return null;
}

/** A profile copy under the member's display name: the server sets it, never the client. */
export function withSubject(snapshot: Record<string, unknown>, display: string): Record<string, unknown> {
  return { ...snapshot, subject: { display } };
}

/** 32 random bytes as base64url: 256 bits, so a link cannot be guessed. */
export function newToken(random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  let bin = '';
  for (const b of random(32)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256HexText(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
// ─── end of supabase/functions/_shared/shareGuard.ts ────────────────────

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

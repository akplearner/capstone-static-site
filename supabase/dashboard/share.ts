// share: paste-ready copy for the Supabase dashboard. GENERATED, DO NOT EDIT.
//
// Built from supabase/functions/share/index.ts, with the shared helpers it
// imports copied in, by `npm run functions:dashboard`. To deploy it without
// the CLI: Supabase → Edge Functions → Deploy a new function → Via Editor;
// replace everything in the editor with this whole file; name the function
// exactly `share` BEFORE clicking Deploy function: the name becomes its
// address (…/functions/v1/share), and renaming it later changes only the
// label. No secrets to set, and JWT verification stays on. SUPABASE_SETUP.md
// has the steps.

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
// No secrets (_shared/env.ts). APP_ORIGIN is required (R135, _shared/cors.ts).
// R135: at most SHARE_MAX_LIVE live links per member (_shared/limits.ts).

import { createClient } from 'jsr:@supabase/supabase-js@2';
// ─── supabase/functions/_shared/cors.ts, copied in ────────────────────
// cors.ts — the browser preflight every function must answer (R113), and the
// origin check that answers it (R135).
//
// `supabase.functions.invoke` from the app sends an OPTIONS preflight before
// the POST; a function that answers it with 405 fails in the browser before
// it runs. Pure: no Deno API here, so it is unit-tested anywhere.
//
// R135: the configured app origin (`APP_ORIGIN`) is the ONLY origin a browser
// may call from. Until R135 an unset APP_ORIGIN echoed the request's own
// origin, which let any site a signed-in member visited call the functions
// with that member's token (a page cannot read the token, but it can be
// handed one by a careless integration). Now an unset APP_ORIGIN, or an
// origin that is not it, is refused with 403 and one log line — fail closed.
// A request with no Origin header (a server, curl, the Supabase CLI) is not a
// browser; the bearer token alone decides it, as before.

export const CORS_ALLOW_HEADERS = 'authorization, apikey, content-type, x-client-info';

function allowed(allowedOrigin?: string): string {
  return (allowedOrigin ?? '').trim();
}

/** The CORS headers. `Access-Control-Allow-Origin` is present only for the configured origin; nothing is echoed. */
export function corsHeaders(requestOrigin: string | null, allowedOrigin?: string): Record<string, string> {
  const origin = allowed(allowedOrigin);
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': CORS_ALLOW_HEADERS,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
  if (origin && requestOrigin === origin) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

/** Why a browser request is refused, or null when it may proceed. */
export function originProblem(requestOrigin: string | null, allowedOrigin?: string): 'app-origin-unset' | 'origin-not-allowed' | null {
  if (!requestOrigin) return null;
  const origin = allowed(allowedOrigin);
  if (!origin) return 'app-origin-unset';
  return requestOrigin === origin ? null : 'origin-not-allowed';
}

/**
 * The answer a request gets before the function runs: 403 for a browser origin
 * that is not the configured one (or when none is configured), 204 for an
 * allowed preflight, null for any request that may proceed.
 */
export function preflight(req: Request, allowedOrigin?: string): Response | null {
  const requestOrigin = req.headers.get('Origin');
  const problem = originProblem(requestOrigin, allowedOrigin);
  if (problem) {
    console.warn(problem === 'app-origin-unset' ? 'APP_ORIGIN is not set: browser calls are refused' : `origin refused: ${requestOrigin}`);
    return json({ error: problem }, 403, req, allowedOrigin);
  }
  if (req.method !== 'OPTIONS') return null;
  return new Response(null, { status: 204, headers: corsHeaders(requestOrigin, allowedOrigin) });
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
// ─── supabase/functions/_shared/limits.ts, copied in ────────────────────
// limits.ts — the per-member caps the functions enforce (R135). Pure, no imports.
//
// An open-sign-up platform has to assume one account will try to make a
// thousand links, a stamp a second, or an email per click. The database caps
// the tables it owns (0023); these are the caps on what the functions mint or
// send. Each is counted by the database and compared here, so the number sits
// in one place and a test can read it.

/** Live (unexpired, unrevoked) candidate links one member may hold. */
export const SHARE_MAX_LIVE = 20;
/** Verification stamps one member may be issued in an hour. */
export const STAMPS_PER_HOUR = 120;
/** Report emails one member may cause in a day. */
export const NOTIFY_PER_DAY = 10;

/** True when a count (as PostgREST returns it: possibly null) has reached the cap. */
export function overCap(count: number | null | undefined, cap: number): boolean {
  return (count ?? 0) >= cap;
}

/** ISO time `ms` before `nowMs`, for a `gt('created_at', …)` filter. */
export function sinceIso(nowMs: number, ms: number): string {
  return new Date(nowMs - ms).toISOString();
}

/** One line of untrusted text for an email: no line breaks, capped. */
export function emailLine(v: unknown, cap: number): string {
  return String(v ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, cap);
}

/**
 * The report email, as a fixed template. It names who, what kind, which task
 * and course; it never carries the note — the dashboard has it, and an email
 * body that quotes a free-text field is a way to send arbitrary content.
 */
export function notifyMessage(p: { who: string; kind: string; task: string; course: string }): { subject: string; text: string } {
  const who = emailLine(p.who, 80) || 'A member';
  const kind = emailLine(p.kind, 20) || 'question';
  const task = emailLine(p.task, 80);
  const course = emailLine(p.course, 60);
  return {
    subject: `[${course}] task issue: ${kind} on ${task}`,
    text: `${who} reported a ${kind} issue on task ${task} (${course}).\n\nOpen the cohort dashboard to read the note and resolve it.`,
  };
}
// ─── end of supabase/functions/_shared/limits.ts ────────────────────
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
export const PROFILE_SCHEMA = 'capstone-member-profile/3';

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
  // R135: a member holds at most SHARE_MAX_LIVE live links; revoking or expiry frees a slot.
  const { count: live, error: countError } = await admin
    .from('profile_shares')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .gt('expires_at', new Date(now).toISOString());
  if (countError) return json({ error: 'share-unavailable' }, 503, req, origin);
  if (overCap(live, SHARE_MAX_LIVE)) return json({ error: 'too-many-links', max: SHARE_MAX_LIVE }, 429, req, origin);
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

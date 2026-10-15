// stamp: paste-ready copy for the Supabase dashboard. GENERATED, DO NOT EDIT.
//
// Built from supabase/functions/stamp/index.ts, with the shared helpers it
// imports copied in, by `npm run functions:dashboard`. To deploy it without
// the CLI: Supabase → Edge Functions → Deploy a new function → Via Editor;
// replace everything in the editor with this whole file; name the function
// exactly `stamp`; click Deploy function. No secrets to set, and JWT
// verification stays on. SUPABASE_SETUP.md has the steps.

// stamp — issues the short-lived verification stamp a member echoes into
// their output for one task (R113).
//
// The stamp has the client stamp's shape (CQ- and six symbols) but is random,
// lives 20 minutes, belongs to the caller, the course and the task, and is
// recorded here so the receipt function can recognise it. A live stamp with
// at least five minutes left is handed out again, so two tabs agree. The
// caller's identity comes from their own token, never from the body. Without
// this function deployed the app falls back to the client stamp and says
// nothing about receipts.
//
// DEPLOY (you, once): paste supabase/dashboard/stamp.ts into the Supabase
// dashboard (SUPABASE_SETUP.md, "Deploy the server functions from your
// browser"), or run `supabase functions deploy stamp`. No secrets: Supabase
// gives every function the project's URL and keys (_shared/env.ts). The
// APP_ORIGIN secret is optional (_shared/cors.ts).

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
// ─── supabase/functions/_shared/stampCodec.ts, copied in ────────────────────
// stampCodec.ts — the server-issued verification stamp and the receipt rules (R113).
//
// A stamp has the same shape as the client's FNV stamp (`taskToken` in
// src/lib/evidenceLedger.ts): `CQ-` and six characters from an alphabet with
// no look-alike letters or digits, so every surface that prints or matches a
// stamp keeps working. The server's stamp is random, short-lived and tied to
// one member, course and task; a receipt records that it came back matched
// for one step. The paste itself never reaches the server: only its SHA-256
// and the token counts do. A receipt records the stamp, not the machine.
// Pure: no Deno API here, so it is unit-tested anywhere.

export const STAMP_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
// Exactly the alphabet: no I, L, O or U, no 0 or 1 (the SQL check in 0014 uses the same class).
export const STAMP_RE = /^CQ-[A-HJKMNP-TV-Z2-9]{6}$/;
/** A stamp lives this long; a live one with at least the reuse margin left is handed out again. */
export const STAMP_MINUTES = 20;
export const STAMP_REUSE_MINUTES = 5;

export const ID_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
export const SHA256_RE = /^[0-9a-f]{64}$/;

/** Six symbols by rejection sampling, so every symbol is equally likely. */
export function randomStamp(random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const limit = 256 - (256 % STAMP_ALPHABET.length);
  let out = '';
  while (out.length < 6) {
    for (const b of random(16)) {
      if (b < limit && out.length < 6) out += STAMP_ALPHABET[b % STAMP_ALPHABET.length];
    }
  }
  return `CQ-${out}`;
}

export interface ReceiptInput {
  courseId: string;
  taskId: string;
  stepId: string;
  stamp: string;
  outputSha256: string;
  matchedTokens: number;
  totalTokens: number;
}

const RECEIPT_KEYS = new Set(['courseId', 'taskId', 'stepId', 'stamp', 'outputSha256', 'matchedTokens', 'totalTokens']);

/**
 * Why a receipt request is malformed, or null. Any field beyond ids, the
 * stamp, the hash and the counts is refused, so pasted text cannot ride along
 * in a request even by mistake.
 */
export function receiptProblem(body: unknown): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'bad-request';
  const b = body as Record<string, unknown>;
  if (Object.keys(b).some((k) => !RECEIPT_KEYS.has(k))) return 'bad-request';
  for (const k of ['courseId', 'taskId', 'stepId'] as const) if (typeof b[k] !== 'string' || !ID_RE.test(b[k] as string)) return 'bad-request';
  if (typeof b.stamp !== 'string' || !STAMP_RE.test(b.stamp)) return 'bad-stamp';
  if (typeof b.outputSha256 !== 'string' || !SHA256_RE.test(b.outputSha256)) return 'bad-hash';
  const m = b.matchedTokens;
  const t = b.totalTokens;
  if (!Number.isInteger(m) || !Number.isInteger(t)) return 'bad-counts';
  // Every token matched, the stamp among them, and at least one token besides the stamp.
  if ((m as number) !== (t as number) || (t as number) < 2) return 'not-matched';
  return null;
}

export interface StampRow {
  id: string;
  course_id: string;
  task_id: string;
  expires_at: string;
}

export type StampVerdict = 'ok' | 'stamp-unknown' | 'stamp-mismatch' | 'stamp-expired';

export function stampVerdict(row: StampRow | null, input: Pick<ReceiptInput, 'courseId' | 'taskId'>, now: number): StampVerdict {
  if (!row) return 'stamp-unknown';
  if (row.course_id !== input.courseId || row.task_id !== input.taskId) return 'stamp-mismatch';
  if (Date.parse(row.expires_at) <= now) return 'stamp-expired';
  return 'ok';
}
// ─── end of supabase/functions/_shared/stampCodec.ts ────────────────────

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

  const body = await req.json().catch(() => ({}));
  const courseId = String(body?.courseId ?? '');
  const taskId = String(body?.taskId ?? '');
  if (!ID_RE.test(courseId) || !ID_RE.test(taskId)) return json({ error: 'bad-request' }, 400, req, origin);

  const admin = createClient(url, serviceRole);
  const { data: member } = await admin.from('memberships').select('user_id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
  if (!member) return json({ error: 'not-enrolled' }, 403, req, origin);

  const now = Date.now();
  const { data: live } = await admin
    .from('verification_stamps')
    .select('stamp, expires_at')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .eq('task_id', taskId)
    .gt('expires_at', new Date(now + STAMP_REUSE_MINUTES * 60_000).toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (live) return json({ stamp: live.stamp, expiresAt: live.expires_at }, 200, req, origin);

  const expiresAt = new Date(now + STAMP_MINUTES * 60_000).toISOString();
  for (let attempt = 0; attempt < 3; attempt++) {
    const stamp = randomStamp();
    const { error } = await admin.from('verification_stamps').insert({ user_id: user.id, course_id: courseId, task_id: taskId, stamp, expires_at: expiresAt });
    if (!error) return json({ stamp, expiresAt }, 200, req, origin);
    // A collision with one of the caller's own earlier stamps: draw again.
    if (error.code !== '23505') break;
  }
  return json({ error: 'stamp-failed' }, 500, req, origin);
});

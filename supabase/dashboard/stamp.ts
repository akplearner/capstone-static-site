// stamp: paste-ready copy for the Supabase dashboard. GENERATED, DO NOT EDIT.
//
// Built from supabase/functions/stamp/index.ts, with the shared helpers it
// imports copied in, by `npm run functions:dashboard`. To deploy it without
// the CLI: Supabase → Edge Functions → Deploy a new function → Via Editor;
// replace everything in the editor with this whole file; name the function
// exactly `stamp` BEFORE clicking Deploy function: the name becomes its
// address (…/functions/v1/stamp), and renaming it later changes only the
// label. No secrets to set, and JWT verification stays on. SUPABASE_SETUP.md
// has the steps.

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
// APP_ORIGIN secret is required (R135, _shared/cors.ts). R135: at most
// STAMPS_PER_HOUR new stamps per member per hour (_shared/limits.ts).

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

  // R135: a reused stamp costs nothing; a NEW one counts against the hourly cap.
  const { count: issued, error: countError } = await admin
    .from('verification_stamps')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gt('issued_at', sinceIso(now, 3_600_000));
  if (countError) return json({ error: 'stamp-failed' }, 500, req, origin);
  if (overCap(issued, STAMPS_PER_HOUR)) return json({ error: 'too-many-stamps', max: STAMPS_PER_HOUR }, 429, req, origin);

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

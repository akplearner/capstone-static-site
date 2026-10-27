// report-notify: paste-ready copy for the Supabase dashboard. GENERATED, DO NOT EDIT.
//
// Built from supabase/functions/report-notify/index.ts, with the shared helpers it
// imports copied in, by `npm run functions:dashboard`. To deploy it without
// the CLI: Supabase → Edge Functions → Deploy a new function → Via Editor;
// replace everything in the editor with this whole file; name the function
// exactly `report-notify` BEFORE clicking Deploy function: the name becomes its
// address (…/functions/v1/report-notify), and renaming it later changes only the
// label. No secrets to set, and JWT verification stays on. SUPABASE_SETUP.md
// has the steps.

// report-notify — emails the instructor when a student files a task report.
//
// OPTIONAL. The reports themselves live in `task_reports` and appear on the
// instructor's cohort dashboard either way; this function only adds the email.
// The app fire-and-forgets an invoke after each report and stays silent when
// the function isn't deployed, so nothing depends on it.
//
// DEPLOY (you, once — after creating a free Resend account): paste
// supabase/dashboard/report-notify.ts into the Supabase dashboard
// (SUPABASE_SETUP.md), or run `supabase functions deploy report-notify`; then
// add two secrets on the dashboard's Edge Function Secrets page (or with
// `supabase secrets set`): RESEND_API_KEY=<your Resend API key> and
// REPORT_EMAIL=<where the emails go>.
//
// The caller must be signed in (their JWT is verified). R135: the email is a
// fixed template (_shared/limits.ts) that names who, what kind, which task and
// course — never the note, which the dashboard has; the name comes from the
// caller's profile, not the body; and one member causes at most NOTIFY_PER_DAY
// emails a day, counted from their own task_reports rows. APP_ORIGIN is
// required (_shared/cors.ts).

import { createClient } from 'jsr:@supabase/supabase-js@2';
// R113: answer the browser preflight, and carry the CORS headers on every reply.
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
  const anonKey = projectKey('public', env);
  const resendKey = env('RESEND_API_KEY');
  const to = env('REPORT_EMAIL');
  if (!url || !anonKey || !resendKey || !to) {
    // Deployed but not configured: succeed quietly — the dashboard has the report.
    return json({ sent: false }, 200, req, origin);
  }

  const asCaller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const {
    data: { user },
  } = await asCaller.auth.getUser();
  if (!user) {
    return json({ error: 'Not signed in' }, 401, req, origin);
  }

  // R135: the member's own reports today (their row policy shows them their own); past the cap, no email.
  const { count: today } = await asCaller
    .from('task_reports')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gt('created_at', sinceIso(Date.now(), 86_400_000));
  if (overCap(today, NOTIFY_PER_DAY + 1)) return json({ sent: false, reason: 'daily-cap' }, 200, req, origin);

  const body = await req.json().catch(() => ({}));
  const { data: profile } = await asCaller.from('profiles').select('display_name').eq('id', user.id).maybeSingle();
  const who = emailLine(profile?.display_name, 80) || 'A member';
  const message = notifyMessage({ who, kind: emailLine(body?.kind, 20), task: emailLine(body?.taskId, 80), course: emailLine(body?.courseId, 60) });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Capstone Quarry <onboarding@resend.dev>', to: [to], ...message }),
  });
  return json({ sent: res.ok }, 200, req, origin);
});

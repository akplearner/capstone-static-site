// report-notify: paste-ready copy for the Supabase dashboard. GENERATED, DO NOT EDIT.
//
// Built from supabase/functions/report-notify/index.ts, with the shared helpers it
// imports copied in, by `npm run functions:dashboard`. To deploy it without
// the CLI: Supabase → Edge Functions → Deploy a new function → Via Editor;
// replace everything in the editor with this whole file; name the function
// exactly `report-notify`; click Deploy function. No secrets to set, and JWT
// verification stays on. SUPABASE_SETUP.md has the steps.

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
// The caller must be signed in (their JWT is verified); the report fields are
// re-read as plain strings and length-capped, so the email can't be used to
// send arbitrary content.

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

  const body = await req.json().catch(() => ({}));
  const s = (v: unknown, cap: number) => String(v ?? '').slice(0, cap);
  const course = s(body.courseId, 60);
  const task = s(body.taskId, 80);
  const kind = s(body.kind, 20);
  const note = s(body.note, 1000);
  const who = s(body.displayName, 80) || user.email || user.id;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Capstone Quarry <onboarding@resend.dev>',
      to: [to],
      subject: `[${course}] task issue: ${kind} on ${task}`,
      text: `${who} reported a ${kind} issue on task ${task} (${course}).\n\n${note || '(no note)'}\n\nOpen the cohort dashboard to resolve it.`,
    }),
  });
  return json({ sent: res.ok }, 200, req, origin);
});

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
import { json, preflight } from '../_shared/cors.ts';
import { projectKey } from '../_shared/env.ts';
import { NOTIFY_PER_DAY, emailLine, notifyMessage, overCap, sinceIso } from '../_shared/limits.ts';

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

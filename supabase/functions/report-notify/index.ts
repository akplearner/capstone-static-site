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
import { json, preflight } from '../_shared/cors.ts';
import { projectKey } from '../_shared/env.ts';

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

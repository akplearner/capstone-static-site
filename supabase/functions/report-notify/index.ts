// report-notify — emails the instructor when a student files a task report.
//
// OPTIONAL. The reports themselves live in `task_reports` and appear on the
// instructor's cohort dashboard either way; this function only adds the email.
// The app fire-and-forgets an invoke after each report and stays silent when
// the function isn't deployed, so nothing depends on it.
//
// DEPLOY (you, once — after creating a free Resend account):
//   supabase functions deploy report-notify
//   supabase secrets set RESEND_API_KEY=<your Resend API key>
//   supabase secrets set REPORT_EMAIL=<where the emails go>
//
// The caller must be signed in (their JWT is verified); the report fields are
// re-read as plain strings and length-capped, so the email can't be used to
// send arbitrary content.

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing bearer token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const to = Deno.env.get('REPORT_EMAIL');
  if (!resendKey || !to) {
    // Deployed but not configured: succeed quietly — the dashboard has the report.
    return new Response(JSON.stringify({ sent: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const asCaller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const {
    data: { user },
  } = await asCaller.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Not signed in' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
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
  return new Response(JSON.stringify({ sent: res.ok }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

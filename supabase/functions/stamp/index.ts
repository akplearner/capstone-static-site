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
// DEPLOY (you, once):
//   supabase functions deploy stamp
//   supabase secrets set SERVICE_ROLE_KEY=<your service_role key>
//   supabase secrets set APP_ORIGIN=<https://your-app.example>   (optional)

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json, preflight } from '../_shared/cors.ts';
import { ID_RE, STAMP_MINUTES, STAMP_REUSE_MINUTES, randomStamp } from '../_shared/stampCodec.ts';

Deno.serve(async (req: Request) => {
  const origin = Deno.env.get('APP_ORIGIN');
  const pre = preflight(req, origin);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method-not-allowed' }, 405, req, origin);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'missing-token' }, 401, req, origin);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRole = Deno.env.get('SERVICE_ROLE_KEY')!;
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

// receipt — records that a server-issued stamp came back matched for one step (R113).
//
// The body carries ids, the stamp, the SHA-256 of the pasted output and the
// token counts; it never carries the paste, and nothing here reads a text
// field beyond those. The stamp must be the caller's, for the same course
// and task, and unexpired; each stamp receipts each step once. The receipt
// table has no client write policy, so the row means the server saw this:
// a record of the stamp, not proof of the machine.
//
// DEPLOY (you, once):
//   supabase functions deploy receipt
//   (uses the same SERVICE_ROLE_KEY and optional APP_ORIGIN secrets as `stamp`)

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json, preflight } from '../_shared/cors.ts';
import { receiptProblem, stampVerdict, type ReceiptInput, type StampRow } from '../_shared/stampCodec.ts';

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

  const body = await req.json().catch(() => null);
  const problem = receiptProblem(body);
  if (problem) return json({ error: problem }, 400, req, origin);
  const input = body as ReceiptInput;

  const admin = createClient(url, serviceRole);
  const { data: row } = await admin
    .from('verification_stamps')
    .select('id, course_id, task_id, expires_at')
    .eq('user_id', user.id)
    .eq('stamp', input.stamp)
    .maybeSingle();
  const verdict = stampVerdict((row as StampRow | null) ?? null, input, Date.now());
  if (verdict !== 'ok') return json({ error: verdict }, 409, req, origin);

  const { error } = await admin.from('verification_receipts').insert({
    user_id: user.id,
    course_id: input.courseId,
    task_id: input.taskId,
    step_id: input.stepId,
    stamp_id: (row as StampRow).id,
    output_sha256: input.outputSha256,
    matched_tokens: input.matchedTokens,
    total_tokens: input.totalTokens,
  });
  if (error) return json({ error: error.code === '23505' ? 'stamp-used' : 'receipt-failed' }, error.code === '23505' ? 409 : 500, req, origin);
  await admin.from('verification_stamps').update({ used_at: new Date().toISOString() }).eq('id', (row as StampRow).id).is('used_at', null);
  return json({ receiptedAt: new Date().toISOString() }, 200, req, origin);
});

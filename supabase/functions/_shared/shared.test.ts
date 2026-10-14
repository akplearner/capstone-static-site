// Deno tests for the shared, pure helpers (CI: `deno test --no-config supabase/functions/_shared`).
// No remote imports, so the job needs no network beyond the runtime itself.
import { CORS_ALLOW_HEADERS, corsHeaders, json, preflight } from './cors.ts';
import { STAMP_ALPHABET, STAMP_RE, randomStamp, receiptProblem, stampVerdict } from './stampCodec.ts';

function ok(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

Deno.test('a preflight is answered with 204 and the allowed headers; other methods pass through', async () => {
  const pre = preflight(new Request('https://f.example/stamp', { method: 'OPTIONS', headers: { Origin: 'https://app.example' } }), 'https://app.example');
  ok(pre && pre.status === 204, 'preflight 204');
  ok(pre!.headers.get('Access-Control-Allow-Headers') === CORS_ALLOW_HEADERS, 'allow headers');
  ok(preflight(new Request('https://f.example/stamp', { method: 'POST' })) === null, 'POST passes through');
  const res = json({ a: 1 }, 409, new Request('https://f.example', { headers: { Origin: 'https://x.example' } }));
  ok(res.status === 409 && res.headers.get('Access-Control-Allow-Origin') === 'https://x.example', 'echo the origin without APP_ORIGIN');
  ok((await res.json()).a === 1, 'json body');
  ok(corsHeaders('https://x.example', 'https://app.example')['Access-Control-Allow-Origin'] === 'https://app.example', 'APP_ORIGIN wins');
});

Deno.test('stamps have the client stamp shape, use every symbol, and receipts need every token matched', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 400; i++) {
    const s = randomStamp();
    ok(STAMP_RE.test(s), `shape ${s}`);
    for (const c of s.slice(3)) seen.add(c);
  }
  ok(seen.size === STAMP_ALPHABET.length, 'every symbol appears');
  // The pattern admits exactly the alphabet, nothing more.
  for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
    ok(STAMP_RE.test(`CQ-${c.repeat(6)}`) === STAMP_ALPHABET.includes(c), `pattern and alphabet agree on ${c}`);
  }
  const good = { courseId: 'security-plus', taskId: 'red-w1-osint', stepId: 'red-w1-s1', stamp: 'CQ-ABC234', outputSha256: 'a'.repeat(64), matchedTokens: 3, totalTokens: 3 };
  ok(receiptProblem(good) === null, 'a full match is a receipt');
  ok(receiptProblem({ ...good, matchedTokens: 2 }) === 'not-matched', 'a partial match is not');
  ok(receiptProblem({ ...good, totalTokens: 1, matchedTokens: 1 }) === 'not-matched', 'the stamp alone is not');
  ok(receiptProblem({ ...good, stamp: 'CQ-ABC23O' }) === 'bad-stamp', 'look-alike letters are not stamps');
  ok(receiptProblem({ ...good, outputSha256: 'xyz' }) === 'bad-hash', 'the hash is checked');
  ok(receiptProblem({ ...good, courseId: '../x' }) === 'bad-request', 'ids are checked');
  ok(receiptProblem({ ...good, output: 'root@lab:~# ufw status' }) === 'bad-request', 'a text field is refused, never ignored');
  const row = { id: 'u', course_id: 'security-plus', task_id: 'red-w1-osint', expires_at: '2026-10-14T10:20:00Z' };
  ok(stampVerdict(null, good, 0) === 'stamp-unknown', 'unknown');
  ok(stampVerdict({ ...row, task_id: 'x' }, good, 0) === 'stamp-mismatch', 'mismatch');
  ok(stampVerdict(row, good, Date.parse('2026-10-14T10:20:01Z')) === 'stamp-expired', 'expired');
  ok(stampVerdict(row, good, Date.parse('2026-10-14T10:00:00Z')) === 'ok', 'live');
});

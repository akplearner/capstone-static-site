// Deno tests for the candidate-link guard (CI: `deno test --no-config supabase/functions/_shared`).
import { SHARE_MAX_BYTES, TOKEN_RE, identityLeaks, newToken, sha256HexText, shareProblem, withSubject } from './shareGuard.ts';

function ok(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

const profile = { schema: 'capstone-member-profile/3', signature: null, subject: { display: 'Grace' }, courses: [{ courseId: 'security-plus', metrics: { verified: 3 } }] };
const credential = { '@context': ['https://www.w3.org/ns/credentials/v2'], type: ['VerifiableCredential', 'OpenBadgeCredential'], credentialSubject: { type: ['AchievementSubject'] } };
const good = { kind: 'profile', days: 30, label: 'For Example Ltd', snapshot: profile };

Deno.test('a link carries only the two published shapes, within the cap, for 7, 30 or 90 days', () => {
  ok(shareProblem(good) === null, 'a profile');
  ok(shareProblem({ ...good, kind: 'credential', snapshot: credential }) === null, 'a credential');
  ok(shareProblem({ ...good, days: 365 }) === 'bad-days', 'no year-long link');
  ok(shareProblem({ ...good, extra: 1 }) === 'bad-request', 'no extra field');
  ok(shareProblem({ ...good, snapshot: { ...profile, signature: 'x' } }) === 'bad-snapshot', 'never a signed claim');
  ok(shareProblem({ ...good, kind: 'credential', snapshot: { ...credential, proof: {} } }) === 'bad-snapshot', 'no proof on a credential');
  ok(shareProblem({ ...good, label: 'x'.repeat(61) }) === 'bad-label', 'label cap');
  ok(shareProblem({ ...good, snapshot: { ...profile, blob: 'a'.repeat(SHARE_MAX_BYTES) } }) === 'too-large', 'size cap');
});

Deno.test('identity stays out of the copy: ids, the submitter and any email address are refused', () => {
  ok(shareProblem({ ...good, snapshot: { ...profile, courses: [{ memberId: 'u1' }] } }) === 'identity-in-snapshot', 'memberId');
  ok(shareProblem({ ...good, snapshot: { ...profile, subject: { display: 'grace@example.com' } } }) === 'identity-in-snapshot', 'an email in a value');
  ok(identityLeaks({ a: [{ teamId: 't' }], b: { user_id: 'x' } }).length === 2, 'nested keys are found');
  ok(identityLeaks(credential).length === 0, '@context is not an email');
  ok(JSON.stringify(withSubject(profile, 'Grace Hopper')).includes('"display":"Grace Hopper"'), 'the server sets the subject');
});

Deno.test('tokens are 256 random bits, base64url, and only their hash is kept', async () => {
  const t = newToken();
  ok(TOKEN_RE.test(t), `shape ${t}`);
  ok(newToken() !== t, 'random');
  ok(newToken(() => new Uint8Array(32)) === 'A'.repeat(43), 'deterministic with a fixed source');
  const h = await sha256HexText(t);
  ok(/^[0-9a-f]{64}$/.test(h) && h !== t, 'a hash, not the token');
});

// shareGuard.ts — what a candidate link may carry, and its token (R114).
//
// A link serves a frozen copy of the member's portfolio export or unsigned
// credential to whoever holds it. The server cannot recompute the numbers,
// so its job is narrower: accept only those two shapes, keep identity out of
// the copy (no member, user or team id, no submitter, no email address in
// any key or value), cap the size, and make the token unguessable. The token
// is shown once; only its SHA-256 is stored. Pure: no Deno API here, so the
// app runs the same checks before it asks (src/lib/shares.ts).

export const SHARE_DAYS = [7, 30, 90] as const;
export const SHARE_MAX_BYTES = 256 * 1024;
export const LABEL_MAX = 60;
export const MEASURE_MAX = 120;
/** 32 random bytes, base64url, no padding. */
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
export const PROFILE_SCHEMA = 'capstone-member-profile/2';

const FORBIDDEN_KEYS = new Set(['memberId', 'userId', 'user_id', 'email', 'teamId', 'submittedBy']);
const EMAIL_RE = /[^\s@"'<>()]+@[^\s@"'<>()]+\.[a-z]{2,}/i;
const REQUEST_KEYS = new Set(['kind', 'days', 'label', 'measuredAgainst', 'snapshot']);

export type ShareKind = 'profile' | 'credential';

export interface ShareRequest {
  kind: ShareKind;
  days: (typeof SHARE_DAYS)[number];
  label: string;
  measuredAgainst?: string;
  snapshot: Record<string, unknown>;
}

/** Where the copy would name someone: a forbidden key, or an email-shaped key or value. */
export function identityLeaks(value: unknown, path = '$'): string[] {
  if (typeof value === 'string') return EMAIL_RE.test(value) ? [path] : [];
  if (Array.isArray(value)) return value.flatMap((v, i) => identityLeaks(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => [
      ...(FORBIDDEN_KEYS.has(k) || EMAIL_RE.test(k) ? [`${path}.${k}`] : []),
      ...identityLeaks(v, `${path}.${k}`),
    ]);
  }
  return [];
}

const byteLength = (s: string) => new TextEncoder().encode(s).length;
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Why a share request is refused, or null. Any field beyond the five is refused. */
export function shareProblem(body: unknown): string | null {
  if (!isObject(body)) return 'bad-request';
  if (Object.keys(body).some((k) => !REQUEST_KEYS.has(k))) return 'bad-request';
  if (body.kind !== 'profile' && body.kind !== 'credential') return 'bad-kind';
  if (!(SHARE_DAYS as readonly unknown[]).includes(body.days)) return 'bad-days';
  if (typeof body.label !== 'string' || body.label.length > LABEL_MAX) return 'bad-label';
  if (body.measuredAgainst !== undefined && (typeof body.measuredAgainst !== 'string' || body.measuredAgainst.length > MEASURE_MAX)) return 'bad-measure';
  const snap = body.snapshot;
  if (!isObject(snap)) return 'bad-snapshot';
  if (byteLength(JSON.stringify(snap)) > SHARE_MAX_BYTES) return 'too-large';
  if (body.kind === 'profile') {
    if (snap.schema !== PROFILE_SCHEMA || snap.signature !== null || !isObject(snap.subject) || typeof snap.subject.display !== 'string') return 'bad-snapshot';
  } else {
    if (!Array.isArray(snap.type) || !snap.type.includes('OpenBadgeCredential') || 'proof' in snap) return 'bad-snapshot';
  }
  if (identityLeaks(snap).length) return 'identity-in-snapshot';
  return null;
}

/** A profile copy under the member's display name: the server sets it, never the client. */
export function withSubject(snapshot: Record<string, unknown>, display: string): Record<string, unknown> {
  return { ...snapshot, subject: { display } };
}

/** 32 random bytes as base64url: 256 bits, so a link cannot be guessed. */
export function newToken(random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  let bin = '';
  for (const b of random(32)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256HexText(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

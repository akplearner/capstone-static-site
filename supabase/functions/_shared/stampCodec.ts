// stampCodec.ts — the server-issued verification stamp and the receipt rules (R113).
//
// A stamp has the same shape as the client's FNV stamp (`taskToken` in
// src/lib/evidenceLedger.ts): `CQ-` and six characters from an alphabet with
// no look-alike letters or digits, so every surface that prints or matches a
// stamp keeps working. The server's stamp is random, short-lived and tied to
// one member, course and task; a receipt records that it came back matched
// for one step. The paste itself never reaches the server: only its SHA-256
// and the token counts do. A receipt records the stamp, not the machine.
// Pure: no Deno API here, so it is unit-tested anywhere.

export const STAMP_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
// Exactly the alphabet: no I, L, O or U, no 0 or 1 (the SQL check in 0014 uses the same class).
export const STAMP_RE = /^CQ-[A-HJKMNP-TV-Z2-9]{6}$/;
/** A stamp lives this long; a live one with at least the reuse margin left is handed out again. */
export const STAMP_MINUTES = 20;
export const STAMP_REUSE_MINUTES = 5;

export const ID_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
export const SHA256_RE = /^[0-9a-f]{64}$/;

/** Six symbols by rejection sampling, so every symbol is equally likely. */
export function randomStamp(random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const limit = 256 - (256 % STAMP_ALPHABET.length);
  let out = '';
  while (out.length < 6) {
    for (const b of random(16)) {
      if (b < limit && out.length < 6) out += STAMP_ALPHABET[b % STAMP_ALPHABET.length];
    }
  }
  return `CQ-${out}`;
}

export interface ReceiptInput {
  courseId: string;
  taskId: string;
  stepId: string;
  stamp: string;
  outputSha256: string;
  matchedTokens: number;
  totalTokens: number;
}

const RECEIPT_KEYS = new Set(['courseId', 'taskId', 'stepId', 'stamp', 'outputSha256', 'matchedTokens', 'totalTokens']);

/**
 * Why a receipt request is malformed, or null. Any field beyond ids, the
 * stamp, the hash and the counts is refused, so pasted text cannot ride along
 * in a request even by mistake.
 */
export function receiptProblem(body: unknown): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'bad-request';
  const b = body as Record<string, unknown>;
  if (Object.keys(b).some((k) => !RECEIPT_KEYS.has(k))) return 'bad-request';
  for (const k of ['courseId', 'taskId', 'stepId'] as const) if (typeof b[k] !== 'string' || !ID_RE.test(b[k] as string)) return 'bad-request';
  if (typeof b.stamp !== 'string' || !STAMP_RE.test(b.stamp)) return 'bad-stamp';
  if (typeof b.outputSha256 !== 'string' || !SHA256_RE.test(b.outputSha256)) return 'bad-hash';
  const m = b.matchedTokens;
  const t = b.totalTokens;
  if (!Number.isInteger(m) || !Number.isInteger(t)) return 'bad-counts';
  // Every token matched, the stamp among them, and at least one token besides the stamp.
  if ((m as number) !== (t as number) || (t as number) < 2) return 'not-matched';
  return null;
}

export interface StampRow {
  id: string;
  course_id: string;
  task_id: string;
  expires_at: string;
}

export type StampVerdict = 'ok' | 'stamp-unknown' | 'stamp-mismatch' | 'stamp-expired';

export function stampVerdict(row: StampRow | null, input: Pick<ReceiptInput, 'courseId' | 'taskId'>, now: number): StampVerdict {
  if (!row) return 'stamp-unknown';
  if (row.course_id !== input.courseId || row.task_id !== input.taskId) return 'stamp-mismatch';
  if (Date.parse(row.expires_at) <= now) return 'stamp-expired';
  return 'ok';
}

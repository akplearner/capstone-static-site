import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { STAMP_ALPHABET, STAMP_RE, randomStamp, receiptProblem } from '../../supabase/functions/_shared/stampCodec';
import { taskToken } from './evidenceLedger';

// R113: the stamp the server issues and the stamp the browser derives must be
// interchangeable everywhere a stamp is printed, matched or stored, so a
// member who falls back to the client stamp (offline, or before the function
// is deployed) sees nothing change but the receipt.
describe('R113 — the server stamp and the client stamp share one shape', () => {
  it('uses the same alphabet as taskToken, character for character', () => {
    const src = readFileSync(join(process.cwd(), 'src/lib/evidenceLedger.ts'), 'utf8');
    const client = src.match(/const ALPHA = '([^']+)'/)?.[1];
    expect(client).toBe(STAMP_ALPHABET);
    expect(new Set(STAMP_ALPHABET).size).toBe(30);
  });

  it('every client stamp matches the server pattern and the SQL check', () => {
    const sql = readFileSync(join(process.cwd(), 'supabase/migrations/0014_verification_receipts.sql'), 'utf8');
    const check = sql.match(/stamp ~ '([^']+)'/)?.[1];
    expect(check).toBe(STAMP_RE.source);
    for (let i = 0; i < 300; i++) {
      expect(taskToken(`user-${i}`, i % 2 ? 'security-plus' : 'cysa-plus', `task-${i * 7}`)).toMatch(STAMP_RE);
    }
  });

  it('server stamps are random but well formed, and a receipt needs every token', () => {
    const seen = new Set(Array.from({ length: 50 }, () => randomStamp()));
    for (const s of seen) expect(s).toMatch(STAMP_RE);
    expect(seen.size).toBeGreaterThan(45);
    const body = { courseId: 'security-plus', taskId: 't1', stepId: 's1', stamp: 'CQ-ABC234', outputSha256: 'f'.repeat(64), matchedTokens: 4, totalTokens: 4 };
    expect(receiptProblem(body)).toBeNull();
    expect(receiptProblem({ ...body, matchedTokens: 3 })).toBe('not-matched');
    // Pasted text never reaches the server: a body carrying any extra field is refused.
    expect(receiptProblem({ ...body, output: 'root@lab:~# ufw status' })).toBe('bad-request');
    expect(receiptProblem({ ...body, snapshot: {} })).toBe('bad-request');
  });
});

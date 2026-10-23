import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * R129 — a failure is a support code and a time for the person, the detail for us. The log write is best
 * effort: signed out, offline or a project without 0020 still gives the person a code.
 */
const db = vi.hoisted(() => ({ session: true as boolean, error: null as null | { code?: string; message?: string }, throws: false, rows: [] as Record<string, unknown>[] }));
vi.mock('./supabase/client', () => ({
  getBrowserClient: () => ({
    auth: { getSession: async () => ({ data: { session: db.session ? { user: { id: 'u-1', email: 'ada@example.com' } } : null } }) },
    from: () => ({
      insert: async (row: Record<string, unknown>) => {
        if (db.throws) throw new Error('boom');
        db.rows.push(row);
        return { error: db.error };
      },
    }),
  }),
}));

import { reportError, supportCode, supportLine, supportTime } from './reportError';

beforeEach(() => {
  db.session = true;
  db.error = null;
  db.throws = false;
  db.rows = [];
});

describe('support codes', () => {
  it('are E- and six characters a person can read aloud, and differ from one call to the next', () => {
    const codes = new Set(Array.from({ length: 200 }, () => supportCode()));
    expect(codes.size).toBeGreaterThan(190);
    for (const c of codes) expect(c).toMatch(/^E-[A-HJ-NP-Z2-9]{6}$/);
  });

  it('are shown with the time in UTC, and the line tells the student where to take them', () => {
    expect(supportTime(Date.UTC(2026, 9, 23, 14, 5, 9))).toBe('2026-10-23 14:05 UTC');
    expect(supportLine({ code: 'E-ABC234', at: Date.UTC(2026, 9, 23, 14, 5) })).toBe('Code E-ABC234 · 2026-10-23 14:05 UTC. Tell your instructor.');
  });
});

describe('reportError', () => {
  it('writes the whole detail with the account and page, and returns only the reference', async () => {
    const ref = await reportError({ area: 'agreements', reason: 'permission', dbCode: '42501', status: 403, message: 'new row violates row-level security policy', details: 'x' });
    expect(Object.keys(ref).sort()).toEqual(['at', 'code']);
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0]).toMatchObject({ support_code: ref.code, user_id: 'u-1', user_email: 'ada@example.com', area: 'agreements', reason: 'permission', db_code: '42501', http_status: 403 });
    expect(db.rows[0].client_at).toBe(new Date(ref.at).toJSON());
    expect(db.rows[0].path).toBe(window.location.pathname);
  });

  it('cuts what the table would refuse, so a long message cannot make the log fail', async () => {
    await reportError({ area: 'a'.repeat(100), message: 'm'.repeat(5000), details: 'd'.repeat(9000) });
    expect(String(db.rows[0].area)).toHaveLength(40);
    expect(String(db.rows[0].message)).toHaveLength(2000);
    expect(String(db.rows[0].details)).toHaveLength(4000);
  });

  it('still returns a code when signed out, when the table is missing, when the write is refused, and when it throws', async () => {
    db.session = false;
    expect((await reportError({ area: 'agreements' })).code).toMatch(/^E-/);
    expect(db.rows).toHaveLength(0);
    db.session = true;
    db.error = { code: '42P01', message: 'relation "client_errors" does not exist' };
    expect((await reportError({ area: 'agreements' })).code).toMatch(/^E-/);
    db.error = { code: '42501', message: 'denied' };
    expect((await reportError({ area: 'agreements' })).code).toMatch(/^E-/);
    db.error = null;
    db.throws = true;
    expect((await reportError({ area: 'agreements' })).code).toMatch(/^E-/);
  });
});

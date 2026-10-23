import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AGREEMENTS } from './agreements';

// A project that has not run migration 0013 has no `text_sha256` column, and
// PostgREST refuses any request that names it (PGRST204, "Could not find the
// 'text_sha256' column ... in the schema cache"). The agreement gate blocks
// the whole platform until the acceptance is logged, so a schema that lags
// the app must never stop anyone: the acceptance is logged without the hash.
const db = vi.hoisted(() => ({
  hasHashColumn: false,
  otherError: null as null | { code: string; message: string },
  errors: [] as { code?: string; message: string; status?: number }[],
  duplicates: false,
  refreshed: 0,
  writes: [] as Record<string, unknown>[][],
  reads: [] as string[],
}));

const MISSING = { code: 'PGRST204', message: "Could not find the 'text_sha256' column of 'agreement_acceptances' in the schema cache" };

vi.mock('../supabase/client', () => ({
  getBrowserClient: () => ({
    auth: { refreshSession: async () => { db.refreshed++; return {}; } },
    from: () => ({
      insert: async (input: Record<string, unknown> | Record<string, unknown>[]) => {
        const rows = Array.isArray(input) ? input : [input];
        db.writes.push(rows);
        if (db.duplicates && rows.length > 1) return { error: { code: '23505', message: 'duplicate key value' } };
        if (db.duplicates && rows[0].agreement_id === AGREEMENTS[0].id) return { error: { code: '23505', message: 'duplicate key value' } };
        if (db.errors.length) return { error: db.errors.shift() };
        if (db.otherError) return { error: db.otherError };
        if (!db.hasHashColumn && rows.some((r) => 'text_sha256' in r)) return { error: MISSING };
        return { error: null };
      },
      select: (cols: string) => ({
        order: async () => {
          db.reads.push(cols);
          if (!db.hasHashColumn && cols.includes('text_sha256')) return { data: null, error: MISSING };
          return { data: [{ agreement_id: 'aup', version: 2, accepted_at: '2026-10-14T09:00:00Z', ...(db.hasHashColumn ? { text_sha256: 'a'.repeat(64) } : {}) }], error: null };
        },
      }),
    }),
  }),
}));

// A fresh module per test: the "column is missing" memory is per page life.
const load = async () => {
  vi.resetModules();
  return import('./acceptances');
};

beforeEach(() => {
  db.hasHashColumn = false;
  db.otherError = null;
  db.errors = [];
  db.duplicates = false;
  db.refreshed = 0;
  db.writes = [];
  db.reads = [];
});

describe('the acceptance log survives a database that predates 0013', () => {
  it('logs the acceptance without the hash when the column is missing, and stops asking for it', async () => {
    const { acceptInCloud } = await load();
    expect(await acceptInCloud('user-1', AGREEMENTS)).toBe(true);
    expect(db.writes).toHaveLength(2);
    expect(db.writes[0].every((r) => typeof r.text_sha256 === 'string')).toBe(true);
    expect(db.writes[1].some((r) => 'text_sha256' in r), 'the retry names no missing column').toBe(false);
    expect(db.writes[1].map((r) => [r.agreement_id, r.version])).toEqual(AGREEMENTS.map((a) => [a.id, a.version]));
    // The next acceptance in the same page goes straight to the shape the table takes.
    expect(await acceptInCloud('user-1', AGREEMENTS.slice(0, 1))).toBe(true);
    expect(db.writes).toHaveLength(3);
    expect('text_sha256' in db.writes[2][0]).toBe(false);
  });

  it('writes the hash in one request once 0013 has run', async () => {
    db.hasHashColumn = true;
    const { acceptInCloud } = await load();
    expect(await acceptInCloud('user-1', AGREEMENTS)).toBe(true);
    expect(db.writes).toHaveLength(1);
    for (const r of db.writes[0]) expect(r.text_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('never reports success for any other failure', async () => {
    db.otherError = { code: '42501', message: 'new row violates row-level security policy' };
    const { acceptInCloud } = await load();
    expect(await acceptInCloud('user-1', AGREEMENTS)).toBe(false);
    expect(db.writes, 'no retry for an unrelated error').toHaveLength(1);
  });

  it('reads the log back without the hash column too', async () => {
    const { fetchCloudAcceptanceLog } = await load();
    expect(await fetchCloudAcceptanceLog()).toEqual([{ agreementId: 'aup', version: 2, acceptedAt: '2026-10-14T09:00:00Z', textSha256: null }]);
    expect(db.reads).toEqual(['agreement_id, version, accepted_at, text_sha256', 'agreement_id, version, accepted_at']);
    db.hasHashColumn = true;
    const fresh = await load();
    expect((await fresh.fetchCloudAcceptanceLog())?.[0].textSha256).toBe('a'.repeat(64));
  });
});

describe('R128 — an acceptance that fails says why, and does not fail for avoidable reasons', () => {
  it('refreshes an expired session once and writes again', async () => {
    db.hasHashColumn = true;
    db.errors = [{ code: 'PGRST301', message: 'JWT expired', status: 401 }];
    const { acceptInCloudDetailed } = await load();
    expect(await acceptInCloudDetailed('user-1', AGREEMENTS)).toEqual({ ok: true });
    expect(db.refreshed).toBe(1);
    expect(db.writes).toHaveLength(2);
  });

  it('names a session that stays expired, a permission fault and a network fault, with the code', async () => {
    db.hasHashColumn = true;
    const { acceptInCloudDetailed } = await load();
    db.errors = [{ code: 'PGRST301', message: 'JWT expired' }, { code: 'PGRST301', message: 'JWT expired' }];
    expect(await acceptInCloudDetailed('u', AGREEMENTS)).toMatchObject({ ok: false, reason: 'session', code: 'PGRST301' });
    db.errors = [{ code: '42501', message: 'new row violates row-level security policy' }];
    expect(await acceptInCloudDetailed('u', AGREEMENTS)).toMatchObject({ ok: false, reason: 'permission', code: '42501' });
    db.errors = [{ message: 'TypeError: Failed to fetch' }];
    expect(await acceptInCloudDetailed('u', AGREEMENTS)).toMatchObject({ ok: false, reason: 'network' });
    db.errors = [{ code: 'XX000', message: 'something else' }];
    expect(await acceptInCloudDetailed('u', AGREEMENTS)).toMatchObject({ ok: false, reason: 'unknown', code: 'XX000' });
  });

  it('counts a row that is already in the log as done, and still adds the others', async () => {
    db.hasHashColumn = true;
    db.duplicates = true;
    const { acceptInCloudDetailed } = await load();
    expect(await acceptInCloudDetailed('u', AGREEMENTS)).toEqual({ ok: true });
    expect(db.writes.length).toBe(1 + AGREEMENTS.length);
  });

  it('logs without the hash when crypto.subtle is not there, instead of hanging', async () => {
    db.hasHashColumn = true;
    const real = globalThis.crypto.subtle;
    Object.defineProperty(globalThis.crypto, 'subtle', { value: undefined, configurable: true });
    try {
      const { acceptInCloudDetailed } = await load();
      expect(await acceptInCloudDetailed('u', AGREEMENTS)).toEqual({ ok: true });
      expect(db.writes[0].some((r) => 'text_sha256' in r)).toBe(false);
    } finally {
      Object.defineProperty(globalThis.crypto, 'subtle', { value: real, configurable: true });
    }
  });
});

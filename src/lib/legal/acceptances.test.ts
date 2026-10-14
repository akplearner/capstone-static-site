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
  writes: [] as Record<string, unknown>[][],
  reads: [] as string[],
}));

const MISSING = { code: 'PGRST204', message: "Could not find the 'text_sha256' column of 'agreement_acceptances' in the schema cache" };

vi.mock('../supabase/client', () => ({
  getBrowserClient: () => ({
    from: () => ({
      upsert: async (rows: Record<string, unknown>[]) => {
        db.writes.push(rows);
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

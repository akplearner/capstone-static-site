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
  logged: [] as Record<string, unknown>[],
  writes: [] as Record<string, unknown>[][],
  reads: [] as string[],
  eqs: [] as [string, string][],
  readError: null as null | { code: string; message: string },
  emptyRead: false,
}));

const MISSING = { code: 'PGRST204', message: "Could not find the 'text_sha256' column of 'agreement_acceptances' in the schema cache" };

vi.mock('../supabase/client', () => ({
  getBrowserClient: () => ({
    auth: { refreshSession: async () => { db.refreshed++; return {}; }, getSession: async () => ({ data: { session: { user: { id: 'user-1', email: 'ada@example.com' } } } }) },
    from: (table: string) => table === 'client_errors' ? { insert: async (row: Record<string, unknown>) => { db.logged.push(row); return { error: null }; } } : ({
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
      select: (cols: string) => {
        // R149: both reads filter by user_id (`.eq`) and the fold read awaits the chain directly, so the
        // chain is thenable and `eq` is recorded.
        const answer = async () => {
          db.reads.push(cols);
          if (db.readError) return { data: null, error: db.readError };
          if (!db.hasHashColumn && cols.includes('text_sha256')) return { data: null, error: MISSING };
          if (db.emptyRead) return { data: [], error: null };
          return { data: [{ agreement_id: 'aup', version: 2, accepted_at: '2026-10-14T09:00:00Z', ...(db.hasHashColumn ? { text_sha256: 'a'.repeat(64) } : {}) }], error: null };
        };
        const chain = {
          eq: (col: string, val: string) => { db.eqs.push([col, val]); return chain; },
          order: answer,
          then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => answer().then(res, rej),
        };
        return chain;
      },
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
  db.logged = [];
  db.writes = [];
  db.reads = [];
  db.eqs = [];
  db.readError = null;
  db.emptyRead = false;
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
    expect(await fetchCloudAcceptanceLog('user-1')).toEqual([{ agreementId: 'aup', version: 2, acceptedAt: '2026-10-14T09:00:00Z', textSha256: null }]);
    expect(db.reads).toEqual(['agreement_id, version, accepted_at, text_sha256', 'agreement_id, version, accepted_at']);
    db.hasHashColumn = true;
    const fresh = await load();
    expect((await fresh.fetchCloudAcceptanceLog('user-1'))?.[0].textSha256).toBe('a'.repeat(64));
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
    expect(await acceptInCloudDetailed('u', AGREEMENTS)).toMatchObject({ ok: false, reason: 'session' });
    db.errors = [{ code: '42501', message: 'new row violates row-level security policy' }];
    expect(await acceptInCloudDetailed('u', AGREEMENTS)).toMatchObject({ ok: false, reason: 'permission' });
    db.errors = [{ message: 'TypeError: Failed to fetch' }];
    expect(await acceptInCloudDetailed('u', AGREEMENTS)).toMatchObject({ ok: false, reason: 'network' });
    db.errors = [{ code: 'XX000', message: 'something else' }];
    expect(await acceptInCloudDetailed('u', AGREEMENTS)).toMatchObject({ ok: false, reason: 'unknown' });
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

describe('R129 — the student gets a code and a time; the detail goes to our log', () => {
  it('returns only a support reference, and writes the full detail with the account to the log', async () => {
    db.hasHashColumn = true;
    db.errors = [{ code: '42501', message: 'new row violates row-level security policy', status: 403 }];
    const { acceptInCloudDetailed } = await load();
    const result = await acceptInCloudDetailed('user-1', AGREEMENTS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result).sort()).toEqual(['ok', 'reason', 'support']);
    expect(result.support.code).toMatch(/^E-[A-HJ-NP-Z2-9]{6}$/);
    expect(JSON.stringify(result)).not.toMatch(/42501|row-level/);
    expect(db.logged).toHaveLength(1);
    expect(db.logged[0]).toMatchObject({ support_code: result.support.code, user_id: 'user-1', user_email: 'ada@example.com', area: 'agreements', reason: 'permission', db_code: '42501', http_status: 403 });
    expect(String(db.logged[0].message)).toContain('row-level security');
  });

  it('prints nothing to the console: the detail is not left in the browser', async () => {
    db.hasHashColumn = true;
    db.errors = [{ code: 'XX000', message: 'secret internals' }];
    const spies = (['error', 'warn', 'log'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    const { acceptInCloudDetailed } = await load();
    await acceptInCloudDetailed('user-1', AGREEMENTS);
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    spies.forEach((spy) => spy.mockRestore());
  });
});


describe('R149 — the reads are the account\'s own, and a failed read is not "accepted nothing"', () => {
  it('filters both reads by the signed-in user id', async () => {
    const { fetchCloudAcceptances, fetchCloudAcceptanceLog } = await load();
    await fetchCloudAcceptances('user-1');
    await fetchCloudAcceptanceLog('user-1');
    // The log read asks for the hash first and retries without it on a pre-0013 project, so it may filter twice.
    expect(db.eqs.length).toBeGreaterThanOrEqual(2);
    expect(db.eqs.every(([col, val]) => col === 'user_id' && val === 'user-1')).toBe(true);
  });

  it('folds the rows to the highest version, returns {} on an empty log and null on an error', async () => {
    const { fetchCloudAcceptances } = await load();
    expect(await fetchCloudAcceptances('user-1')).toEqual({ aup: 2 });
    db.emptyRead = true;
    expect(await fetchCloudAcceptances('user-1')).toEqual({});
    db.readError = { code: 'PGRST301', message: 'JWT expired' };
    expect(await fetchCloudAcceptances('user-1')).toBeNull();
    expect(db.logged.some((r) => (r.area ?? (r as { data?: { area?: string } }).data?.area) !== undefined || JSON.stringify(r).includes('agreements-read'))).toBe(true);
  });

  it('tells a live session for this account from none or another account', async () => {
    const { sessionMatches } = await load();
    expect(await sessionMatches('user-1')).toBe('ok');
    expect(await sessionMatches('user-2')).toBe('other');
  });

  it('queues an acceptance the log could not take and flushes it later, per account', async () => {
    const { queuePendingAcceptances, pendingAcceptances, flushPendingAcceptances } = await load();
    localStorage.clear();
    queuePendingAcceptances('user-1', AGREEMENTS.slice(0, 2));
    expect(pendingAcceptances('user-1')).toEqual({ [AGREEMENTS[0].id]: AGREEMENTS[0].version, [AGREEMENTS[1].id]: AGREEMENTS[1].version });
    expect(pendingAcceptances('user-2')).toEqual({});
    await flushPendingAcceptances('user-1');
    expect(db.writes.at(-1)?.map((r) => r.agreement_id)).toEqual(AGREEMENTS.slice(0, 2).map((a) => a.id));
    expect(pendingAcceptances('user-1')).toEqual({});
  });
});

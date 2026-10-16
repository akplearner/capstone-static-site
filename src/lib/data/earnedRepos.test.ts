import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * R125 — the earned-skills ledger in its two homes: this device, and the database. Both hold the
 * one rule: a row is added or raised, never lowered, rewritten or re-dated. The cloud repo sends no
 * time of its own, keeps a write that failed to try again, and keeps the ledger on this device while
 * the database has no table for it (0019 not applied), so a retake never costs a member a skill.
 */
const calls = vi.hoisted(() => ({
  selects: [] as { table: string; eq: [string, unknown][]; range?: [number, number] }[],
  upserts: [] as { rows: Record<string, unknown>[]; opts: unknown }[],
  selectResult: { data: [] as unknown[] | null, error: null as unknown },
  upsertResult: { error: null as unknown },
}));
function selectChain(table: string) {
  const rec = { table, eq: [] as [string, unknown][], range: undefined as [number, number] | undefined };
  calls.selects.push(rec);
  const api = {
    eq(c: string, v: unknown) {
      rec.eq.push([c, v]);
      return api;
    },
    range(a: number, b: number) {
      rec.range = [a, b];
      return Promise.resolve(calls.selectResult);
    },
  };
  return api;
}
const client = {
  from: (table: string) => ({
    select: () => selectChain(table),
    upsert: (rows: Record<string, unknown>[], opts: unknown) => {
      calls.upserts.push({ rows, opts });
      return Promise.resolve(calls.upsertResult);
    },
  }),
};
vi.mock('../supabase/client', () => ({ getBrowserClient: () => client }));

const { localStorageEarnedRepo, earnedStore } = await import('./localStorageEarnedRepo');
const { supabaseEarnedRepo, resetEarnedPending } = await import('./supabaseEarnedRepo');
const { cache, setCurrentUserId, hydrateEarned, earnedFromRow } = await import('./supabaseCache');
const { KEYS } = await import('./keys');
import type { EarnedRow } from '../earnedSkills';

const row = (over: Partial<EarnedRow> = {}): EarnedRow => ({ dimension: 'skills', id: 'comp.recon.osint', courseId: 'security-plus', level: 'practised', firstAt: 100, levelAt: 100, via: [{ taskId: 't1', stepIds: ['s1'] }], ...over });

beforeEach(() => {
  localStorage.clear();
  calls.selects.length = calls.upserts.length = 0;
  calls.selectResult = { data: [], error: null };
  calls.upsertResult = { error: null };
  setCurrentUserId(null);
  setCurrentUserId('user-1');
  resetEarnedPending();
});

describe('the ledger on this device', () => {
  it('banks, lists by course, and returns what changed', () => {
    expect(localStorageEarnedRepo.list()).toEqual([]);
    const changed = localStorageEarnedRepo.bank([row(), row({ id: 'comp.dns', courseId: 'ccna' })]);
    expect(changed).toHaveLength(2);
    expect(localStorageEarnedRepo.list()).toHaveLength(2);
    expect(localStorageEarnedRepo.list('ccna').map((e) => e.id)).toEqual(['comp.dns']);
    expect(JSON.parse(localStorage.getItem(KEYS.earnedSkills)!)).toHaveLength(2);
  });

  it('adds and raises and never lowers, rewrites or re-dates', () => {
    localStorageEarnedRepo.bank([row()]);
    expect(localStorageEarnedRepo.bank([row({ level: 'verified', levelAt: 500, firstAt: 500, courseId: 'ccna' })])).toHaveLength(1);
    expect(localStorageEarnedRepo.list()[0]).toMatchObject({ level: 'verified', firstAt: 100, levelAt: 500, courseId: 'security-plus' });
    expect(localStorageEarnedRepo.bank([row({ level: 'practised', firstAt: 900, levelAt: 900 })]), 'a lower candidate changes nothing').toEqual([]);
    expect(localStorageEarnedRepo.bank([row({ level: 'verified', firstAt: 900, levelAt: 900 })]), 'an equal one neither').toEqual([]);
    expect(localStorageEarnedRepo.list()[0]).toMatchObject({ level: 'verified', firstAt: 100, levelAt: 500 });
  });

  it('returns the same array while nothing is banked, so it is cheap in a render', () => {
    localStorageEarnedRepo.bank([row()]);
    const a = localStorageEarnedRepo.list();
    expect(localStorageEarnedRepo.list()).toBe(a);
    localStorageEarnedRepo.bank([row({ id: 'other' })]);
    expect(localStorageEarnedRepo.list()).not.toBe(a);
  });

  it('drops a malformed row instead of trusting it, and survives text that is not JSON', () => {
    localStorage.setItem(KEYS.earnedSkills, JSON.stringify([row(), { dimension: 'nonsense', id: 'x', courseId: 'c', level: 'verified' }, { id: 'no-dimension' }, null, 7]));
    expect(localStorageEarnedRepo.list().map((e) => e.id)).toEqual(['comp.recon.osint']);
    localStorage.setItem(KEYS.earnedSkills, '{not json');
    expect(localStorageEarnedRepo.list()).toEqual([]);
  });

  it('keeps nothing for a store with no key, and is a copy per key', () => {
    let key: string | null = null;
    const store = earnedStore(() => key);
    expect(store.bank([row()])).toEqual([]);
    key = 'a';
    store.bank([row()]);
    key = 'b';
    expect(store.list(), 'another key is another ledger').toEqual([]);
    key = 'a';
    expect(store.list()).toHaveLength(1);
  });
});

describe('the ledger in the database', () => {
  it('reads the member’s own rows, every course or one, and maps the database’s clock to milliseconds', async () => {
    calls.selectResult = { data: [{ user_id: 'user-1', dimension: 'tools', skill_id: 'tool.nmap', course_id: 'security-plus', level: 'verified', first_at: '2026-10-16T09:00:00+00:00', level_at: '2026-10-17T09:00:00+00:00', via: [{ taskId: 't', stepIds: ['a'] }] }], error: null };
    await hydrateEarned();
    expect(calls.selects[0]).toMatchObject({ table: 'earned_skills', eq: [['user_id', 'user-1']], range: [0, expect.any(Number)] });
    expect(supabaseEarnedRepo.list()).toEqual([{ dimension: 'tools', id: 'tool.nmap', courseId: 'security-plus', level: 'verified', firstAt: Date.parse('2026-10-16T09:00:00Z'), levelAt: Date.parse('2026-10-17T09:00:00Z'), via: [{ taskId: 't', stepIds: ['a'] }] }]);
    await hydrateEarned('ccna');
    expect(calls.selects[1].eq).toEqual([['user_id', 'user-1'], ['course_id', 'ccna']]);
  });

  it('banks at once in the cache, then upserts without a time of its own and with the unique key', async () => {
    const changed = supabaseEarnedRepo.bank([row({ level: 'verified' })]);
    expect(changed).toHaveLength(1);
    expect(supabaseEarnedRepo.list('security-plus')).toHaveLength(1);
    await vi.waitFor(() => expect(calls.upserts).toHaveLength(1));
    expect(calls.upserts[0].opts).toEqual({ onConflict: 'user_id,dimension,skill_id' });
    expect(calls.upserts[0].rows[0]).toEqual({ user_id: 'user-1', dimension: 'skills', skill_id: 'comp.recon.osint', course_id: 'security-plus', level: 'verified', via: [{ taskId: 't1', stepIds: ['s1'] }] });
    for (const k of ['first_at', 'level_at', 'firstAt', 'levelAt']) expect(k in calls.upserts[0].rows[0], k).toBe(false);
  });

  it('writes nothing for a candidate that adds or raises nothing', async () => {
    supabaseEarnedRepo.bank([row({ level: 'verified' })]);
    await vi.waitFor(() => expect(calls.upserts).toHaveLength(1));
    expect(supabaseEarnedRepo.bank([row({ level: 'practised' }), row({ level: 'verified' })])).toEqual([]);
    await Promise.resolve();
    expect(calls.upserts, 'no second write').toHaveLength(1);
  });

  it('keeps a write that failed and tries it again with the next bank', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    calls.upsertResult = { error: { code: '57014', message: 'timeout' } };
    supabaseEarnedRepo.bank([row()]);
    await vi.waitFor(() => expect(calls.upserts).toHaveLength(1));
    await vi.waitFor(() => expect(errors).toHaveBeenCalled());
    expect(supabaseEarnedRepo.list(), 'the page still has it').toHaveLength(1);
    calls.upsertResult = { error: null };
    supabaseEarnedRepo.bank([]);
    await vi.waitFor(() => expect(calls.upserts).toHaveLength(2));
    expect(calls.upserts[1].rows).toHaveLength(1);
    supabaseEarnedRepo.bank([]);
    await Promise.resolve();
    expect(calls.upserts, 'done: nothing left to write').toHaveLength(2);
    errors.mockRestore();
  });

  it('keeps the ledger on this device, per account, while the database has no table for it', async () => {
    calls.upsertResult = { error: { code: '42P01', message: 'relation "public.earned_skills" does not exist' } };
    supabaseEarnedRepo.bank([row({ level: 'verified' })]);
    await vi.waitFor(() => expect(cache.earnedMissing()).toBe(true));
    expect(supabaseEarnedRepo.list()).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(KEYS.earnedSkillsFor('user-1'))!)).toHaveLength(1);
    expect(localStorage.getItem(KEYS.earnedSkillsFor('user-2'))).toBeNull();
    supabaseEarnedRepo.bank([row({ id: 'comp.other' })]);
    expect(calls.upserts, 'once the table is known to be missing the database is not asked again').toHaveLength(1);
    expect(supabaseEarnedRepo.list()).toHaveLength(2);
  });

  it('says the table is missing when it is read, and never throws', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    calls.selectResult = { data: null, error: { code: '42P01', message: 'relation "public.earned_skills" does not exist' } };
    await expect(hydrateEarned()).resolves.toBeUndefined();
    expect(cache.earnedMissing()).toBe(true);
    expect(errors, 'a missing table is not an error on a page').not.toHaveBeenCalled();
    calls.selectResult = { data: null, error: { code: '42501', message: 'permission denied' } };
    await expect(hydrateEarned()).resolves.toBeUndefined();
    expect(errors).toHaveBeenCalledTimes(1);
    errors.mockRestore();
  });

  it('a read never lowers what this device banked, and signing out clears the member’s ledger', async () => {
    supabaseEarnedRepo.bank([row({ level: 'verified' })]);
    calls.selectResult = { data: [{ dimension: 'skills', skill_id: 'comp.recon.osint', course_id: 'security-plus', level: 'practised', first_at: '2026-10-16T09:00:00Z', level_at: '2026-10-16T09:00:00Z', via: [] }], error: null };
    await hydrateEarned();
    expect(supabaseEarnedRepo.list()[0].level).toBe('verified');
    setCurrentUserId(null);
    expect(supabaseEarnedRepo.list()).toEqual([]);
    expect(supabaseEarnedRepo.bank([row()]), 'no account, no ledger').toEqual([]);
  });

  it('reads a row from the database as a ledger row, and drops one that is not', () => {
    expect(earnedFromRow({ dimension: 'domains', skill_id: 'd1', course_id: 'ccna', level: 'reviewed', first_at: null, level_at: null, via: null })).toEqual({ dimension: 'domains', id: 'd1', courseId: 'ccna', level: 'reviewed', firstAt: 0, levelAt: 0, via: [] });
    expect(earnedFromRow({ dimension: 'ability', skill_id: 'x', course_id: 'c', level: 'verified' })).toBeNull();
    expect(earnedFromRow({ dimension: 'skills', skill_id: 'x', course_id: 'c', level: 'not-started' })).toBeNull();
  });
});

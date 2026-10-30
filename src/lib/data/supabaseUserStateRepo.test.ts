// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * R149 — the state blob is merged, not rewritten: two devices each patch only the keys they own, so a
 * timer tick on one can no longer erase the Week-0 acknowledgement given on the other. A project that
 * has not run 0027 (no merge function) falls back to the whole-blob upsert, which is what `save` did.
 */
const db = vi.hoisted(() => ({
  rpcs: [] as { fn: string; args: Record<string, unknown> }[],
  upserts: [] as Record<string, unknown>[],
  rpcError: null as null | { code: string; message: string },
}));
const state = vi.hoisted(() => ({ cache: new Map<string, Record<string, unknown>>() }));

vi.mock('../supabase/client', () => ({
  getBrowserClient: () => ({
    rpc: (fn: string, args: Record<string, unknown>) => ({ then: (res: (v: unknown) => unknown) => res({ error: db.rpcs.push({ fn, args }) && db.rpcError }) }),
    from: () => ({ upsert: (row: Record<string, unknown>) => ({ then: (res: (v: unknown) => unknown) => res({ error: db.upserts.push(row) && null }) }) }),
  }),
}));
vi.mock('./supabaseCache', () => ({
  cache: { userState: (c: string) => state.cache.get(c) ?? null, setUserState: (c: string, d: Record<string, unknown>) => state.cache.set(c, d) },
  getCurrentUserId: () => 'user-1',
}));
vi.mock('../useClientStore', () => ({ notifyStore: () => undefined }));
vi.mock('@/lib/toastBus', () => ({ toast: () => undefined }));

beforeEach(() => {
  db.rpcs = [];
  db.upserts = [];
  db.rpcError = null;
  state.cache.clear();
});

describe('R149 — user_course_state is patched on the server', () => {
  it('each device sends only its own keys, and the local cache holds the merge', async () => {
    const { supabaseUserStateRepo } = await import('./supabaseUserStateRepo');
    supabaseUserStateRepo.patch('security-plus', 'm', { homeBuildAck: true });
    supabaseUserStateRepo.patch('security-plus', 'm', { timers: { t1: { elapsedMs: 5, runningSince: null } } });
    expect(db.rpcs.map((r) => r.args.p_patch)).toEqual([{ homeBuildAck: true }, { timers: { t1: { elapsedMs: 5, runningSince: null } } }]);
    expect(db.rpcs.every((r) => r.fn === 'merge_user_course_state' && r.args.p_course_id === 'security-plus')).toBe(true);
    expect(state.cache.get('security-plus')).toEqual({ homeBuildAck: true, timers: { t1: { elapsedMs: 5, runningSince: null } } });
    expect(db.upserts).toEqual([]);
  });

  it('a key set to undefined is sent as null, which removes it', async () => {
    const { supabaseUserStateRepo } = await import('./supabaseUserStateRepo');
    state.cache.set('c', { resume: { week: 1, taskId: 't', stepId: 's', at: 1 }, mineSeen: 2 });
    supabaseUserStateRepo.patch('c', 'm', { resume: undefined });
    expect(db.rpcs[0].args.p_patch).toEqual({ resume: null });
    expect(state.cache.get('c')).toEqual({ mineSeen: 2 });
  });

  it('falls back to the whole-blob upsert when the merge function is missing', async () => {
    db.rpcError = { code: 'PGRST202', message: 'Could not find the function public.merge_user_course_state in the schema cache' };
    const { supabaseUserStateRepo } = await import('./supabaseUserStateRepo');
    state.cache.set('c', { mineSeen: 1 });
    supabaseUserStateRepo.patch('c', 'm', { homeBuildAck: true });
    expect(db.upserts).toHaveLength(1);
    expect(db.upserts[0]).toMatchObject({ user_id: 'user-1', course_id: 'c', data: { mineSeen: 1, homeBuildAck: true } });
  });
});

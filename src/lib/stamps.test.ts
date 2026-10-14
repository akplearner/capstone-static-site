import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// R113: the client half of server stamps and receipts. Every failure falls
// back to the client stamp; only a stamp this module holds for the signed-in
// member's own task is ever sent back, and the receipt body is exactly the
// seven fields the function accepts, none of them the paste.
const env = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  client: true,
  invoke: vi.fn(),
  setReceipt: vi.fn(),
}));

vi.mock('./supabase/client', () => ({ getBrowserClient: () => (env.client ? { functions: { invoke: env.invoke } } : null) }));
vi.mock('./data/supabaseCache', () => ({ getCurrentUserId: () => env.userId, cache: { setReceipt: env.setReceipt } }));
vi.mock('./useClientStore', () => ({ notifyStore: vi.fn() }));

const load = async () => {
  vi.resetModules();
  return import('./stamps');
};

const NOW = Date.parse('2026-10-14T10:00:00Z');
const issued = (minutes: number) => ({ data: { stamp: 'CQ-ABC234', expiresAt: new Date(NOW + minutes * 60_000).toISOString() }, error: null });
const refused = (status: number, code = '') => ({ data: null, error: { name: 'FunctionsHttpError', context: new Response(JSON.stringify({ error: code }), { status }) } });
const receipt = { userId: 'u1', courseId: 'security-plus', taskId: 't1', stepId: 's1', stamp: 'CQ-ABC234', outputSha256: 'f'.repeat(64), matchedTokens: 3, totalTokens: 3 };

beforeEach(() => {
  env.userId = 'u1';
  env.client = true;
  env.invoke.mockReset();
  env.setReceipt.mockReset();
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('server stamps', () => {
  it('asks nothing offline, signed out, or for anyone but the signed-in member', async () => {
    env.client = false;
    let m = await load();
    expect(await m.fetchStamp('u1', 'security-plus', 't1')).toBeNull();
    expect(await m.requestReceipt(receipt)).toBe('offline');
    env.client = true;
    env.userId = 'u2';
    m = await load();
    expect(await m.fetchStamp('u1', 'security-plus', 't1')).toBeNull();
    expect(env.invoke).not.toHaveBeenCalled();
  });

  it('holds the issued stamp, shares one request between callers, and marks it expired when its time runs out', async () => {
    env.invoke.mockResolvedValue(issued(20));
    const m = await load();
    const [a, b] = await Promise.all([m.fetchStamp('u1', 'security-plus', 't1'), m.fetchStamp('u1', 'security-plus', 't1')]);
    expect(env.invoke).toHaveBeenCalledTimes(1);
    expect(env.invoke).toHaveBeenCalledWith('stamp', { body: { courseId: 'security-plus', taskId: 't1' } });
    expect(a).toEqual({ stamp: 'CQ-ABC234', expiresAt: NOW + 20 * 60_000, expired: false });
    expect(b).toEqual(a);
    vi.advanceTimersByTime(20 * 60_000 + 1);
    // Expired on screen: a match is not sent for a receipt the server would refuse.
    expect(await m.requestReceipt(receipt)).toBe('stamp-expired');
    expect(env.invoke).toHaveBeenCalledTimes(1);
  });

  it('stops asking once the platform says the function does not exist, and refuses a malformed answer', async () => {
    env.invoke.mockResolvedValue(refused(404));
    let m = await load();
    expect(await m.fetchStamp('u1', 'security-plus', 't1')).toBeNull();
    expect(await m.fetchStamp('u1', 'security-plus', 't2')).toBeNull();
    expect(env.invoke).toHaveBeenCalledTimes(1);
    env.invoke.mockReset();
    env.invoke.mockResolvedValue({ data: { stamp: 'CQ-ABCDEL', expiresAt: new Date(NOW + 60_000).toISOString() }, error: null });
    m = await load();
    expect(await m.fetchStamp('u1', 'security-plus', 't1'), 'a look-alike symbol is not a stamp').toBeNull();
  });
});

describe('receipts', () => {
  it('sends exactly the seven fields for a held stamp and records the receipt', async () => {
    env.invoke.mockResolvedValueOnce(issued(20)).mockResolvedValueOnce({ data: { receiptedAt: '2026-10-14T10:01:00Z' }, error: null });
    const m = await load();
    await m.fetchStamp('u1', 'security-plus', 't1');
    expect(await m.requestReceipt(receipt)).toBe('receipted');
    const [name, { body }] = env.invoke.mock.calls[1];
    expect(name).toBe('receipt');
    expect(Object.keys(body).sort()).toEqual(['courseId', 'matchedTokens', 'outputSha256', 'stamp', 'stepId', 'taskId', 'totalTokens']);
    expect(env.setReceipt).toHaveBeenCalledWith({ courseId: 'security-plus', taskId: 't1', stepId: 's1', outputSha256: 'f'.repeat(64), receiptedAt: Date.parse('2026-10-14T10:01:00Z') }, 'u1');
  });

  it('never sends a stamp it did not issue', async () => {
    env.invoke.mockResolvedValueOnce(issued(20));
    const m = await load();
    await m.fetchStamp('u1', 'security-plus', 't1');
    expect(await m.requestReceipt({ ...receipt, stamp: 'CQ-ZZZ999' })).toBe('offline');
    expect(await m.requestReceipt({ ...receipt, taskId: 't2' })).toBe('offline');
    expect(env.invoke).toHaveBeenCalledTimes(1);
  });

  it('reads the function’s refusals: already receipted counts, expired and unknown do not', async () => {
    for (const [code, outcome] of [['stamp-used', 'receipted'], ['stamp-expired', 'stamp-expired'], ['stamp-mismatch', 'stamp-unknown'], ['stamp-unknown', 'stamp-unknown']] as const) {
      env.invoke.mockReset();
      env.invoke.mockResolvedValueOnce(issued(20)).mockResolvedValueOnce(refused(409, code));
      const m = await load();
      await m.fetchStamp('u1', 'security-plus', 't1');
      expect(await m.requestReceipt(receipt), code).toBe(outcome);
    }
    expect(env.setReceipt).not.toHaveBeenCalled();
  });
});

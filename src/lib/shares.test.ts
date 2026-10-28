import { describe, it, expect, vi, beforeEach } from 'vitest';

// R114: the member's half of candidate links and the reader's. The same
// guard the `share` function runs refuses an identity-carrying copy before
// any request; every failure reads as a plain outcome, never an exception.
const env = vi.hoisted(() => ({
  client: true,
  invoke: vi.fn(),
  selectResult: { data: [] as unknown[] | null, error: null as null | { code: string; message: string } },
}));

vi.mock('./supabase/client', () => ({
  getBrowserClient: () =>
    env.client
      ? {
          functions: { invoke: env.invoke },
          from: () => ({ select: () => ({ order: async () => env.selectResult }) }),
        }
      : null,
}));

import { createShare, fetchShared, listShares, shareStatus, shareUrl, tokenFromHash } from './shares';

const TOKEN = 'A'.repeat(43);
const profile = { schema: 'capstone-member-profile/3', signature: null, subject: { display: 'Grace' }, courses: [] };
const refused = (status: number, code = '') => ({ data: null, error: { name: 'FunctionsHttpError', context: new Response(JSON.stringify({ error: code }), { status }) } });

beforeEach(() => {
  env.client = true;
  env.invoke.mockReset();
  env.selectResult = { data: [], error: null };
});

describe('candidate links — the URL', () => {
  it('carries the token in the fragment, which no server sees, and reads it back only when well formed', () => {
    expect(shareUrl('https://app.example', TOKEN)).toBe(`https://app.example/share#${TOKEN}`);
    expect(tokenFromHash(`#${TOKEN}`)).toBe(TOKEN);
    expect(tokenFromHash('#short')).toBeNull();
    expect(tokenFromHash('')).toBeNull();
  });

  it('a link is live until it expires or is revoked', () => {
    const now = Date.parse('2026-10-14T00:00:00Z');
    expect(shareStatus({ expiresAt: '2026-11-13T00:00:00Z', revokedAt: null }, now)).toBe('live');
    expect(shareStatus({ expiresAt: '2026-10-13T00:00:00Z', revokedAt: null }, now)).toBe('expired');
    expect(shareStatus({ expiresAt: '2026-11-13T00:00:00Z', revokedAt: '2026-10-13T00:00:00Z' }, now)).toBe('revoked');
  });
});

describe('candidate links — creating one', () => {
  it('refuses a copy that names the member before asking anyone', async () => {
    const r = await createShare({ kind: 'profile', days: 30, label: '', snapshot: { ...profile, subject: { display: 'grace@example.com' } } });
    expect(r).toEqual({ ok: false, error: 'identity-in-snapshot' });
    expect(env.invoke).not.toHaveBeenCalled();
  });

  it('returns the token once on success, and reads the refusals as outcomes', async () => {
    env.invoke.mockResolvedValueOnce({ data: { id: 'id-1', token: TOKEN, expiresAt: '2026-11-13T00:00:00Z' }, error: null });
    expect(await createShare({ kind: 'profile', days: 30, label: 'For Example Ltd', snapshot: profile })).toEqual({ ok: true, id: 'id-1', token: TOKEN, expiresAt: '2026-11-13T00:00:00Z' });
    expect(env.invoke).toHaveBeenCalledWith('share', { body: { kind: 'profile', days: 30, label: 'For Example Ltd', snapshot: profile } });
    for (const [answer, error] of [
      [refused(403, 'consent-required'), 'consent-required'],
      [refused(404), 'unavailable'],
      [refused(503, 'share-unavailable'), 'unavailable'],
      [refused(503, 'not-configured'), 'unavailable'],
      [{ data: null, error: { name: 'FunctionsFetchError', context: new TypeError('Failed to fetch') } }, 'unavailable'],
      [refused(500, 'share-failed'), 'failed'],
      [{ data: { id: 'x', token: 'not-a-token', expiresAt: 'x' }, error: null }, 'failed'],
    ] as const) {
      env.invoke.mockResolvedValueOnce(answer);
      expect(await createShare({ kind: 'profile', days: 30, label: '', snapshot: profile }), error).toEqual({ ok: false, error });
    }
  });

  it('offline there are no links: nothing to create, nothing to list, nothing to read', async () => {
    env.client = false;
    expect(await createShare({ kind: 'profile', days: 7, label: '', snapshot: profile })).toEqual({ ok: false, error: 'offline' });
    expect(await listShares()).toBeNull();
    expect(await fetchShared(TOKEN)).toBeNull();
  });
});

describe('candidate links — listing and reading', () => {
  it('lists the granted columns and hides the section on a project without 0015', async () => {
    env.selectResult = { data: [{ id: 'id-1', kind: 'profile', label: 'L', measured_against: '', created_at: 'c', expires_at: 'e', revoked_at: null }], error: null };
    expect(await listShares()).toEqual([{ id: 'id-1', kind: 'profile', label: 'L', measuredAgainst: '', createdAt: 'c', expiresAt: 'e', revokedAt: null }]);
    env.selectResult = { data: null, error: { code: 'PGRST205', message: "Could not find the table 'public.profile_shares' in the schema cache" } };
    expect(await listShares()).toBeNull();
  });

  it('reads a live link, and anything else as not available', async () => {
    env.invoke.mockResolvedValueOnce({ data: { kind: 'profile', snapshot: profile, measuredAgainst: '', createdAt: 'c', expiresAt: 'e' }, error: null });
    expect((await fetchShared(TOKEN))?.snapshot).toEqual(profile);
    env.invoke.mockResolvedValueOnce(refused(404, 'not-available'));
    expect(await fetchShared(TOKEN)).toBeNull();
    expect(await fetchShared('bad')).toBeNull();
  });
});

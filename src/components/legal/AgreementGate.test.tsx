// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AGREEMENTS } from '@/lib/legal/agreements';

/**
 * R149 — the acknowledgement gate never shows a returning account the first-time "Welcome":
 * a failed read becomes a Retry screen, an empty read is believed only once the session is
 * confirmed to be this account's, and a session fault on Accept refreshes instead of signing out.
 */
const auth = vi.hoisted(() => ({ user: { id: 'user-1' } as { id: string } | null, loading: false, signOut: vi.fn(async () => undefined) }));
const acc = vi.hoisted(() => ({
  reads: [] as (Record<string, number> | null)[],
  session: 'ok' as 'ok' | 'none' | 'other',
  refreshed: 0,
  accepted: { ok: true } as { ok: true } | { ok: false; reason: 'session' | 'permission' | 'network'; support: { code: string; at: string } },
  queued: [] as string[][],
  flushed: 0,
}));

vi.mock('@/lib/useAuth', () => ({ useAuth: () => auth }));
vi.mock('next/navigation', () => ({ usePathname: () => '/courses/security-plus' }));
vi.mock('@/components/ui/Toast', () => ({ toast: vi.fn() }));
vi.mock('@/lib/reportError', () => ({ supportLine: () => 'Support code X.' }));
vi.mock('@/lib/legal/acceptances', () => ({
  isCloudMode: () => true,
  fetchCloudAcceptances: async () => (acc.reads.length ? acc.reads.shift()! : {}),
  sessionMatches: async () => acc.session,
  refreshSession: async () => { acc.refreshed++; },
  pendingAcceptances: () => ({}),
  queuePendingAcceptances: (_u: string, list: { id: string }[]) => { acc.queued.push(list.map((a) => a.id)); },
  flushPendingAcceptances: async () => { acc.flushed++; },
  acceptInCloudDetailed: async () => acc.accepted,
  acceptLocally: () => undefined,
  localAcceptances: () => ({}),
}));

const everything = Object.fromEntries(AGREEMENTS.map((a) => [a.id, a.version]));
const load = async () => (await import('./AgreementGate')).LegalGateOverlay;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  auth.user = { id: 'user-1' };
  auth.signOut.mockClear();
  acc.reads = [];
  acc.session = 'ok';
  acc.refreshed = 0;
  acc.accepted = { ok: true };
  acc.queued = [];
  acc.flushed = 0;
});

describe('R149 — the gate reads before it asks', () => {
  it('covers the app while reading, then opens when the account has accepted everything', async () => {
    acc.reads = [everything];
    const Gate = await load();
    render(<Gate />);
    expect(screen.getByText(/Checking your agreements/)).toBeTruthy();
    await waitFor(() => expect(screen.queryByText(/Checking your agreements/)).toBeNull());
    expect(screen.queryByText(/Welcome/)).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(acc.flushed).toBe(1);
  });

  it('a read that fails three times becomes a Retry screen, never the Welcome checklist', async () => {
    acc.reads = [null, null, null, null];
    const Gate = await load();
    render(<Gate />);
    await act(async () => { await vi.advanceTimersByTimeAsync(13000); });
    await waitFor(() => expect(screen.getByText(/We couldn’t check your agreements/)).toBeTruthy());
    expect(screen.queryByText(/Welcome/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('an empty log with no live session is a failed read, not a new account', async () => {
    acc.reads = [{}, {}];
    acc.session = 'none';
    const Gate = await load();
    render(<Gate />);
    await waitFor(() => expect(screen.getByText(/We couldn’t check your agreements/)).toBeTruthy());
    expect(acc.refreshed).toBe(1);
    expect(screen.queryByText(/Welcome/)).toBeNull();
  });

  it('an empty log with a live session is a new account and gets the Welcome checklist', async () => {
    acc.reads = [{}];
    const Gate = await load();
    render(<Gate />);
    await waitFor(() => expect(screen.getByText(/Welcome\./)).toBeTruthy());
  });

  it('a version bump asks only for what changed, by name', async () => {
    acc.reads = [{ ...everything, [AGREEMENTS[0].id]: 1 }];
    const Gate = await load();
    render(<Gate />);
    await waitFor(() => expect(screen.getByText(/Changed since you last accepted/)).toBeTruthy());
    // The title appears in the changed-since line and on its own card; both are expected.
    expect(screen.getAllByText(new RegExp(AGREEMENTS[0].title)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Changed since you last accepted/).textContent).toContain(AGREEMENTS[0].title);
  });

  it('a session fault on Accept refreshes and lets them retry — it never signs them out', async () => {
    acc.reads = [{}];
    acc.accepted = { ok: false, reason: 'session', support: { code: 'X', at: 'now' } };
    const Gate = await load();
    render(<Gate />);
    await waitFor(() => expect(screen.getByText(/Welcome\./)).toBeTruthy());
    for (const box of screen.getAllByRole('checkbox')) await act(async () => { box.click(); });
    await act(async () => { screen.getByRole('button', { name: /Agree & continue/ }).click(); });
    await waitFor(() => expect(acc.refreshed).toBe(1));
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it('a network fault opens the app for this visit and queues the acceptance for the next load', async () => {
    acc.reads = [{}];
    acc.accepted = { ok: false, reason: 'network', support: { code: 'X', at: 'now' } };
    const Gate = await load();
    render(<Gate />);
    await waitFor(() => expect(screen.getByText(/Welcome\./)).toBeTruthy());
    for (const box of screen.getAllByRole('checkbox')) await act(async () => { box.click(); });
    await act(async () => { screen.getByRole('button', { name: /Agree & continue/ }).click(); });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(acc.queued).toEqual([AGREEMENTS.map((a) => a.id)]);
  });
});

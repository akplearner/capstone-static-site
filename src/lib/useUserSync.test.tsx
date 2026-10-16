import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

/**
 * R126 — the dashboard and the portfolio read an account's whole record from a cache this hook fills.
 * Two things the record needed: it says when the first load has landed (an empty dashboard before
 * that is not an answer), and a page left open is current again when it is looked at.
 */
const state = vi.hoisted(() => ({ cloud: true, user: { id: 'u1' } as { id: string } | null, resolve: null as null | (() => void), hydrations: 0, notified: 0 }));
vi.mock('./useAuth', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('./supabase/config', () => ({ isSupabaseConfigured: () => state.cloud }));
vi.mock('./useClientStore', () => ({ notifyStore: () => void (state.notified += 1) }));
vi.mock('./data/supabaseCache', () => ({
  setCurrentUserId: vi.fn(),
  hydrateUser: () => {
    state.hydrations += 1;
    return new Promise<void>((resolve) => {
      state.resolve = resolve;
    });
  },
}));

const { useUserSync, REFRESH_MS } = await import('./useUserSync');

const settle = async () => {
  await act(async () => {
    state.resolve?.();
    await Promise.resolve();
  });
};
const look = (visible = true) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (visible ? 'visible' : 'hidden') });
  act(() => {
    window.dispatchEvent(new Event('focus'));
  });
};

beforeEach(() => {
  state.cloud = true;
  state.user = { id: 'u1' };
  state.resolve = null;
  state.hydrations = 0;
  state.notified = 0;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(1_000_000);
});
afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
});

describe('useUserSync', () => {
  it('is not ready until the first load of the account has landed, then is', async () => {
    const { result } = renderHook(() => useUserSync());
    expect(state.hydrations).toBe(1);
    expect(result.current.ready).toBe(false);
    await settle();
    expect(result.current.ready).toBe(true);
  });

  it('is ready at once offline, and for a signed-out visitor, with nothing to load', () => {
    state.cloud = false;
    expect(renderHook(() => useUserSync()).result.current.ready).toBe(true);
    expect(state.hydrations).toBe(0);
    state.cloud = true;
    state.user = null;
    expect(renderHook(() => useUserSync()).result.current.ready).toBe(true);
  });

  it('loads the account again when the page is looked at, every reader re-reads, and not more than every ten seconds', async () => {
    renderHook(() => useUserSync());
    await settle();
    expect(state.hydrations).toBe(1);
    vi.setSystemTime(1_000_000 + REFRESH_MS + 1);
    look();
    expect(state.hydrations, 'looked at after a while: loaded again').toBe(2);
    expect(state.notified).toBeGreaterThan(0);
    look();
    look();
    expect(state.hydrations, 'looked at again at once: not again').toBe(2);
    vi.setSystemTime(1_000_000 + 3 * REFRESH_MS);
    look();
    expect(state.hydrations).toBe(3);
  });

  it('does nothing while the tab is hidden, and refreshes when it becomes visible', async () => {
    renderHook(() => useUserSync());
    await settle();
    vi.setSystemTime(1_000_000 + 2 * REFRESH_MS);
    look(false);
    expect(state.hydrations).toBe(1);
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(state.hydrations).toBe(2);
  });

  it('offline it only asks the readers to re-read when the page is looked at', () => {
    state.cloud = false;
    renderHook(() => useUserSync());
    look();
    expect(state.hydrations).toBe(0);
    expect(state.notified).toBeGreaterThan(0);
  });

  it('stops listening when the page goes', async () => {
    const { unmount } = renderHook(() => useUserSync());
    await settle();
    unmount();
    vi.setSystemTime(1_000_000 + 5 * REFRESH_MS);
    look();
    expect(state.hydrations).toBe(1);
  });
});

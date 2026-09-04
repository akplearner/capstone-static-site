'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';

// External-store helpers for client-only data (localStorage-backed repos).
//
// These replace the old "read in useEffect, then setState" pattern, which
// triggered React 19's react-hooks/set-state-in-effect rule. useSyncExternalStore
// gives us SSR-safe snapshots (the server snapshot matches the repos' hasWindow()
// defaults) without an effect, and a same-tab notification channel so writes in
// one component update every reader live.

const STORE_EVENT = 'capstone:store';

// Stable module-level defaults so getServerSnapshot returns a referentially
// stable value (React warns otherwise).
export const EMPTY_ARRAY: never[] = [];
export const EMPTY_OBJECT: Record<string, never> = {};

/** Call after any localStorage write so all useClientStore readers re-read. */
export function notifyStore(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(STORE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(STORE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(STORE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * Subscribe to a client-only value derived from `read()`. The snapshot is cached
 * by its serialized form so the reference stays stable while the value is
 * unchanged — required because the repos return fresh objects each call, which
 * would otherwise loop useSyncExternalStore. `serverValue` must be referentially
 * stable across renders (pass a primitive or a module-level constant).
 *
 * ── `key`, and what the cache does and does not buy you ──
 * The cache stabilises the REFERENCE, not the WORK. `read()` and the
 * `JSON.stringify` below run on every render AND on every one of the ~34
 * `notifyStore()` broadcasts, per subscriber — because this is one global event
 * and every subscriber wakes on all of it. For a small scalar that is nothing.
 * For a whole `Course` it is every week, task, step and command serialised, on
 * every page, to answer a question that did not change.
 *
 * So a caller that already knows a cheap identity for its value can pass one.
 * `key` receives the freshly read value and returns a string that changes
 * exactly when the value should be treated as changed. It must be genuinely
 * sufficient: a key that misses a change silently freezes the UI, which is worse
 * than the cost it saves. Omit it and the default deep-serialisation applies,
 * which is always correct.
 */
export function useClientStore<T>(read: () => T, serverValue: T, key?: (value: T) => string): T {
  // Cache the snapshot by its serialized form so the reference stays stable while
  // the value is unchanged (the repos return fresh objects each call, which would
  // otherwise loop useSyncExternalStore). The cache is only touched inside
  // getSnapshot, which is the React-sanctioned place to memoize a store snapshot.
  const cache = useRef<{ key: string; value: T } | null>(null);
  // In a ref so a caller may pass an inline arrow without re-keying every render.
  const keyRef = useRef(key);
  useEffect(() => {
    keyRef.current = key;
  });

  const getSnapshot = (): T => {
    const value = read();
    const k = keyRef.current;
    const cacheKey = (k ? k(value) : JSON.stringify(value)) ?? 'undefined';
    if (!cache.current || cache.current.key !== cacheKey) {
      cache.current = { key: cacheKey, value };
    }
    return cache.current.value;
  };

  const getServerSnapshot = (): T => serverValue;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const noopSubscribe = () => () => {};
const trueSnapshot = () => true;
const falseSnapshot = () => false;

/**
 * False during SSR and the first hydration render, true afterward. A lint-clean
 * replacement for the manual `ready`/`loading` flags that used a mount effect.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, trueSnapshot, falseSnapshot);
}

/**
 * The component-test harness. vitest ran only `src/**\/*.test.ts` until R68,
 * so no React component was ever rendered in a test — the guards are
 * source-text greps for exactly that reason. This file is what a `.test.tsx`
 * needs that jsdom does not provide.
 */
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

afterEach(() => {
  cleanup();
});

// framer-motion reads the reduced-motion media query on mount.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// jsdom has no layout: the palette and the deep links scroll rows into view.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

// SiteNav publishes its height through a ResizeObserver.
if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (window as unknown as { ResizeObserver: typeof RO }).ResizeObserver = RO;
}

// The evidence ledger hashes pasted output with SubtleCrypto.
if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}

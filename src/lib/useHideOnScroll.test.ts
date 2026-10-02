import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHideOnScroll } from './useHideOnScroll';

/** R100 — the header hides on a scroll down past the top and returns on the first scroll up. */
const frames: FrameRequestCallback[] = [];
function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
  window.dispatchEvent(new Event('scroll'));
  // The hook reads scrollY on the next frame: run it.
  frames.splice(0).forEach((cb) => cb(0));
}

describe('useHideOnScroll', () => {
  beforeEach(() => {
    scrollTo(0);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });
  afterEach(() => vi.unstubAllGlobals());

  it('hides after scrolling down past minY, shows again on a scroll up or near the top', () => {
    const { result } = renderHook(() => useHideOnScroll(true, { minY: 96, delta: 10 }));
    expect(result.current).toBe(false);
    act(() => scrollTo(40)); // still inside the top band
    expect(result.current).toBe(false);
    act(() => scrollTo(400));
    expect(result.current).toBe(true);
    act(() => scrollTo(395)); // jitter inside delta: no change
    expect(result.current).toBe(true);
    act(() => scrollTo(300));
    expect(result.current).toBe(false);
    act(() => scrollTo(900));
    expect(result.current).toBe(true);
    act(() => scrollTo(20));
    expect(result.current).toBe(false);
  });

  it('never hides while disabled, and forgets a hidden state when disabled', () => {
    const { result, rerender } = renderHook(({ on }) => useHideOnScroll(on), { initialProps: { on: true } });
    act(() => scrollTo(600));
    expect(result.current).toBe(true);
    rerender({ on: false });
    expect(result.current).toBe(false);
    act(() => scrollTo(1200));
    expect(result.current).toBe(false);
  });
});

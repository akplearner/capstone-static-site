import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import { TasksLayout, useSplitView, SPLIT_QUERY } from './TasksLayout';

/** R100 — the Tasks tab goes two-column exactly at the split query. */
function mockMedia(matches: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    matches,
    media: SPLIT_QUERY,
    addEventListener: (_: string, l: () => void) => listeners.add(l),
    removeEventListener: (_: string, l: () => void) => listeners.delete(l),
  };
  const spy = vi.spyOn(window, 'matchMedia').mockImplementation(() => mql as unknown as MediaQueryList);
  return {
    spy,
    set(next: boolean) {
      mql.matches = next;
      listeners.forEach((l) => l());
    },
  };
}

afterEach(() => vi.restoreAllMocks());

describe('TasksLayout', () => {
  it('useSplitView follows the media query live', () => {
    const m = mockMedia(false);
    const { result } = renderHook(() => useSplitView());
    expect(result.current).toBe(false);
    act(() => m.set(true));
    expect(result.current).toBe(true);
    expect(m.spy).toHaveBeenCalledWith(SPLIT_QUERY);
  });

  it('stacks below the breakpoint and splits into a sticky list beside the pane above it', () => {
    const { container, rerender } = render(<TasksLayout split={false} list={<p>list</p>} pane={<p>pane</p>} />);
    expect(container.firstElementChild).toHaveAttribute('data-layout', 'stacked');
    rerender(<TasksLayout split list={<p>list</p>} pane={<p>pane</p>} />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('data-layout', 'split');
    expect(root.className).toContain('grid-cols-[22rem_minmax(0,1fr)]');
    const left = root.firstElementChild as HTMLElement;
    expect(left.className).toContain('sticky');
    expect(left.className).toContain('overflow-y-auto');
    expect(left.style.top).toContain('--subnav-h');
    expect(left.textContent).toBe('list');
    expect(root.lastElementChild!.textContent).toBe('pane');
  });
});

'use client';

import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';

/**
 * R100 — the Tasks tab in two columns when the window is wide enough.
 *
 * Left: the week's list (sticky, scrolling on its own under the two bars).
 * Right: the open task. A student reading a task no longer scrolls past the
 * list to reach it, and clicking the next row swaps the pane in place.
 * Below the breakpoint the tab stacks exactly as before, so a phone or a
 * narrow side-by-side window loses nothing.
 */
export const SPLIT_QUERY = '(min-width: 68.75rem)'; // 1100px at 16px

const subscribe = (onChange: () => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia(SPLIT_QUERY);
  mq.addEventListener?.('change', onChange);
  return () => mq.removeEventListener?.('change', onChange);
};
const read = () => (typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(SPLIT_QUERY).matches) || false;

/** True when the Tasks tab should draw the list beside the open task. */
export function useSplitView(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}

interface TasksLayoutProps {
  split: boolean;
  /** The week's list: rail, header, picture, objectives, rows. */
  list: ReactNode;
  /** The open task, or what stands in for it (the week picture at full size). */
  pane?: ReactNode;
}

export function TasksLayout({ split, list, pane }: TasksLayoutProps) {
  if (!split) {
    return (
      <div data-layout="stacked" className="space-y-4">
        {list}
        {pane}
      </div>
    );
  }
  return (
    <div data-layout="split" className="grid grid-cols-[22rem_minmax(0,1fr)] items-start gap-5">
      <div
        className="sticky min-h-0 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]"
        style={{
          top: 'calc(var(--nav-top, var(--nav-h, 0px)) + var(--subnav-h, 3rem) + 0.75rem)',
          maxHeight: 'calc(100dvh - var(--nav-top, var(--nav-h, 0px)) - var(--subnav-h, 3rem) - 1.5rem)',
        }}
      >
        {list}
      </div>
      <div className="min-w-0">{pane}</div>
    </div>
  );
}

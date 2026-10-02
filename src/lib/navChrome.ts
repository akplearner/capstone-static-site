import { useSyncExternalStore } from 'react';

/**
 * R100 — whether the site header may hide while the reader scrolls down.
 *
 * Only the Tasks tab wants it (a student reading down a task gets the bar
 * back the moment they scroll up); every other page keeps the header pinned.
 * The course page flips this; `SiteNav` reads it. A module store rather than
 * context, because the header is rendered by the root layout, two trees away.
 */
let autoHide = false;
const listeners = new Set<() => void>();

export function setNavAutoHide(on: boolean): void {
  if (autoHide === on) return;
  autoHide = on;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function useNavAutoHide(): boolean {
  return useSyncExternalStore(subscribe, () => autoHide, () => false);
}

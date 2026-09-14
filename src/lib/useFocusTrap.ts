'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Keep keyboard focus inside a panel while it is open, and hand it back after.
 *
 * Extracted from `ui/Dialog` so the command palette shares the exact same
 * behaviour: focus moves into the panel on open (to the first focusable, or
 * the panel itself), Tab and Shift+Tab wrap at the ends, Escape closes, and
 * the element that had focus before is restored on close.
 *
 * `autoFocusFirst` is off for the palette, which focuses its own input.
 */
export function useFocusTrap(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  { autoFocusFirst = true }: { autoFocusFirst?: boolean } = {}
) {
  useEffect(() => {
    if (!open) return;
    const restore = document.activeElement as HTMLElement | null;
    const t = autoFocusFirst
      ? setTimeout(() => {
          const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
          (first ?? panelRef.current)?.focus();
        }, 0)
      : null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (!nodes || nodes.length === 0) return;
        const list = Array.from(nodes).filter((n) => !n.hasAttribute('disabled'));
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      if (t) clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      restore?.focus?.();
    };
  }, [open, onClose, panelRef, autoFocusFirst]);
}

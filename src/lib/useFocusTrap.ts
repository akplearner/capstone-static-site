'use client';

import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
/** What a person types into. */
const TEXT_ENTRY =
  'textarea, input:not([type]), input[type="text"], input[type="search"], input[type="email"], input[type="url"], input[type="tel"], input[type="password"], input[type="number"]';

const usable = (n: HTMLElement) => !n.hasAttribute('disabled');

/**
 * Where focus lands when a panel opens, so typing can start at once: an element marked
 * `data-autofocus`, else the first text field, else the first control that is not the panel's own
 * close button (a confirmation lands on its first choice), else the close button, else the panel.
 */
function initialTarget(panel: HTMLElement): HTMLElement {
  const marked = panel.querySelector<HTMLElement>('[data-autofocus]');
  if (marked) return marked;
  const field = Array.from(panel.querySelectorAll<HTMLElement>(TEXT_ENTRY)).find((n) => usable(n) && !n.hasAttribute('readonly'));
  if (field) return field;
  const first = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).find((n) => usable(n) && !n.hasAttribute('data-dialog-close'));
  return first ?? panel.querySelector<HTMLElement>('[data-dialog-close]') ?? panel;
}

/** Focus an element; in a field that already holds text (a draft kept from the last time) the caret goes to the end, where typing continues. */
function focusAtEnd(el: HTMLElement) {
  el.focus();
  if ((el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) && !el.readOnly) {
    try {
      const end = el.value.length;
      el.setSelectionRange(end, end);
    } catch {
      // A number or email field has no caret to move.
    }
  }
}

/**
 * Keep keyboard focus inside a panel while it is open, and hand it back after.
 *
 * The one copy of this behaviour, used by `ui/Dialog` and the command palette: focus moves into
 * the panel on open (see `initialTarget`), Tab and Shift+Tab wrap at the ends, Escape closes, and
 * the element that had focus before is restored on close.
 *
 * `autoFocusFirst` is off for the palette, which focuses its own input.
 *
 * R123 — the effect depends on `open` and nothing else. `onClose` is read through a ref, because
 * callers pass an inline arrow (`onClose={() => setOpen(false)}`) whose identity changes on every
 * render: with `onClose` in the dependency list, each keystroke in a field inside the panel
 * re-rendered the parent, re-ran the effect, handed focus back to the trigger and then moved it
 * to the first control, so a field took one character and the next space closed the dialog.
 */
export function useFocusTrap(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  { autoFocusFirst = true }: { autoFocusFirst?: boolean } = {}
) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const restore = document.activeElement as HTMLElement | null;
    const t = autoFocusFirst
      ? setTimeout(() => {
          const panel = panelRef.current;
          if (panel) focusAtEnd(initialTarget(panel));
        }, 0)
      : null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab') {
        const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (!nodes || nodes.length === 0) return;
        const list = Array.from(nodes).filter(usable);
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
  }, [open, panelRef, autoFocusFirst]);
}

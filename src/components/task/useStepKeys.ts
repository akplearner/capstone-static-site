import { useEffect, type RefObject } from 'react';

/**
 * R100 — ← / → walk the steps of the open task, Esc closes the open step.
 *
 * Only while the reader is IN the task (focus inside it, or nothing focused
 * and this is the only runner on the page), never while typing (inputs,
 * textareas, editable text), never when a dialog is open, and never when
 * another widget already handled the key (the objectives flow walks its own
 * nodes with the same arrows and calls `preventDefault`).
 */
export function useStepKeys({
  rootRef,
  enabled,
  ids,
  openId,
  onMove,
  onClose,
}: {
  rootRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  ids: string[];
  openId: string | null;
  onMove: (id: string) => void;
  /** Esc closes the open step. Omitted in guided mode, where a rung is always open. */
  onClose?: () => void;
}) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Escape') return;
      const active = document.activeElement as HTMLElement | null;
      if (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) return;
      if (active?.isContentEditable) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const root = rootRef.current;
      if (!root) return;
      const inside = active && active !== document.body ? root.contains(active) : document.querySelectorAll('[data-task-runner]').length === 1;
      if (!inside) return;
      if (e.key === 'Escape') {
        if (openId && onClose) {
          e.preventDefault();
          onClose();
        }
        return;
      }
      const i = openId ? ids.indexOf(openId) : -1;
      const next = e.key === 'ArrowRight' ? Math.min(ids.length - 1, i + 1) : Math.max(0, i - 1);
      if (next === i || ids.length === 0) return;
      e.preventDefault();
      onMove(ids[next]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rootRef, enabled, ids, openId, onMove, onClose]);
}

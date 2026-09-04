'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DeliverableData } from './types';

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved';

/**
 * Typing in a deliverable used to cost a whole document round-trip per character.
 *
 * The form is fully controlled off the repo, so every keystroke ran
 * `docsRepo.get` (JSON parse) → `docsRepo.save` (stringify + a synchronous
 * `localStorage.setItem`) → `notifyStore()`, and that last one makes EVERY
 * subscriber on the page re-read and re-serialise its own snapshot. On the
 * Deliverables page that is the team's entire document map, per character.
 *
 * So the keystroke now lands in React state and nothing else. The write is
 * coalesced and flushed once the student pauses. Three things make that safe:
 *
 *  1. `pending` is layered OVER the repo's data by `merge()`, so the form keeps
 *     rendering exactly what was typed while the write is still owed.
 *  2. Any pending work is flushed on unmount and when the tab is hidden — the
 *     two ways a student leaves without pausing first.
 *  3. `status` is the honest state of that promise, which is what the
 *     "Saving… / Saved" indicator reports. Before this the most common action
 *     in the product confirmed nothing at all.
 */
export function useAutoSave(
  persist: (id: string, data: DeliverableData) => void,
  delayMs = 500
) {
  const [pending, setPending] = useState<Record<string, DeliverableData>>({});
  const [status, setStatus] = useState<SaveStatus>('idle');

  // The queue is a ref as well as state: the flush must see the latest edits
  // without being re-created (and re-timed) on every keystroke.
  const queue = useRef<Record<string, DeliverableData>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistRef = useRef(persist);
  // In an effect, not during render: the flush reads this from a timer, long
  // after any render has committed.
  useEffect(() => {
    persistRef.current = persist;
  });

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const owed = queue.current;
    if (Object.keys(owed).length === 0) return;
    queue.current = {};
    setStatus('saving');
    for (const [id, data] of Object.entries(owed)) persistRef.current(id, data);
    // The overlay is dropped only now: until the repo has the value, it is the
    // only place the student's typing exists.
    setPending({});
    setStatus('saved');
  }, []);

  const save = useCallback(
    (id: string, data: DeliverableData) => {
      queue.current = { ...queue.current, [id]: data };
      setPending((p) => ({ ...p, [id]: data }));
      setStatus('pending');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delayMs);
    },
    [flush, delayMs]
  );

  // Leaving the page is the one case a debounce must not lose.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  /** What the form should render: the repo's data with unsaved edits on top. */
  const merge = useCallback(
    (saved: Record<string, DeliverableData>): Record<string, DeliverableData> =>
      Object.keys(pending).length === 0 ? saved : { ...saved, ...pending },
    [pending]
  );

  return { save, flush, merge, status };
}

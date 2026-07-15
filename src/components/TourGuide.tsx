'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useHydrated } from '@/lib/useClientStore';

export interface TourStep {
  /** data-tour attribute value to anchor on; omit (or missing element) → centered. */
  target?: string;
  title: string;
  body: string;
}

/** Fire this to (re)start the tour from anywhere: window.dispatchEvent(new Event(TOUR_EVENT)). */
export const TOUR_EVENT = 'capstone:start-tour';

type Rect = { top: number; left: number; width: number; height: number };

/**
 * A lightweight first-visit coachmark tour. Each step spotlights an element found
 * by `[data-tour="…"]` (box-shadow cutout + ring) with a tooltip; if the element
 * isn't present it falls back to a centered tooltip, so it never blocks the app.
 * Shown once (localStorage), and replayable via the TOUR_EVENT window event.
 */
export function TourGuide({
  steps,
  storageKey,
  autoStart = true,
}: {
  steps: TourStep[];
  storageKey: string;
  /** When false the tour won't auto-open on first visit (replay via TOUR_EVENT still works).
   *  Used to hold the tour until the student has joined, so its steps have on-screen targets. */
  autoStart?: boolean;
}) {
  const hydrated = useHydrated();
  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const targetRef = useRef<string | undefined>(undefined);

  const finish = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, '1');
    } catch {}
    setActive(false);
  }, [storageKey]);

  // Auto-start once, and listen for replay requests. (setState is deferred out of
  // the synchronous effect body so it runs after the first paint.)
  useEffect(() => {
    if (!hydrated) return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(storageKey) === '1';
    } catch {}
    const start = () => {
      setIdx(0);
      setActive(true);
    };
    let startId: number | undefined;
    if (autoStart && !seen && steps.length > 0) startId = window.setTimeout(start, 50);
    window.addEventListener(TOUR_EVENT, start);
    return () => {
      if (startId) window.clearTimeout(startId);
      window.removeEventListener(TOUR_EVENT, start);
    };
  }, [hydrated, storageKey, steps.length, autoStart]);

  // Position the spotlight on the current step's target.
  const measure = useCallback(() => {
    const t = targetRef.current;
    const el = t ? (document.querySelector(`[data-tour="${t}"]`) as HTMLElement | null) : null;
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    } else {
      setRect(null);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    targetRef.current = steps[idx]?.target;
    const el = targetRef.current ? (document.querySelector(`[data-tour="${targetRef.current}"]`) as HTMLElement | null) : null;
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const id = window.setTimeout(measure, 320);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      else if (e.key === 'ArrowRight') setIdx((i) => Math.min(i + 1, steps.length - 1));
      else if (e.key === 'ArrowLeft') setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [active, idx, steps, measure, finish]);

  if (!active || steps.length === 0) return null;

  const step = steps[idx];
  const last = idx === steps.length - 1;

  // Tooltip placement: under the target if it fits, else above; centered if no rect.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
  const TW = 320;
  let tipStyle: React.CSSProperties;
  if (rect) {
    const below = rect.top + rect.height + 150 < vh;
    const top = below ? rect.top + rect.height + 12 : Math.max(12, rect.top - 12 - 150);
    const left = Math.min(Math.max(8, rect.left), vw - TW - 8);
    tipStyle = { position: 'fixed', top, left, width: TW, zIndex: 101 };
  } else {
    tipStyle = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: TW, zIndex: 101 };
  }

  return (
    <div className="fixed inset-0 z-[100]" aria-live="polite" role="dialog" aria-label="Guided tour">
      {/* Backdrop / spotlight */}
      {rect ? (
        <div
          style={{
            position: 'fixed',
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            borderRadius: 10,
            boxShadow: '0 0 0 9999px rgba(15,23,42,0.55)',
            border: '2px solid #60a5fa',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-slate-900/55" style={{ zIndex: 100 }} onClick={finish} />
      )}

      {/* Tooltip card */}
      <div
        style={tipStyle}
        className="rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{step.title}</h3>
          <button onClick={finish} aria-label="Close tour" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{step.body}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {idx + 1} / {steps.length}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={finish} className="text-xs text-gray-500 hover:underline dark:text-gray-400">
              Skip
            </button>
            {idx > 0 && (
              <button
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (last ? finish() : setIdx((i) => Math.min(steps.length - 1, i + 1)))}
              className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              {last ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

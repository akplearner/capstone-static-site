'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ArrowRight, X, PlayCircle, Rocket } from 'lucide-react';
import { useHydrated } from '@/lib/useClientStore';

const DISMISS_KEY = 'capstone_quickstart_dismissed_v1';

export interface QuickstartStep {
  label: string;
  how: string;
  done: boolean;
  /** Either an in-app callback (tab switch) or an href (another page). */
  onAction?: () => void;
  href?: string;
  cta?: string;
}

/**
 * A persistent "Start here" path on the course Overview. Shows the 5 moves of the
 * core loop with live done/▢ state and a deep link for the next undone step.
 * Collapses to a thin done bar once complete; dismissable (localStorage).
 */
export function QuickstartChecklist({
  steps,
  onTakeTour,
}: {
  steps: QuickstartStep[];
  onTakeTour?: () => void;
}) {
  const hydrated = useHydrated();
  const [dismissed, setDismissed] = useState(false);

  // Read the dismiss flag only after hydration to avoid SSR mismatch.
  const isDismissed =
    dismissed || (hydrated && typeof window !== 'undefined' && window.localStorage.getItem(DISMISS_KEY) === '1');

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {}
    setDismissed(true);
  };

  if (isDismissed) return null;

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const nextIdx = steps.findIndex((s) => !s.done);

  if (allDone) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm dark:border-green-800 dark:bg-green-900/20">
        <span className="flex items-center gap-2 font-medium text-green-800 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4" /> You&apos;ve got the flow — nice work.
        </span>
        <button onClick={dismiss} className="text-green-700 hover:underline dark:text-green-400">
          Hide
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-800 dark:bg-blue-900/15"
      data-tour="quickstart"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Start here</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              The whole course is one loop. {doneCount}/{steps.length} done.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onTakeTour && (
            <button
              onClick={onTakeTour}
              className="inline-flex items-center gap-1 rounded-md border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
            >
              <PlayCircle className="h-3.5 w-3.5" /> Take the tour
            </button>
          )}
          <button onClick={dismiss} aria-label="Hide getting started" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ol className="mt-3 space-y-1.5">
        {steps.map((s, i) => {
          const isNext = i === nextIdx;
          const action = !s.done && (s.onAction || s.href) && (
            s.href ? (
              <Link
                href={s.href}
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
              >
                {s.cta ?? 'Open'} <ArrowRight className="h-3 w-3" />
              </Link>
            ) : (
              <button
                onClick={s.onAction}
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
              >
                {s.cta ?? 'Go'} <ArrowRight className="h-3 w-3" />
              </button>
            )
          );
          return (
            <li
              key={s.label}
              className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 ${
                isNext ? 'bg-white ring-1 ring-blue-200 dark:bg-gray-800 dark:ring-blue-800' : ''
              }`}
            >
              {s.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              ) : (
                <Circle className={`h-4 w-4 shrink-0 ${isNext ? 'text-blue-500' : 'text-gray-300 dark:text-gray-600'}`} />
              )}
              <div className="min-w-0 flex-1">
                <div className={`text-sm ${s.done ? 'text-gray-400 line-through dark:text-gray-500' : 'font-medium text-gray-900 dark:text-white'}`}>
                  {i + 1}. {s.label}
                </div>
                {!s.done && <div className="text-xs text-gray-500 dark:text-gray-400">{s.how}</div>}
              </div>
              {isNext && action}
            </li>
          );
        })}
      </ol>
    </motion.div>
  );
}

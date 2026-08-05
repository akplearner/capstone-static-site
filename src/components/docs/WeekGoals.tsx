import { Lightbulb } from 'lucide-react';
import type { WeekDef } from '@/lib/types';

/**
 * A simple, always-open "what each week is about" list. One row per week:
 * the expedition phase + a week chip + title + objective + the plain-language
 * sentence (`plain`) written exactly for non-technical students. Presentational
 * and state-free, so it renders identically on the Guide and the course
 * overview.
 */
export function WeekGoals({ weeks }: { weeks: WeekDef[] }) {
  const ordered = [...weeks].sort((a, b) => a.number - b.number);
  return (
    <ol className="space-y-3">
      {ordered.map((w) => (
        <li key={w.number} className="rounded-lg border border-line bg-panel p-4">
          {/* Same expedition phase the weekly tab shows, so the Guide and the
              course read as one arc rather than two lists of weeks. */}
          {(w.phase ?? w.theme) && (
            <div
              className="pixel mb-1.5 text-[9px] uppercase leading-none tracking-wider"
              style={{ color: `var(--color-w${Math.min(4, Math.max(1, w.number))})` }}
            >
              {w.phase ?? w.theme}
            </div>
          )}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-ink">
              {w.number === 0 ? 'Setup' : `Week ${w.number}`}
            </span>
            {w.phase && w.theme && (
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                {w.theme}
              </span>
            )}
            <span className="font-semibold text-ink">{w.title}</span>
          </div>
          {w.objective && <p className="mt-1 text-sm text-muted">{w.objective}</p>}
          {w.plain && (
            <div className="mt-2 flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 dark:border-sky-800 dark:bg-sky-900/20">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <p className="text-sm text-sky-900 dark:text-sky-200">
                <span className="font-semibold">In plain words: </span>
                {w.plain}
              </p>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

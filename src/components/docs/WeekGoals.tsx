import type { WeekDef } from '@/lib/types';

/**
 * A simple, always-open "what each week is about" list — one tight row per week:
 * a week chip, the expedition phase, the title, and a single plain-language
 * sentence (the `plain` line written for non-technical students, falling back to
 * the `objective`). Deliberately one line of prose, not a paragraph plus a
 * callout: this list is scanned, not studied. Presentational and state-free, so
 * it renders identically on the Guide and the course overview.
 */
export function WeekGoals({ weeks }: { weeks: WeekDef[] }) {
  const ordered = [...weeks].sort((a, b) => a.number - b.number);
  return (
    <ol className="space-y-2">
      {ordered.map((w) => {
        const line = w.plain ?? w.objective;
        const phase = w.phase ?? w.theme;
        return (
          <li key={w.number} className="rounded-lg border border-line bg-panel px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-ink">
                {w.number === 0 ? 'Setup' : `Week ${w.number}`}
              </span>
              {phase && (
                <span
                  className="pixel text-[9px] uppercase leading-none tracking-wider"
                  style={{ color: `var(--color-w${Math.min(4, Math.max(1, w.number))})` }}
                >
                  {phase}
                </span>
              )}
              <span className="font-semibold text-ink">{w.title}</span>
            </div>
            {line && <p className="mt-1 text-sm text-muted">{line}</p>}
          </li>
        );
      })}
    </ol>
  );
}

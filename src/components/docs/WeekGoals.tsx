import type { WeekDef } from '@/lib/types';

/**
 * The course arc as a scannable index — one tight row per week: a week chip, the
 * phase, and the title.
 *
 * It deliberately does NOT print the week's `plain` sentence. That sentence
 * renders on the Weekly Tasks week block, which is the screen a student actually
 * works from; printing it here too meant reading the same ~200 words twice, once
 * on a page they visit to orient themselves and again on the page they use daily.
 * Presentational and state-free.
 */
export function WeekGoals({ weeks }: { weeks: WeekDef[] }) {
  const ordered = [...weeks].sort((a, b) => a.number - b.number);
  return (
    <ol className="space-y-2">
      {ordered.map((w) => {
        const phase = w.phase ?? w.theme;
        return (
          <li key={w.number} className="rounded-lg border border-line bg-panel px-3 py-2">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-ink">
                {w.number === 0 ? 'Setup' : `Week ${w.number}`}
              </span>
              {phase && (
                <span
                  className="font-mono text-[10px] font-semibold uppercase leading-none tracking-wider"
                  style={{ color: `var(--color-w${Math.min(4, Math.max(1, w.number))})` }}
                >
                  {phase}
                </span>
              )}
              <span className="font-semibold text-ink">{w.title}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

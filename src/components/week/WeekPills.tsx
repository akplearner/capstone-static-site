'use client';

import { Minus, Plus } from 'lucide-react';

/**
 * The week control over a week-scoped picture (R88, lifted out of the cloud
 * diagram in R99 so every course's picture can carry it): previous, one pill
 * per week in its phase colour — the same rail the Tasks tab draws — next,
 * and a status line that says what the selected week holds.
 */
export function WeekPills({
  weeks,
  selected,
  onSelect,
  label = (w) => `${w}`,
  status,
  ariaLabel = 'Week',
}: {
  weeks: number[];
  selected: number;
  onSelect: (week: number) => void;
  /** What a pill prints and its `data-week` (a cloud slice numbers 1–4 over global weeks). */
  label?: (week: number) => string;
  status?: string;
  ariaLabel?: string;
}) {
  const i = weeks.indexOf(selected);
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1 text-xs" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        aria-label="Previous week"
        disabled={i <= 0}
        onClick={() => onSelect(weeks[Math.max(0, i - 1)])}
        className="rounded-md p-1 text-muted hover:bg-panel-2 hover:text-ink disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      {weeks.map((w) => (
        <button
          key={w}
          type="button"
          data-week={label(w)}
          aria-pressed={w === selected}
          aria-label={`Week ${label(w)}`}
          onClick={() => onSelect(w)}
          className={`min-w-[1.75rem] rounded-md border-b-2 px-1.5 py-0.5 font-semibold tabular-nums ${
            w === selected ? 'bg-panel-2 text-ink' : 'text-muted hover:bg-panel-2 hover:text-ink'
          }`}
          style={{ borderBottomColor: w === selected ? 'var(--week)' : 'transparent' }}
        >
          {label(w)}
        </button>
      ))}
      <button
        type="button"
        aria-label="Next week"
        disabled={i < 0 || i >= weeks.length - 1}
        onClick={() => onSelect(weeks[Math.min(weeks.length - 1, i + 1)])}
        className="rounded-md p-1 text-muted hover:bg-panel-2 hover:text-ink disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      {status && <span className="ml-1 text-muted">{status}</span>}
    </div>
  );
}

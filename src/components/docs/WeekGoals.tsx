import type { Course, Gate } from '@/lib/types';
import { phaseTag } from '@/lib/course-helpers';

/**
 * The course arc as a scannable index — one tight row per week: a week chip, the
 * phase, the title, and the gate that closes it when the course has gates.
 *
 * This is the course's *only* rendering of the arc. `LifecycleFlow` used to
 * draw the same weeks — a fixed-width SVG that truncated the phase to 18
 * characters and hid the title in a tooltip — on the Guide, then on Reference,
 * then on the Server+ Overview as well. It is deleted; the one thing it had that
 * this didn't (the gate markers) is the chip below. Presentational and
 * state-free.
 */
export function WeekGoals({ course, gates }: { course: Course; gates?: Gate[] }) {
  const ordered = [...course.weeks].sort((a, b) => a.number - b.number);
  return (
    <ol className="space-y-2">
      {ordered.map((w) => {
        const phase = w.phase ?? w.theme;
        const gate = gates?.find((g) => g.week === w.number);
        return (
          // `data-week` resolves this row's phase colour once (globals.css),
          // so the phase label below can just say `var(--week)` and the whole
          // row can wear it. It replaces a hand-built `var(--color-w${n})`
          // whose clamp — Math.min(4, Math.max(1, n)) — gave SETUP the Week-1
          // colour, contradicting the rule that week 0 has no phase at all.
          <li
            key={w.number}
            data-week={w.number}
            className="rounded-lg border border-line border-l-2 bg-panel px-3 py-2"
            style={{ borderLeftColor: 'var(--week, var(--color-line))' }}
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-accent-ink">
                {/* phaseTag, not a hardcoded "Week N": an engagement course reads
                    "Phase P1" everywhere else and used to read "Week 1" only here. */}
                {phaseTag(course, w.number)}
              </span>
              {phase && (
                <span
                  className="font-mono text-3xs font-semibold uppercase leading-none tracking-wider"
                  style={{ color: 'var(--week, var(--color-muted))' }}
                >
                  {phase}
                </span>
              )}
              <span className="font-semibold text-ink">{w.title}</span>
              {gate && (
                <span className="ml-auto rounded-full border border-line px-2 py-0.5 font-mono text-3xs text-muted">
                  Gate {gate.id}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

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
          <li key={w.number} className="rounded-lg border border-line bg-panel px-3 py-2">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-ink">
                {/* phaseTag, not a hardcoded "Week N": an engagement course reads
                    "Phase P1" everywhere else and used to read "Week 1" only here. */}
                {phaseTag(course, w.number)}
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
              {gate && (
                <span className="ml-auto rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-muted">
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

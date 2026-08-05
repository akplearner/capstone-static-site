/**
 * Difficulty as filled blocks rather than stars.
 *
 * Blocks read at a glance and stay legible in both themes without relying on
 * colour alone — the label carries the meaning for anyone who can't distinguish
 * the fill. Shared by the week header and the task card so the same level never
 * renders two different ways.
 */

export const DIFFICULTY_LABEL: Record<number, string> = {
  1: 'Gentle',
  2: 'Steady',
  3: 'Demanding',
  4: 'Heavy build',
};

export function Difficulty({
  level,
  compact = false,
}: {
  level: 1 | 2 | 3 | 4;
  /** Blocks only, no word — for dense rows where the label repeats. */
  compact?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={`Difficulty ${level} of 4 — ${DIFFICULTY_LABEL[level]}`}
    >
      <span className="flex gap-[3px]" aria-hidden>
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={compact ? 'h-2.5 w-1.5 rounded-[1px]' : 'h-3 w-2 rounded-[1px]'}
            style={{ background: n <= level ? 'var(--color-accent)' : 'var(--color-line)' }}
          />
        ))}
      </span>
      {compact ? (
        <span className="sr-only">
          Difficulty {level} of 4 — {DIFFICULTY_LABEL[level]}
        </span>
      ) : (
        <span className="text-xs font-medium text-muted">
          {DIFFICULTY_LABEL[level]}
          <span className="sr-only"> — difficulty {level} of 4</span>
        </span>
      )}
    </span>
  );
}

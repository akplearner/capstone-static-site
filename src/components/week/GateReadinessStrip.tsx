import type { ReactNode } from 'react';
import { CheckCircle2, Circle, Users } from 'lucide-react';

export interface ReadinessCheck {
  key: string;
  label: ReactNode;
  pass: boolean;
  /** `team` draws the people icon: a teammate's item, informational only. */
  kind?: 'mine' | 'team';
  /** A small trailing fact — the owning role, "team". */
  note?: ReactNode;
}

/**
 * One checklist for "how ready is this gate", however the checks were derived.
 *
 * Two surfaces answer that question from two different sources — the Tasks
 * tab from task completion (`WeekGatePanel`), the Deliverables page from the
 * documents' Definition-of-Done predicates — and until R78-C2 they each drew
 * their own list, with different icons, sizes and strike-through rules, so the
 * same gate looked like two different facts. The source stays different; the
 * picture is one.
 */
export function GateReadinessStrip({
  title,
  meta,
  checks,
  columns = 1,
  children,
}: {
  title: ReactNode;
  /** Right of the title — a status pill, or "3/7 checks". */
  meta?: ReactNode;
  checks: ReadinessCheck[];
  columns?: 1 | 2;
  /** Anything below the list — the hand-offs, a caption. */
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg depth-edge bg-panel-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">{title}</span>
        {meta}
      </div>
      <ul className={`mt-2 gap-x-6 gap-y-1.5 ${columns === 2 ? 'grid sm:grid-cols-2' : 'space-y-1.5'}`}>
        {checks.map((c) => (
          <li key={c.key} className="flex items-start gap-2 text-sm">
            {c.kind === 'team' ? (
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-label="Teammate's item" />
            ) : c.pass ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-label="Done" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-label="Not yet" />
            )}
            <span className={c.pass ? 'text-muted line-through' : 'text-body'}>{c.label}</span>
            {c.note && <span className="text-2xs text-muted">{c.note}</span>}
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}

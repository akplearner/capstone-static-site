'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { ArrowRight, CheckCircle2, Circle, Handshake } from 'lucide-react';
import { Course } from '@/lib/types';
import { getRoleDef } from '@/lib/course-helpers';

const HANDOFF_EVENT = 'capstone-handoffs-changed';

/**
 * A "who owes whom" checklist for a team. Reads each gate's cross-role hand-offs
 * (from → to, artifact) and lets the team self-track what's been passed. Purely
 * local (per device) until Supabase makes it shared — the point is to make the
 * dependencies explicit so nobody is silently blocked on a teammate.
 */

interface HandoffRow {
  key: string;
  gate: number;
  from: string;
  to: string;
  artifact?: string;
  label: string;
}

function storageKey(courseId: string, teamId: string) {
  return `capstone_handoffs_${courseId}_${teamId}`;
}

/** Read the done-map as a live external store (localStorage), avoiding an
 *  effect+setState hydration pattern. getSnapshot returns the raw string so its
 *  reference is stable when nothing changed; parsing happens in the component. */
function useDoneMap(courseId: string, teamId: string): Record<string, boolean> {
  const key = storageKey(courseId, teamId);
  const raw = useSyncExternalStore(
    (cb) => {
      window.addEventListener('storage', cb);
      window.addEventListener(HANDOFF_EVENT, cb);
      return () => {
        window.removeEventListener('storage', cb);
        window.removeEventListener(HANDOFF_EVENT, cb);
      };
    },
    () => (typeof window !== 'undefined' ? window.localStorage.getItem(key) ?? '{}' : '{}'),
    () => '{}'
  );
  return useMemo(() => {
    try {
      return JSON.parse(raw) as Record<string, boolean>;
    } catch {
      return {};
    }
  }, [raw]);
}

export function TeamHandoffChecklist({ course, teamId }: { course: Course; teamId: string }) {
  const rows: HandoffRow[] = course.gates.flatMap((g) =>
    (g.handoffs ?? []).map((h, i) => ({
      key: `g${g.id}-${i}`,
      gate: g.id,
      from: h.from,
      to: h.to,
      artifact: h.artifact,
      label: h.label,
    }))
  );

  const done = useDoneMap(course.id, teamId);

  if (rows.length === 0) return null;

  const toggle = (key: string) => {
    const next = { ...done, [key]: !done[key] };
    try {
      window.localStorage.setItem(storageKey(course.id, teamId), JSON.stringify(next));
      window.dispatchEvent(new Event(HANDOFF_EVENT));
    } catch {
      /* ignore quota/private-mode errors */
    }
  };

  const doneCount = rows.filter((r) => done[r.key]).length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
        <Handshake className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Team hand-offs ({doneCount}/{rows.length} done)
      </h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Who owes whom, gate by gate. Tick each hand-off once the file has actually been passed and received, so
        nobody is stuck waiting. (Saved on this device.)
      </p>
      <ul className="mt-3 space-y-1.5">
        {rows.map((r) => {
          const from = getRoleDef(course, r.from);
          const to = getRoleDef(course, r.to);
          const isDone = !!done[r.key];
          return (
            <li key={r.key}>
              <button
                type="button"
                onClick={() => toggle(r.key)}
                className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                {isDone ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
                )}
                <span className={isDone ? 'text-gray-500 line-through dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}>
                  <span className="text-[11px] font-semibold uppercase text-gray-400">Gate {r.gate}</span>{' '}
                  <span className="font-semibold" style={{ color: from?.color }}>{from?.name ?? r.from}</span>
                  <ArrowRight className="mx-1 inline h-3 w-3" />
                  <span className="font-semibold" style={{ color: to?.color }}>{to?.name ?? r.to}</span>
                  {r.artifact && <span className="ml-1 font-mono text-xs">{r.artifact}</span>} — {r.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

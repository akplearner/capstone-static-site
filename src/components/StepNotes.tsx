'use client';

import { useEffect, useRef, useState } from 'react';
import { Flag, StickyNote } from 'lucide-react';
import { stepNotesRepo } from '@/lib/data';
import { useClientStore } from '@/lib/useClientStore';
import type { StepNote } from '@/lib/data/types';
import type { LedgerRef } from '@/components/step/StepDetail';
import { stepNoteKey } from '@/lib/data/localStorageFeatureRepos';

/**
 * A student's own note on a step, and the one bit of it the team can see.
 *
 * Until R68 a step was binary: ticked or not. The thing a student actually has
 * to say about a step — "ens19, not ens18, on this box", "the switch port was
 * an access port" — went nowhere, and "I'm stuck" went to whoever happened to
 * be beside them. The note is private (owner-only, like lab access); the
 * stuck flag is visible to teammates on the team block and to the instructor
 * on the cohort dashboard, where a step three people are stuck on is the
 * thing to teach next.
 */
export function StepNotes({ ledger }: { ledger: LedgerRef }) {
  const key = stepNoteKey(ledger.taskId, ledger.stepId);
  const saved = useClientStore<StepNote | null>(
    () => stepNotesRepo.getAll(ledger.courseId, ledger.memberId)[key] ?? null,
    null
  );
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shown = text ?? saved?.note ?? '';
  const stuck = saved?.stuck ?? false;

  const persist = (note: string, isStuck: boolean) =>
    stepNotesRepo.save(ledger.memberId, { courseId: ledger.courseId, taskId: ledger.taskId, stepId: ledger.stepId, note, stuck: isStuck, at: Date.now() });

  const onType = (v: string) => {
    setText(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      persist(v, stuck);
      setText(null);
    }, 500);
  };

  // Flush a pending note if the step unmounts mid-debounce (the guided view
  // moves on when a step is ticked).
  const latest = useRef({ text, stuck });
  useEffect(() => {
    latest.current = { text, stuck };
  });
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        if (latest.current.text !== null) persist(latest.current.text, latest.current.stuck);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const toggleStuck = () => persist(shown, !stuck);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-muted hover:bg-panel-2 hover:text-ink"
      >
        <StickyNote className="h-4 w-4" aria-hidden />
        {shown ? 'Your note' : 'Add a note'}
      </button>
      <button
        type="button"
        onClick={toggleStuck}
        aria-pressed={stuck}
        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 ${stuck ? 'bg-warn-soft text-warn' : 'text-muted hover:bg-panel-2 hover:text-ink'}`}
      >
        <Flag className="h-4 w-4" aria-hidden />
        {stuck ? 'Stuck — teammates can see this' : "I'm stuck"}
      </button>
      {open && (
        <label className="block w-full">
          <span className="sr-only">Your note on this step</span>
          <textarea
            value={shown}
            onChange={(e) => onType(e.target.value)}
            rows={3}
            placeholder="What you found, what was different on your machine, what to remember. Only you can read this."
            className="mt-1 w-full text-sm"
          />
          <span className="mt-1 block text-xs text-muted">{text !== null ? 'Saving…' : saved?.note ? 'Saved' : ''}</span>
        </label>
      )}
    </div>
  );
}

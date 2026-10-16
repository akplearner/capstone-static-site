'use client';

import { useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { FIX_SUMMARY, SUMMARY_MAX, fixDraft, patchableFields, validateFix, type FixChange, type FixDraft } from '@/lib/contentFix';
import type { IssueDto } from '@/lib/issueInbox';
import type { Course } from '@/lib/types';

/** The words the panel prints, in one place. */
export const FIX_PANEL_COPY = {
  open: 'Fix the text',
  close: 'Close',
  lede: 'Saved as a new revision. The new text is live for students at once, can be reverted from the Fixes view, and is folded into the code later.',
  where: 'Which text',
  whole: 'The task itself',
  why: 'What changed and why',
  resolve: 'Mark this report resolved',
  also: 'Also resolve the other pending reports here',
  note: 'Note for the reporter',
  notePlaceholder: 'What changed, in a few words',
  save: 'Save fix',
  saving: 'Saving…',
  changed: 'Changed',
  list: 'One item per line.',
  none: 'Nothing to change: the task or the step is no longer in the course.',
} as const;

const rowsFor = (text: string) => Math.min(10, Math.max(2, text.split('\n').length + Math.floor(text.length / 90)));

const FIELD =
  'mt-1 w-full rounded-md bg-panel-2 px-2 py-1.5 text-sm text-ink placeholder-muted';

/**
 * The admin's fix panel (R121), under the report it answers. It shows the words of the task or
 * the step the report names, as the student reads them now, each in a box; the admin changes
 * what is wrong, says in one line what changed and why, and saves. Saving adds a revision to the
 * course's ledger and, if asked, resolves this report and the others about the same text.
 *
 * Props only: the page loads the course, stores the fix and closes the reports. The checks (the
 * reading budgets, the self-check tokens, "this text changed since the panel opened") are the
 * pure ones of `contentFix.ts`, shown beside the field they are about.
 */
export function FixTextPanel({
  course,
  issue,
  others,
  labTokens,
  onSave,
}: {
  /** The course as students read it now (the effective course). */
  course: Course;
  issue: IssueDto;
  /** The other pending reports about the same text, which one save may close too. */
  others: readonly IssueDto[];
  labTokens?: ReadonlySet<string>;
  onSave: (draft: FixDraft, resolution: { resolveIds: string[]; note: string }) => Promise<boolean>;
}) {
  const task = course.tasks.find((t) => t.id === issue.taskId);
  const [open, setOpen] = useState(false);
  const [stepId, setStepId] = useState(issue.stepId && task?.steps.some((s) => s.id === issue.stepId) ? issue.stepId : '');
  // What was typed, with the text it was typed over: a change is "this was X" and stays so even if the course moves under it.
  const [edits, setEdits] = useState<Record<string, { before: string; after: string }>>({});
  const [summary, setSummary] = useState(FIX_SUMMARY[issue.kind] ?? FIX_SUMMARY.unclear);
  const [resolve, setResolve] = useState(true);
  const [alsoOthers, setAlsoOthers] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const fields = useMemo(() => patchableFields(course, { taskId: issue.taskId, ...(stepId ? { stepId } : {}) }), [course, issue.taskId, stepId]);
  const changes = useMemo<FixChange[]>(
    () =>
      Object.entries(edits)
        .filter(([, e]) => e.after !== e.before)
        .map(([field, e]) => ({ taskId: issue.taskId, ...(stepId ? { stepId } : {}), field, before: e.before, after: e.after })),
    [edits, issue.taskId, stepId]
  );
  // The checks do not depend on which reports the save will close.
  const problems = useMemo(() => (changes.length > 0 ? validateFix(course, fixDraft(summary, changes, []), { labTokens }) : []), [course, summary, changes, labTokens]);
  const ready = changes.length > 0 && problems.length === 0 && !busy;

  const type = (field: string, before: string, after: string) => setEdits((all) => ({ ...all, [field]: { before: all[field]?.before ?? before, after } }));

  const save = async () => {
    setBusy(true);
    const resolveIds = resolve ? [issue.id, ...(alsoOthers ? others.map((o) => o.id) : [])] : [];
    const ok = await onSave(fixDraft(summary, changes, resolveIds), { resolveIds, note: note.trim() });
    setBusy(false);
    if (ok) {
      setOpen(false);
      setEdits({});
      setNote('');
    }
  };

  if (!task) return null;
  return (
    <div className="border-t border-line pt-3" data-fix-panel>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focusable inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-accent hover:bg-panel-2"
        data-fix-open
      >
        <Pencil className="h-4 w-4" aria-hidden /> {open ? FIX_PANEL_COPY.close : FIX_PANEL_COPY.open}
      </button>

      {open && (
        <div className="mt-3 space-y-4" data-fix-body>
          <p className="text-xs text-muted">{FIX_PANEL_COPY.lede}</p>

          <label className="block text-xs">
            <span className="block font-medium text-body">{FIX_PANEL_COPY.where}</span>
            <select
              value={stepId}
              onChange={(e) => {
                setStepId(e.target.value);
                setEdits({});
              }}
              className="mt-1 max-w-full text-sm"
              data-fix-target
            >
              <option value="">{FIX_PANEL_COPY.whole}</option>
              {task.steps.map((s, i) => (
                <option key={s.id} value={s.id}>
                  Step {i + 1}: {s.title}
                </option>
              ))}
            </select>
          </label>

          {fields.length === 0 ? (
            <p className="text-sm text-muted">{FIX_PANEL_COPY.none}</p>
          ) : (
            <ul className="space-y-3">
              {fields.map((f) => {
                const e = edits[f.field];
                const text = e ? e.after : f.value;
                const changed = !!e && e.after !== e.before;
                const mine = problems.filter((p) => p.field === f.field);
                return (
                  <li key={f.field} data-fix-field={f.field} data-changed={changed || undefined}>
                    <label className="block text-xs">
                      <span className="flex flex-wrap items-center gap-2 font-medium text-body">
                        {f.label}
                        {changed && (
                          <Chip tone="info" icon={<Pencil />}>
                            {FIX_PANEL_COPY.changed}
                          </Chip>
                        )}
                      </span>
                      {f.shape === 'line' ? (
                        <input value={text} maxLength={f.max} onChange={(ev) => type(f.field, f.value, ev.target.value)} className={FIELD} />
                      ) : (
                        <textarea value={text} maxLength={f.max} rows={rowsFor(text)} onChange={(ev) => type(f.field, f.value, ev.target.value)} className={`${FIELD} font-mono`} />
                      )}
                    </label>
                    {f.shape === 'list' && <p className="mt-0.5 text-2xs text-muted">{FIX_PANEL_COPY.list}</p>}
                    {mine.map((p, i) => (
                      <p key={i} className="mt-1 text-xs text-danger" role="alert" data-fix-problem={p.code}>
                        {p.message}
                      </p>
                    ))}
                  </li>
                );
              })}
            </ul>
          )}

          {problems.filter((p) => p.field === null).map((p, i) => (
            <p key={i} className="text-xs text-danger" role="alert" data-fix-problem={p.code}>
              {p.message}
            </p>
          ))}

          <label className="block text-xs">
            <span className="block font-medium text-body">{FIX_PANEL_COPY.why}</span>
            <input value={summary} maxLength={SUMMARY_MAX} onChange={(e) => setSummary(e.target.value)} className={FIELD} data-fix-summary />
          </label>

          <div className="space-y-2 text-sm text-body">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={resolve} onChange={(e) => setResolve(e.target.checked)} className="accent-[var(--color-accent)]" data-fix-resolve />
              {FIX_PANEL_COPY.resolve}
            </label>
            {others.length > 0 && (
              <label className={`flex items-center gap-2 ${resolve ? 'cursor-pointer' : 'opacity-60'}`}>
                <input type="checkbox" checked={alsoOthers && resolve} disabled={!resolve} onChange={(e) => setAlsoOthers(e.target.checked)} className="accent-[var(--color-accent)]" data-fix-also />
                {FIX_PANEL_COPY.also} ({others.length})
              </label>
            )}
            {resolve && (
              <label className="block text-xs">
                <span className="block font-medium text-body">{FIX_PANEL_COPY.note}</span>
                <input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder={FIX_PANEL_COPY.notePlaceholder} className={FIELD} data-fix-note />
              </label>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={() => void save()} disabled={!ready} data-fix-save>
              {busy ? FIX_PANEL_COPY.saving : FIX_PANEL_COPY.save}
            </Button>
            <span className="text-xs text-muted" aria-live="polite" data-fix-count>
              {changes.length} field{changes.length === 1 ? '' : 's'} changed
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

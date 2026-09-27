'use client';

import { useState } from 'react';
import { Flag, Send } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { taskReportsRepo } from '@/lib/data';
import { notifyStore } from '@/lib/useClientStore';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { toast } from '@/lib/toastBus';
import { REPORT_KINDS, type ReportKind } from '@/lib/reportKinds';
import type { Member, Task } from '@/lib/types';

/**
 * "Report an issue" on every task (R83): a structured flag — five kinds and an
 * optional note — filed without leaving the task. Teammates see a marker on
 * the row (no duplicate confusion); the instructor gets it on the cohort
 * dashboard, grouped by task, and resolves it there. Not for step-level "I'm
 * stuck", which stays on each step's notes.
 */
export function ReportIssueDialog({ courseId, task, member }: { courseId: string; task: Task; member: Member }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ReportKind>('unclear');
  const [note, setNote] = useState('');
  const { guard } = useRequireAuth();

  const submit = () => {
    const ok = guard('report an issue', () => {
      taskReportsRepo.save({
        id: crypto.randomUUID(),
        courseId,
        taskId: task.id,
        teamId: member.teamId,
        memberId: member.memberId,
        kind,
        note: note.trim().slice(0, 1000),
        status: 'open',
        at: Date.now(),
      });
      notifyStore();
    });
    if (!ok) return;
    setOpen(false);
    setNote('');
    toast({ message: 'Reported. Your instructor sees it on the cohort dashboard; your team sees a marker on this task.', variant: 'success' });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg depth-edge px-3 py-1.5 text-xs font-medium text-muted hover:bg-panel-2 hover:text-ink"
      >
        <Flag className="h-3.5 w-3.5" /> Report an issue
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={`Report an issue — ${task.title}`}>
        <fieldset className="space-y-1.5">
          <legend className="mb-1 text-sm text-muted">What kind of problem is it?</legend>
          {REPORT_KINDS.map((k) => (
            <label
              key={k.id}
              className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                kind === k.id ? 'depth-edge bg-panel-2' : 'hover:bg-panel-2'
              }`}
            >
              <input
                type="radio"
                name="report-kind"
                checked={kind === k.id}
                onChange={() => setKind(k.id)}
                className="mt-1 accent-[var(--color-accent)]"
              />
              <span>
                <span className="font-medium text-ink">{k.label}</span>
                <span className="block text-xs text-muted">{k.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <label className="mt-3 block">
          <span className="text-sm font-medium text-body">What happened? (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="The command in step 3 returns…"
            className="mt-1 w-full rounded-lg bg-panel px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none"
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} className="flex items-center gap-1.5">
            <Send className="h-4 w-4" /> Send report
          </Button>
        </div>
      </Dialog>
    </>
  );
}

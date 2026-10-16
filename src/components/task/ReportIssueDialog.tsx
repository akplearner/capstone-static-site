'use client';

import { useState } from 'react';
import { Flag, Send } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { courseRepo, taskReportsRepo } from '@/lib/data';
import { contentVersion } from '@/lib/contentVersion';
import { notifyStore } from '@/lib/useClientStore';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { toast } from '@/lib/toastBus';
import { REPORT_KINDS, type ReportKind } from '@/lib/reportKinds';
import type { Member, Task } from '@/lib/types';

/**
 * "Report an issue" on every task (R83): a structured flag — five kinds and an
 * optional note — filed without leaving the task. Teammates see a marker on
 * the row (no duplicate confusion); the instructor gets it in the issues inbox
 * and works it there. R120: the report names the STEP when the reporter picks one,
 * and records who filed it, in what role, and which version of the course they
 * were looking at, so the fix can be traced to what was on screen. Not for
 * step-level "I'm stuck", which stays on each step's notes.
 */
export function ReportIssueDialog({ courseId, task, member }: { courseId: string; task: Task; member: Member }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ReportKind>('unclear');
  const [note, setNote] = useState('');
  // R120: '' = the whole task.
  const [stepId, setStepId] = useState('');
  const { guard } = useRequireAuth();
  const version = contentVersion(courseRepo.get(courseId)?.version);

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
        stepId: stepId || undefined,
        week: task.week,
        reporterName: member.displayName,
        reporterRole: member.role,
        contentVersion: version,
      });
      notifyStore();
    });
    if (!ok) return;
    setOpen(false);
    setNote('');
    setStepId('');
    toast({ message: 'Reported. Your instructor sees it in the issues inbox; your team sees a marker on this task.', variant: 'success' });
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
          <span className="text-sm font-medium text-body">Which step? (optional)</span>
          <select value={stepId} onChange={(e) => setStepId(e.target.value)} className="mt-1 w-full text-sm" data-report-step>
            <option value="">The whole task</option>
            {task.steps.map((s, i) => (
              <option key={s.id} value={s.id}>
                Step {i + 1}: {s.title.length > 70 ? `${s.title.slice(0, 69)}…` : s.title}
              </option>
            ))}
          </select>
        </label>
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
        <p className="mt-3 text-xs text-muted" data-report-stamp>
          Sent with your name, your role and course version {version}, so the fix can be traced to what you saw.
        </p>
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

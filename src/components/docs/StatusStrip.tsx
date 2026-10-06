'use client';

import { useState } from 'react';
import { Check, CornerUpLeft, RotateCcw, Send, Stamp } from 'lucide-react';
import type { DeliverableDef } from '@/lib/docs/types';
import { ACTION_LABEL, STATUS_LABEL, STATUS_ORDER, allowedActions, latestStatus, raciLine, statusOf, transition, type Actor, type LifecycleAction } from '@/lib/docs/lifecycle';
import { progressRepo, statusRepo, submissionsRepo } from '@/lib/data';
import { useClientStore, EMPTY_ARRAY } from '@/lib/useClientStore';
import { useCourse } from '@/lib/useCourse';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { getRoleDef } from '@/lib/course-helpers';
import { Dialog } from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';

/**
 * R103: where this document stands in the team's own lifecycle — draft, in
 * review, approved, issued — who drafts, reviews and approves it, and the one
 * action the viewer's role may take now. Submitting happens where the
 * document is frozen (the Expectations panel below); this strip carries the
 * review, the approval, the issue and the reopen.
 */
export function StatusStrip({ def, courseId, teamId, member, dodOk }: { def: DeliverableDef; courseId: string; teamId: string; member: Actor; /** The definition of done due by the week on screen passes. */ dodOk: boolean }) {
  const course = useCourse();
  const { guard } = useRequireAuth();
  const [returning, setReturning] = useState(false);
  const [note, setNote] = useState('');
  const rows = useClientStore(() => statusRepo.list(courseId, teamId), EMPTY_ARRAY);
  const roster = useClientStore(() => progressRepo.getRoster(courseId), EMPTY_ARRAY);
  const submissions = useClientStore(() => submissionsRepo.list(courseId, teamId), EMPTY_ARRAY);
  if (!def.raci) return null;
  const team: Actor[] = roster.filter((r) => r.teamId === teamId).map((r) => ({ memberId: r.memberId, role: r.role }));
  const current = statusOf(rows, def.id);
  const latest = latestStatus(rows, def.id);
  const version = submissions.filter((s) => s.deliverableId === def.id).reduce((m, s) => Math.max(m, s.version), 0);
  const actions = allowedActions(def, rows, member, team, dodOk).filter((a) => a !== 'submit');
  const roleName = (id: string) => getRoleDef(course, id)?.name ?? id;
  const who = (id: string) => roster.find((r) => r.memberId === id)?.displayName ?? 'a teammate';

  const act = (action: LifecycleAction, reason?: string) =>
    guard('record where this document stands', () => {
      try {
        const row = transition(def, rows, action, member, { courseId, teamId, team, dodOk, note: reason, version });
        statusRepo.save(row);
        setReturning(false);
        setNote('');
        toast({ message: `${def.title}: ${STATUS_LABEL[row.status].toLowerCase()}.`, variant: 'success' });
      } catch (e) {
        toast({ message: e instanceof Error ? e.message : 'That change is not allowed.', variant: 'error' });
      }
    });

  const icon = (a: LifecycleAction) => (a === 'approve' ? <Check className="h-3.5 w-3.5" /> : a === 'return' ? <CornerUpLeft className="h-3.5 w-3.5" /> : a === 'issue' ? <Stamp className="h-3.5 w-3.5" /> : a === 'reopen' ? <RotateCcw className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />);

  return (
    <div className="rounded-lg depth-edge bg-panel-2 px-3 py-2" data-status-strip={def.id} data-status={current}>
      <div className="flex flex-wrap items-center gap-2">
        <ol className="flex flex-wrap items-center gap-1" aria-label="Document status">
          {STATUS_ORDER.map((s, i) => {
            const reached = STATUS_ORDER.indexOf(current) >= i;
            const here = s === current;
            return (
              <li key={s} className="flex items-center gap-1">
                <span
                  aria-current={here ? 'step' : undefined}
                  className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${here ? 'bg-accent text-accent-contrast' : reached ? 'bg-accent-soft text-accent-ink' : 'bg-panel text-muted'}`}
                >
                  {STATUS_LABEL[s]}
                </span>
                {i < STATUS_ORDER.length - 1 && <span aria-hidden className="text-muted">›</span>}
              </li>
            );
          })}
        </ol>
        <span className="min-w-0 text-2xs text-muted">
          {latest ? `${STATUS_LABEL[latest.status]} by ${who(latest.changedBy)} (${roleName(latest.role)}) on ${new Date(latest.at).toLocaleDateString()}` : 'Not yet submitted'}
          {version > 0 && ` · v${version}`}
          {latest?.note && <span className="italic"> · “{latest.note}”</span>}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {current === 'draft' && member.role === def.raci.drafts && (
            <span className="text-2xs text-muted">{dodOk ? 'Submit from the Expectations panel below' : 'Finish the definition of done, then submit below'}</span>
          )}
          {current === 'draft' && member.role !== def.raci.drafts && <span className="text-2xs text-muted">{roleName(def.raci.drafts)} submits this document</span>}
          {current === 'in_review' && !actions.length && <span className="text-2xs text-muted">Waiting for {roleName(def.raci.reviews)} to review</span>}
          {current === 'approved' && !actions.length && <span className="text-2xs text-muted">Waiting for {roleName(def.raci.approves)} to issue</span>}
          {actions.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => (a === 'return' ? setReturning(true) : act(a))}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${a === 'return' || a === 'reopen' ? 'depth-edge bg-panel text-ink hover:bg-panel-2' : 'bg-accent text-accent-contrast hover:bg-accent-strong'}`}
            >
              {icon(a)} {ACTION_LABEL[a]}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-2xs text-muted">{raciLine(def.raci, roleName)}</p>
      <Dialog open={returning} onClose={() => setReturning(false)} title="Return for changes">
        <label className="block text-sm text-body">
          What has to change before you can approve it?
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1 w-full rounded-lg bg-panel px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none" placeholder="The scope says no RDP, but the report tests it." />
        </label>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={() => setReturning(false)} className="rounded-md px-3 py-1.5 text-sm text-muted hover:text-ink">
            Cancel
          </button>
          <button type="button" disabled={!note.trim()} onClick={() => act('return', note)} className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-contrast disabled:cursor-not-allowed disabled:opacity-50">
            Return to {roleName(def.raci.drafts)}
          </button>
        </div>
      </Dialog>
    </div>
  );
}

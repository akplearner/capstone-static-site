import { AlertTriangle } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { REWRITE_PCT, type FrictionReport } from '@/lib/friction';

/**
 * R112 — the step friction map: the steps where members tick without output,
 * get stuck or stop, highest first. A rewrite candidate carries an icon and a
 * word, never colour alone. Steps are ordered, never people; props only.
 */
const SHOWN = 30;

export function FrictionPanel({ report }: { report: FrictionReport }) {
  const rows = report.rows.filter((r) => r.members > 0 && r.pct > 0);
  const candidates = rows.filter((r) => r.candidate).length;
  return (
    <section aria-labelledby="friction-title" className="space-y-3" data-friction-panel>
      <div>
        <h2 id="friction-title" className="text-xl font-semibold tracking-tight text-ink">Step friction</h2>
        <p className="text-sm text-muted">
          Per verifiable step, among members whose role has the task: ticked without matching output, more than one paste, stuck
          now, or stopped after an earlier step. From {REWRITE_PCT}% of at least two members a step is a rewrite candidate.
          {rows.length > 0 && ` ${candidates} candidate${candidates === 1 ? '' : 's'} among ${rows.length} step${rows.length === 1 ? '' : 's'} with any signal.`}
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted" data-friction-empty>No step shows friction yet.</p>
      ) : (
        <Surface padding="none" className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm" data-friction-table>
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th scope="col" className="px-3 py-2">Week</th>
                <th scope="col" className="px-3 py-2">Task and step</th>
                <th scope="col" className="px-3 py-2 text-right">Members</th>
                <th scope="col" className="px-3 py-2 text-right">Ticked</th>
                <th scope="col" className="px-3 py-2 text-right">Verified</th>
                <th scope="col" className="px-3 py-2 text-right">No output</th>
                <th scope="col" className="px-3 py-2 text-right">Retries</th>
                <th scope="col" className="px-3 py-2 text-right">Stuck</th>
                <th scope="col" className="px-3 py-2 text-right">Stopped</th>
                <th scope="col" className="px-3 py-2 text-right">Friction</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, SHOWN).map((r) => (
                <tr key={`${r.taskId}::${r.stepId}`} className="border-t border-line align-top" data-friction-row={`${r.taskId}::${r.stepId}`} data-candidate={r.candidate}>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-body">{r.week}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-ink">{r.stepTitle}</div>
                    <div className="text-xs text-muted">{r.taskTitle}</div>
                    {r.candidate && (
                      <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-warn">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Rewrite candidate
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-body">{r.members}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-body">{r.ticked}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-body">{r.verified}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-body">{r.selfAttestedOnly}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-body">{r.multiAttempt}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-body">{r.stuck}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-body">{r.stopped}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-ink">{r.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > SHOWN && <p className="px-3 py-2 text-xs text-muted">The first {SHOWN} of {rows.length} steps; the CSV has every one.</p>}
        </Surface>
      )}
    </section>
  );
}

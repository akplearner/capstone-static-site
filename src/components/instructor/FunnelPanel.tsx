import { Surface } from '@/components/ui/Surface';
import { FUNNEL_STAGES, RETENTION_BANDS, type FunnelGroup, type FunnelReport, type FunnelStage, type RetentionBand } from '@/lib/funnel';

/**
 * R112 — the platform funnel as tiles with a same-ramp bar and a table twin,
 * and the active-weeks bands as a table. Counts only, nobody named, no
 * motion; props only.
 */
const STAGE_LABEL: Record<FunnelStage, string> = {
  enrolled: 'Enrolled',
  firstTick: 'First tick',
  firstVerified: 'First verified step',
  firstWeekCleared: 'First graded week cleared',
  capstoneFiled: 'Capstone filed',
};

const BAND_LABEL: Record<RetentionBand, string> = {
  none: 'No active graded week',
  one: 'One',
  twoToThree: 'Two or three',
  fourPlus: 'Four or more',
};

const pctOf = (n: number, of: number) => (of > 0 ? Math.round((100 * n) / of) : 0);

function Stages({ g }: { g: FunnelGroup }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-5" data-funnel-stages={g.cohort}>
      {FUNNEL_STAGES.map((s) => {
        const n = g.stages[s];
        const p = pctOf(n, g.members);
        return (
          <li key={s} data-stage={s} data-count={n}>
            <Surface variant="dense" padding="sm" className="h-full space-y-1.5">
              <div className="text-xs text-muted">{STAGE_LABEL[s]}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-semibold tabular-nums text-ink">{n}</span>
                <span className="text-xs text-muted">of {g.members}</span>
                <span className="ml-auto text-xs tabular-nums text-muted">{p}%</span>
              </div>
              <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p} aria-label={STAGE_LABEL[s]} className="relative h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
                <div className="absolute inset-0 origin-left rounded-full bg-accent" style={{ transform: `scaleX(${p / 100})` }} />
              </div>
            </Surface>
          </li>
        );
      })}
    </ol>
  );
}

export function FunnelPanel({ report }: { report: FunnelReport }) {
  const groups = report.groups.length > 1 ? [report.all, ...report.groups] : report.groups.length === 1 ? report.groups : [report.all];
  return (
    <section aria-labelledby="funnel-title" className="space-y-4" data-funnel-panel>
      <div>
        <h2 id="funnel-title" className="text-xl font-semibold tracking-tight text-ink">Funnel</h2>
        <p className="text-sm text-muted">
          Members who reached each stage and every stage before it, so the counts never rise. Counts only; nobody is named or
          ranked.
        </p>
      </div>
      {groups.map((g) => (
        <div key={g.cohort} className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">
            {g.cohort === 'all' ? 'Whole course' : `Cohort ${g.cohort}`} · {g.members}
          </h3>
          <Stages g={g} />
          <Surface padding="none" className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm" data-funnel-table={g.cohort}>
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th scope="col" className="px-4 py-2">Stage</th>
                  <th scope="col" className="px-4 py-2 text-right">Members</th>
                  <th scope="col" className="px-4 py-2 text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {FUNNEL_STAGES.map((s) => (
                  <tr key={s} className="border-t border-line">
                    <td className="px-4 py-2 text-ink">{STAGE_LABEL[s]}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-body">{g.stages[s]}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-body">{pctOf(g.stages[s], g.members)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Surface>
          <Surface padding="none" className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm" data-retention-table={g.cohort}>
              <caption className="px-4 py-2 text-left text-xs font-medium text-body">Active graded weeks per member</caption>
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th scope="col" className="px-4 py-2">Band</th>
                  <th scope="col" className="px-4 py-2 text-right">Members</th>
                </tr>
              </thead>
              <tbody>
                {RETENTION_BANDS.map((b) => (
                  <tr key={b} className="border-t border-line" data-band={b}>
                    <td className="px-4 py-2 text-ink">{BAND_LABEL[b]}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-body">{g.retention[b]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Surface>
        </div>
      ))}
    </section>
  );
}

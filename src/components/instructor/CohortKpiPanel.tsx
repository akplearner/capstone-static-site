import { CheckCircle2, CircleDashed, CircleDot, MinusCircle } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import type { CohortKpiReport, KpiBand } from '@/lib/cohortKpi';
import type { KpiDef, KpiFamilyDef } from '@/lib/docs/kpis';
import type { BoardCopy } from '@/lib/docs/skillsCopy';

/**
 * R108 — the cohort KPI report as tables: one per cohort (and the whole
 * course first when there is more than one), sixteen rows each, counts per
 * band with an icon beside every count so a band is never colour alone.
 * Nobody is ranked and no member is named; props only, no motion.
 */
const BANDS: { id: KpiBand; Icon: typeof CheckCircle2 }[] = [
  { id: 'notStarted', Icon: CircleDashed },
  { id: 'inProgress', Icon: CircleDot },
  { id: 'complete', Icon: CheckCircle2 },
  { id: 'noDenominator', Icon: MinusCircle },
];

export function CohortKpiPanel({ report, defs, families, copy }: { report: CohortKpiReport; defs: KpiDef[]; families: KpiFamilyDef[]; copy: BoardCopy }) {
  const defOf = new Map(defs.map((d) => [d.id, d]));
  const familyOf = new Map(families.map((f) => [f.id, f.label]));
  const groups = report.groups.length > 1 ? [report.all, ...report.groups] : report.groups.length === 1 ? report.groups : [report.all];
  return (
    <section aria-labelledby="cohort-kpis" className="space-y-3" data-cohort-kpi-panel>
      <h2 id="cohort-kpis" className="text-xl font-semibold tracking-tight text-ink">{copy.cohortTitle}</h2>
      <p className="text-sm text-muted">{copy.cohortLede}</p>
      {groups.map((g) => (
        <Surface key={g.cohort} padding="none" className="relative overflow-x-auto">
          <table className="w-full text-sm" data-cohort-kpis={g.cohort}>
            <caption className="px-4 py-2 text-left text-xs font-medium text-body">
              {g.cohort} · {g.members}
            </caption>
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                {copy.cohortColumns.map((c, i) => (
                  <th key={c} scope="col" className={`px-4 py-2.5 ${i >= 3 ? 'text-right' : ''}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {g.kpis.map((k) => (
                <tr key={k.id} data-kpi-row={k.id}>
                  <td className="px-4 py-2 font-medium text-ink">{defOf.get(k.id)?.label ?? k.id}</td>
                  <td className="px-4 py-2 text-body">{familyOf.get(k.family) ?? k.family}</td>
                  <td className="px-4 py-2 text-muted">{k.fact}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-ink">{k.members}</td>
                  {BANDS.map(({ id, Icon }) => (
                    <td key={id} className="px-4 py-2 text-right tabular-nums text-body">
                      <span className="inline-flex items-center justify-end gap-1" title={copy.bands[id]}>
                        <Icon className="h-3.5 w-3.5 text-muted" aria-hidden />
                        <span className="sr-only">{copy.bands[id]} </span>
                        {k.bands[id]}
                      </span>
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-muted">
                    {k.sumValue} of {k.sumOf}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      ))}
    </section>
  );
}

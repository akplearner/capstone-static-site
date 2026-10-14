import type { KpiBoard } from '@/lib/kpiBoard';
import type { KpiDef, KpiFamilyDef } from '@/lib/docs/kpis';
import type { BoardCopy } from '@/lib/docs/skillsCopy';

/**
 * R108 — the sixteen as a table: the twin of the tiles for the portfolio
 * print and for anyone who reads numbers better in rows. Props only, no
 * motion; every figure the tiles count up is here in full.
 */
export interface ToolLine {
  label: string;
  value: number;
  of: number;
}

export function KpiTable({ board, defs, families, copy, perTool, title }: { board: KpiBoard; defs: KpiDef[]; families: KpiFamilyDef[]; copy: BoardCopy; perTool?: ToolLine[]; title?: string }) {
  const defOf = new Map(defs.map((d) => [d.id, d]));
  const familyOf = new Map(families.map((f) => [f.id, f.label]));
  const fact = (k: KpiBoard['kpis'][number]) => (!k.loaded ? copy.notLoaded : k.fact === 'own' ? copy.factOwn : k.fact === 'team' ? copy.factTeam : copy.factContent).split(':')[0];
  return (
    <div className="space-y-3" data-kpi-table-wrap>
      <h3 className="text-sm font-semibold text-ink">{title ?? copy.tableTitle}</h3>
      <div className="overflow-x-auto rounded-lg depth-edge bg-panel">
        <table className="w-full min-w-[560px] text-left text-xs" data-kpi-table>
          <thead>
            <tr className="text-2xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-3 py-2 font-semibold">KPI</th>
              <th scope="col" className="px-3 py-2 font-semibold">{copy.cohortColumns[1]}</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">n / m</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">%</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">{copy.contributionColumn}</th>
              <th scope="col" className="px-3 py-2 font-semibold">{copy.cohortColumns[2]}</th>
            </tr>
          </thead>
          <tbody>
            {board.kpis.map((k) => (
              <tr key={k.id} data-kpi-row={k.id} className="border-t border-line align-top">
                <td className="px-3 py-2 font-medium text-ink">
                  {defOf.get(k.id)?.label ?? k.id}
                  <div className="font-normal text-muted">{defOf.get(k.id)?.whyMember}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-body">{familyOf.get(k.family) ?? k.family}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-ink">{k.loaded ? `${k.value} / ${k.of}` : '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-body">{k.loaded && k.of > 0 ? `${k.pct}%` : '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-body" data-contribution={k.contribution ? `${k.contribution.value}/${k.contribution.of}` : ''}>{k.contribution ? `${k.contribution.value} / ${k.contribution.of}` : '—'}</td>
                <td className="px-3 py-2 text-muted">{fact(k)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {perTool && perTool.length > 0 && (
        <div className="overflow-x-auto rounded-lg depth-edge bg-panel">
          <table className="w-full text-left text-xs" data-kpi-tools>
            <caption className="px-3 py-2 text-left text-2xs uppercase tracking-wide text-muted">{copy.perTool}</caption>
            <tbody>
              {perTool.map((t) => (
                <tr key={t.label} className="border-t border-line">
                  <td className="px-3 py-1.5 text-ink">{t.label}</td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums text-body">{t.value} / {t.of}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

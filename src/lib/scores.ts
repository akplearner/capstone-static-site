import type { KpiValue } from './kpiBoard';
import type { ScoreDef } from './docs/scoring';

/**
 * R132 — the published scores, computed. Each score is the weighted mean of
 * the percentages of the KPIs its definition names (`docs/scoring.ts`); a
 * component whose fact was not loaded, or whose denominator is zero, is left
 * out and the weights of the rest are renormalised, so a score never reads a
 * zero that was not measured. The board carries every component with its
 * weight and whether it counted, so a reader can redo the sum. Pure: no
 * clock, no repository, no registry import; the definitions arrive as values.
 */

export interface ScoreComponentValue {
  kpi: string;
  weight: number;
  /** The KPI's percentage, 0..100, when it counted. */
  pct: number | null;
  counted: boolean;
}

export interface ScoreValue {
  id: string;
  /** 0..100 over the components that counted; 0 with none, and `loaded` false. */
  value: number;
  /** Components that counted, over components defined. */
  counted: number;
  of: number;
  loaded: boolean;
  components: ScoreComponentValue[];
}

export function scoreValue(def: ScoreDef, kpis: Pick<KpiValue, 'id' | 'pct' | 'of' | 'loaded'>[]): ScoreValue {
  const byId = new Map(kpis.map((k) => [k.id, k]));
  const components: ScoreComponentValue[] = def.components.map((c) => {
    const k = byId.get(c.kpi);
    const counted = !!k && k.loaded && k.of > 0;
    return { kpi: c.kpi, weight: c.weight, pct: counted ? k!.pct : null, counted };
  });
  const used = components.filter((c) => c.counted);
  const weight = used.reduce((n, c) => n + c.weight, 0);
  const value = weight > 0 ? Math.round(used.reduce((n, c) => n + (c.pct as number) * c.weight, 0) / weight) : 0;
  return { id: def.id, value: Math.max(0, Math.min(100, value)), counted: used.length, of: components.length, loaded: used.length > 0, components };
}

export function scoreValues(defs: ScoreDef[], kpis: Pick<KpiValue, 'id' | 'pct' | 'of' | 'loaded'>[]): ScoreValue[] {
  return defs.map((d) => scoreValue(d, kpis));
}

/** The one-use tier of the record: professional at the threshold, building below it, with the count. */
export type Tier = 'professional' | 'building';

export function tierOf(verifiedUses: number, threshold: number): Tier {
  return verifiedUses >= threshold ? 'professional' : 'building';
}

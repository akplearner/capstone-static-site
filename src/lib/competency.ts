import type { KpiValue } from './kpiBoard';
import { COMPETENCY_FACETS, type CompetencyFacetDef, type CompetencyFacetId } from './docs/competencyFacets';

/**
 * R141 — `capstone-competency/1`: the eight professional competency facets of
 * one member on one course, each a weighted mean of KPI percentages by the
 * published registry (`docs/competencyFacets.ts`). Pure: the board in, the
 * document out; no clock, no repository, no ranking.
 */
export const COMPETENCY_SCHEMA = 'capstone-competency/1';

export interface CompetencyComponent {
  kpi: string;
  weight: number;
  /** The KPI's percentage, when it counted. */
  pct: number | null;
  counted: boolean;
}

export interface CompetencyFacet {
  id: CompetencyFacetId;
  label: string;
  /** 0 to 100 over the components that counted; 0 when none did. */
  value: number;
  /** Components that counted, over components named. */
  counted: number;
  of: number;
  loaded: boolean;
  components: CompetencyComponent[];
  caveat: string;
}

export interface CompetencyDto {
  schema: typeof COMPETENCY_SCHEMA;
  courseId: string;
  role: string;
  facets: CompetencyFacet[];
}

function facetValue(def: CompetencyFacetDef, kpis: KpiValue[]): CompetencyFacet {
  const byId = new Map(kpis.map((k) => [k.id, k]));
  const components: CompetencyComponent[] = def.components.map((c) => {
    const k = byId.get(c.kpi);
    const counted = !!k && k.loaded && k.applies && k.unit !== 'count' && k.of > 0;
    return { kpi: c.kpi, weight: c.weight, pct: counted ? k!.pct : null, counted };
  });
  const used = components.filter((c) => c.counted);
  const weight = used.reduce((n, c) => n + c.weight, 0);
  const value = weight > 0 ? Math.round(used.reduce((n, c) => n + c.weight * (c.pct ?? 0), 0) / weight) : 0;
  return { id: def.id, label: def.label, value, counted: used.length, of: components.length, loaded: used.length > 0, components, caveat: def.caveat };
}

export function competencyOf(board: { courseId: string; role: string; kpis: KpiValue[] }, facets: CompetencyFacetDef[] = COMPETENCY_FACETS): CompetencyDto {
  return { schema: COMPETENCY_SCHEMA, courseId: board.courseId, role: board.role, facets: facets.map((f) => facetValue(f, board.kpis)) };
}

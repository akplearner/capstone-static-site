import type { ProfileRow, SkillProfile } from './skillProfile';
import type { KpiBoard, KpiValue, MeasureAgainst } from './kpiBoard';
import type { ScoreValue } from './scores';
import type { SkillDomainDef } from './docs/skillDomains';
import { levelRank } from './skillProfile';

/**
 * R133 — "Skills by course" as eight domains. Each domain lists the rows of
 * the dimensions it names that have evidence behind them: a verified step, an
 * approved form, a resolved fault, a chosen decision, a stamp a week after
 * another. A row with nothing behind it is a gap and is counted, never
 * listed. Beside each row: how often (verified steps or uses), how consistent
 * (verified on two or more tasks, in order, current), and what a
 * professional reader expects of it (required by the work role measured
 * against). Pure: the page hands in the profile, the board and the measure.
 */

export interface DomainRow {
  row: ProfileRow;
  /** Verified steps, or uses for a fact row. */
  frequency: number;
  /** The denominator of the frequency: verifiable steps, or uses. */
  frequencyOf: number;
  /** Verified on two or more tasks (a registry row), or more than one success (a fact row). */
  repeated: boolean;
  /** Every ordered task of the row was verified in authored order. */
  inOrder: boolean;
  /** The work role measured against requires this competency. */
  required: boolean;
  /** The forms, steps and decisions behind the row, counted. */
  evidence: { steps: number; forms: number; artifacts: number };
}

export interface DomainSection {
  def: SkillDomainDef;
  rows: DomainRow[];
  /** Rows the domain's dimensions hold with nothing behind them yet. */
  gaps: number;
  kpis: KpiValue[];
  score?: ScoreValue;
}

const VERIFIED = levelRank('verified');

/** A row has evidence when something verifiable stands behind it. */
export function hasEvidence(row: ProfileRow): boolean {
  // An execution row's uses are its denominator (checks due, tasks ordered), not something done: only a success is evidence there.
  if (row.uses !== undefined) return (row.successes ?? 0) > 0 || (row.dimension !== 'execution' && (row.uses ?? 0) > 0);
  return row.verifiedSteps > 0 || row.deliverablesApproved > 0 || levelRank(row.level) >= VERIFIED;
}

export function domainRow(row: ProfileRow, measure: Pick<MeasureAgainst, 'requiredCompetencies'>): DomainRow {
  const fact = row.uses !== undefined;
  return {
    row,
    frequency: fact ? (row.successes ?? 0) : row.verifiedSteps,
    frequencyOf: fact ? (row.uses ?? 0) : row.verifiableSteps,
    repeated: fact ? (row.successes ?? 0) >= 2 : row.verifiedTasks >= 2,
    inOrder: (row.orderedTasks ?? 0) > 0 && row.inOrderTasks === row.orderedTasks,
    required: row.dimension === 'skills' && measure.requiredCompetencies.includes(row.id),
    evidence: { steps: row.verifiedSteps, forms: row.deliverablesApproved, artifacts: row.artifacts },
  };
}

export function domainSections(profile: SkillProfile, board: Pick<KpiBoard, 'kpis' | 'scores'>, domains: SkillDomainDef[], measure: Pick<MeasureAgainst, 'requiredCompetencies'>): DomainSection[] {
  const kpiOf = new Map(board.kpis.map((k) => [k.id, k]));
  const scoreOf = new Map(board.scores.map((s) => [s.id, s]));
  return domains.map((def) => {
    const all = def.dimensions.flatMap((d) => profile.rows[d]);
    const seen = new Set<string>();
    const rows: DomainRow[] = [];
    let gaps = 0;
    for (const r of all) {
      const k = `${r.dimension}:${r.id}`;
      if (seen.has(k)) continue;
      seen.add(k);
      if (hasEvidence(r)) rows.push(domainRow(r, measure));
      else gaps += 1;
    }
    rows.sort((a, b) => levelRank(b.row.level) - levelRank(a.row.level) || b.frequency - a.frequency || a.row.label.localeCompare(b.row.label));
    return {
      def,
      rows,
      gaps,
      kpis: def.kpis.map((id) => kpiOf.get(id)).filter((k): k is KpiValue => !!k),
      ...(def.score && scoreOf.get(def.score) ? { score: scoreOf.get(def.score) } : {}),
    };
  });
}

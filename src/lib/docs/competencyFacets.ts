/**
 * R141 — the eight professional competency facets, as DATA.
 *
 * A facet is a LENS over the KPI board: a weighted mean of named KPI
 * percentages, like a score, but asked from the owner's competency framework
 * (decision quality, investigation quality, troubleshooting success, process
 * compliance, collaboration, communication, reliability, independence) rather
 * than from the exam. A facet may share a KPI with a score or with another
 * facet: the scores answer "how ready", the facets answer "what kind of
 * professional", and the same fact can inform both. The method is the same as
 * `scoring.ts`: weights sum to one, a component whose row is not loaded or has
 * no denominator is left out, and the result says how many components it
 * stands on. Nothing here ranks one member against another.
 */
export type CompetencyFacetId =
  | 'decisionQuality' | 'investigationQuality' | 'troubleshootingSuccess' | 'processCompliance'
  | 'collaboration' | 'communication' | 'reliability' | 'independence';

export interface CompetencyFacetDef {
  id: CompetencyFacetId;
  /** Four words or fewer. */
  label: string;
  /** Twenty-five words or fewer. */
  definition: string;
  components: { kpi: string; weight: number }[];
  /** What a reader may and may not read into it; twenty-five words or fewer. */
  caveat: string;
}

export const COMPETENCY_FACETS: CompetencyFacetDef[] = [
  {
    id: 'decisionQuality', label: 'Decision quality',
    definition: 'Decisions justified against named options, approved by the team, and changes planned with a way back.',
    components: [{ kpi: 'kpi.decision-making.decisions-justified', weight: 0.4 }, { kpi: 'kpi.decision-making.decisions-approved', weight: 0.3 }, { kpi: 'kpi.decision-making.change-rollback', weight: 0.3 }],
    caveat: 'Reads what was written and approved; it does not judge whether the choice was right.',
  },
  {
    id: 'investigationQuality', label: 'Investigation quality',
    definition: 'Evidence named to convention, faults worked to an outcome, and contradictions in the record found and closed.',
    components: [{ kpi: 'kpi.execution.evidence-named', weight: 0.4 }, { kpi: 'kpi.problem-solving.faults-resolved', weight: 0.3 }, { kpi: 'kpi.validation.conflicts-resolved', weight: 0.3 }],
    caveat: 'Faults are team rows; the evidence names are the member’s own files.',
  },
  {
    id: 'troubleshootingSuccess', label: 'Troubleshooting success',
    definition: 'Faults resolved, verifications reached after a failed paste, and stuck flags cleared.',
    components: [{ kpi: 'kpi.problem-solving.faults-resolved', weight: 0.4 }, { kpi: 'kpi.problem-solving.persistence', weight: 0.3 }, { kpi: 'kpi.problem-solving.flags-cleared', weight: 0.3 }],
    caveat: 'The same facts the Troubleshooting score reads, without the minutes.',
  },
  {
    id: 'processCompliance', label: 'Process compliance',
    definition: 'Steps verified in the authored order, every check due met, and procedures followed to their standard.',
    components: [{ kpi: 'kpi.execution.steps-in-order', weight: 0.4 }, { kpi: 'kpi.execution.dod-met', weight: 0.3 }, { kpi: 'kpi.technical.procedures-to-standard', weight: 0.3 }],
    caveat: 'Order is read from verification stamps; a step verified out of order is not a step done wrong.',
  },
  {
    id: 'collaboration', label: 'Collaboration',
    definition: 'Hand-offs closed, the RACI respected, peer reviews given when assigned, and decisions the team approved.',
    components: [{ kpi: 'kpi.teamwork.handoffs', weight: 0.35 }, { kpi: 'kpi.teamwork.raci-respected', weight: 0.25 }, { kpi: 'kpi.teamwork.peer-reviews-given', weight: 0.2 }, { kpi: 'kpi.decision-making.decisions-approved', weight: 0.2 }],
    caveat: 'Team facts count for the team; the role share on the KPIs says what this member moved.',
  },
  {
    id: 'communication', label: 'Communication',
    definition: 'Documents controlled, approved by the instructor, and decisions written with their reasons.',
    components: [{ kpi: 'kpi.professionalism.document-control', weight: 0.4 }, { kpi: 'kpi.professionalism.instructor-approved', weight: 0.3 }, { kpi: 'kpi.decision-making.decisions-justified', weight: 0.3 }],
    caveat: 'Reads the forms the role drafts; a well-written form a teammate drafted is theirs.',
  },
  {
    id: 'reliability', label: 'Reliability',
    definition: 'On time against the cohort calendar, controls cited, and approval earned.',
    components: [{ kpi: 'kpi.professionalism.on-time', weight: 0.5 }, { kpi: 'kpi.professionalism.controls-cited', weight: 0.25 }, { kpi: 'kpi.professionalism.instructor-approved', weight: 0.25 }],
    caveat: 'On time needs the cohort start date; without one the facet stands on the other two and says so.',
  },
  {
    id: 'independence', label: 'Independence',
    definition: 'First pastes that verified, values recalled weeks later, and scenarios applied without the form open.',
    components: [{ kpi: 'kpi.execution.first-try', weight: 0.4 }, { kpi: 'kpi.validation.recall-accuracy', weight: 0.3 }, { kpi: 'kpi.validation.applied-scenarios', weight: 0.3 }],
    caveat: 'A first try is a browser check; recall and application are answers to questions generated from the team’s own record.',
  },
];

export function facetOf(id: string): CompetencyFacetDef | undefined {
  return COMPETENCY_FACETS.find((f) => f.id === id);
}

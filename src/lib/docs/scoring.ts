/**
 * R132 — the published scores, as DATA.
 *
 * Before this round nothing on the platform was scored: every number was a
 * ratio of counts with its facts named. The workforce-readiness round allows
 * composite scores, on one condition: the method is published. Each score is
 * a weighted mean of KPI percentages (`kpis.ts`), the weights sum to one,
 * the result is 0 to 100, and the board carries every component with its
 * weight and whether it was counted (a component whose fact was not loaded,
 * or whose denominator is zero, is left out and the score says how many of
 * its components it stands on). `docs/SCORING.md` repeats this table in
 * words. Nothing here ranks one member against another.
 */

export type ScoreId = 'score.tool-proficiency' | 'score.troubleshooting-success' | 'score.judgment' | 'score.collaboration' | 'score.reliability' | 'score.readiness' | 'score.understanding';

export interface ScoreComponent {
  /** A `kpi.*` id with a ratio or minutes unit. */
  kpi: string;
  /** Weights of one score sum to one. */
  weight: number;
}

export interface ScoreDef {
  id: ScoreId;
  /** Four words or fewer. */
  label: string;
  /** Twenty-five words or fewer. */
  definition: string;
  components: ScoreComponent[];
  /** What a hiring reader may and may not read into it; twenty-five words or fewer. */
  caveat: string;
}

export const SCORES: ScoreDef[] = [
  {
    id: 'score.tool-proficiency', label: 'Tool proficiency',
    definition: 'Commands and skills proven by output, and skills proved on a second task, weighted.',
    components: [{ kpi: 'kpi.technical.commands-verified', weight: 0.4 }, { kpi: 'kpi.technical.skills-verified', weight: 0.3 }, { kpi: 'kpi.growth.skills-transferred', weight: 0.3 }],
    caveat: 'Reads browser checks and receipts of stamps, not proof of the machine; the per-tool table names each command.',
  },
  {
    id: 'score.troubleshooting-success', label: 'Troubleshooting success',
    definition: 'Faults resolved, retries that verified, stuck flags cleared and steps resolved within the hour, weighted.',
    components: [{ kpi: 'kpi.problem-solving.faults-resolved', weight: 0.4 }, { kpi: 'kpi.problem-solving.persistence', weight: 0.2 }, { kpi: 'kpi.problem-solving.flags-cleared', weight: 0.2 }, { kpi: 'kpi.problem-solving.time-to-resolution', weight: 0.2 }],
    caveat: 'Faults are team rows; the minutes are a median between two recorded stamps, so a step left open overnight is counted apart.',
  },
  {
    id: 'score.judgment', label: 'Judgment',
    definition: 'Decisions recorded, justified and approved, and changes with a rollback written, equally weighted.',
    components: [{ kpi: 'kpi.decision-making.decisions-recorded', weight: 0.25 }, { kpi: 'kpi.decision-making.decisions-justified', weight: 0.25 }, { kpi: 'kpi.decision-making.decisions-approved', weight: 0.25 }, { kpi: 'kpi.decision-making.change-rollback', weight: 0.25 }],
    caveat: 'Counts what was written against named options; it does not judge whether the choice was right.',
  },
  {
    id: 'score.collaboration', label: 'Collaboration',
    definition: 'Hand-offs closed, RACI respected and peer reviews given, weighted.',
    components: [{ kpi: 'kpi.teamwork.handoffs', weight: 0.35 }, { kpi: 'kpi.teamwork.raci-respected', weight: 0.35 }, { kpi: 'kpi.teamwork.peer-reviews-given', weight: 0.3 }],
    caveat: 'Team facts count for the team; the role share on the KPIs says what this member moved.',
  },
  {
    id: 'score.reliability', label: 'Reliability',
    definition: 'On time against the cohort calendar, document control complete, controls cited and instructor approval, weighted.',
    components: [{ kpi: 'kpi.professionalism.on-time', weight: 0.4 }, { kpi: 'kpi.professionalism.document-control', weight: 0.2 }, { kpi: 'kpi.professionalism.controls-cited', weight: 0.2 }, { kpi: 'kpi.professionalism.instructor-approved', weight: 0.2 }],
    caveat: 'On time needs the cohort start date; without one the score stands on the other three and says so.',
  },
  {
    id: 'score.readiness', label: 'Readiness',
    definition: 'Exam weight verified, work-role coverage, skills retained and steps in order, weighted.',
    components: [{ kpi: 'kpi.technical.exam-weight-verified', weight: 0.3 }, { kpi: 'kpi.growth.profile-coverage', weight: 0.3 }, { kpi: 'kpi.growth.retention', weight: 0.2 }, { kpi: 'kpi.execution.steps-in-order', weight: 0.2 }],
    caveat: 'A reading of the record against an exam and a work role, not a prediction of a pass or a hire.',
  },
  {
    id: 'score.understanding', label: 'Understanding retained',
    definition: 'Values recalled, scenarios applied and conflicts resolved, weeks after the team recorded them, weighted.',
    components: [{ kpi: 'kpi.validation.recall-accuracy', weight: 0.4 }, { kpi: 'kpi.validation.applied-scenarios', weight: 0.4 }, { kpi: 'kpi.validation.conflicts-resolved', weight: 0.2 }],
    caveat: 'Asks only about values the team recorded; before the checkpoint week the score stands on nothing and says so.',
  },
];

const byId = new Map(SCORES.map((s) => [s.id, s]));
export function scoreOf(id: string): ScoreDef | undefined {
  return byId.get(id as ScoreId);
}

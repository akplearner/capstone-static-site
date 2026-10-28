import type { Course, RosterEntry } from './types';
import type { DeliverableVersion, ValidationAnswer } from './data/types';
import type { CertContent, SkillsContent } from './content/read';
import type { DeliverableData, DeliverableDef } from './docs/types';
import { projectRecord, recordConflicts, type ProjectRecord, type RecordConflict } from './docs/projectRecord';
import { validationPlanOf, type Checkpoint } from './validation/plan';
import { validationActivities, type ValidationActivity } from './validation/activities';
import { projectArchitectureOf, type ProjectArchitectureDto } from './projectArchitecture';
import { projectInfrastructureOf, type ProjectInfrastructureDto } from './projectInfrastructure';
import { competencyOf, type CompetencyDto } from './competency';
import { skillValidationOf, type SkillValidationDto } from './skillValidation';
import { skillProfile, type OwnFacts, type TeamFacts } from './skillProfile';
import { applyEarned, type EarnedRow } from './earnedSkills';
import { defaultMeasure, kpiBoard } from './kpiBoard';
import { gradedWeeksCleared } from './course-helpers';
import { isDeliverableFiled } from './deliverableChain';

/**
 * R141 — one team's hidden layer, as the instructor's record console shows it.
 * Pure: the facts arrive as values (the cohort loader and the history read),
 * the documents leave as values. No clock, no repository, no ranking: the
 * members are listed in roster order and nothing compares them.
 */
export interface TeamRecordFacts {
  course: Course;
  teamId: string;
  members: RosterEntry[];
  docs: Record<string, DeliverableData>;
  history: DeliverableVersion[];
  /** Every member's answers on the team. */
  answers: ValidationAnswer[];
  registry: SkillsContent;
  cert: CertContent;
  deliverables: DeliverableDef[];
  ontologyVersion: string;
  /** Per member, the facts the profile reads; each optional where the loader did not read it. */
  memberFacts: (memberId: string) => {
    isStepDone: (taskId: string, stepId: string) => boolean;
    evidence: TeamFactsEvidence;
    artifacts: Parameters<typeof skillProfile>[0]['artifacts'];
    earned?: EarnedRow[];
    own?: OwnFacts;
    weekDue?: (week: number) => number | undefined;
  };
  team: Omit<TeamFacts, 'docs'>;
}

type TeamFactsEvidence = Parameters<typeof skillProfile>[0]['evidence'];

export interface MemberDocuments {
  memberId: string;
  displayName: string;
  role: string;
  competency: CompetencyDto;
  skillValidation: SkillValidationDto;
  answers: ValidationAnswer[];
}

export interface TeamRecordView {
  record: ProjectRecord;
  conflicts: RecordConflict[];
  checkpoints: Checkpoint[];
  activities: ValidationActivity[];
  architecture: ProjectArchitectureDto;
  infrastructure: ProjectInfrastructureDto;
  /** Per form: facts recorded and conflicts touching it — the diagram's overlay. */
  overlay: { byForm: Record<string, { values: number; conflicts: number; answered: number }> };
  members: MemberDocuments[];
}

export function teamRecordView(facts: TeamRecordFacts): TeamRecordView {
  const { course, teamId, deliverables } = facts;
  const record = projectRecord(facts.docs, deliverables);
  const conflicts = recordConflicts(record);
  const checkpoints = validationPlanOf(course);
  const activities = checkpoints.flatMap((checkpoint) => validationActivities({ course, defs: deliverables, record, conflicts, checkpoint }));
  const answers = facts.answers.filter((a) => a.courseId === course.id && a.teamId === teamId);
  const byForm: TeamRecordView['overlay']['byForm'] = {};
  for (const d of deliverables) {
    const values = record.entries.filter((e) => e.form === d.id).length;
    const touching = conflicts.filter((c) => c.forms.includes(d.id)).length;
    const answered = answers.filter((a) => a.recordKey.split('.')[0] === d.id).length;
    if (values || touching || answered) byForm[d.id] = { values, conflicts: touching, answered };
  }
  const capstone = deliverables.find((d) => d.capstone);
  const members: MemberDocuments[] = facts.members.map((m) => {
    const f = facts.memberFacts(m.memberId);
    const live = skillProfile({
      course,
      role: m.role,
      memberId: m.memberId,
      isStepDone: f.isStepDone,
      evidence: f.evidence,
      artifacts: f.artifacts,
      registry: facts.registry,
      cert: facts.cert,
      deliverables,
      team: { ...facts.team, docs: facts.docs },
      own: f.own,
      weekDue: f.weekDue,
    });
    const profile = f.earned ? applyEarned(live, f.earned) : live;
    const weeks = gradedWeeksCleared(course, m.role, f.isStepDone);
    const board = kpiBoard({
      profile,
      registry: facts.registry,
      cert: facts.cert,
      measure: defaultMeasure(facts.registry, m.role),
      outcome: { capstoneFiled: !!capstone && isDeliverableFiled(facts.docs[capstone.id]), weeksCleared: weeks.cleared, weeksTotal: weeks.total },
      ontologyVersion: facts.ontologyVersion,
    });
    const mine = answers.filter((a) => a.memberId === m.memberId);
    return { memberId: m.memberId, displayName: m.displayName, role: m.role, competency: competencyOf(board), skillValidation: skillValidationOf(profile, mine), answers: mine };
  });
  return {
    record,
    conflicts,
    checkpoints,
    activities,
    architecture: projectArchitectureOf({ courseId: course.id, teamId, record, conflicts, history: facts.history, checkpoints, activities, answers }),
    infrastructure: projectInfrastructureOf({ courseId: course.id, teamId, record, history: facts.history }),
    overlay: { byForm },
    members,
  };
}

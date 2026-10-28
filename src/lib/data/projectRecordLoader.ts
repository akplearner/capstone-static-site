import type { Course } from '../types';
import { docsRepo } from './index';
import { isStepDoneIn, type CohortData } from './cohortLoader';
import { bareDocument, courseDocument } from '../content/docs';
import { certOf, deliverablesOf, skillsOf } from '../content/read';
import { ONTOLOGY_VERSION } from '../docs/ontology';
import { weekDueFrom } from '../weekDue';
import type { TeamRecordFacts } from '../teamRecord';
import type { DeliverableVersion } from './types';

/**
 * R141 — the facts one team's record console needs, from the cohort loader
 * (roster, forms, evidence, answers, marks, ledger) plus the team's history
 * (0025), read on demand. The view itself is pure (`teamRecord.ts`).
 */
export async function loadTeamHistory(course: Course, teamId: string): Promise<DeliverableVersion[]> {
  return docsRepo.history(course.id, teamId);
}

export function teamRecordFacts(course: Course, data: CohortData, teamId: string, history: DeliverableVersion[], week: number): TeamRecordFacts {
  const doc = courseDocument(course.id) ?? bareDocument(course);
  const members = data.roster.filter((m) => m.teamId === teamId);
  const answers = members.flatMap((m) => data.validation[m.memberId] ?? []);
  return {
    course,
    teamId,
    members,
    docs: data.docs[teamId] ?? {},
    history,
    answers,
    registry: skillsOf(doc),
    cert: certOf(doc),
    deliverables: deliverablesOf(doc),
    ontologyVersion: ONTOLOGY_VERSION,
    team: {
      status: data.status[teamId] ?? [],
      submissions: data.submissions.filter((s) => s.teamId === teamId),
      reviews: data.reviews.filter((r) => r.teamId === teamId),
      currentWeek: week,
      marks: data.marks[teamId] ?? [],
    },
    memberFacts: (memberId) => {
      const m = members.find((x) => x.memberId === memberId);
      return {
        isStepDone: (t, s) => isStepDoneIn(data, course.id, memberId, t, s),
        evidence: data.evidence[memberId] ?? {},
        artifacts: data.artifacts[memberId] ?? [],
        earned: data.earned[memberId],
        own: { notes: [], reports: [], flagEvents: data.flagEvents[memberId] ?? [], peerReviews: data.peerReviewCounts[memberId], validation: data.validation[memberId] ?? [] },
        weekDue: m ? weekDueFrom(data.cohortDates.find((d) => d.cohort === m.cohort)) : undefined,
      };
    },
  };
}

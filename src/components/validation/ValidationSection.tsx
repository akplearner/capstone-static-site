'use client';

import { useMemo } from 'react';
import { docsRepo, validationRepo } from '@/lib/data';
import type { ValidationAnswer } from '@/lib/data/types';
import { deliverablesOf } from '@/lib/content/read';
import { useCourseDocument } from '@/lib/useCourse';
import { useClientStore, EMPTY_ARRAY, EMPTY_OBJECT } from '@/lib/useClientStore';
import { sha256Text } from '@/lib/evidenceLedger';
import { projectRecord, recordConflicts } from '@/lib/docs/projectRecord';
import type { DeliverableData } from '@/lib/docs/types';
import { checkpointsReached, validationPlanOf } from '@/lib/validation/plan';
import { judgeAnswer, validationActivities, type ValidationActivity } from '@/lib/validation/activities';
import type { Course, Member } from '@/lib/types';
import { ValidationPanel } from './ValidationPanel';

/**
 * R140 — the container: reads the team's documents and the member's answers,
 * generates the activities from the record (the same function the projection
 * runs, so the board reads the answers against the same ids), and records an
 * answer as its hash. Nothing here renders beyond the panel.
 */
export function ValidationSection({ course, member, currentWeek }: { course: Course; member: Member; currentWeek: number }) {
  const defs = deliverablesOf(useCourseDocument());
  const docs = useClientStore<Record<string, DeliverableData>>(() => docsRepo.get(course.id, member.teamId) ?? (EMPTY_OBJECT as Record<string, DeliverableData>), EMPTY_OBJECT as Record<string, DeliverableData>);
  const answers = useClientStore<ValidationAnswer[]>(() => validationRepo.list(course.id, member.memberId), EMPTY_ARRAY as ValidationAnswer[]);
  const { record, conflicts } = useMemo(() => {
    const record = projectRecord(docs, defs);
    return { record, conflicts: recordConflicts(record) };
  }, [docs, defs]);
  const checkpoints = useMemo(() => validationPlanOf(course), [course]);
  const reached = useMemo(() => checkpointsReached(course, currentWeek), [course, currentWeek]);
  const activities = useMemo(
    () => reached.flatMap((checkpoint) => validationActivities({ course, defs, record, conflicts, checkpoint })),
    [reached, course, defs, record, conflicts]
  );

  const onAnswer = (activity: ValidationActivity, given: string) => {
    const correct = judgeAnswer(activity, given, conflicts);
    void sha256Text(given.trim()).then((answerSha256) => {
      validationRepo.save({
        courseId: course.id,
        memberId: member.memberId,
        teamId: member.teamId,
        activityId: activity.id,
        checkpoint: activity.checkpoint,
        kind: activity.kind,
        recordKey: activity.recordKey,
        answerSha256,
        correct,
        explanation: activity.kind === 'explain' ? given.trim().slice(0, 2000) : '',
        at: Date.now(),
      });
    });
  };

  return <ValidationPanel checkpoints={checkpoints} reached={reached} activities={activities} answers={answers} currentWeek={currentWeek} recorded={record.entries.length} onAnswer={onAnswer} />;
}

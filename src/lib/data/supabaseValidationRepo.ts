'use client';

import { getBrowserClient } from '../supabase/client';
import { notifyStore } from '../useClientStore';
import { cache, getCurrentUserId } from './supabaseCache';
import { toast } from '@/lib/toastBus';
import type { ValidationAnswer, ValidationRepository } from './types';

/**
 * R140: validation answers in the cloud (0026). Reads are synchronous off the
 * cache (the course hydrate reads the team's rows, the user hydrate the member's
 * own across courses); a write is an optimistic append and an insert the
 * database stamps with its own clock. Append-only: a retry is a second row.
 */
export const supabaseValidationRepo: ValidationRepository = {
  list(courseId, memberId): ValidationAnswer[] {
    return cache.validation(courseId).filter((a) => a.memberId === memberId);
  },
  listTeam(courseId, teamId): ValidationAnswer[] {
    return cache.validation(courseId).filter((a) => a.teamId === teamId);
  },
  save(answer): void {
    cache.addValidation(answer);
    notifyStore();
    const supabase = getBrowserClient();
    const user_id = getCurrentUserId();
    if (!supabase || !user_id) return;
    void supabase
      .from('validation_answers')
      .insert({
        user_id,
        course_id: answer.courseId,
        team_id: answer.teamId,
        activity_id: answer.activityId,
        checkpoint: answer.checkpoint,
        kind: answer.kind,
        record_key: answer.recordKey,
        answer_sha256: answer.answerSha256,
        correct: answer.correct,
        explanation: answer.explanation,
      })
      .then(({ error }) => {
        if (error) {
          console.error('validation answer save failed', error.message);
          toast({ message: 'Couldn’t record the answer — the database may need supabase/setup.sql re-run (0026).', variant: 'warning', duration: 6000 });
        }
      });
  },
};

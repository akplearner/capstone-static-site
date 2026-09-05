'use client';

import { getBrowserClient } from '../supabase/client';
import { notifyStore } from '../useClientStore';
import {
  EvidenceArtifact,
  EvidenceRepository,
  PathRepository,
  StepEvidence,
} from './types';
import { cache, getCurrentUserId } from './supabaseCache';
import { toast } from '@/lib/toastBus';

// The evidence ledger and the chosen career path.
//
// Same house pattern as the other single-user repos: synchronous read off the
// cache, optimistic write, fire-and-forget upsert. Reads happen during render
// (the metrics projections run inside store selectors), so they cannot be async.
//
// What is deliberately NOT sent: the raw pasted terminal output. Only its
// SHA-256 and the match counts go to the server — see the privacy note in
// supabase/migrations/0003_evidence_ledger.sql.

export const supabaseEvidenceRepo: EvidenceRepository = {
  getSteps(courseId: string): Record<string, StepEvidence> {
    return cache.stepEvidence(courseId);
  },

  saveStep(_memberId: string, evidence: StepEvidence): void {
    cache.setStepEvidence(evidence);
    notifyStore();

    const supabase = getBrowserClient();
    if (!supabase) return;
    const user_id = getCurrentUserId();
    if (!user_id) return;

    void supabase
      .from('step_evidence')
      .upsert(
        {
          user_id,
          course_id: evidence.courseId,
          task_id: evidence.taskId,
          step_id: evidence.stepId,
          verified: evidence.verified,
          method: evidence.method,
          matched_tokens: evidence.matchedTokens,
          total_tokens: evidence.totalTokens,
          output_sha256: evidence.outputSha256 ?? null,
          attempts: evidence.attempts,
          first_attempt_at: evidence.firstAttemptAt
            ? new Date(evidence.firstAttemptAt).toISOString()
            : null,
          verified_at: evidence.verifiedAt ? new Date(evidence.verifiedAt).toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,course_id,task_id,step_id' }
      )
      .then(({ error }) => {
        if (error) {
          console.error('step_evidence save failed', error.message);
          toast({
            message: 'Couldn’t save your verification record — it’s held locally and will retry on reload.',
            variant: 'warning',
            duration: 6000,
          });
        }
      });
  },

  getArtifacts(courseId: string): EvidenceArtifact[] {
    return cache.artifacts(courseId);
  },

  saveArtifact(_memberId: string, artifact: EvidenceArtifact): void {
    cache.setArtifact(artifact);
    notifyStore();

    const supabase = getBrowserClient();
    if (!supabase) return;
    const user_id = getCurrentUserId();
    if (!user_id) return;

    void supabase
      .from('evidence_artifacts')
      .upsert(
        {
          user_id,
          course_id: artifact.courseId,
          sha256: artifact.sha256,
          filename: artifact.filename,
          size_bytes: artifact.sizeBytes,
          week: artifact.week ?? null,
          deliverable_id: artifact.deliverableId ?? null,
          name_ok: artifact.nameOk,
          hashed_at: new Date(artifact.hashedAt || Date.now()).toISOString(),
        },
        { onConflict: 'user_id,course_id,sha256' }
      )
      .then(({ error }) => {
        if (error) {
          console.error('evidence_artifacts save failed', error.message);
          toast({
            message: 'Couldn’t record that evidence hash — it’s held locally and will retry on reload.',
            variant: 'warning',
            duration: 6000,
          });
        }
      });
  },

  resetCourse(courseId: string): void {
    cache.clearEvidence(courseId);
    notifyStore();

    const supabase = getBrowserClient();
    if (!supabase) return;
    const user_id = getCurrentUserId();
    if (!user_id) return;

    for (const table of ['step_evidence', 'evidence_artifacts'] as const) {
      void supabase
        .from(table)
        .delete()
        .eq('user_id', user_id)
        .eq('course_id', courseId)
        .then(({ error }) => {
          if (error) console.error(`${table} reset failed`, error.message);
        });
    }
  },
};

export const supabasePathRepo: PathRepository = {
  get(): { pathId: string; chosenAt: number } | null {
    return cache.path();
  },

  save(_memberId: string, pathId: string): void {
    const chosenAt = Date.now();
    cache.setPath({ pathId, chosenAt });
    notifyStore();

    const supabase = getBrowserClient();
    if (!supabase) return;
    const user_id = getCurrentUserId();
    if (!user_id) return;

    void supabase
      .from('user_paths')
      .upsert(
        {
          user_id,
          path_id: pathId,
          chosen_at: new Date(chosenAt).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .then(({ error }) => {
        if (error) {
          console.error('user_paths save failed', error.message);
          toast({
            message: 'Couldn’t save your chosen path — it’s held locally and will retry on reload.',
            variant: 'warning',
            duration: 6000,
          });
        }
      });
  },

  clear(): void {
    cache.setPath(null);
    notifyStore();

    const supabase = getBrowserClient();
    if (!supabase) return;
    const user_id = getCurrentUserId();
    if (!user_id) return;

    void supabase
      .from('user_paths')
      .delete()
      .eq('user_id', user_id)
      .then(({ error }) => {
        if (error) console.error('user_paths clear failed', error.message);
      });
  },
};

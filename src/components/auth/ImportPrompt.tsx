'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Course, Member, TaskCompletion } from '@/lib/types';
import type { DeliverableData } from '@/lib/docs/types';
import { progressRepo, docsRepo, grcRepo, userStateRepo, labAccessRepo, evidenceRepo, pathRepo } from '@/lib/data';
import type { GrcData } from '@/lib/types';
import type { EvidenceArtifact, LabAccessData, StepEvidence, UserCourseState } from '@/lib/data';
import { getBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/useAuth';
import { useMember } from '@/lib/useMember';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { KEYS } from '@/lib/data/keys';
import { teamLabel } from '@/lib/team';
import { useClientStore } from '@/lib/useClientStore';

// First-sign-in migration: if this device has localStorage progress for the course
// but the account hasn't joined in the cloud yet, offer to import it once. Runs only
// in Supabase mode; the marker (per-account, per-course) prevents re-prompting.

/** Fallback timestamp for legacy completions stored before `completedAt` existed.
 *  Module scope keeps the impure clock read out of component render scope. */
function fallbackCompletedAt(): number {
  return Date.now();
}

function readLocal<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function ImportPrompt({ course }: { course: Course }) {
  const { user } = useAuth();
  const { member: cloudMember } = useMember(course.id);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  const marker = user ? `${KEYS.context(course.id)}_imported_${user.id}` : '';
  const alreadyImported = useClientStore<boolean>(
    () => (marker ? window.localStorage.getItem(marker) === '1' : false),
    false
  );

  // Local data to offer (read raw localStorage, since the live repo is now cloud).
  const localCtx = readLocal<Member>(KEYS.context(course.id));

  if (
    !isSupabaseConfigured() ||
    !user ||
    cloudMember || // already set up in the cloud
    !localCtx ||
    dismissed ||
    alreadyImported ||
    done
  ) {
    return null;
  }

  const setMarker = () => {
    try {
      window.localStorage.setItem(marker, '1');
    } catch {}
  };

  const runImport = async () => {
    setBusy(true);
    setFailed(false);
    const oldId = localCtx.memberId;
    const member: Member = { ...localCtx, memberId: user.id, courseId: course.id };

    // 1. Join the team under the account.
    progressRepo.joinTeam(course, member);

    // 2. Step completions (parse values to get task/step ids reliably).
    const prefix = KEYS.completionPrefix(course.id, oldId);
    let expected = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const c = readLocal<TaskCompletion>(key);
      if (c) {
        expected++;
        progressRepo.setCompletion({
          courseId: course.id,
          taskId: c.taskId,
          stepId: c.stepId,
          memberId: user.id,
          completedAt: c.completedAt ?? fallbackCompletedAt(),
        });
      }
    }

    // 3. Team deliverable forms.
    const localDocs = readLocal<Record<string, DeliverableData>>(KEYS.docs(course.id, localCtx.teamId));
    if (localDocs) docsRepo.save(course.id, localCtx.teamId, localDocs);

    // 4. GRC registers, lab access, and the resume pointer + Week-0 ack. These
    //    also live in the cloud now, so an import that skipped them would silently
    //    drop a returning student's work the moment they signed in.
    const localGrc = readLocal<GrcData>(KEYS.grc(course.id, localCtx.teamId));
    if (localGrc) grcRepo.save(course.id, localCtx.teamId, localGrc);

    const localLab = readLocal<LabAccessData>(KEYS.labAccess(course.id));
    if (localLab) labAccessRepo.save(course.id, user.id, localLab);

    const localResume = readLocal<NonNullable<UserCourseState['resume']>>(
      KEYS.resume(course.id, oldId)
    );
    const localAck = window.localStorage.getItem(KEYS.homeBuildAck(course.id)) === '1';
    if (localResume || localAck) {
      userStateRepo.save(course.id, user.id, {
        ...(localResume ? { resume: localResume } : {}),
        ...(localAck ? { homeBuildAck: true } : {}),
      });
    }

    // 5. The evidence ledger — the student's proof of work. Skipping this would
    //    silently downgrade every verified step back to an un-evidenced tick the
    //    moment they signed in, which is the single most valuable thing they own.
    const localEvidence = readLocal<Record<string, StepEvidence>>(
      KEYS.stepEvidence(course.id, oldId)
    );
    const evidenceRows = Object.values(localEvidence ?? {});
    evidenceRows.forEach((record) => evidenceRepo.saveStep(user.id, record));

    const localArtifacts = readLocal<EvidenceArtifact[]>(
      KEYS.evidenceArtifacts(course.id, oldId)
    );
    (localArtifacts ?? []).forEach((artifact) => evidenceRepo.saveArtifact(user.id, artifact));

    // The chosen career path is global rather than course-scoped, so it migrates
    // once regardless of which course triggered this prompt.
    const localPath = readLocal<{ pathId: string; chosenAt: number }>(KEYS.path(oldId));
    if (localPath?.pathId) pathRepo.save(user.id, localPath.pathId);

    // The repo writes are optimistic and fire-and-forget, so "no exception" does
    // NOT mean the server accepted them. Confirm against the database before
    // marking this course imported — otherwise a network blip would set the
    // marker, the prompt would never reappear, and the work would be gone.
    const ok = await verifyLanded(expected, evidenceRows.length);
    setBusy(false);
    if (!ok) {
      setFailed(true);
      return;
    }
    setMarker();
    setDone(true);
  };

  /** Read back what we just wrote. Returns false if the server is missing rows. */
  const verifyLanded = async (
    expectedCompletions: number,
    expectedEvidence: number
  ): Promise<boolean> => {
    const supabase = getBrowserClient();
    if (!supabase) return false;
    try {
      const [membership, completions, evidence] = await Promise.all([
        supabase
          .from('memberships')
          .select('user_id')
          .eq('course_id', course.id)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('step_completions')
          .select('step_id', { count: 'exact', head: true })
          .eq('course_id', course.id)
          .eq('user_id', user.id),
        // The ledger gets the same read-back as completions: it is the one store
        // where a silent partial write would cost the student something they
        // cannot reproduce by re-ticking a box.
        supabase
          .from('step_evidence')
          .select('step_id', { count: 'exact', head: true })
          .eq('course_id', course.id)
          .eq('user_id', user.id),
      ]);
      if (membership.error || !membership.data) return false;
      if (completions.error) return false;
      if ((completions.count ?? 0) < expectedCompletions) return false;
      if (evidence.error) return false;
      return (evidence.count ?? 0) >= expectedEvidence;
    } catch {
      return false;
    }
  };

  const dismiss = () => {
    setMarker();
    setDismissed(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start justify-between gap-3 rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-900/15"
    >
      <div className="flex items-start gap-2">
        <Upload className="mt-0.5 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
        <div>
          <h3 className="text-sm font-semibold text-ink">
            Import your saved progress?
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            We found progress saved on this device ({teamLabel(localCtx.teamId)} · {localCtx.role}). Import it
            into your account so it syncs across devices and to your team.
          </p>
          {/* The import is only marked done once the server confirms it, so this
              message means the local data is still intact and safe to retry. */}
          {failed && (
            <p className="mt-1.5 flex items-start gap-1.5 text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              The import didn’t finish, so nothing was marked as done. Your progress on this device is
              untouched — check your connection and try again.
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={runImport}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {failed ? 'Try again' : 'Import'}
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss import"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

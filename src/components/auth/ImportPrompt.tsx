'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Course, Member, TaskCompletion } from '@/lib/types';
import type { DeliverableData } from '@/lib/docs/types';
import { progressRepo, docsRepo } from '@/lib/data';
import { useAuth } from '@/lib/useAuth';
import { useMember } from '@/lib/useMember';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { KEYS } from '@/lib/data/keys';
import { useClientStore } from '@/lib/useClientStore';

// First-sign-in migration: if this device has localStorage progress for the course
// but the account hasn't joined in the cloud yet, offer to import it once. Runs only
// in Supabase mode; the marker (per-account, per-course) prevents re-prompting.

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
    const oldId = localCtx.memberId;
    const member: Member = { ...localCtx, memberId: user.id, courseId: course.id };

    // 1. Join the team under the account.
    progressRepo.joinTeam(course, member);

    // 2. Step completions (parse values to get task/step ids reliably).
    const prefix = KEYS.completionPrefix(course.id, oldId);
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const c = readLocal<TaskCompletion>(key);
      if (c) {
        progressRepo.setCompletion({
          courseId: course.id,
          taskId: c.taskId,
          stepId: c.stepId,
          memberId: user.id,
          completedAt: c.completedAt ?? Date.now(),
        });
      }
    }

    // 3. Team deliverable forms.
    const localDocs = readLocal<Record<string, DeliverableData>>(KEYS.docs(course.id, localCtx.teamId));
    if (localDocs) docsRepo.save(course.id, localCtx.teamId, localDocs);

    setMarker();
    setBusy(false);
    setDone(true);
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
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Import your saved progress?
          </h3>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
            We found progress saved on this device (Team {localCtx.teamId} · {localCtx.role}). Import it
            into your account so it syncs across devices and to your team.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={runImport}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Import
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

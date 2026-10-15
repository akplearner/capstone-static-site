'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { hydrateCourse } from '@/lib/data/supabaseCache';

/**
 * R117 — what a student sees when their team and role could not be read.
 *
 * "Not enrolled" would be a lie: the load failed (offline, an expired token),
 * and showing the Join panel instead invites an enrolled student to join again
 * and overwrite their own team and role. So this says what happened, that
 * nothing was lost, and offers the retry that puts them back where they were.
 */
export function CourseLoadFailed({ courseId }: { courseId: string }) {
  const [busy, setBusy] = useState(false);
  const retry = async () => {
    setBusy(true);
    await hydrateCourse(courseId);
    setBusy(false);
  };
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center" role="alert" data-load-failed>
      <h1 className="text-2xl font-bold text-ink">Couldn’t load your team</h1>
      <p className="text-muted">
        We couldn’t reach the server to read your team and role. Nothing was lost and you are still signed in. Check your connection and try again.
      </p>
      <Button onClick={retry} disabled={busy}>
        {busy ? 'Trying…' : 'Try again'}
      </Button>
    </div>
  );
}

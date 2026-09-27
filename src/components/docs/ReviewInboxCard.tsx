'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldQuestion } from 'lucide-react';
import { submissionsRepo } from '@/lib/data';

/**
 * Home's "reviews waiting for you" card (R84). Renders nothing until the
 * queue actually holds work — a student with no assignments should not learn
 * the feature exists from an empty box. Self-fetching so HomeTab's already
 * long prop list stays alone.
 */
export function ReviewInboxCard({ courseId }: { courseId: string }) {
  const [pending, setPending] = useState(0);
  useEffect(() => {
    let on = true;
    void submissionsRepo.queue().then((q) => {
      if (on) setPending(q.filter((i) => i.courseId === courseId && !i.done).length);
    });
    return () => {
      on = false;
    };
  }, [courseId]);

  if (pending === 0) return null;
  return (
    <Link
      href={`/courses/${courseId}/review`}
      className="flex items-center justify-between gap-3 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 hover:border-accent"
    >
      <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
        <ShieldQuestion className="h-5 w-5 shrink-0 text-accent" aria-hidden />
        <span>
          <span className="font-semibold">
            {pending} peer review{pending === 1 ? '' : 's'} waiting for you
          </span>{' '}
          — another team&apos;s work, names removed. Their pass depends on reviewers showing up.
        </span>
      </span>
      <span className="shrink-0 text-sm font-medium text-accent">Review →</span>
    </Link>
  );
}

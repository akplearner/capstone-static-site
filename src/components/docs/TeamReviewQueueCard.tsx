'use client';

import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';
import { statusOf } from '@/lib/docs/lifecycle';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { statusRepo } from '@/lib/data';
import { useClientStore, EMPTY_ARRAY } from '@/lib/useClientStore';

/**
 * R103: the team's documents waiting on THIS member — in review where they
 * are the reviewing role, approved where they are the issuing role. Renders
 * nothing until something is waiting, like the peer-review inbox beside it.
 */
export function TeamReviewQueueCard({ courseId, teamId, role }: { courseId: string; teamId: string; role: string }) {
  const rows = useClientStore(() => statusRepo.list(courseId, teamId), EMPTY_ARRAY);
  const defs = deliverablesForCourse(courseId).filter((d) => d.raci);
  const toReview = defs.filter((d) => d.raci!.reviews === role && statusOf(rows, d.id) === 'in_review');
  const toIssue = defs.filter((d) => d.raci!.approves === role && statusOf(rows, d.id) === 'approved');
  const items = [...toReview.map((d) => ({ d, verb: 'review' })), ...toIssue.map((d) => ({ d, verb: 'issue' }))];
  if (items.length === 0) return null;
  return (
    <div className="rounded-lg border border-accent/30 bg-accent-soft px-4 py-3" data-team-queue>
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <ClipboardCheck className="h-5 w-5 shrink-0 text-accent" aria-hidden />
        {items.length} document{items.length === 1 ? '' : 's'} waiting for you
      </div>
      <ul className="mt-1 space-y-0.5 text-sm text-body">
        {items.map(({ d, verb }) => (
          <li key={d.id}>
            <Link href={`/courses/${courseId}/docs?week=${Math.min(...d.weeks)}&form=${d.id}`} className="font-medium text-accent underline-offset-2 hover:underline">
              {d.title}
            </Link>{' '}
            <span className="text-muted">— yours to {verb}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

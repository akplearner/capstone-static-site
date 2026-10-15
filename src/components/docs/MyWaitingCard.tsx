'use client';

import Link from 'next/link';
import { Hourglass } from 'lucide-react';
import { allowedActions, isVacant, statusOf, submitterOf } from '@/lib/docs/lifecycle';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { progressRepo, statusRepo } from '@/lib/data';
import { getRoleDef } from '@/lib/course-helpers';
import { useClientStore, EMPTY_ARRAY } from '@/lib/useClientStore';
import { useCourse } from '@/lib/useCourse';

/**
 * R118: what THIS member is waiting on. `TeamReviewQueueCard` lists the team's
 * documents waiting on the member; this is its other half: a document the
 * member sent for review that is still in review, and a document they drafted
 * that is approved and waits to be issued. Each line names the role it waits
 * on, and says so when nobody on the team holds that role (any member may
 * cover it, R117). Renders nothing until something is waiting.
 */
export function MyWaitingCard({ courseId, teamId, role, memberId }: { courseId: string; teamId: string; role: string; memberId: string }) {
  const course = useCourse();
  const rows = useClientStore(() => statusRepo.list(courseId, teamId), EMPTY_ARRAY);
  const roster = useClientStore(() => progressRepo.getRoster(courseId), EMPTY_ARRAY);
  const team = roster.filter((r) => r.teamId === teamId).map((r) => ({ memberId: r.memberId, role: r.role }));
  const actor = { memberId, role };
  const name = (id: string) => getRoleDef(course, id)?.name ?? id;
  const items = deliverablesForCourse(courseId)
    .filter((d) => d.raci)
    .flatMap((d) => {
      const status = statusOf(rows, d.id);
      const can = allowedActions(d, rows, actor, team, true);
      if (status === 'in_review' && submitterOf(rows, d.id) === memberId && !can.includes('approve')) return [{ d, on: d.raci!.reviews, verb: 'review' }];
      if (status === 'approved' && d.raci!.drafts === role && !can.includes('issue')) return [{ d, on: d.raci!.approves, verb: 'issue' }];
      return [];
    });
  if (items.length === 0) return null;
  return (
    <div className="rounded-lg bg-panel-2 px-4 py-3" data-my-waiting>
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Hourglass className="h-5 w-5 shrink-0 text-muted" aria-hidden />
        {items.length} document{items.length === 1 ? '' : 's'} waiting on your teammates
      </div>
      <ul className="mt-1 space-y-0.5 text-sm text-body">
        {items.map(({ d, on, verb }) => (
          <li key={`${d.id}-${verb}`}>
            <Link href={`/courses/${courseId}/docs?week=${Math.min(...d.weeks)}&form=${d.id}`} className="font-medium text-accent underline-offset-2 hover:underline">
              {d.title}
            </Link>{' '}
            <span className="text-muted">
              — waiting on {name(on)} to {verb}
              {isVacant(team, on) && <span data-covering>: nobody on the team holds it, so any member may cover</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

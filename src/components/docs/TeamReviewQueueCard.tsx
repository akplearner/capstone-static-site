'use client';

import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';
import { allowedActions, statusOf } from '@/lib/docs/lifecycle';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { progressRepo, statusRepo } from '@/lib/data';
import { getRoleDef } from '@/lib/course-helpers';
import { useClientStore, EMPTY_ARRAY } from '@/lib/useClientStore';
import { useCourse } from '@/lib/useCourse';

/**
 * R103: the team's documents waiting on THIS member — in review where they
 * are the reviewing role, approved where they are the issuing role. Renders
 * nothing until something is waiting, like the peer-review inbox beside it.
 *
 * R117: "waiting on this member" includes a step whose role nobody on the team
 * holds, which any member may cover (`allowedActions` decides, so this card and
 * the buttons on the document never disagree); the line says it is cover.
 */
export function TeamReviewQueueCard({ courseId, teamId, role, memberId }: { courseId: string; teamId: string; role: string; memberId: string }) {
  const course = useCourse();
  const rows = useClientStore(() => statusRepo.list(courseId, teamId), EMPTY_ARRAY);
  const roster = useClientStore(() => progressRepo.getRoster(courseId), EMPTY_ARRAY);
  const team = roster.filter((r) => r.teamId === teamId).map((r) => ({ memberId: r.memberId, role: r.role }));
  const actor = { memberId, role };
  const defs = deliverablesForCourse(courseId).filter((d) => d.raci);
  const toReview = defs.filter((d) => statusOf(rows, d.id) === 'in_review' && allowedActions(d, rows, actor, team, true).includes('approve'));
  const toIssue = defs.filter((d) => statusOf(rows, d.id) === 'approved' && allowedActions(d, rows, actor, team, true).includes('issue'));
  const items = [
    ...toReview.map((d) => ({ d, verb: 'review', covering: d.raci!.reviews !== role ? d.raci!.reviews : null })),
    ...toIssue.map((d) => ({ d, verb: 'issue', covering: d.raci!.approves !== role ? d.raci!.approves : null })),
  ];
  if (items.length === 0) return null;
  return (
    <div className="rounded-lg border border-accent/30 bg-accent-soft px-4 py-3" data-team-queue>
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <ClipboardCheck className="h-5 w-5 shrink-0 text-accent" aria-hidden />
        {items.length} document{items.length === 1 ? '' : 's'} waiting for you
      </div>
      <ul className="mt-1 space-y-0.5 text-sm text-body">
        {items.map(({ d, verb, covering }) => (
          <li key={`${d.id}-${verb}`}>
            <Link href={`/courses/${courseId}/docs?week=${Math.min(...d.weeks)}&form=${d.id}`} className="font-medium text-accent underline-offset-2 hover:underline">
              {d.title}
            </Link>{' '}
            <span className="text-muted">
              — yours to {verb}
              {covering && <span data-covering> (covering for {getRoleDef(course, covering)?.name ?? covering}: nobody on the team holds it)</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

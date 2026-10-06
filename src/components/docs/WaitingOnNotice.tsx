'use client';

import Link from 'next/link';
import type { DeliverableDef } from '@/lib/docs/types';
import { STATUS_LABEL, waitingOn } from '@/lib/docs/lifecycle';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { statusRepo } from '@/lib/data';
import { useClientStore, EMPTY_ARRAY } from '@/lib/useClientStore';
import { useCourse } from '@/lib/useCourse';
import { getRoleDef } from '@/lib/course-helpers';
import { Alert } from '@/components/ui/Alert';

/**
 * R103: the forms this one is built from that are not yet approved. A notice,
 * never a lock — the team can keep writing; it just knows what it is waiting
 * on and who holds it.
 */
export function WaitingOnNotice({ def, courseId, teamId }: { def: DeliverableDef; courseId: string; teamId: string }) {
  const course = useCourse();
  const rows = useClientStore(() => statusRepo.list(courseId, teamId), EMPTY_ARRAY);
  const waiting = waitingOn(deliverablesForCourse(courseId), rows, def);
  if (waiting.length === 0) return null;
  return (
    <Alert variant="info">
      <span className="font-semibold">Waiting on:</span>{' '}
      {waiting.map((w, i) => (
        <span key={w.id} data-waiting-on={w.id}>
          {i > 0 && ', '}
          <Link href={`/courses/${courseId}/docs?form=${w.id}`} className="underline underline-offset-2">
            {w.title}
          </Link>{' '}
          ({getRoleDef(course, w.role)?.name ?? w.role} · {STATUS_LABEL[w.status].toLowerCase()})
        </span>
      ))}
      . You can keep writing; the rows you carry forward may still change.
    </Alert>
  );
}

'use client';

import { ArrowRight } from 'lucide-react';
import { Collapsible } from '@/components/ui/Button';
import { Runs, fillRuns } from '@/components/docs/Runs';
import { deliverablesForCourse, getDeliverable } from '@/lib/docs/definitions';
import {
  DOCS_REDUCTION,
  DOCS_REDUCTION_ADMIN as ADMIN,
  DOCS_REDUCTION_COPY as COPY,
} from '@/lib/docs/securityContent';

/**
 * The old course produced 17 loose working files; this platform consolidates
 * them into graded deliverables. Showing the mapping makes the change legible to
 * a returning student.
 *
 * The map and the sentence around it are content (`securityContent.ts`); the two
 * counts are computed from that map and from the deliverables themselves, so the
 * prose cannot claim a number the table disagrees with.
 */

function Table() {
  const oldCount = DOCS_REDUCTION.reduce((n, m) => n + m.old.length, 0) + ADMIN.length;
  const newCount = deliverablesForCourse('security-plus').length;
  return (
    <div className="overflow-x-auto pb-2">
      <p className="mb-3 text-sm text-muted">
        <Runs runs={fillRuns(COPY.summary, { old: oldCount, new: newCount })} />
      </p>
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="py-2 pr-3">{COPY.columns[0]}</th>
            <th scope="col" className="py-2 pr-3" />
            <th scope="col" className="py-2 pr-3">{COPY.columns[1]}</th>
          </tr>
        </thead>
        <tbody>
          {DOCS_REDUCTION.map((m) => {
            const def = getDeliverable(m.id);
            return (
              <tr key={m.id} className="border-b border-line align-top">
                <td className="py-1.5 pr-3 font-mono text-xs text-muted">
                  {m.old.join(' · ')}
                </td>
                <td className="py-1.5 pr-3 text-muted">
                  <ArrowRight className="h-4 w-4" />
                </td>
                <td className="py-1.5 pr-3 font-medium text-ink">
                  {def?.num}. {def?.title}{' '}
                  <span className="font-mono text-xs font-normal text-muted">{def?.file}</span>
                </td>
              </tr>
            );
          })}
          <tr className="align-top">
            <td className="py-1.5 pr-3 font-mono text-xs text-muted">
              {ADMIN.join(' · ')}
            </td>
            <td className="py-1.5 pr-3 text-muted">
              <ArrowRight className="h-4 w-4" />
            </td>
            <td className="py-1.5 pr-3 text-muted">
              <Runs runs={COPY.adminRow} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function DocsReductionTable({ collapsible = false }: { collapsible?: boolean }) {
  if (collapsible) {
    return (
      <div className="rounded-lg clay-rim bg-panel px-5">
        <Collapsible title={COPY.collapsedTitle} defaultOpen={false}>
          <Table />
        </Collapsible>
      </div>
    );
  }
  return <Table />;
}

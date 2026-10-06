'use client';

import type { Course } from '@/lib/types';
import { roleFlow } from '@/lib/docs/roleFlow';
import { deliverablesOf, roleGuidesOf } from '@/lib/content/read';
import { useCourseDocument } from '@/lib/useCourse';
import { RoleIcon } from '@/components/team/RoleIcon';

/**
 * R104: the roles as one table — mission, how the role works, what it
 * drafts, reviews and approves, who it hands to and who it waits on. Every
 * cell is read off the course document (the RACI on each form and the role
 * guide), so the overview is as short as the data. Replaces the mission
 * cards and the "what you owe" paragraph.
 */
const WORKS: Record<string, string> = { commands: 'Commands', documents: 'Documents', both: 'Both' };

export function RoleTable({ course, highlightRole }: { course: Course; highlightRole?: string }) {
  const doc = useCourseDocument();
  const defs = deliverablesOf(useCourseDocument());
  const guides = roleGuidesOf(doc);
  const flow = roleFlow(course.roles, defs);
  const title = (id: string) => defs.find((d) => d.id === id)?.title ?? id;
  const name = (id: string) => course.roles.find((r) => r.id === id)?.name ?? id;
  const count = (ids: string[]) => (ids.length ? <span className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold tabular-nums text-accent-ink" title={ids.map(title).join(' · ')}>{ids.length}</span> : <span className="text-muted">–</span>);
  const names = (ids: string[]) => (ids.length ? ids.map(name).join(', ') : '–');

  return (
    <div className="overflow-x-auto rounded-lg depth-edge bg-panel" data-role-table>
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead>
          <tr className="text-2xs uppercase tracking-wide text-muted">
            <th scope="col" className="px-3 py-2 font-semibold">Role</th>
            <th scope="col" className="px-3 py-2 font-semibold">Mission</th>
            <th scope="col" className="px-3 py-2 font-semibold">Works in</th>
            <th scope="col" className="px-3 py-2 text-center font-semibold">Drafts</th>
            <th scope="col" className="px-3 py-2 text-center font-semibold">Reviews</th>
            <th scope="col" className="px-3 py-2 text-center font-semibold">Approves</th>
            <th scope="col" className="px-3 py-2 font-semibold">Hands to</th>
            <th scope="col" className="px-3 py-2 font-semibold">Waits on</th>
          </tr>
        </thead>
        <tbody>
          {flow.rows.map((row) => {
            const guide = guides[row.role.id];
            const mine = highlightRole === row.role.id;
            return (
              <tr key={row.role.id} data-role-row={row.role.id} aria-current={mine ? 'true' : undefined} className={`border-t border-line align-top ${mine ? 'bg-accent-soft/40' : ''}`}>
                <th scope="row" className="whitespace-nowrap px-3 py-2 font-semibold text-ink">
                  <span className="inline-flex items-center gap-1.5">
                    <RoleIcon iconName={row.role.icon} className="h-3.5 w-3.5 shrink-0" color={row.role.color} />
                    {row.role.name}
                  </span>
                </th>
                <td className="px-3 py-2 text-body">{row.role.mission}</td>
                <td className="whitespace-nowrap px-3 py-2 text-muted">{guide ? WORKS[guide.works] : '–'}</td>
                <td className="px-3 py-2 text-center">{count(row.drafts)}</td>
                <td className="px-3 py-2 text-center">{count(row.reviews)}</td>
                <td className="px-3 py-2 text-center">{count(row.approves)}</td>
                <td className="px-3 py-2 text-body">{names(row.handsTo)}</td>
                <td className="px-3 py-2 text-body">{names(row.waitsOn)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

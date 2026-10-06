'use client';

import { motion } from 'framer-motion';
import type { Course } from '@/lib/types';
import { roleFlow } from '@/lib/docs/roleFlow';
import { profileOf, splitRoleName } from '@/lib/docs/roles';
import { deliverablesOf, rolesOf } from '@/lib/content/read';
import { useCourseDocument } from '@/lib/useCourse';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import { resolveRoleMotion } from '@/lib/roleMotion';
import { useRoleFocus } from '@/lib/useRoleFocus';
import { RoleIcon } from '@/components/team/RoleIcon';

/**
 * R104/R105: the roles as one table — function and title, mission, how the
 * role works, what it drafts, reviews and approves, who it hands to and
 * waits on. Every cell is read off the course document (the RACI on each
 * form and the role profile), so the overview is as short as the data.
 * Rows reveal on the course's motion spec; the viewer's row starts in
 * focus and a click on a role moves it, dimming the rows that are not it.
 */
export function RoleTable({ course, highlightRole }: { course: Course; highlightRole?: string }) {
  const content = rolesOf(useCourseDocument());
  const defs = deliverablesOf(useCourseDocument());
  const m = resolveRoleMotion(content.MOTION, useReducedMotionSafe());
  const { focus, pinned, toggle, touches } = useRoleFocus(highlightRole);
  const flow = roleFlow(course.roles, defs);
  const title = (id: string) => defs.find((d) => d.id === id)?.title ?? id;
  const name = (id: string) => splitRoleName(course.roles.find((r) => r.id === id)?.name ?? id).fn;
  const count = (ids: string[]) => (ids.length ? <span className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold tabular-nums text-accent-ink" title={ids.map(title).join(' · ')}>{ids.length}</span> : <span className="text-muted">–</span>);
  const names = (ids: string[]) => (ids.length ? ids.map(name).join(', ') : '–');

  return (
    <div className="overflow-x-auto rounded-lg depth-edge bg-panel" data-role-table data-focus={focus ?? 'none'}>
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
          {flow.rows.map((row, i) => {
            const profile = profileOf(content.PROFILES, row.role.id);
            const mine = highlightRole === row.role.id;
            const lit = touches(row.role.id);
            const { fn, tag } = splitRoleName(row.role.name);
            return (
              <motion.tr
                key={row.role.id}
                data-role-row={row.role.id}
                data-dim={lit ? undefined : 'true'}
                aria-current={mine ? 'true' : undefined}
                className={`cursor-pointer border-t border-line align-top ${focus === row.role.id ? 'bg-accent-soft/40' : ''}`}
                onClick={() => toggle(row.role.id)}
                initial={m.on ? { opacity: 0, y: 4 } : false}
                animate={{ opacity: lit ? 1 : 0.5, y: 0 }}
                transition={m.row(i)}
              >
                <th scope="row" className="whitespace-nowrap px-3 py-2 font-semibold text-ink">
                  <button type="button" aria-pressed={pinned === row.role.id} onClick={(e) => { e.stopPropagation(); toggle(row.role.id); }} className="inline-flex items-start gap-1.5 text-left">
                    <RoleIcon iconName={row.role.icon} className="mt-0.5 h-3.5 w-3.5 shrink-0" color={row.role.color} />
                    <span>
                      <span className="block">{fn}</span>
                      {tag && <span className="block text-2xs font-normal text-muted">{tag}</span>}
                    </span>
                  </button>
                </th>
                <td className="px-3 py-2 text-body">{row.role.mission}</td>
                <td className="whitespace-nowrap px-3 py-2 text-muted">{profile ? content.WORKS_SHORT[profile.works] : '–'}</td>
                <td className="px-3 py-2 text-center">{count(row.drafts)}</td>
                <td className="px-3 py-2 text-center">{count(row.reviews)}</td>
                <td className="px-3 py-2 text-center">{count(row.approves)}</td>
                <td className="px-3 py-2 text-body">{names(row.handsTo)}</td>
                <td className="px-3 py-2 text-body">{names(row.waitsOn)}</td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

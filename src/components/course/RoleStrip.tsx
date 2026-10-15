'use client';

import Link from 'next/link';
import { useContext } from 'react';
import { UserPlus } from 'lucide-react';
import { CourseContext } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { getRoleDef } from '@/lib/course-helpers';
import { splitRoleName } from '@/lib/docs/roles';
import { teamLabel } from '@/lib/team';
import { RoleIcon } from '@/components/team/RoleIcon';

// Its own row on a phone (so it can never push the tabs off screen), one more
// item in the bar from `sm` up.
const BASE = 'order-first flex h-8 min-w-0 max-w-full basis-full items-center gap-2 rounded-md px-2.5 text-sm sm:order-none sm:basis-auto';

/** Scroll to the Home role section, retrying while a tab switch mounts it. */
function goToRole(): void {
  let tries = 0;
  const go = () => {
    const el = document.getElementById('role');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if (tries++ < 16) setTimeout(go, 120);
  };
  go();
}

/**
 * The member's role, always on top (R116).
 *
 * It is the first item inside `CourseSubNav`, the one sticky bar every course
 * page renders, so it stays at the top edge however far the page scrolls,
 * follows the site header's auto-hide, and survives Focus mode. It says "Your
 * role", the role's icon and name, and the team. Until the member loads it is a
 * grey block of the same size; a visitor with no role sees a way in ("No role
 * yet. Join"), never an empty bar. It links to the role section on Home.
 */
export function RoleStrip({ courseId, onSelectHome }: { courseId: string; onSelectHome?: () => void }) {
  const course = useContext(CourseContext);
  const { member, loading } = useMember(courseId);
  if (!course) return null;
  if (loading) return <span aria-hidden data-role-strip="loading" className={`${BASE} w-52 animate-pulse bg-panel-2 motion-reduce:animate-none`} />;
  if (!member) {
    return (
      <Link href={`/courses/${courseId}#join-panel`} data-role-strip="none" className={`${BASE} focusable bg-panel-2 text-muted hover:text-ink`}>
        <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
        <span>No role yet.</span>
        <span className="font-semibold text-accent">Join</span>
      </Link>
    );
  }
  const role = getRoleDef(course, member.role);
  const name = role?.name ?? member.role;
  const { fn, tag } = splitRoleName(name);
  const team = teamLabel(member.teamId);
  const body = (
    <>
      <RoleIcon iconName={role?.icon} className="h-5 w-5 shrink-0" color={role?.color} />
      <span className="min-w-0 truncate">
        <span className="font-mono text-2xs font-semibold uppercase tracking-wider text-muted">Your role</span>{' '}
        <span className="font-semibold text-ink">{fn}</span>
        {tag && <span className="hidden text-muted md:inline"> ({tag})</span>}
        <span className="text-muted"> · {team}</span>
      </span>
    </>
  );
  const cls = `${BASE} focusable bg-accent-soft hover:bg-panel-2`;
  const label = `Your role: ${name}, ${team}`;
  if (onSelectHome) {
    return (
      <button
        type="button"
        data-role-strip="member"
        aria-label={label}
        className={`${cls} text-left`}
        onClick={() => {
          onSelectHome();
          goToRole();
        }}
      >
        {body}
      </button>
    );
  }
  return (
    <Link href={`/courses/${courseId}#role`} data-role-strip="member" aria-label={label} className={cls}>
      {body}
    </Link>
  );
}

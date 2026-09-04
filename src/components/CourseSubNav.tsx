'use client';

import Link from 'next/link';
import { useId, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { SPRING } from '@/lib/motion';
import { BookOpen, ClipboardList, Home, ListChecks } from 'lucide-react';

export type CourseTab = 'home' | 'tasks' | 'deliverables' | 'guide';

const BASE =
  'relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors';
const INACTIVE = 'text-muted hover:bg-panel-2 hover:text-ink';
// text-accent-contrast so the active tab label stays legible when a dark theme
// lightens the accent (see --color-accent-contrast in globals.css).
//
// The FILL is no longer here — it moved into a `layoutId` element behind the
// label, so this now carries only the ink. All three selectors in the app (this
// nav, the week rail, ui/Tabs) are the same shape as a result.
const ACTIVE = 'text-accent-contrast';
const cls = (active: boolean) => `${BASE} ${active ? ACTIVE : INACTIVE}`;

/**
 * The sliding fill, and an honest note about how far it slides.
 *
 * On the course dashboard, Home and Tasks are both buttons in one commit, so
 * moving between them genuinely animates. Home→Guide and Tasks→Deliverables are
 * Next route changes: this whole nav unmounts and the next page's nav mounts
 * with the pill already at its destination. So the pill animates for one of the
 * six transitions and appears in place for the rest.
 *
 * That is normal — it is what a shared-layout indicator does across a route
 * boundary, and every app with one behaves this way. It is written down because
 * it is the reason this was the weakest item in the round, and because the
 * obvious "fix" (hoisting the nav above the router) would trade a real page
 * boundary for an animation nobody asked for.
 */
function ActivePill({ id }: { id: string }) {
  return (
    <motion.span
      layoutId={id}
      transition={SPRING.slide}
      className="absolute inset-0 -z-10 rounded-md bg-accent"
      aria-hidden
    />
  );
}

interface CourseSubNavProps {
  courseId: string;
  active: CourseTab;
  /** Team id once joined; when absent Deliverables is hidden (there is no team to file for). */
  teamId?: string | null;
  /** On the dashboard, Home/Tasks switch client tabs; on sub-pages they're omitted
   *  and Home/Tasks link back to the dashboard instead. */
  onSelectTab?: (tab: 'home' | 'tasks') => void;
  /** Optional trailing content (e.g. progress + Continue on the dashboard). */
  trailing?: ReactNode;
}

/**
 * The one in-course navigation bar — Home / Tasks / Deliverables / Guide —
 * rendered identically on the dashboard AND every sub-page so the tabs never
 * disappear. On the dashboard Home/Tasks are client-state buttons (onSelectTab);
 * on sub-pages they link back to the dashboard (`?tab=tasks` deep-links Tasks).
 *
 * Four, down from six surfaces. Team folded into Home (your own team is the
 * only one you can see, so it never needed a URL of its own), and the Reference
 * manual folded into the Guide — it showed as "Guide" in this bar anyway, so a
 * student on it could not tell where they were.
 */
export function CourseSubNav({ courseId, active, teamId, onSelectTab, trailing }: CourseSubNavProps) {
  const cur = (tab: CourseTab) => (active === tab ? 'page' : undefined);
  const pillId = `subnav-pill-${useId()}`;
  // Each tab's inner content, written once. The onSelectTab ternary below
  // already duplicates every label/icon pair; adding the pill to both branches
  // by hand would have made that four copies of each.
  const body = (tab: CourseTab, icon: ReactNode, label: string) => (
    <>
      {active === tab && <ActivePill id={pillId} />}
      {icon} {label}
    </>
  );
  return (
    <nav
      aria-label="Course sections"
      style={{ top: 'var(--nav-h, 0px)' }}
      className="sticky z-30 -mx-4 flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-line bg-surface/95 px-4 py-2 backdrop-blur"
    >
      {onSelectTab ? (
        <button type="button" aria-current={cur('home')} onClick={() => onSelectTab('home')} className={cls(active === 'home')}>
          {body('home', <Home className="h-4 w-4" />, 'Home')}
        </button>
      ) : (
        <Link href={`/courses/${courseId}`} aria-current={cur('home')} className={cls(active === 'home')}>
          {body('home', <Home className="h-4 w-4" />, 'Home')}
        </Link>
      )}

      {onSelectTab ? (
        <button type="button" data-tour="tab-weeks" aria-current={cur('tasks')} onClick={() => onSelectTab('tasks')} className={cls(active === 'tasks')}>
          {body('tasks', <ListChecks className="h-4 w-4" />, 'Tasks')}
        </button>
      ) : (
        <Link href={`/courses/${courseId}?tab=tasks`} data-tour="tab-weeks" aria-current={cur('tasks')} className={cls(active === 'tasks')}>
          {body('tasks', <ListChecks className="h-4 w-4" />, 'Tasks')}
        </Link>
      )}

      {teamId && (
        <Link href={`/courses/${courseId}/docs`} data-tour="tab-deliverables" aria-current={cur('deliverables')} className={cls(active === 'deliverables')}>
          {body('deliverables', <ClipboardList className="h-4 w-4" />, 'Deliverables')}
        </Link>
      )}
      <Link href={`/courses/${courseId}/guide`} aria-current={cur('guide')} className={cls(active === 'guide')}>
        {body('guide', <BookOpen className="h-4 w-4" />, 'Guide')}
      </Link>

      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}
    </nav>
  );
}

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { BookOpen, ClipboardList, Home, ListChecks } from 'lucide-react';

export type CourseTab = 'home' | 'tasks' | 'deliverables' | 'guide';

const BASE =
  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors';
const INACTIVE = 'text-muted hover:bg-panel-2 hover:text-ink';
// text-accent-contrast so the active tab label stays legible when a dark theme
// lightens the accent (see --color-accent-contrast in globals.css).
const ACTIVE = 'bg-accent text-accent-contrast hover:bg-accent-strong';
const cls = (active: boolean) => `${BASE} ${active ? ACTIVE : INACTIVE}`;

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
  return (
    <nav
      aria-label="Course sections"
      style={{ top: 'var(--nav-h, 0px)' }}
      className="sticky z-30 -mx-4 flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-line bg-surface/95 px-4 py-2 backdrop-blur"
    >
      {onSelectTab ? (
        <button type="button" aria-current={cur('home')} onClick={() => onSelectTab('home')} className={cls(active === 'home')}>
          <Home className="h-4 w-4" /> Home
        </button>
      ) : (
        <Link href={`/courses/${courseId}`} aria-current={cur('home')} className={cls(active === 'home')}>
          <Home className="h-4 w-4" /> Home
        </Link>
      )}

      {onSelectTab ? (
        <button type="button" data-tour="tab-weeks" aria-current={cur('tasks')} onClick={() => onSelectTab('tasks')} className={cls(active === 'tasks')}>
          <ListChecks className="h-4 w-4" /> Tasks
        </button>
      ) : (
        <Link href={`/courses/${courseId}?tab=tasks`} data-tour="tab-weeks" aria-current={cur('tasks')} className={cls(active === 'tasks')}>
          <ListChecks className="h-4 w-4" /> Tasks
        </Link>
      )}

      {teamId && (
        <Link href={`/courses/${courseId}/docs`} data-tour="tab-deliverables" aria-current={cur('deliverables')} className={cls(active === 'deliverables')}>
          <ClipboardList className="h-4 w-4" /> Deliverables
        </Link>
      )}
      <Link href={`/courses/${courseId}/guide`} aria-current={cur('guide')} className={cls(active === 'guide')}>
        <BookOpen className="h-4 w-4" /> Guide
      </Link>

      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}
    </nav>
  );
}

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { BookOpen, ClipboardList, Users } from 'lucide-react';

export type CourseTab = 'overview' | 'weeks' | 'team' | 'deliverables' | 'guide';

const BASE =
  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors';
const INACTIVE =
  'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white';
const ACTIVE = 'bg-blue-600 text-white hover:bg-blue-700';
const cls = (active: boolean) => `${BASE} ${active ? ACTIVE : INACTIVE}`;

interface CourseSubNavProps {
  courseId: string;
  active: CourseTab;
  /** Team id for the Team link; when absent (not joined) Team + Deliverables are hidden. */
  teamId?: string | null;
  /** On the dashboard, Overview/Weekly switch client tabs; on sub-pages they're omitted
   *  and Overview/Weekly link back to the dashboard instead. */
  onSelectTab?: (tab: 'overview' | 'weeks') => void;
  /** Optional trailing content (e.g. progress + Continue on the dashboard). */
  trailing?: ReactNode;
}

/**
 * The one in-course navigation bar — Overview / Weekly Tasks / Team / Deliverables /
 * Guide — rendered identically on the dashboard AND every sub-page so the tabs never
 * disappear. On the dashboard Overview/Weekly are client-state buttons (onSelectTab);
 * on sub-pages they link back to the dashboard (`?tab=weeks` deep-links the Weekly tab).
 */
export function CourseSubNav({ courseId, active, teamId, onSelectTab, trailing }: CourseSubNavProps) {
  const cur = (tab: CourseTab) => (active === tab ? 'page' : undefined);
  return (
    <nav
      aria-label="Course sections"
      className="sticky top-0 z-30 -mx-4 flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-gray-200 bg-white/95 px-4 py-2 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95"
    >
      {onSelectTab ? (
        <button type="button" aria-current={cur('overview')} onClick={() => onSelectTab('overview')} className={cls(active === 'overview')}>
          Overview
        </button>
      ) : (
        <Link href={`/courses/${courseId}`} aria-current={cur('overview')} className={cls(active === 'overview')}>
          Overview
        </Link>
      )}

      {onSelectTab ? (
        <button type="button" data-tour="tab-weeks" aria-current={cur('weeks')} onClick={() => onSelectTab('weeks')} className={cls(active === 'weeks')}>
          Weekly Tasks
        </button>
      ) : (
        <Link href={`/courses/${courseId}?tab=weeks`} data-tour="tab-weeks" aria-current={cur('weeks')} className={cls(active === 'weeks')}>
          Weekly Tasks
        </Link>
      )}

      {teamId && (
        <Link href={`/courses/${courseId}/team/${teamId}`} aria-current={cur('team')} className={cls(active === 'team')}>
          <Users className="h-4 w-4" /> Team
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

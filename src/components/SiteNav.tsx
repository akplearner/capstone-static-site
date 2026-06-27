'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, GraduationCap, LogOut, PencilRuler, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { courseRepo } from '@/lib/data';
import { useClientStore } from '@/lib/useClientStore';
import { useAuth } from '@/lib/useAuth';

type Crumb = { label: string; href?: string };

/** Global header: brand, primary links with active state, a theme toggle, and a
 *  breadcrumb trail so it's always clear where you are and how to get back. */
export function SiteNav() {
  const pathname = usePathname() || '/';
  const segments = pathname.split('/').filter(Boolean);

  // Resolve a course title for breadcrumbs when we're inside a course/editor.
  const courseId =
    segments[0] === 'courses' || segments[0] === 'instructor' ? segments[1] : undefined;
  const course = useClientStore(
    () => (courseId ? courseRepo.get(courseId) ?? null : null),
    null
  );
  const courseTitle = course?.title ?? 'Course';

  const coursesActive = pathname === '/' || pathname.startsWith('/courses');
  const instructorActive = pathname.startsWith('/instructor');

  const crumbs = buildCrumbs(segments, courseTitle);

  const linkClass = (active: boolean) =>
    `flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium ${
      active
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
    }`;

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-gray-900 dark:text-white"
          >
            <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span>Capstone Lab</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/" className={linkClass(coursesActive)}>
              <GraduationCap className="h-4 w-4" />
              <span>Courses</span>
            </Link>
            <Link href="/instructor" className={linkClass(instructorActive)}>
              <PencilRuler className="h-4 w-4" />
              <span>Instructor</span>
            </Link>
            <ThemeToggle />
            <AuthControl />
          </div>
        </div>

        {crumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="mt-3 flex flex-wrap items-center gap-1 text-sm text-gray-500 dark:text-gray-400"
          >
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />}
                {c.href ? (
                  <Link
                    href={c.href}
                    className="hover:text-gray-900 hover:underline dark:hover:text-white"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-700 dark:text-gray-200">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>
    </nav>
  );
}

/** Signed-in indicator + sign-out. Renders nothing when signed out (sign-in is
 *  offered contextually where saving is required) or when Supabase is unconfigured. */
function AuthControl() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  const label = user.email ?? 'Account';
  return (
    <button
      onClick={() => signOut()}
      title={`Signed in as ${label} — sign out`}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden max-w-[10rem] truncate sm:inline">{label}</span>
    </button>
  );
}

function buildCrumbs(segments: string[], courseTitle: string): Crumb[] {
  if (segments.length === 0) return [];
  const home: Crumb = { label: 'Home', href: '/' };

  if (segments[0] === 'courses') {
    const [, id, sub, teamId] = segments;
    const courseHref = `/courses/${id}`;
    const crumbs: Crumb[] = [home, { label: courseTitle, href: sub ? courseHref : undefined }];
    if (sub === 'guide') crumbs.push({ label: 'Guide' });
    else if (sub === 'docs') crumbs.push({ label: 'Deliverables' });
    else if (sub === 'team') crumbs.push({ label: `Team ${teamId ?? ''}`.trim() });
    return crumbs;
  }

  if (segments[0] === 'instructor') {
    const [, id] = segments;
    const crumbs: Crumb[] = [home, { label: 'Instructor', href: id ? '/instructor' : undefined }];
    if (id) crumbs.push({ label: courseTitle });
    return crumbs;
  }

  return [];
}

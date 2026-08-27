'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Compass, FolderGit2, GraduationCap, LayoutDashboard, LogIn, LogOut, PencilRuler, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { courseRepo } from '@/lib/data';
import { useClientStore } from '@/lib/useClientStore';
import { useAuth } from '@/lib/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { useInstructorAuth } from '@/lib/useInstructorAuth';
import { teamLabel } from '@/lib/team';

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
  const exploreActive = pathname.startsWith('/explore');
  const dashboardActive = pathname.startsWith('/dashboard');
  const portfolioActive = pathname.startsWith('/portfolio');
  const instructorActive = pathname.startsWith('/instructor');

  // The Dashboard link only appears once signed in — it's a personal home with
  // nothing to show a guest. Explore is always available.
  const { user } = useAuth();

  // Students should never see the studio exists. The link appears only once a
  // visitor is actually an instructor — an unlocked passcode (local) or an
  // account with the instructor flag (Supabase). The author reaches the studio
  // by URL, unlocks it, and the link then persists.
  const { unlocked: isInstructor } = useInstructorAuth();

  const crumbs = buildCrumbs(segments, courseTitle);

  const linkClass = (active: boolean) =>
    `flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium ${
      active
        ? 'bg-accent-soft text-accent-ink'
        : 'text-muted hover:bg-panel-2 hover:text-ink'
    }`;

  return (
    <nav className="border-b border-line bg-panel/90 shadow-[var(--shadow-card)] backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-ink"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
            </span>
            <ShieldCheck className="h-6 w-6 text-accent" />
            <span>Capstone Quarry</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/" className={linkClass(coursesActive)}>
              <GraduationCap className="h-4 w-4" />
              <span>Courses</span>
            </Link>
            <Link href="/explore" className={linkClass(exploreActive)}>
              <Compass className="h-4 w-4" />
              <span>Explore</span>
            </Link>
            {user && (
              <Link href="/dashboard" className={linkClass(dashboardActive)}>
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            )}
            {user && (
              <Link href="/portfolio" className={linkClass(portfolioActive)}>
                <FolderGit2 className="h-4 w-4" />
                <span className="hidden sm:inline">Portfolio</span>
              </Link>
            )}
            {isInstructor && (
              <Link href="/instructor" className={linkClass(instructorActive)}>
                <PencilRuler className="h-4 w-4" />
                <span>Instructor</span>
              </Link>
            )}
            <ThemeToggle />
            <AuthControl />
          </div>
        </div>

        {crumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="mt-3 flex flex-wrap items-center gap-1 text-sm text-muted"
          >
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-line" />}
                {c.href ? (
                  <Link
                    href={c.href}
                    className="hover:text-ink hover:underline"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="font-medium text-ink">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>
    </nav>
  );
}

/**
 * Signed in → who you are, and sign out. Signed out → the way in.
 *
 * The signed-out half used to render nothing, on the reasoning that "sign-in is
 * offered contextually where saving is required". That held only while the proxy
 * gated `/courses` wholesale, so every visitor eventually hit a redirect to
 * `/login` whether they meant to or not. Now that a course dashboard is public
 * (see `lib/routeGate.ts`) a visitor can browse the site indefinitely without
 * being bounced — so without a link here there is no way in at all short of
 * typing the URL.
 *
 * Still nothing in demo mode: with Supabase unconfigured there is no account to
 * sign in to, and `DemoBanner` already explains that.
 */
function AuthControl() {
  const { user, signOut } = useAuth();
  const pathname = usePathname() || '/';

  if (!user) {
    if (!isSupabaseConfigured()) return null;
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted hover:bg-panel-2 hover:text-ink"
      >
        <LogIn className="h-4 w-4" />
        <span>Sign in</span>
      </Link>
    );
  }

  const label = user.email ?? 'Account';
  return (
    <button
      onClick={() => signOut()}
      title={`Signed in as ${label} — sign out`}
      aria-label={`Signed in as ${label} — sign out`}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted hover:bg-panel-2 hover:text-ink"
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
    else if (sub === 'team') crumbs.push({ label: teamId ? teamLabel(teamId) : 'Team' });
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

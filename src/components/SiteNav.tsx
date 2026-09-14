'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass, FolderGit2, GraduationCap, LayoutDashboard, LogIn, LogOut, Menu, PencilRuler, Search, ShieldCheck, X } from 'lucide-react';
import { DUR, EASE } from '@/lib/motion';
import { ThemeToggle } from './ThemeToggle';
import { CommandPalette } from './CommandPalette';
import { courseRepo, progressRepo } from '@/lib/data';
import { useAuth } from '@/lib/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { useInstructorAuth } from '@/lib/useInstructorAuth';
import { buildIndex, type SearchItem } from '@/lib/search';

/**
 * Global header: brand, primary links, the command palette, theme, account.
 *
 * ── R68 ──
 * The bar is frosted glass (`.glass`, one recipe for every sticky bar), the
 * brand is a mark and a wordmark (the pinging dot is gone), and the links are
 * text from `sm` up — an icon on every link was the single densest thing on
 * the page. Breadcrumbs left this bar: each page names its own place in its
 * header now, so a course page no longer carries three rows of chrome.
 *
 * ⌘K / Ctrl-K opens the palette from anywhere. The index is built lazily on
 * first open from the courses in memory; same-page navigation goes through
 * pushState + a synthetic popstate so the course page updates without a
 * remount, everything else through the router.
 *
 * ── R63 ──
 * Below `sm` the links collapse behind one button. The header is sticky and
 * publishes its height as `--nav-h` for the bars pinned beneath it.
 */
export function SiteNav() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const barRef = useRef<HTMLElement>(null);
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const menuOpen = openedOn === pathname;
  const [paletteOpen, setPaletteOpen] = useState(false);

  const coursesActive = pathname === '/' || pathname.startsWith('/courses');
  const exploreActive = pathname.startsWith('/explore');
  const dashboardActive = pathname.startsWith('/dashboard');
  const portfolioActive = pathname.startsWith('/portfolio');
  const instructorActive = pathname.startsWith('/instructor');

  const { user } = useAuth();
  const { unlocked: isInstructor } = useInstructorAuth();

  // The palette's corpus, rebuilt on every open: a few thousand short strings,
  // and it must reflect a course authored or imported since the last open.
  const [index, setIndex] = useState<SearchItem[] | null>(null);
  const openPalette = useCallback(() => {
    setIndex(
      buildIndex({
        courses: courseRepo.list(),
        signedIn: !!user,
        isInstructor,
        hasTeam: (id) => !!progressRepo.getContext(id),
      })
    );
    setPaletteOpen(true);
  }, [user, isInstructor]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (paletteOpen) setPaletteOpen(false);
        else openPalette();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, openPalette]);

  const navigate = useCallback(
    (href: string) => {
      const [path] = href.split(/[?#]/);
      if (path === pathname) {
        // Same page: change the URL and let the page's own popstate reader
        // pick up the new tab/week/task/step without a remount.
        window.history.pushState(null, '', href);
        window.dispatchEvent(new PopStateEvent('popstate'));
        const hash = href.split('#')[1];
        if (hash) setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      } else {
        router.push(href);
      }
    },
    [pathname, router]
  );

  const linkClass = (active: boolean) =>
    `flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium ${
      active ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:bg-panel-2 hover:text-ink'
    }`;

  // Publish this header's height as `--nav-h`: the bars pinned beneath it
  // position against the measurement, which changes with the breakpoint.
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const publish = () => document.documentElement.style.setProperty('--nav-h', `${el.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Icons only in the phone menu, where a list of words needs them to scan.
  const icon = 'h-4 w-4 sm:hidden';
  const links = (
    <>
      <Link href="/" className={linkClass(coursesActive)}>
        <GraduationCap className={icon} />
        <span>Courses</span>
      </Link>
      <Link href="/explore" className={linkClass(exploreActive)}>
        <Compass className={icon} />
        <span>Explore</span>
      </Link>
      {user && (
        <Link href="/dashboard" className={linkClass(dashboardActive)}>
          <LayoutDashboard className={icon} />
          <span>Dashboard</span>
        </Link>
      )}
      {user && (
        <Link href="/portfolio" className={linkClass(portfolioActive)}>
          <FolderGit2 className={icon} />
          <span>Portfolio</span>
        </Link>
      )}
      {isInstructor && (
        <Link href="/instructor" className={linkClass(instructorActive)}>
          <PencilRuler className={icon} />
          <span>Instructor</span>
        </Link>
      )}
    </>
  );

  const paletteButton = (
    <button
      type="button"
      onClick={openPalette}
      aria-label="Search — Ctrl K"
      aria-keyshortcuts="Control+K Meta+K"
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted hover:bg-panel-2 hover:text-ink"
    >
      <Search className="h-4 w-4" />
      <span className="sm:hidden">Search</span>
      <kbd className="kbd hidden sm:inline-flex">⌘K</kbd>
    </button>
  );

  return (
    <>
      <nav ref={barRef} className="glass sticky top-0 z-40 border-b">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold tracking-tight text-ink">
              <ShieldCheck className="h-6 w-6 shrink-0 text-accent" />
              <span className="truncate">Capstone Quarry</span>
            </Link>

            <div className="hidden items-center gap-1 sm:flex sm:gap-2">
              {links}
              {paletteButton}
              <ThemeToggle />
              <AuthControl />
            </div>

            <div className="flex items-center gap-1 sm:hidden">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setOpenedOn(menuOpen ? null : pathname)}
                aria-expanded={menuOpen}
                aria-controls="site-menu"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                className="rounded-md p-2 text-muted transition-colors hover:bg-panel-2 hover:text-ink"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div id="site-menu" className="sm:hidden">
            <AnimatePresence initial={false}>
              {menuOpen && (
                <motion.div
                  key="menu"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: DUR.reveal, ease: EASE.out }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-0.5 pt-2">
                    {links}
                    {paletteButton}
                    <AuthControl />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} items={index ?? []} onNavigate={navigate} />
    </>
  );
}

/**
 * Signed in → who you are, and sign out. Signed out → the way in. Nothing in
 * demo mode: with Supabase unconfigured there is no account to sign in to,
 * and `DemoBanner` already explains that.
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
        <LogIn className="h-4 w-4 sm:hidden" />
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

/** A page's place in the site, rendered inside its own header now that the
 *  global bar no longer carries a breadcrumb row. */
export function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted">
      {items.map((c, i) => (
        <span key={`${c.label}-${i}`} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden>/</span>}
          {c.href ? (
            <Link href={c.href} className="hover:text-ink hover:underline">
              {c.label}
            </Link>
          ) : (
            <span className="text-ink">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

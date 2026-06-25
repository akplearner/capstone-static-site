'use client';

import { useReducer } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useHydrated } from '@/lib/useClientStore';

/** Apply + persist the theme by toggling the `.dark` class on <html>. */
function setTheme(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark);
  try {
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  } catch {
    // localStorage may be unavailable (private mode) — theme still applies for the session.
  }
}

/**
 * Light/dark toggle. The DOM (`.dark` on <html>, set by the pre-hydration script
 * in layout.tsx) is the source of truth; we force a re-render on click and read
 * it back. useHydrated keeps SSR and the first client render in agreement so the
 * icon doesn't cause a hydration mismatch.
 */
export function ThemeToggle() {
  const hydrated = useHydrated();
  const [, force] = useReducer((n: number) => n + 1, 0);

  const isDark =
    hydrated && typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false;

  return (
    <button
      type="button"
      onClick={() => {
        setTheme(!isDark);
        force();
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

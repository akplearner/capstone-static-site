'use client';

import Link from 'next/link';
import { HardDrive } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { useAuth } from '@/lib/useAuth';
import { useHydrated } from '@/lib/useClientStore';

/**
 * "This is a demo, and here's exactly what that costs you."
 *
 * Without accounts configured the whole app still works, writing to
 * localStorage. That is genuinely useful — you can try a capstone before
 * signing up — but the previous behaviour was to say nothing, so a student
 * could complete four weeks of work that was never backed up, never synced,
 * and never verifiable by anyone else. Silence was the worst option; this
 * states the trade plainly and offers the way out.
 *
 * Renders nothing once there's an account, and nothing before hydration (the
 * server can't know the auth state, and flashing this at signed-in users on
 * every page load would be worse than not showing it).
 */
export function DemoBanner() {
  const hydrated = useHydrated();
  const { user, loading } = useAuth();
  const cloud = isSupabaseConfigured();

  if (!hydrated || loading) return null;
  if (cloud && user) return null;

  return (
    <div
      role="status"
      className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--radius-card)] border border-dashed border-line bg-panel-2 px-4 py-3 text-sm"
    >
      <HardDrive className="h-4 w-4 shrink-0 text-muted" />
      <span className="text-ink">
        <span className="font-semibold">Demo mode.</span>{' '}
        {cloud ? (
          <>Your work is saved on this device only — it isn’t backed up and can’t be verified by anyone else.</>
        ) : (
          <>
            Accounts aren’t configured on this deployment, so your work is saved on this device only —
            not backed up, and lost if you clear your browser.
          </>
        )}
      </span>
      {cloud && (
        <Link
          href="/register"
          className="ml-auto shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-contrast hover:bg-accent-strong"
        >
          Save it to an account
        </Link>
      )}
    </div>
  );
}

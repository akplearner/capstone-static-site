import type { Metadata } from 'next';
import Link from 'next/link';
import { WifiOff } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';

export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false, follow: false },
};

/**
 * The page the service worker serves when a navigation fails and there is no
 * cached copy. It is a server component with no data so it pre-caches cleanly.
 * Pages the student has already opened in this browser still load from the
 * worker's page cache; this is the fallback for one they have not.
 */
export default function OfflinePage() {
  return (
    <Surface as="section" padding="lg" className="mx-auto max-w-xl space-y-4" aria-labelledby="offline-head">
      <div className="flex items-center gap-3">
        <WifiOff className="h-6 w-6 text-warn" aria-hidden />
        <h1 id="offline-head" className="text-2xl font-semibold tracking-tight text-ink">
          You are offline
        </h1>
      </div>
      <p className="text-base text-body">
        This page has not been opened on this device yet, so there is no copy to show. Pages you have already visited — your
        course home, the week you were on, the Deliverables — open from the cache until the connection is back.
      </p>
      <p className="text-sm text-muted">
        Progress you record while offline stays in this browser. When you are back online, the platform saves it to your
        account on the next page you open.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard" className="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast hover:bg-accent-strong">
          Open your dashboard
        </Link>
        <Link href="/" className="rounded-lg clay-rim px-3.5 py-2 text-sm font-medium text-body hover:bg-panel-2">
          Home
        </Link>
      </div>
    </Surface>
  );
}

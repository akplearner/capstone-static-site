'use client';

import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}
const getOnline = () => navigator.onLine;
const getServerOnline = () => true;

/**
 * A thin strip under the nav while the browser reports no connection. Reads
 * `navigator.onLine` through useSyncExternalStore so the server render and the
 * first client render agree (online), and the strip appears the moment the
 * browser flips.
 */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, getOnline, getServerOnline);
  if (online) return null;
  return (
    <div role="status" className="glass border-b border-warn-line text-sm text-ink" data-offline-banner>
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-1.5">
        <WifiOff className="h-4 w-4 text-warn" aria-hidden />
        <span>
          <span className="font-medium">Offline.</span> Pages you have opened still work; what you record here is saved when the
          connection is back.
        </span>
      </div>
    </div>
  );
}

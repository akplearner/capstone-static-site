'use client';

import { useEffect } from 'react';
import { INSTALL_EVENT, type BeforeInstallPromptEvent } from '@/lib/pwa';

/**
 * Registers `/public/sw.js` in production and keeps the browser's install
 * prompt for the dashboard's Install card.
 *
 * Development is excluded on purpose: a worker that caches pages under a dev
 * server serves stale HMR chunks and makes every "why is my change not
 * showing" ten minutes longer. Registration is idempotent, so the browser
 * reuses the existing worker across navigations.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    const onInstallable = (e: Event) => {
      e.preventDefault();
      window.__quarryInstall = e as BeforeInstallPromptEvent;
      window.dispatchEvent(new Event(INSTALL_EVENT));
    };
    window.addEventListener('beforeinstallprompt', onInstallable);

    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // A refused registration (private mode, a locked-down browser) leaves
        // the app exactly as it was: online-only.
      });
    }
    return () => window.removeEventListener('beforeinstallprompt', onInstallable);
  }, []);
  return null;
}

'use client';

/**
 * The browser side of the offline layer, kept out of the component tree so
 * `useAuth` (a lib module) can clear the worker's caches on sign-out without
 * importing a component.
 */

/** The non-standard event Chromium fires when the app is installable. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __quarryInstall?: BeforeInstallPromptEvent | null;
  }
}

/** Fired on `window` whenever the captured install prompt changes. */
export const INSTALL_EVENT = 'capstone:installable';

/** Ask the worker to drop every cache — called on sign-out. */
export function clearOfflineCaches(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.controller?.postMessage({ type: 'clear' });
}

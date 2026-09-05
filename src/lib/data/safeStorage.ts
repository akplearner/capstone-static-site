import { toast } from '@/lib/toastBus';

/**
 * Guarded localStorage writes. A raw setItem can throw — most importantly
 * QuotaExceededError once a team's deliverable forms or an authored course grow
 * large — which would otherwise crash the render. This swallows the failure,
 * warns the user via a toast, and returns whether the write succeeded so callers
 * can react if they need to.
 */
export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (err) {
    const quota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    const message = quota
      ? 'This browser’s storage is full — your latest change wasn’t saved. Export or download your work, then clear old data.'
      : 'Couldn’t save your latest change to this browser.';
    console.error('localStorage write failed:', err);
    try {
      toast({ message, variant: 'error', duration: 8000 });
    } catch {
      /* toast provider not mounted (e.g. during tests) — ignore */
    }
    return false;
  }
}


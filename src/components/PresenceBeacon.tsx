'use client';

import { usePresenceBeacon } from '@/lib/usePresence';

/** Mounted once in the root layout: renders nothing, says "I'm here" (R86). */
export function PresenceBeacon() {
  usePresenceBeacon();
  return null;
}

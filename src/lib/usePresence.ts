'use client';

import { useEffect } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getBrowserClient } from './supabase/client';
import { isSupabaseConfigured } from './supabase/config';
import { stampLastSeen } from './data/supabaseFeatureRepos';
import { useAuth } from './useAuth';

/**
 * The activity signals behind the admin metrics (R86), sent by every
 * signed-in tab:
 *
 *  - PRESENCE: the tab joins the shared `online` realtime channel keyed by
 *    user id. "Live right now" is simply who is in the channel — no table,
 *    no polling, gone the moment the tab closes.
 *  - LAST SEEN: a throttled heartbeat stamps the caller's OWN
 *    `profiles.last_seen_at` (0011 column grant) so "last activity" survives
 *    the tab closing. Every 5 minutes, only while the tab is visible —
 *    a classroom of phones must not turn into a write storm.
 *
 * Privacy: both signals say "this account was here", nothing else — no page,
 * no course, no content. Staff see them on the metrics page; students never
 * see either.
 */
const HEARTBEAT_MS = 5 * 60_000;
export const PRESENCE_CHANNEL = 'online';

export function usePresenceBeacon(): void {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!isSupabaseConfigured() || !userId) return;
    const supabase = getBrowserClient();
    if (!supabase) return;

    const beat = () => {
      if (document.visibilityState !== 'visible') return;
      stampLastSeen(userId);
    };
    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    document.addEventListener('visibilitychange', beat);

    const channel: RealtimeChannel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: userId } },
    });
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') void channel.track({ at: Date.now() });
    });

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', beat);
      void channel.unsubscribe();
    };
  }, [userId]);
}

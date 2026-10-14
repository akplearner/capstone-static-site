'use client';

// employerProfiles.ts — environment profiles an instructor published (R114).
//
// A company's environment profile (`environment-profile.schema.json`: the
// tools, procedures, policies and work-role requirements of their
// environment) was a file a reader imported on one device. Published here,
// every signed-in member can measure their Skill board against it, and a
// candidate link records which one the board was measured against. Every
// published row is validated again on read: a row that no longer fits the
// schema is skipped, never rendered. Without migration 0015 (or offline)
// there are no published profiles, and the picker shows the rest as before.

import { useEffect, useState } from 'react';
import { getBrowserClient } from './supabase/client';
import { readProfileFile } from './importedProfile';
import type { EnvironmentProfile } from './docs/environmentProfile';

export interface PublishedProfile {
  profile: EnvironmentProfile;
  publisherId: string;
  publishedAt: string;
}

/** Every published profile that still validates, newest first; null where none can exist. */
export async function listPublishedProfiles(): Promise<PublishedProfile[] | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from('environment_profiles').select('id, publisher_user_id, profile, published_at').order('published_at', { ascending: false });
  if (error) return null;
  return ((data ?? []) as Record<string, unknown>[]).flatMap((r) => {
    const read = readProfileFile(JSON.stringify(r.profile ?? null));
    return 'profile' in read && read.profile.id === String(r.id) ? [{ profile: read.profile, publisherId: String(r.publisher_user_id), publishedAt: String(r.published_at ?? '') }] : [];
  });
}

/** Validate a profile file and publish it under the instructor's id. */
export async function publishProfile(userId: string, text: string): Promise<{ ok: true; profile: EnvironmentProfile } | { ok: false; error: string }> {
  const read = readProfileFile(text);
  if (!('profile' in read)) return { ok: false, error: `Not an environment profile: ${read.errors[0]}` };
  const supabase = getBrowserClient();
  if (!supabase) return { ok: false, error: 'Publishing needs accounts on this deployment.' };
  const { error } = await supabase.from('environment_profiles').insert({ id: read.profile.id, publisher_user_id: userId, profile: read.profile });
  if (error) return { ok: false, error: error.code === '23505' ? `A profile with the id ${read.profile.id} is already published: remove it first to publish a new version.` : 'Couldn’t publish the profile.' };
  return { ok: true, profile: read.profile };
}

export async function removeProfile(id: string): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const { error } = await supabase.from('environment_profiles').delete().eq('id', id);
  return !error;
}

/** The published profiles, loaded once per mount; empty until they arrive and wherever none can exist. */
export function usePublishedProfiles(): { profiles: PublishedProfile[]; available: boolean; reload: () => void } {
  const [state, setState] = useState<PublishedProfile[] | null>(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let on = true;
    void listPublishedProfiles().then((p) => {
      if (on) setState(p);
    });
    return () => {
      on = false;
    };
  }, [nonce]);
  return { profiles: state ?? [], available: state !== null, reload: () => setNonce((n) => n + 1) };
}

'use client';

import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getBrowserClient } from '@/lib/supabase/client';
import { loadProfile, useAuth } from '@/lib/useAuth';
import { hydrateUser } from '@/lib/data/supabaseCache';
import { toast } from '@/lib/toastBus';

/**
 * Who the account is, on the Account page (R81): the picture and name the
 * sign-in provider gave us, which providers are linked, and the one thing a
 * student may change — their display name, which is what teammates see.
 *
 * The name lives in two places by design: `profiles.display_name` (the
 * account) and `memberships.display_name` (the roster row per course, which is
 * what the team table reads without a join). Saving writes both, then
 * re-hydrates the user's rows so every open course page picks the new name up.
 * `is_instructor` is on the same profile row and is NOT editable from here —
 * migration 0006 revoked the column from the request roles.
 */
export function ProfileCard({ user }: { user: User }) {
  const { profile } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = profile?.displayName ?? '';
  const value = name ?? current;
  const dirty = value.trim() !== current && value.trim().length > 0;

  const providers = (user.identities ?? [])
    .map((i) => i.provider)
    .filter((p, i, all) => all.indexOf(p) === i);
  const label = (p: string) => ({ google: 'Google', github: 'GitHub', email: 'Email' })[p] ?? p;

  const save = async () => {
    const supabase = getBrowserClient();
    if (!supabase || !dirty) return;
    const next = value.trim().slice(0, 80);
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ display_name: next }).eq('id', user.id);
    if (!error) {
      const { error: e2 } = await supabase.from('memberships').update({ display_name: next }).eq('user_id', user.id);
      if (e2) console.error('memberships rename failed', e2.message);
    }
    setBusy(false);
    if (error) {
      toast({ message: `Couldn’t save your name: ${error.message}`, variant: 'warning' });
      return;
    }
    setName(null);
    loadProfile(user);
    void hydrateUser();
    toast({ message: 'Name saved. Your team sees it on their next refresh.', variant: 'success' });
  };

  return (
    <div className="mt-4 flex flex-wrap items-start gap-4">
      {profile?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- provider-hosted picture; next/image would need every host allow-listed.
        <img src={profile.avatarUrl} alt="" width={56} height={56} referrerPolicy="no-referrer" className="h-14 w-14 shrink-0 rounded-full bg-panel-2 object-cover" />
      ) : (
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-panel-2 text-lg font-bold text-muted" aria-hidden="true">
          {(current || user.email || '?').slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-3">
        <label className="block max-w-sm">
          <span className="text-sm font-medium text-body">Display name</span>
          <span className="block text-xs text-muted">What your teammates and the instructor see.</span>
          <div className="mt-1 flex gap-2">
            <input
              value={value}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg bg-panel px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none"
            />
            <Button variant="secondary" disabled={!dirty || busy} onClick={save} className="flex shrink-0 items-center gap-1.5">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
            </Button>
          </div>
        </label>
        {providers.length > 0 && (
          <p className="text-xs text-muted">
            Signs in with{' '}
            {providers.map((p, i) => (
              <span key={p}>
                {i > 0 && ' and '}
                <span className="font-medium text-ink">{label(p)}</span>
              </span>
            ))}
            .
          </p>
        )}
      </div>
    </div>
  );
}

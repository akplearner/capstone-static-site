'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Link2 } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { createShare, shareUrl, SHARE_DAYS, type ShareError, type ShareKind } from '@/lib/shares';
import { useConsents } from '@/lib/legal/consents';
import { localDay } from '@/lib/localDate';

const ERROR_TEXT: Record<ShareError, string> = {
  'consent-required': 'Links need the "share with employers" consent: turn it on from the account page first.',
  'identity-in-snapshot': 'The copy would name you directly (an email address or an account id). If your display name is an email address, change it on the account page.',
  'too-large': 'The copy is larger than 256 KB, the most a link can hold.',
  unavailable: 'Links are not set up on this deployment yet.',
  offline: 'Links need an account and a connection.',
  failed: 'Couldn’t create the link. Try again.',
};

/**
 * R114 — create a candidate link: a frozen, unsigned copy of the portfolio
 * export or the credential, for 7, 30 or 90 days, revocable from the account
 * page. The URL is shown once: only its hash is stored, so a lost link is
 * made again, never recovered. The two copies are built at the click, never
 * at render. Cloud mode only; the pages pass it nothing otherwise.
 */
export function ShareLinkDialog({
  open,
  onClose,
  buildProfile,
  buildCredential,
  measuredAgainst,
}: {
  open: boolean;
  onClose: () => void;
  buildProfile: () => Record<string, unknown>;
  buildCredential: () => Promise<Record<string, unknown>>;
  measuredAgainst?: string;
}) {
  const { consents, loaded } = useConsents();
  const [kind, setKind] = useState<ShareKind>('profile');
  const [days, setDays] = useState<(typeof SHARE_DAYS)[number]>(30);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ShareError | null>(null);
  const [made, setMade] = useState<{ url: string; expiresAt: string } | null>(null);

  const close = () => {
    setMade(null);
    setError(null);
    setLabel('');
    onClose();
  };
  const create = async () => {
    setBusy(true);
    setError(null);
    const snapshot = kind === 'profile' ? buildProfile() : await buildCredential();
    const r = await createShare({ kind, days, label: label.trim(), ...(measuredAgainst ? { measuredAgainst } : {}), snapshot });
    setBusy(false);
    if (r.ok) setMade({ url: shareUrl(window.location.origin, r.token), expiresAt: r.expiresAt });
    else setError(r.error);
  };

  return (
    <Dialog open={open} onClose={close} title="Create a link" labelledBy="share-link-title">
      {made ? (
        <div className="space-y-3 text-sm" data-share-made>
          <p className="text-muted">
            Anyone with this link can read the frozen copy until {localDay(Date.parse(made.expiresAt))}. It is shown once: copy it now, and revoke or
            delete it from the account page.
          </p>
          <div className="flex items-center gap-2">
            <input readOnly value={made.url} aria-label="The link" data-share-url className="min-w-0 flex-1 rounded bg-panel-2 px-2 py-1.5 font-mono text-xs text-ink" onFocus={(e) => e.currentTarget.select()} />
            <CopyButton text={made.url} label="Copy link" />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={close}>
              Done
            </Button>
          </div>
        </div>
      ) : loaded && !consents['share-employer'] ? (
        <div className="space-y-3 text-sm" data-share-needs-consent>
          <p className="text-muted">
            A link shares a frozen copy of your record with whoever holds it. That needs the <strong className="text-ink">share with employers</strong> consent, which is off
            until you turn it on.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={close}>
              Not now
            </Button>
            <Link href="/account" className="inline-flex items-center rounded-[var(--radius-control)] bg-accent px-3 py-1.5 text-sm font-semibold text-accent-contrast" onClick={close}>
              Open the account page
            </Link>
          </div>
        </div>
      ) : (
        <form
          className="space-y-3 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            void create();
          }}
        >
          <p className="text-muted">
            The copy is unsigned: it records browser-side checks, hashes and server receipts of stamps, and it is not proof of the machine. It never carries your email
            address or account ids.
          </p>
          <fieldset className="space-y-1">
            <legend className="text-xs font-semibold text-muted">Share</legend>
            {(['profile', 'credential'] as const).map((k) => (
              <label key={k} className="flex items-center gap-2">
                <input type="radio" name="share-kind" value={k} checked={kind === k} onChange={() => setKind(k)} />
                {k === 'profile' ? 'The portfolio export (skills, KPIs, evidence hashes)' : 'The credential (Open Badges, unsigned)'}
              </label>
            ))}
          </fieldset>
          <label className="block">
            <span className="text-xs font-semibold text-muted">Expires after</span>
            <select value={days} onChange={(e) => setDays(Number(e.target.value) as (typeof SHARE_DAYS)[number])} className="mt-1 block w-full rounded bg-panel-2 px-2 py-1.5 text-ink">
              {SHARE_DAYS.map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted">Label (only you see it)</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} placeholder="For Example Ltd, SOC role" className="mt-1 block w-full rounded bg-panel-2 px-2 py-1.5 text-ink" />
          </label>
          {error && (
            <p role="alert" className="text-xs text-warn" data-share-error={error}>
              {ERROR_TEXT[error]}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={busy || !loaded} className="flex items-center gap-1.5" data-share-create>
              <Link2 className="h-4 w-4" aria-hidden /> {busy ? 'Creating…' : 'Create link'}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

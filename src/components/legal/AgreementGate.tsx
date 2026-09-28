'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileCheck2, ScrollText } from 'lucide-react';
import { Button, Collapsible } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/useAuth';
import { useClientStore } from '@/lib/useClientStore';
import { missingAcceptances, type Agreement } from '@/lib/legal/agreements';
import {
  acceptInCloud,
  acceptLocally,
  fetchCloudAcceptances,
  isCloudMode,
  localAcceptances,
} from '@/lib/legal/acceptances';

/**
 * The acknowledgement gate (R86). Cloud mode: `LegalGateOverlay` sits in the
 * root layout and, the moment a signed-in account is missing any current
 * agreement version, covers the app until every one is read and accepted —
 * which is also how a version bump re-asks returning students once. Offline
 * mode has no account to hang the log on, so `LocalLegalDialog` fronts the
 * one action that starts real use: joining a team (the device is the
 * identity, and the acceptance is stored on it).
 *
 * Accepting writes the append-only log — id, version, timestamp — which is
 * what the admin metrics read; nothing here can edit or erase a row.
 */

function AgreementCard({
  agreement,
  checked,
  onCheck,
}: {
  agreement: Agreement;
  checked: boolean;
  onCheck: (v: boolean) => void;
}) {
  return (
    <div className="rounded-lg depth-edge bg-panel p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">{agreement.title}</h3>
          <p className="mt-0.5 text-xs text-muted">{agreement.summary}</p>
        </div>
        {agreement.link && (
          <Link href={agreement.link} target="_blank" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent hover:underline">
            Full text <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="mt-1">
        <Collapsible title="Read it" hint={`${agreement.sections.length} section${agreement.sections.length === 1 ? '' : 's'}`} defaultOpen={false}>
          <div className="space-y-2 pb-2 text-sm text-body">
            {agreement.sections.map((s) => (
              <div key={s.heading}>
                <div className="font-semibold text-ink">{s.heading}</div>
                <p className="mt-0.5">{s.body}</p>
              </div>
            ))}
          </div>
        </Collapsible>
      </div>
      <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-md bg-panel-2 px-2.5 py-2 text-sm text-ink">
        <input type="checkbox" checked={checked} onChange={(e) => onCheck(e.target.checked)} className="mt-0.5" />
        <span>
          I have read and agree to <span className="font-medium">{agreement.title}</span> (v{agreement.version}).
        </span>
      </label>
    </div>
  );
}

export function AgreementChecklist({
  missing,
  onAccept,
  busy,
}: {
  missing: Agreement[];
  onAccept: () => void;
  busy: boolean;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allChecked = missing.every((a) => checked[a.id]);
  return (
    <div className="space-y-3">
      {missing.map((a) => (
        <AgreementCard key={a.id} agreement={a} checked={!!checked[a.id]} onCheck={(v) => setChecked({ ...checked, [a.id]: v })} />
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-2xs text-muted">
          Each acceptance is logged with its version and time — that record is how the platform
          knows not to ask you again.
        </p>
        <Button onClick={onAccept} disabled={!allChecked || busy} className="flex items-center gap-1.5">
          <FileCheck2 className="h-4 w-4" />
          {busy ? 'Recording…' : `Agree & continue (${missing.length})`}
        </Button>
      </div>
    </div>
  );
}

/**
 * Cloud mode, mounted once in the root layout: renders nothing until a
 * signed-in account is missing acceptances, then covers everything.
 */
export function LegalGateOverlay() {
  const { user, loading, signOut } = useAuth();
  const [accepted, setAccepted] = useState<Record<string, number> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isCloudMode() || !user) return;
    let on = true;
    void fetchCloudAcceptances().then((a) => {
      if (on) setAccepted(a ?? {});
    });
    return () => {
      on = false;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- user identity is the dependency, not the object
  // Signed out (or a different account): forget the previous account's answers.
  // Render-time reset, the documented pattern — a setState inside the effect
  // above would cascade.
  const [seenUser, setSeenUser] = useState<string | null>(null);
  if ((user?.id ?? null) !== seenUser) {
    setSeenUser(user?.id ?? null);
    setAccepted(null);
  }

  if (!isCloudMode() || loading || !user || accepted === null) return null;
  const missing = missingAcceptances(accepted);
  if (missing.length === 0) return null;

  const accept = () => {
    setBusy(true);
    void acceptInCloud(user.id, missing).then((ok) => {
      setBusy(false);
      if (!ok) {
        toast({ message: 'Couldn’t record the acceptance — check your connection and try again.', variant: 'warning' });
        return;
      }
      setAccepted({ ...accepted, ...Object.fromEntries(missing.map((a) => [a.id, a.version])) });
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-surface" role="dialog" aria-modal="true" aria-label="Platform agreements">
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-10">
        <div className="text-center">
          <div className="mx-auto inline-flex rounded-full bg-panel-2 p-3 text-accent">
            <ScrollText className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-bold text-ink">Before you continue</h1>
          <p className="mt-1 text-sm text-muted">
            {Object.keys(accepted).length === 0
              ? 'Welcome. Five short agreements set what this platform is — and is not. Read each one; access opens when all are accepted.'
              : 'An agreement changed since you last accepted it. Read the updated text; access reopens when it is accepted.'}
          </p>
        </div>
        <AgreementChecklist missing={missing} onAccept={accept} busy={busy} />
        <p className="text-center text-xs text-muted">
          Don’t agree?{' '}
          <button type="button" onClick={() => void signOut()} className="font-medium text-accent hover:underline">
            Sign out
          </button>{' '}
          — course overviews stay public either way.
        </p>
      </div>
    </div>
  );
}

/**
 * Offline mode: the same checklist as a dialog, opened by JoinPanel before
 * the first join on this device.
 */
export function LocalLegalDialog({
  open,
  onClose,
  onAccepted,
}: {
  open: boolean;
  onClose: () => void;
  onAccepted: () => void;
}) {
  const accepted = useClientStore(localAcceptances, {});
  const missing = missingAcceptances(accepted);
  return (
    <Dialog open={open} onClose={onClose} title="Before you join — the platform agreements">
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <AgreementChecklist
          missing={missing}
          busy={false}
          onAccept={() => {
            acceptLocally(missing);
            onAccepted();
          }}
        />
      </div>
    </Dialog>
  );
}

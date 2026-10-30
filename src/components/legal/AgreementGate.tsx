'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, FileCheck2, ScrollText } from 'lucide-react';
import { Button, Collapsible } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/useAuth';
import { useClientStore } from '@/lib/useClientStore';
import { supportLine } from '@/lib/reportError';
import { AGREEMENTS, missingAcceptances, type Agreement } from '@/lib/legal/agreements';
import {
  acceptInCloudDetailed,
  acceptLocally,
  fetchCloudAcceptances,
  flushPendingAcceptances,
  isCloudMode,
  localAcceptances,
  pendingAcceptances,
  queuePendingAcceptances,
  refreshSession,
  sessionMatches,
  type AcceptedVersions,
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
 * Cloud mode, mounted once in the root layout (R149 rewrite). The gate has three
 * states and never guesses: `loading` covers the app while the account's own log
 * is read (so nobody acts, then gets covered mid-task); `failed` says the log could
 * not be read and offers Retry — a failed read is NOT "accepted nothing"; `ready`
 * holds the account's own acceptances and asks only for what is missing. An empty
 * log is believed only once the session is confirmed to be this account's: an
 * expired token makes the client fall back to the anon key, and row-level security
 * then answers an honest-looking empty list, which used to show returning students
 * the first-time "Welcome". Acceptances the log cannot take yet are queued on the
 * device and written on the next load, so "you can continue" is kept.
 */
type GateCheck = { kind: 'loading' } | { kind: 'failed'; attempt: number } | { kind: 'ready'; accepted: AcceptedVersions };

/** Read retries before the gate gives up and says so: 1 s, 3 s, 8 s. */
const READ_RETRY_MS = [1000, 3000, 8000];

export function LegalGateOverlay() {
  const { user, loading, signOut } = useAuth();
  // R110: the legal pages stay readable while the gate is up, so "Full text"
  // opens a page a person can actually read; the gate returns on the next
  // navigation anywhere else.
  const pathname = usePathname();
  const [check, setCheck] = useState<GateCheck>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  // A `session` failure on Accept: refreshed once; the second time the student is offered a sign-in, never signed out under them.
  const [sessionFailures, setSessionFailures] = useState(0);

  useEffect(() => {
    if (!isCloudMode() || !user) return;
    let on = true;
    const userId = user.id;
    const run = async () => {
      await flushPendingAcceptances(userId);
      let refreshed = false;
      for (let attempt = 0; ; attempt++) {
        const a = await fetchCloudAcceptances(userId);
        if (!on) return;
        if (a !== null) {
          if (Object.keys(a).length === 0) {
            // Nothing in the log: a new account, or no session (the anon key sees no rows). Ask before believing it.
            const s = await sessionMatches(userId);
            if (!on) return;
            if (s !== 'ok') {
              if (!refreshed) {
                refreshed = true;
                await refreshSession();
                if (!on) return;
                continue;
              }
              setCheck({ kind: 'failed', attempt });
              return;
            }
          }
          setCheck({ kind: 'ready', accepted: { ...a, ...pendingAcceptances(userId) } });
          return;
        }
        if (attempt >= READ_RETRY_MS.length) {
          setCheck({ kind: 'failed', attempt });
          return;
        }
        await new Promise((r) => window.setTimeout(r, READ_RETRY_MS[attempt]));
        if (!on) return;
      }
    };
    void run();
    return () => {
      on = false;
    };
  }, [user?.id, retryNonce]); // eslint-disable-line react-hooks/exhaustive-deps -- user identity (and an explicit retry) is the dependency, not the object
  // Signed out (or a different account): forget the previous account's answers.
  // Render-time reset, the documented pattern — a setState inside the effect
  // above would cascade.
  const [seenUser, setSeenUser] = useState<string | null>(null);
  if ((user?.id ?? null) !== seenUser) {
    setSeenUser(user?.id ?? null);
    setCheck({ kind: 'loading' });
    setSessionFailures(0);
  }

  if (!isCloudMode() || loading || !user) return null;
  if (pathname?.startsWith('/legal')) return null;

  const shell = (children: ReactNode) => (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-surface" role="dialog" aria-modal="true" aria-label="Platform agreements">
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-10">
        <div className="text-center">
          <div className="mx-auto inline-flex rounded-full bg-panel-2 p-3 text-accent">
            <ScrollText className="h-6 w-6" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );

  if (check.kind === 'loading') {
    return shell(
      <>
        <h1 className="mt-3 text-2xl font-bold text-ink">Checking your agreements…</h1>
        <p className="mt-1 text-sm text-muted" data-gate="loading">One moment — reading what this account has already accepted.</p>
      </>
    );
  }
  if (check.kind === 'failed') {
    return shell(
      <>
        <h1 className="mt-3 text-2xl font-bold text-ink">We couldn’t check your agreements</h1>
        <p className="mt-1 text-sm text-muted" data-gate="failed">
          Your acceptances could not be read just now — this is not a request to accept anything again. Check your connection and try again.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={() => { setCheck({ kind: 'loading' }); setRetryNonce((n) => n + 1); }}>Retry</Button>
          <Button variant="ghost" onClick={() => void signOut()}>Sign out</Button>
        </div>
      </>
    );
  }

  const accepted = check.accepted;
  const missing = missingAcceptances(accepted);
  if (missing.length === 0) return null;

  const accept = () => {
    setBusy(true);
    const unlock = () => setCheck({ kind: 'ready', accepted: { ...accepted, ...Object.fromEntries(missing.map((a) => [a.id, a.version])) } });
    void acceptInCloudDetailed(user.id, missing).then(async (result) => {
      setBusy(false);
      if (result.ok) return unlock();
      // R128/R129: the log is a record, not a lock. A fault in writing it (network, a database that
      // lags the app) must not strand a student, so the platform opens for this visit and the write is
      // kept on the device and tried again; a sign-in or permission fault cannot be worked around.
      // The student is told the support code and the time, never the technical cause (client_errors).
      const line = supportLine(result.support);
      if (result.reason === 'session') {
        // R149: refresh and let them try again — never sign a returning student out under them.
        setSessionFailures((n) => n + 1);
        await refreshSession();
        toast({ message: sessionFailures === 0 ? `Your sign-in needed a refresh — please try again. ${line}` : `Your sign-in has expired. Use "Sign in again" below. ${line}`, variant: 'warning' });
        return;
      }
      if (result.reason === 'permission') {
        toast({ message: `This account cannot record the acceptance yet. ${line}`, variant: 'warning' });
        return;
      }
      toast({ message: `The acceptance could not be saved just now. You can continue; it will be saved again shortly. ${line}`, variant: 'warning' });
      queuePendingAcceptances(user.id, missing);
      unlock();
      window.setTimeout(() => void flushPendingAcceptances(user.id), 15000);
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
              ? `Welcome. ${AGREEMENTS.length} short agreements set what this platform is — and is not. Read each one; access opens when all are accepted.`
              : `Changed since you last accepted: ${missing.map((a) => a.title).join('; ')}. Read the updated text; access reopens when it is accepted.`}
          </p>
        </div>
        <AgreementChecklist missing={missing} onAccept={accept} busy={busy} />
        {sessionFailures >= 2 && (
          <p className="text-center text-sm text-muted">
            <button type="button" onClick={() => void signOut()} className="font-medium text-accent hover:underline">
              Sign in again
            </button>{' '}
            — your session has expired; signing in brings you straight back here.
          </p>
        )}
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

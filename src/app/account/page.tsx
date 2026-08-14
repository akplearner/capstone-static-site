'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Download, LogOut, Trash2, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Spinner';
import { getBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/useAuth';
import { useUserSync } from '@/lib/useUserSync';
import { useHydrated } from '@/lib/useClientStore';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { courseRepo, progressRepo, docsRepo, evidenceRepo, pathRepo, userStateRepo, labAccessRepo } from '@/lib/data';
import { toast } from '@/lib/toastBus';

/**
 * Account settings — and the two rights that are not optional once signups are
 * open to the public: get your data out, and get your account deleted.
 *
 * Deletion is the honest hard part. The anon key cannot remove a row from
 * `auth.users`; only the service role can, and that key must never reach the
 * browser. So this page deletes every application row it CAN reach with the
 * user's own credentials (which RLS scopes to them), then calls a
 * `delete-account` Edge Function to remove the identity itself. If that function
 * isn't deployed the page says so plainly rather than reporting a success it
 * didn't achieve — see supabase/functions/delete-account/index.ts.
 */
export default function AccountPage() {
  const hydrated = useHydrated();
  const { user, loading, signOut } = useAuth();
  useUserSync();
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState<null | 'export' | 'delete'>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!hydrated || loading) return <Skeleton className="mx-auto h-80 w-full max-w-2xl" />;

  if (!isSupabaseConfigured()) {
    return (
      <Shell>
        <p className="text-muted">
          Accounts aren’t configured on this deployment, so there’s no account to manage. Your work is
          stored in this browser only.
        </p>
      </Shell>
    );
  }

  // The proxy already redirects signed-out visitors, so this is a belt-and-braces
  // state that should only appear if the session expired while the page was open.
  if (!user) {
    return (
      <Shell>
        <p className="text-muted">Your session has ended.</p>
        <Link href="/login" className="mt-3 inline-block"><Button>Sign in again</Button></Link>
      </Shell>
    );
  }

  /** Everything this account owns, assembled client-side from the repos. */
  const collect = () => {
    const courses = courseRepo.list().map((course) => {
      const member = progressRepo.getContext(course.id);
      if (!member) return null;
      return {
        courseId: course.id,
        courseTitle: course.title,
        member,
        completedStepKeys: [...progressRepo.getCompletionKeySet(course.id, member.memberId)],
        deliverables: docsRepo.get(course.id, member.teamId),
        stepEvidence: evidenceRepo.getSteps(course.id, member.memberId),
        evidenceArtifacts: evidenceRepo.getArtifacts(course.id, member.memberId),
        userState: userStateRepo.get(course.id, member.memberId),
        labAccess: labAccessRepo.get(course.id, member.memberId),
      };
    });
    return {
      exportedAt: new Date().toISOString(),
      account: { id: user.id, email: user.email },
      path: pathRepo.get(user.id),
      courses: courses.filter(Boolean),
    };
  };

  const exportData = () => {
    setBusy('export');
    try {
      const blob = new Blob([JSON.stringify(collect(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `capstone-quarry-data-${user.id.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  };

  const deleteAccount = async () => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setDeleteError(null);
    setBusy('delete');

    // 1. Remove the application rows. RLS restricts each delete to this user, so
    //    this is safe to run from the browser with the anon key.
    const tables = [
      'step_evidence',
      'evidence_artifacts',
      'user_paths',
      'step_completions',
      'user_course_state',
      'lab_access',
      'memberships',
    ];
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('user_id', user.id);
      if (error) {
        setBusy(null);
        setDeleteError(`Couldn’t clear ${table}: ${error.message}. Nothing else was deleted.`);
        return;
      }
    }

    // 2. Remove the identity. Needs the service role, so it lives in an Edge
    //    Function. Report honestly if it isn't deployed — the data is gone but
    //    the login still exists, and the user needs to know that.
    const { error } = await supabase.functions.invoke('delete-account');
    setBusy(null);
    if (error) {
      setDeleteError(
        'Your data has been deleted, but the sign-in itself could not be removed automatically ' +
          '(the delete-account function is not deployed). Contact support to finish removing your login.'
      );
      return;
    }
    toast({ message: 'Your account and all its data have been deleted.', variant: 'success' });
    await signOut();
    window.location.assign('/');
  };

  return (
    <Shell>
      <section className="rounded-[var(--radius-card)] border border-line bg-panel p-5">
        <h2 className="text-lg font-bold text-ink">Signed in</h2>
        <p className="mt-1 font-mono text-sm text-muted">{user.email}</p>
        <div className="mt-4">
          <Button variant="secondary" className="flex items-center gap-2" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-line bg-panel p-5">
        <h2 className="text-lg font-bold text-ink">Your data</h2>
        <p className="mt-1 text-sm text-muted">
          Download everything this account holds — progress, deliverables, your evidence ledger and
          your chosen path — as JSON.
        </p>
        <div className="mt-4">
          <Button variant="secondary" disabled={busy === 'export'} className="flex items-center gap-2" onClick={exportData}>
            <Download className="h-4 w-4" /> Export my data
          </Button>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border p-5" style={{ borderColor: 'var(--color-danger)' }}>
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--color-danger)' }}>
          <AlertTriangle className="h-5 w-5" /> Delete account
        </h2>
        <p className="mt-1 text-sm text-muted">
          Permanently removes your account and every row of your work: progress, deliverables,
          evidence ledger and hashed artifacts. This cannot be undone. Export first if you want a copy.
        </p>
        <label className="mt-4 block max-w-sm">
          <span className="eyebrow-muted">Type DELETE to confirm</span>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DELETE"
            className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink placeholder-muted focus:border-accent focus:outline-none"
          />
        </label>
        <div className="mt-3">
          <Button
            variant="destructive"
            disabled={confirm !== 'DELETE' || busy === 'delete'}
            className="flex items-center gap-2"
            onClick={deleteAccount}
          >
            <Trash2 className="h-4 w-4" />
            {busy === 'delete' ? 'Deleting…' : 'Delete my account'}
          </Button>
        </div>
        {deleteError && (
          <p className="mt-3 text-sm" style={{ color: 'var(--color-danger)' }}>{deleteError}</p>
        )}
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <header className="flex items-center gap-3">
        <div className="inline-flex rounded-2xl bg-accent-soft p-3 text-accent">
          <UserIcon className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Account</h1>
      </header>
      {children}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Link2 } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { PixelBadge } from '@/components/ui/Pixel';
import { toast } from '@/lib/toastBus';
import { deleteShare, listShares, revokeShare, shareStatus, type ShareRow } from '@/lib/shares';
import { localDay } from '@/lib/localDate';

/** Clock read hoisted to module scope: the purity lint treats a `Date.now()` in a component-body function as render work. */
function nowMs(): number {
  return Date.now();
}

/**
 * R114 — the links the member created: what each shares, the label only
 * they see, what the board was measured against, when it expires, and
 * whether it is live, expired or revoked. Revoke stops a live link at once;
 * delete removes the frozen copy too. The copy and the token never come back
 * here (the table's column grants refuse both). Hidden wherever links cannot
 * exist: offline, or before the project runs migration 0015.
 */
export function LinksSection() {
  const [rows, setRows] = useState<ShareRow[] | null | undefined>(undefined);
  const [now] = useState(nowMs);
  const [deleting, setDeleting] = useState<ShareRow | null>(null);
  useEffect(() => {
    let on = true;
    void listShares().then((r) => {
      if (on) setRows(r);
    });
    return () => {
      on = false;
    };
  }, []);

  if (!rows) return null;

  const revoke = async (row: ShareRow) => {
    if (!(await revokeShare(row.id))) return toast({ message: 'Couldn’t revoke the link — try again.', variant: 'warning' });
    // The status needs only that it is revoked; the database holds the time.
    setRows((rs) => rs?.map((r) => (r.id === row.id ? { ...r, revokedAt: 'now' } : r)) ?? rs);
    toast({ message: 'Link revoked: it no longer opens.', variant: 'success' });
  };
  const remove = async (row: ShareRow) => {
    if (!(await deleteShare(row.id))) return toast({ message: 'Couldn’t delete the link — try again.', variant: 'warning' });
    setRows((rs) => rs?.filter((r) => r.id !== row.id) ?? rs);
    toast({ message: 'Link and its frozen copy deleted.', variant: 'success' });
  };

  return (
    <Surface as="section" aria-labelledby="account-links" data-links-section>
      <h2 id="account-links" className="flex items-center gap-2 text-lg font-bold text-ink">
        <Link2 className="h-5 w-5" aria-hidden /> Links you created
      </h2>
      <p className="mt-1 text-sm text-muted">
        Each link shows a frozen, unsigned copy of your portfolio export or credential to whoever holds it, until it expires or you revoke it. Create one from the
        portfolio or the dashboard.
      </p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No links yet.</p>
      ) : (
        <div className="relative mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th scope="col" className="px-2 py-2">Shares</th>
                <th scope="col" className="px-2 py-2">Label</th>
                <th scope="col" className="px-2 py-2">Measured against</th>
                <th scope="col" className="px-2 py-2">Expires</th>
                <th scope="col" className="px-2 py-2">Status</th>
                <th scope="col" className="px-2 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const status = shareStatus(r, now);
                return (
                  <tr key={r.id} data-share-row={status}>
                    <td className="px-2 py-2 whitespace-nowrap">{r.kind === 'profile' ? 'Portfolio export' : 'Credential'}</td>
                    <td className="px-2 py-2">{r.label || '—'}</td>
                    <td className="px-2 py-2">{r.measuredAgainst || '—'}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{localDay(Date.parse(r.expiresAt))}</td>
                    <td className="px-2 py-2">
                      <PixelBadge tone={status === 'live' ? 'accent' : 'muted'}>{status}</PixelBadge>
                    </td>
                    <td className="px-2 py-2 text-right whitespace-nowrap">
                      {status === 'live' && (
                        <Button variant="secondary" size="sm" onClick={() => void revoke(r)} data-share-revoke>
                          Revoke
                        </Button>
                      )}{' '}
                      <Button variant="ghost" size="sm" onClick={() => setDeleting(r)} data-share-delete>
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && void remove(deleting)}
        title="Delete this link?"
        message="The link stops opening and its frozen copy is removed. This cannot be undone."
        confirmLabel="Delete link"
      />
    </Surface>
  );
}

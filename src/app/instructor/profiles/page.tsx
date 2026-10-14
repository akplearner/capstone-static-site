'use client';

import { useRef, useState } from 'react';
import { Building2, Trash2, Upload } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Crumbs } from '@/components/SiteNav';
import { toast } from '@/lib/toastBus';
import { useAuth } from '@/lib/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { publishProfile, removeProfile, usePublishedProfiles, type PublishedProfile } from '@/lib/employerProfiles';
import { localDay } from '@/lib/localDate';

/**
 * R114 — employer profiles. An instructor publishes a company's environment
 * profile (the `environment-profile.schema.json` shape: tools, procedures,
 * policies and the competencies each work role needs), and every signed-in
 * member can measure their Skill board against it; a candidate link records
 * which profile the board was measured against. Instructors remove their
 * own; a new version is a new publish. The file is validated before it is
 * sent and again whenever it is read.
 */
export default function EmployerProfilesPage() {
  const { user } = useAuth();
  const { profiles, available, reload } = usePublishedProfiles();
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<PublishedProfile | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cloud = isSupabaseConfigured();

  const onFile = async (file: File | undefined) => {
    if (!file || !user) return;
    setError(null);
    const r = await publishProfile(user.id, await file.text());
    if (!r.ok) return setError(r.error);
    toast({ message: `Published ${r.profile.name}: members can measure against it now.`, variant: 'success' });
    reload();
  };
  const remove = async (p: PublishedProfile) => {
    if (!(await removeProfile(p.profile.id))) return toast({ message: 'Couldn’t remove the profile — try again.', variant: 'warning' });
    toast({ message: `Removed ${p.profile.name}.`, variant: 'success' });
    reload();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={<Crumbs items={[{ label: 'Home', href: '/' }, { label: 'Instructor', href: '/instructor' }, { label: 'Employer profiles' }]} />}
        title="Employer profiles"
        lede="Publish a company's environment profile so every member can measure their Skill board against it."
        trailing={
          cloud && available ? (
            <>
              <Button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5" data-publish-profile>
                <Upload className="h-4 w-4" aria-hidden /> Publish a profile
              </Button>
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
            </>
          ) : undefined
        }
      />
      {error && (
        <p role="alert" className="text-sm text-danger" data-publish-error>
          {error}
        </p>
      )}
      {!cloud || !available ? (
        <Surface as="section" data-profiles-unavailable>
          <p className="text-sm text-muted">
            Publishing needs accounts and migration 0015 on this deployment. Until then a member can still import a profile file on the Skill board, on their own
            device.
          </p>
        </Surface>
      ) : profiles.length === 0 ? (
        <Surface as="section">
          <p className="text-sm text-muted">No profiles published yet. The sample profiles in content/profiles/ show the shape.</p>
        </Surface>
      ) : (
        <Surface as="section" padding="none" className="relative overflow-x-auto">
          <table className="w-full text-sm" data-profiles-table>
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th scope="col" className="px-4 py-2.5">Profile</th>
                <th scope="col" className="px-4 py-2.5">Publisher</th>
                <th scope="col" className="px-4 py-2.5 text-right">Work roles</th>
                <th scope="col" className="px-4 py-2.5">Published</th>
                <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {profiles.map((p) => (
                <tr key={p.profile.id} data-profile-row={p.profile.id}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2 font-medium text-ink">
                      <Building2 className="h-4 w-4 text-muted" aria-hidden /> {p.profile.name}
                    </div>
                    <div className="font-mono text-2xs text-muted">{p.profile.id} · v{p.profile.version}</div>
                  </td>
                  <td className="px-4 py-2.5">{p.profile.publisher}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{p.profile.workRoles.length}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted">{p.publishedAt ? localDay(Date.parse(p.publishedAt)) : '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    {p.publisherId === user?.id && (
                      <Button variant="ghost" size="sm" className="flex items-center gap-1" onClick={() => setRemoving(p)} data-remove-profile>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      )}
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && void remove(removing)}
        title="Remove this profile?"
        message="Members stop seeing it in the Skill board picker. Links already made keep the name they were measured against."
        confirmLabel="Remove profile"
      />
    </div>
  );
}

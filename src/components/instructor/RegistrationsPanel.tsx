'use client';

import { useState } from 'react';
import { UserCog, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Surface } from '@/components/ui/Surface';
import { toast } from '@/components/ui/Toast';
import { RoleIcon } from '@/components/team/RoleIcon';
import { getRoleDef } from '@/lib/course-helpers';
import { moveMember, removeMember } from '@/lib/data/rosterAdmin';
import type { CohortData } from '@/lib/data/cohortLoader';
import { parseTeamId, teamLabel } from '@/lib/team';
import type { Course } from '@/lib/types';

/**
 * Registrations & teams (R85): every account on the course, with a name and a
 * face, and the fixes an instructor was missing — move a student to another
 * team or lobby, change their role, remove someone who dropped. Students
 * still enrol only themselves; this panel corrects, it never conscripts.
 */
export function RegistrationsPanel({
  course,
  data,
  onChanged,
}: {
  course: Course;
  data: CohortData;
  onChanged: () => void;
}) {
  const [managing, setManaging] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<{ memberId: string; name: string } | null>(null);

  const roster = [...data.roster].sort((a, b) => a.teamId.localeCompare(b.teamId) || a.displayName.localeCompare(b.displayName));
  const teams = [...new Set(roster.map((m) => m.teamId))].sort();
  const nameOf = (id: string, fallback: string) => data.profiles[id]?.displayName || fallback || 'Unnamed';

  const confirmRemove = () => {
    if (!pendingRemove) return;
    const { memberId, name } = pendingRemove;
    setPendingRemove(null);
    void removeMember(course.id, memberId).then((ok) => {
      toast(
        ok
          ? { message: `${name} removed from the course. Their account and its evidence remain.`, variant: 'success' }
          : { message: 'Couldn’t remove them — check your access and connection.', variant: 'warning' }
      );
      if (ok) onChanged();
    });
  };

  return (
    <Surface as="section" variant="inset" className="space-y-3" aria-labelledby="cohort-registrations">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="cohort-registrations" className="flex items-center gap-2 text-base font-semibold text-ink">
          <Users className="h-4 w-4 text-accent" aria-hidden /> Registrations &amp; teams
        </h2>
        <span className="text-sm text-muted">
          {roster.length} enrolled · {teams.length} team{teams.length === 1 ? '' : 's'}
        </span>
      </div>
      {/* `relative` matters: the header's sr-only span is absolutely
          positioned, and without a positioned scroller it escapes the
          scroll box and widens the whole page on a phone. */}
      <div className="relative overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-3 py-2">Student</th>
              <th scope="col" className="px-3 py-2">Team</th>
              <th scope="col" className="px-3 py-2">Focus</th>
              <th scope="col" className="px-3 py-2">Cohort</th>
              <th scope="col" className="px-3 py-2">Joined</th>
              <th scope="col" className="px-3 py-2"><span className="sr-only">Manage</span></th>
            </tr>
          </thead>
          <tbody>
            {roster.map((m) => {
              const rd = getRoleDef(course, m.role);
              const avatar = data.profiles[m.memberId]?.avatarUrl ?? m.avatarUrl;
              return (
                <ManageableRow
                  key={m.memberId}
                  open={managing === m.memberId}
                  onToggle={() => setManaging(managing === m.memberId ? null : m.memberId)}
                  onRemove={() => setPendingRemove({ memberId: m.memberId, name: nameOf(m.memberId, m.displayName) })}
                  onChanged={onChanged}
                  course={course}
                  teams={teams}
                  member={{ ...m, displayName: nameOf(m.memberId, m.displayName) }}
                  cells={
                    <>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2">
                          {avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element -- provider-hosted picture; next/image would need every host allow-listed.
                            <img src={avatar} alt="" width={24} height={24} referrerPolicy="no-referrer" className="h-6 w-6 shrink-0 rounded-full bg-panel-2 object-cover" />
                          ) : (
                            <RoleIcon iconName={rd?.icon} className="h-4 w-4 shrink-0" color={rd?.color} />
                          )}
                          <span className="font-medium text-ink">{nameOf(m.memberId, m.displayName)}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-body">{teamLabel(m.teamId)}</td>
                      <td className="px-3 py-2 text-body">{rd?.name ?? m.role}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted">{m.cohort}</td>
                      <td className="px-3 py-2 text-xs text-muted">
                        {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '—'}
                      </td>
                    </>
                  }
                />
              );
            })}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={!!pendingRemove}
        onClose={() => setPendingRemove(null)}
        onConfirm={confirmRemove}
        title="Remove from course?"
        message={
          <>
            Remove <strong>{pendingRemove?.name}</strong> from {course.title}? Their account, ticks and
            evidence stay; only the enrolment goes. They can join again themselves.
          </>
        }
        confirmLabel="Remove"
      />
    </Surface>
  );
}

function ManageableRow({
  open,
  onToggle,
  onRemove,
  onChanged,
  course,
  teams,
  member,
  cells,
}: {
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onChanged: () => void;
  course: Course;
  teams: string[];
  member: { memberId: string; teamId: string; role: string; cohort: string; displayName: string };
  cells: React.ReactNode;
}) {
  const [teamId, setTeamId] = useState(member.teamId);
  const [custom, setCustom] = useState('');
  const [role, setRole] = useState(member.role);
  const [busy, setBusy] = useState(false);

  const target = custom.trim() || teamId;
  // parseTeamId never throws; an id without the YYYY-MM prefix comes back
  // with cohort: null, which is exactly what makes it invalid here.
  const parsed = parseTeamId(target);
  const valid = !!parsed.cohort && !!role;
  const dirty = target !== member.teamId || role !== member.role;

  const save = () => {
    if (!valid || !dirty || busy || !parsed.cohort) return;
    setBusy(true);
    void moveMember(course.id, member.memberId, { teamId: target, role, cohort: parsed.cohort }).then((ok) => {
      setBusy(false);
      toast(
        ok
          ? { message: `${member.displayName} → ${teamLabel(target)}. They see it live.`, variant: 'success' }
          : { message: 'The move didn’t land — check your access and connection.', variant: 'warning' }
      );
      if (ok) {
        onToggle();
        onChanged();
      }
    });
  };

  return (
    <>
      <tr className="border-b border-line/60 last:border-0">
        {cells}
        <td className="px-3 py-2 text-right">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-panel-2"
          >
            <UserCog className="h-3.5 w-3.5" /> Manage
          </button>
        </td>
      </tr>
      {open && (
        <tr className="border-b border-line/60 bg-panel-2/50 last:border-0">
          <td colSpan={6} className="px-3 py-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm">
                <span className="block text-xs font-medium text-body">Team / lobby</span>
                <select value={teamId} onChange={(e) => { setTeamId(e.target.value); setCustom(''); }} className="mt-1 text-sm">
                  {teams.map((t) => (
                    <option key={t} value={t}>{teamLabel(t)} · {t}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="block text-xs font-medium text-body">…or a new id</span>
                <input
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder={`${member.cohort}-t02`}
                  className="mt-1 w-36 rounded-md bg-panel px-2 py-1.5 font-mono text-xs text-ink"
                />
              </label>
              <label className="text-sm">
                <span className="block text-xs font-medium text-body">Focus</span>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 text-sm">
                  {course.roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </label>
              <Button size="sm" onClick={save} disabled={!valid || !dirty || busy}>
                {busy ? 'Moving…' : 'Save'}
              </Button>
              <Button size="sm" variant="destructive" onClick={onRemove}>
                Remove from course
              </Button>
              {!parsed.cohort && custom.trim() && (
                <span className="text-xs text-warn">A team id reads YYYY-MM-tN (or -oN for a lobby).</span>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

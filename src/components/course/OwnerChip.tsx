'use client';

import { Users } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import { RoleIcon } from '@/components/team/RoleIcon';
import { splitRoleName } from '@/lib/docs/roles';
import { OWNER_COPY, ownerSentence, type Ownership } from '@/lib/taskOwnership';

/** The role a chip names: enough to draw its icon and short name. */
export interface OwnerRole {
  name: string;
  icon: string;
  color: string;
}

/**
 * Whose a task is, in one chip, wherever a task is drawn (R116).
 *
 * Three kinds, each an icon plus words, never colour alone: **Your task**
 * (accent, with the role's icon), **Everyone** (a shared task: it used to say
 * nothing at all), and **{Role} · open to anyone** (another role's task, in the
 * neutral tone). There is no padlock anywhere: a role is a label, and every
 * task is open to the whole team.
 */
export function OwnerChip({ kind, role }: { kind: Ownership; role?: OwnerRole }) {
  if (kind === 'shared') {
    return (
      <Chip tone="muted" icon={<Users />} title={OWNER_COPY.explain.shared} data-owner="shared">
        {OWNER_COPY.shared}
      </Chip>
    );
  }
  const icon = role ? <RoleIcon iconName={role.icon} className="h-3 w-3" color={role.color} /> : undefined;
  if (kind === 'yours') {
    return (
      <Chip tone="accent" icon={icon} title={role ? ownerSentence(OWNER_COPY.explain.yours, role.name) : undefined} data-owner="yours">
        {OWNER_COPY.yours}
      </Chip>
    );
  }
  const short = role ? splitRoleName(role.name).fn : '';
  return (
    <Chip tone="muted" icon={icon} title={role ? ownerSentence(OWNER_COPY.openTip, role.name) : undefined} data-owner="other">
      {short ? `${short} · ${OWNER_COPY.other}` : OWNER_COPY.other}
    </Chip>
  );
}

'use client';

import { useState } from 'react';
import { UserCheck, UserPlus, Users } from 'lucide-react';
import type { JoinResult } from '@/lib/data/types';
import type { Task } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Dialog } from '@/components/ui/Dialog';
import { Surface } from '@/components/ui/Surface';
import { toast } from '@/components/ui/Toast';
import { RoleIcon } from '@/components/team/RoleIcon';
import { splitRoleName } from '@/lib/docs/roles';
import { OWNER_COPY } from '@/lib/taskOwnership';
import { ROLE_BOARD_COPY as COPY, fill, holdersLabel, type BoardRole, type BoardTask, type RoleBoardData } from '@/lib/roleBoard';
import { OwnerChip } from './OwnerChip';
import { TaskStateChip } from './TaskStateChip';

/**
 * The team's roles on Home (R119): every role of the course with the teammates
 * who hold it and this week's tasks, each saying whose it is and where it
 * stands. The viewer's own role is first and marked "You"; the rest are
 * "open to anyone", never locked. A role nobody on the team holds is marked
 * open, says any teammate can cover its documents, and can be taken in one
 * click behind a short confirm. Props only: the page hands it the board and the
 * way to take a role.
 */
export function RoleBoard({
  board,
  unit,
  teamName,
  onOpenTask,
  onOpenTasks,
  onTake,
}: {
  board: RoleBoardData;
  unit: string;
  /** "Team 1": named in the confirm. */
  teamName: string;
  /** Opens a task in Tasks. */
  onOpenTask: (task: Task) => void;
  /** Opens the week's whole list in Tasks. */
  onOpenTasks: () => void;
  /** Moves the member to this role on their own team. */
  onTake: (roleId: string) => Promise<JoinResult>;
}) {
  const [takingId, setTakingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const taking = board.roles.find((r) => r.id === takingId);
  const mine = board.roles.find((r) => r.you);

  const close = () => {
    setTakingId(null);
    setError(null);
  };
  const confirm = async () => {
    if (!taking || busy) return;
    setBusy(true);
    const res = await onTake(taking.id);
    setBusy(false);
    if (!res.ok) {
      setError(res.reason === 'team-full' ? COPY.full : COPY.failed);
      return;
    }
    toast({ message: fill(COPY.taken, { role: splitRoleName(taking.name).fn }), variant: 'success' });
    close();
  };

  return (
    <Surface as="section" variant="inset" id="roles" className="scroll-under-chrome space-y-3" aria-labelledby="roles-title" data-role-board>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <h2 id="roles-title" className="text-lg font-semibold text-ink">
            {fill(COPY.title, { unit })}
          </h2>
          <p className="text-sm text-muted">{COPY.lede}</p>
        </div>
        <button type="button" onClick={onOpenTasks} className="focusable text-sm font-medium text-accent hover:text-accent-strong">
          {COPY.openTasks}
        </button>
      </div>

      {board.shared.length > 0 && (
        <div className="min-w-0 rounded-lg bg-panel px-3 py-3 text-sm" data-board-shared>
          <div className="flex items-center gap-2 font-semibold text-ink">
            <Users className="h-5 w-5 shrink-0 text-muted" aria-hidden />
            <h3>{COPY.shared}</h3>
          </div>
          <p className="mt-0.5 text-xs text-muted">{OWNER_COPY.explain.shared}</p>
          <ul className="mt-3 space-y-2.5 border-t border-line pt-3">
            {board.shared.map((item) => (
              <TaskLine key={item.task.id} item={item} onOpen={onOpenTask} />
            ))}
          </ul>
        </div>
      )}

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {board.roles.map((role) => (
          <RoleCard key={role.id} role={role} unit={unit} onOpenTask={onOpenTask} onTake={() => setTakingId(role.id)} />
        ))}
      </ul>

      <Dialog open={!!taking} onClose={close} title={taking ? fill(COPY.confirmTitle, { role: splitRoleName(taking.name).fn }) : COPY.take}>
        {taking && (
          <p className="text-sm text-body" data-take-confirm>
            {fill(COPY.confirmBody, { team: teamName, role: splitRoleName(taking.name).fn, from: mine ? splitRoleName(mine.name).fn : 'your current role' })}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={close}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => void confirm()} disabled={busy}>
            {busy ? 'Moving…' : COPY.take}
          </Button>
        </div>
      </Dialog>
    </Surface>
  );
}

function RoleCard({ role, unit, onOpenTask, onTake }: { role: BoardRole; unit: string; onOpenTask: (task: Task) => void; onTake: () => void }) {
  const { fn, tag } = splitRoleName(role.name);
  const owner = { name: role.name, icon: role.icon, color: role.color };
  return (
    <li
      data-board-role={role.id}
      data-you={role.you ? '' : undefined}
      data-vacant={role.vacant ? '' : undefined}
      className={`min-w-0 rounded-lg px-3 py-3 text-sm ${role.you ? 'bg-accent-soft/60' : 'bg-panel'}`}
    >
      <div className="flex items-start gap-2">
        <RoleIcon iconName={role.icon} className="mt-0.5 h-5 w-5 shrink-0" color={role.color} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-semibold text-ink">{fn}</h3>
            {role.you && (
              <Chip tone="accent" icon={<UserCheck />} data-board-you>
                {COPY.you}
              </Chip>
            )}
            {role.vacant && (
              <Chip tone="warn" icon={<UserPlus />} data-board-open>
                {COPY.openRole}
              </Chip>
            )}
          </div>
          {tag && <div className="text-xs text-muted">{tag}</div>}
          <p className="mt-0.5 break-words text-xs text-muted" data-board-holders>
            {role.vacant ? COPY.nobody : holdersLabel(role.holders)}
          </p>
        </div>
      </div>
      {role.vacant && (
        <div className="mt-2 space-y-1.5">
          <p className="text-xs text-body">{COPY.cover}</p>
          <Button size="sm" variant="secondary" onClick={onTake} aria-label={`${COPY.take}: ${fn}`} data-take-role={role.id}>
            {COPY.take}
          </Button>
        </div>
      )}
      {role.tasks.length > 0 ? (
        <ul className="mt-3 space-y-2.5 border-t border-line pt-3">
          {role.tasks.map((item) => (
            <TaskLine key={item.task.id} item={item} owner={owner} onOpen={onOpenTask} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 border-t border-line pt-3 text-xs text-muted">{fill(COPY.noTasks, { unit })}</p>
      )}
    </li>
  );
}

/** One task: its title opens it in Tasks, and two chips say whose it is and where it stands. */
function TaskLine({ item, owner, onOpen }: { item: BoardTask; owner?: { name: string; icon: string; color: string }; onOpen: (task: Task) => void }) {
  return (
    <li data-board-task={item.task.id}>
      <button type="button" onClick={() => onOpen(item.task)} className="focusable block max-w-full break-words rounded text-left text-sm text-ink hover:text-accent-ink">
        {item.task.title}
      </button>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <OwnerChip kind={item.ownership} role={owner} />
        <TaskStateChip state={item.state} />
      </div>
    </li>
  );
}

import { describe, it, expect, beforeEach } from 'vitest';
import { SECURITY_PLUS } from './seed/securityPlus';
import { progressRepo } from './index';
import { composeTeamId } from '../team';
import type { Member } from '../types';

/**
 * R154 — a role is led by one; a second joins only as a permitted co-work peer, never a third. Offline
 * here (the localStorage repo); the database half is proven in supabase/tests/rls.sql.
 */
const C = SECURITY_PLUS;
const TEAM = composeTeamId('2026-01', '1', 'local');
const member = (id: string, role: string): Member => ({ memberId: id, courseId: C.id, teamId: TEAM, role, displayName: id, cohort: '2026-01' });
const roleA = C.roles[0].id;

beforeEach(() => localStorage.clear());

describe('localStorageProgressRepo — role peering', () => {
  it('the first member leads a role; a second on it is refused until the role allows a peer; a third never', () => {
    expect(progressRepo.joinTeam(C, member('m1', roleA))).toEqual({ ok: true });
    // second on the same role, peering closed → refused
    expect(progressRepo.joinTeam(C, member('m2', roleA))).toEqual({ ok: false, reason: 'role-taken' });
    // the role opens a peer seat → the second may join
    progressRepo.setRolePeering(C.id, TEAM, roleA, true);
    expect(progressRepo.joinTeam(C, member('m2', roleA))).toEqual({ ok: true });
    // a third is refused even with peering open — two is the cap
    expect(progressRepo.joinTeam(C, member('m3', roleA))).toEqual({ ok: false, reason: 'role-full' });
  });

  it('a free role on the same team is open, and a member keeping their own role is never refused', () => {
    progressRepo.joinTeam(C, member('m1', roleA));
    const roleB = C.roles[1].id;
    expect(progressRepo.joinTeam(C, member('m2', roleB))).toEqual({ ok: true });
    // m1 re-saving their own role (a name change, say) is fine
    expect(progressRepo.joinTeam(C, member('m1', roleA))).toEqual({ ok: true });
  });

  it('getRolePeering reflects what setRolePeering wrote, keyed by team and role', () => {
    expect(progressRepo.getRolePeering(C.id)).toEqual({});
    progressRepo.setRolePeering(C.id, TEAM, roleA, true);
    expect(progressRepo.getRolePeering(C.id)[`${TEAM}::${roleA}`]).toBe(true);
    progressRepo.setRolePeering(C.id, TEAM, roleA, false);
    expect(progressRepo.getRolePeering(C.id)[`${TEAM}::${roleA}`]).toBeUndefined();
  });
});

'use client';

import { Info, Users } from 'lucide-react';
import { TeamProgressTable, type MemberProgress, type DeliverableStatus } from '@/components/TeamProgressTable';
import { progressRepo, docsRepo } from '@/lib/data';
import { useClientStore, EMPTY_ARRAY } from '@/lib/useClientStore';
import { getRequiredStepCount, getTasksByRole } from '@/lib/course-helpers';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { emptyData } from '@/lib/docs/types';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { parseTeamId, teamLabel } from '@/lib/team';
import type { Course, Member } from '@/lib/types';

/**
 * Your team, on the Home tab.
 *
 * This was its own tab (`/team/<teamId>`), which made five tabs and one more
 * place to look for "how are we doing". A student only ever views their own
 * team, so the block keys on `member.teamId` and renders on Home behind the
 * join — nothing to deny any more. The old route redirects here (`#team`).
 */
export function TeamBlock({ course, member }: { course: Course; member: Member }) {
  const teamId = member.teamId;

  // Roster + per-member progress, recomputed whenever cloud/local data changes.
  const rows = useClientStore<MemberProgress[]>(() => {
    const roster = progressRepo.getRoster(course.id).filter((e) => e.teamId === teamId);
    return roster.map((m) => {
      const keySet = progressRepo.getCompletionKeySet(course.id, m.memberId);
      const tasks = getTasksByRole(course, m.role);
      const totalSteps = tasks.reduce((s, t) => s + getRequiredStepCount(t), 0);
      const doneSteps = tasks.reduce(
        (s, t) => s + Math.round((progressRepo.getTaskPercent(course.id, m.memberId, t, keySet) / 100) * getRequiredStepCount(t)),
        0
      );
      const overall = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;
      const weeks = [...course.weeks]
        .map((w) => w.number)
        .sort((a, b) => a - b)
        .map((week) => ({
          week,
          pct: progressRepo.getWeekCompletion(course, m.memberId, m.role, week, keySet),
        }));
      return { memberId: m.memberId, displayName: m.displayName, role: m.role, overall, weeks, isYou: member.memberId === m.memberId };
    });
  }, EMPTY_ARRAY);

  // Team deliverable completeness (DoD checks where defined; else any saved data).
  const deliverables = useClientStore<DeliverableStatus[]>(() => {
    const saved = docsRepo.get(course.id, teamId) ?? {};
    return deliverablesForCourse(course.id).map((d) => {
      const data = saved[d.id];
      let complete = false;
      if (d.dod && d.dod.length > 0) {
        complete = d.dod.every((c) => c.test(data ?? emptyData()));
      } else if (data) {
        complete =
          Object.values(data.fields ?? {}).some((v) => v && v.trim()) ||
          Object.values(data.groups ?? {}).some((rowsArr) => rowsArr.length > 0);
      }
      return { id: d.id, title: d.title, owner: d.owner, complete };
    });
  }, EMPTY_ARRAY);

  const cohort = parseTeamId(teamId).cohort;

  return (
    <section id="team" className="scroll-mt-24 space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Users className="h-5 w-5 text-accent" /> Your team · {teamLabel(teamId)}
        </h2>
        {cohort && <span className="text-sm text-muted">Class session {cohort}</span>}
      </div>
      {!isSupabaseConfigured() && (
        <div className="flex items-start gap-2 rounded-lg border border-warn-line bg-warn-soft p-3 text-sm text-warn">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Sign-in isn&apos;t configured, so this shows only your own device&apos;s data. Once the
            platform is connected to its backend, teammates&apos; live progress appears here.
          </p>
        </div>
      )}
      <TeamProgressTable course={course} rows={rows} deliverables={deliverables} />
    </section>
  );
}

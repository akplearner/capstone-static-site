'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Info, Users } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { DeliverablesMatrix } from '@/components/diagrams/DeliverablesMatrix';
import { TeamProgressTable, MemberProgress, DeliverableStatus } from '@/components/TeamProgressTable';
import { TeamHandoffChecklist } from '@/components/TeamHandoffChecklist';
import { LoadingBlock } from '@/components/ui/Spinner';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { useSupabaseSync } from '@/lib/useSupabaseSync';
import { progressRepo, docsRepo } from '@/lib/data';
import { useClientStore, EMPTY_ARRAY } from '@/lib/useClientStore';
import { getRequiredStepCount, getTasksByRole } from '@/lib/course-helpers';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { emptyData } from '@/lib/docs/types';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export default function TeamSpacePage() {
  const course = useCourse();
  const params = useParams();
  const teamId = params.teamId as string;
  useSupabaseSync(course.id);
  const { member, loading } = useMember(course.id);

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
      return { memberId: m.memberId, displayName: m.displayName, role: m.role, overall, weeks, isYou: member?.memberId === m.memberId };
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

  if (loading) return <LoadingBlock />;

  // Teammates of the same team can view it; others can't (RLS also enforces this
  // server-side, so a non-member's queries simply return nothing).
  if (member && member.teamId !== teamId) {
    return (
      <EmptyState
        title="Access denied"
        message={`You can only view your own team's space (Team ${member.teamId}).`}
        href={`/courses/${course.id}/team/${member.teamId}`}
        cta="Go to my team"
      />
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href={`/courses/${course.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" /> Back to course
      </Link>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team {teamId} · {course.title}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Your team&apos;s roster, each member&apos;s progress, and the documents you produce together.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" /> Team progress
        </h2>
        {!isSupabaseConfigured() && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Sign-in isn&apos;t configured, so this shows only your own device&apos;s data. Once the
              platform is connected to its backend, teammates&apos; live progress appears here.
            </p>
          </div>
        )}
        <TeamProgressTable course={course} rows={rows} deliverables={deliverables} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hand-offs — who owes whom</h2>
        <TeamHandoffChecklist course={course} teamId={teamId} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Documents by week &amp; role</h2>
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <DeliverablesMatrix course={course} highlightRole={member?.role} />
        </div>
      </section>
    </div>
  );
}

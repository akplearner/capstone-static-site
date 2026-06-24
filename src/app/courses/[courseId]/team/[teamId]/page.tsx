'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, FileText, Info } from 'lucide-react';
import { RoleIcon } from '@/components/RoleIcon';
import { EmptyState } from '@/components/EmptyState';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { getDeliverablesForWeek } from '@/lib/course-helpers';

export default function TeamSpacePage() {
  const course = useCourse();
  const params = useParams();
  const teamId = params.teamId as string;
  const { member, loading } = useMember(course.id);

  if (loading) return <div className="py-12 text-center text-gray-500">Loading…</div>;

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
          The deliverables your team should produce each week, by role.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Gather these artifacts as you complete each week. File upload and shared team submission arrive when
          the platform is connected to a backend; for now, keep your files organized using these names.
        </p>
      </div>

      <div className="space-y-6">
        {course.weeks.map((w) => (
          <div key={w.number} className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Week {w.number}: {w.title}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {course.roles.map((r) => {
                const deliverables = getDeliverablesForWeek(course, r.id, w.number);
                return (
                  <div key={r.id} className="rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <RoleIcon iconName={r.icon} className="h-4 w-4" color={r.color} />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{r.name}</span>
                    </div>
                    {deliverables.length === 0 ? (
                      <p className="mt-2 text-xs text-gray-400">No deliverables.</p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {deliverables.map((d) => (
                          <li key={d} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <FileText className="h-3 w-3 shrink-0 text-amber-500" />
                            <span className="font-mono">{d}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

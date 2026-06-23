'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { RoleIcon } from '@/components/RoleIcon';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { progressRepo } from '@/lib/data';
import { Member } from '@/lib/types';

const TEAM_OPTIONS = ['01', '02', '03'];
const COHORTS = ['2026-Spring', '2026-Fall'];

export default function CourseSettingsPage() {
  const course = useCourse();
  const router = useRouter();
  const { member } = useMember(course.id);

  const [cohort, setCohort] = useState(member?.cohort || COHORTS[0]);
  const [team, setTeam] = useState(member?.teamId || TEAM_OPTIONS[0]);
  const [role, setRole] = useState<string>(member?.role || course.roles[0]?.id || '');
  const [displayName, setDisplayName] = useState(member?.displayName || '');
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSave = () => {
    if (!displayName.trim()) {
      setNameError('Please enter your name to continue.');
      return;
    }
    setNameError(null);
    const newMember: Member = {
      memberId: `${course.id}-${cohort}-${team}-${role}-${Date.now()}`,
      courseId: course.id,
      teamId: team,
      role,
      displayName: displayName.trim(),
      cohort,
    };
    // Persist directly so navigation reads fresh state.
    progressRepo.setContext(newMember);
    router.push(`/courses/${course.id}/dashboard`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Enroll · {course.title}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Set up your profile to access this course.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Your Profile</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="Your name"
                aria-invalid={!!nameError}
                className={`mt-2 w-full rounded-lg border bg-white px-4 py-2 dark:bg-gray-700 dark:text-white ${
                  nameError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {nameError && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{nameError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cohort</label>
              <select
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {COHORTS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {TEAM_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTeam(t)}
                    className={`rounded-lg border-2 px-4 py-2 font-medium transition-colors ${
                      team === t
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Team {t}
                  </button>
                ))}
              </div>
            </div>

            {course.roles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <div className="mt-3 space-y-2">
                  {course.roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left font-medium transition-colors ${
                        role === r.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <RoleIcon iconName={r.icon} className="h-5 w-5" color={r.color} />
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleSave} size="lg" className="w-full">
              Save &amp; Continue
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Role Overview</h2>
          <div className="space-y-6">
            {course.roles.map((r) => (
              <div key={r.id}>
                <RoleIcon iconName={r.icon} className="h-7 w-7" color={r.color} />
                <h3 className="mt-2 font-bold text-gray-900 dark:text-white">{r.name}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{r.mission}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

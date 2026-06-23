'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { setStudentContext, getStudentContext } from '@/lib/storage';
import { Member } from '@/lib/types';

export default function SettingsPage() {
  const router = useRouter();
  const currentContext = getStudentContext();

  const [cohort, setCohort] = useState(currentContext?.cohort || '2026-Spring');
  const [team, setTeam] = useState(currentContext?.teamId || '01');
  const [role, setRole] = useState<'red' | 'blue' | 'grc'>(
    (currentContext?.role as any) || 'red'
  );
  const [displayName, setDisplayName] = useState(currentContext?.displayName || '');
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSave = () => {
    if (!displayName.trim()) {
      setNameError('Please enter your name to continue.');
      return;
    }
    setNameError(null);

    const newContext: Member = {
      memberId: `${cohort}-${team}-${role}-${Date.now()}`,
      teamId: team,
      role,
      displayName,
      cohort,
    };

    setStudentContext(newContext);
    router.push('/dashboard');
  };

  const teamOptions = ['01', '02', '03'];
  const roleOptions: Array<{ value: 'red' | 'blue' | 'grc'; label: string }> = [
    { value: 'red', label: '🏃 Red (Runners)' },
    { value: 'blue', label: '🛡️ Blue (Wardens)' },
    { value: 'grc', label: '📋 GRC (Fixers)' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Enrollment</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Set up your profile to access the capstone lab.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Your Profile</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
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
                  nameError
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {nameError && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{nameError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cohort
              </label>
              <select
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option>2026-Spring</option>
                <option>2026-Fall</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Team
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {teamOptions.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTeam(t)}
                    className={`rounded-lg border-2 px-4 py-2 font-medium transition-colors ${
                      team === t
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    Team {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Role
              </label>
              <div className="mt-3 space-y-2">
                {roleOptions.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`w-full rounded-lg border-2 px-4 py-3 text-left font-medium transition-colors ${
                      role === r.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} size="lg" className="w-full">
              Save & Continue
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Role Overview</h2>

          <div className="space-y-6">
            <div>
              <div className="text-2xl">🏃</div>
              <h3 className="mt-2 font-bold text-gray-900 dark:text-white">Red (Runners)</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Reconnaissance, enumeration, and exploitation.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>✓ OSINT & passive recon</li>
                <li>✓ Vulnerability scanning</li>
                <li>✓ Exploit execution</li>
                <li>✓ Proof collection</li>
              </ul>
            </div>

            <div>
              <div className="text-2xl">🛡️</div>
              <h3 className="mt-2 font-bold text-gray-900 dark:text-white">Blue (Wardens)</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Hardening, detection, and incident response.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>✓ System hardening</li>
                <li>✓ Baseline capture</li>
                <li>✓ Attack detection</li>
                <li>✓ Incident response</li>
              </ul>
            </div>

            <div>
              <div className="text-2xl">📋</div>
              <h3 className="mt-2 font-bold text-gray-900 dark:text-white">GRC (Fixers)</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Governance, risk, and compliance.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>✓ Framework mapping</li>
                <li>✓ Risk assessment</li>
                <li>✓ Evidence management</li>
                <li>✓ Final reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

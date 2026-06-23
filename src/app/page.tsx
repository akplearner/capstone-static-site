'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentContext } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const context = getStudentContext();
    if (context) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="space-y-12">
      <div className="text-center">
        <div className="mb-6 text-6xl">🔐</div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Security+ Capstone Lab</h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
          A 4-week hands-on security lab with Red, Blue, and GRC roles.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="mb-3 text-3xl">🏃</div>
          <h2 className="font-bold text-gray-900 dark:text-white">Red Team</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Reconnaissance, enumeration, and exploitation tasks.
          </p>
        </div>

        <div className="rounded-lg border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-900/20">
          <div className="mb-3 text-3xl">🛡️</div>
          <h2 className="font-bold text-gray-900 dark:text-white">Blue Team</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Hardening, detection, and incident response tasks.
          </p>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
          <div className="mb-3 text-3xl">📋</div>
          <h2 className="font-bold text-gray-900 dark:text-white">GRC</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Risk assessment, compliance, and reporting tasks.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-lg bg-gray-50 p-8 dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Get Started</h2>
        <p className="text-gray-600 dark:text-gray-400">
          New here? See how the capstone works first, then set up your profile.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/guide">
            <Button size="lg" className="w-full sm:w-auto">
              See How It Works
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Enroll Now
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lab Flow</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="mt-1 text-2xl font-bold text-blue-600">1</div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Cold Recon (Week 1)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Build baseline, passive recon, and foundational security.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="mt-1 text-2xl font-bold text-blue-600">2</div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Hard Target (Week 2)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Authorized vulnerability assessment and detection engineering.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="mt-1 text-2xl font-bold text-blue-600">3</div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">The Breach (Week 3)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Execute attacks, detect, and preserve evidence.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="mt-1 text-2xl font-bold text-blue-600">4</div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Payday (Week 4)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Compile findings and present results.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

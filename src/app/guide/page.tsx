'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ListChecks,
  FileText,
  ShieldCheck,
  Presentation,
  Target,
  Shield,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LifecycleFlow } from '@/components/diagrams/LifecycleFlow';
import { RoleInterplayDiagram } from '@/components/diagrams/RoleInterplayDiagram';
import { useStudentContext } from '@/lib/storage';
import { getRoleMission } from '@/lib/utils';

const RHYTHM = [
  {
    icon: ListChecks,
    title: '1. Follow the steps',
    body: 'Open your week and work the guided steps one at a time. Each step tells you exactly what to run, what you should see, and why it matters.',
  },
  {
    icon: FileText,
    title: '2. Gather your evidence',
    body: 'Steps marked with a deliverable produce a file (e.g. Nmap_Scan.txt). Save it using the naming convention so it is ready for your report.',
  },
  {
    icon: ShieldCheck,
    title: '3. Clear the gate',
    body: 'Finishing your required tasks for the week moves its gate from Locked → In progress → Passed. Gates mark that a phase is complete.',
  },
  {
    icon: Presentation,
    title: '4. Report & present',
    body: 'In Week 4 you compile findings, recommendations, and a briefing — the same deliverables a real security engagement produces.',
  },
];

const ROLES = [
  { role: 'red', icon: Target, name: 'Red (Runners)' },
  { role: 'blue', icon: Shield, name: 'Blue (Wardens)' },
  { role: 'grc', icon: ClipboardList, name: 'GRC (Fixers)' },
] as const;

export default function GuidePage() {
  const { context } = useStudentContext();

  return (
    <div className="space-y-12">
      {/* Intro */}
      <div className="space-y-3 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">How the Capstone Works</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          A 4-week, industry-style security engagement. You pick a role, work week-by-week through
          guided tasks, gather evidence, and deliver a professional report — exactly like a real
          Red / Blue / GRC team.
        </p>
      </div>

      {/* Lifecycle */}
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">The 4-week lifecycle</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Each week builds on the last and ends with a gate you must clear before the work is considered done.
        </p>
        <LifecycleFlow currentWeek={1} />
      </section>

      {/* Weekly rhythm */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your weekly rhythm</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {RHYTHM.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="inline-flex rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <r.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">{r.title}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{r.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Role interplay */}
      <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How the three roles work together</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Red simulates the attacker. Blue hardens systems and detects the attack. GRC governs the
            engagement, collects evidence from both sides, and compiles the final report. Every role
            depends on the others.
          </p>
          <div className="space-y-3">
            {ROLES.map((r) => (
              <div key={r.role} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <r.icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{r.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{getRoleMission(r.role)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <RoleInterplayDiagram highlightRole={context?.role} />
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center gap-4 rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
        {context ? (
          <>
            <p className="text-gray-600 dark:text-gray-400">You&apos;re enrolled. Jump back into your work.</p>
            <Link href="/dashboard">
              <Button size="lg" className="flex items-center gap-2">
                Go to Dashboard <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </>
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-400">Ready to start? Set up your profile and pick a role.</p>
            <Link href="/settings">
              <Button size="lg" className="flex items-center gap-2">
                Enroll Now <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </>
        )}
      </section>
    </div>
  );
}

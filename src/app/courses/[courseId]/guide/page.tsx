'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ListChecks, FileText, ShieldCheck, Presentation, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RoleIcon } from '@/components/RoleIcon';
import { LifecycleFlow } from '@/components/diagrams/LifecycleFlow';
import { RoleInterplayDiagram } from '@/components/diagrams/RoleInterplayDiagram';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';

const RHYTHM = [
  { icon: ListChecks, title: '1. Follow the steps', body: 'Work the guided steps one at a time. Each tells you what to run, what you should see, and why it matters.' },
  { icon: FileText, title: '2. Gather your evidence', body: 'Steps that produce a deliverable show the filename to save. Keep your artifacts ready for your report.' },
  { icon: ShieldCheck, title: '3. Clear the gate', body: 'Finishing a week’s required tasks moves its gate from Locked → In progress → Passed.' },
  { icon: Presentation, title: '4. Report & present', body: 'The final week compiles findings and recommendations — the deliverables a real engagement produces.' },
];

export default function CourseGuidePage() {
  const course = useCourse();
  const { member } = useMember(course.id);

  return (
    <div className="space-y-12">
      <div className="space-y-3 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">How {course.title} Works</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">{course.description}</p>
      </div>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">The lifecycle</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {course.weeks.length} weeks, each ending with a gate you clear before moving on.
        </p>
        <LifecycleFlow weeks={course.weeks} gates={course.gates} currentWeek={course.weeks[0]?.number} />
      </section>

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

      {course.roles.length > 0 && (
        <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">The roles</h2>
            <div className="space-y-3">
              {course.roles.map((r) => (
                <div key={r.id} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <RoleIcon iconName={r.icon} className="mt-0.5 h-5 w-5 shrink-0" color={r.color} />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{r.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{r.mission}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <RoleInterplayDiagram roles={course.roles} highlightRole={member?.role} />
          </div>
        </section>
      )}

      <section className="flex flex-col items-center gap-4 rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
        {member ? (
          <>
            <p className="text-gray-600 dark:text-gray-400">You’re enrolled. Jump back into your work.</p>
            <Link href={`/courses/${course.id}/dashboard`}>
              <Button size="lg" className="flex items-center gap-2">
                Go to Dashboard <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </>
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-400">Ready to start? Set up your profile and pick a role.</p>
            <Link href={`/courses/${course.id}/settings`}>
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

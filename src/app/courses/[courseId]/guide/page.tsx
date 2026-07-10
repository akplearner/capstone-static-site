'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ListChecks, FileText, ShieldCheck, Presentation, ArrowRight } from 'lucide-react';
import { Button, Collapsible } from '@/components/ui/Button';
import { RoleIcon } from '@/components/RoleIcon';
import { LifecycleFlow } from '@/components/diagrams/LifecycleFlow';
import { RoleInterplayDiagram } from '@/components/diagrams/RoleInterplayDiagram';
import { ArchitectureDiagram } from '@/components/diagrams/ArchitectureDiagram';
import { DeliverablesMatrix } from '@/components/diagrams/DeliverablesMatrix';
import { DeliverablesIndex } from '@/components/docs/DeliverablesIndex';
import { DocsReductionTable } from '@/components/docs/DocsReductionTable';
import { FolderTree } from '@/components/docs/FolderTree';
import { QuickReferenceCard } from '@/components/docs/QuickReferenceCard';
import { WorkflowFlow } from '@/components/docs/WorkflowFlow';
import { WeeklyFlow } from '@/components/docs/WeeklyFlow';
import { LabSetupGuide } from '@/components/docs/LabSetupGuide';
import { CommandTroubleshooting } from '@/components/docs/CommandTroubleshooting';
import { EvidenceGuide } from '@/components/docs/EvidenceGuide';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { getFrameworkLabel, getFrameworkDescription, getFrameworkWhy, getFrameworkColor } from '@/lib/utils';

const RHYTHM = [
  { icon: ListChecks, title: '1. Follow the steps', body: 'Work the guided steps one at a time. Each tells you what to run, what you should see, and why it matters.' },
  { icon: FileText, title: '2. Gather your evidence', body: 'Steps that produce a deliverable show the filename to save. Keep your artifacts ready for your report.' },
  { icon: ShieldCheck, title: '3. Clear the gate', body: 'Finishing a week’s required tasks moves its gate from Locked → In progress → Passed.' },
  { icon: Presentation, title: '4. Report & present', body: 'The final week compiles findings and recommendations — the deliverables a real engagement produces.' },
];

export default function CourseGuidePage() {
  const course = useCourse();
  const { member } = useMember(course.id);

  const frameworkIds = Array.from(
    new Set(course.tasks.flatMap((t) => t.frameworks))
  ).sort();

  return (
    <div className="space-y-12">
      <div className="space-y-3 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">How {course.title} Works</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">{course.description}</p>
      </div>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">The lifecycle</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {course.gates.length} gates across the engagement — clear each week&apos;s required tasks to advance.
        </p>
        <LifecycleFlow weeks={course.weeks} gates={course.gates} currentWeek={course.weeks[0]?.number} />
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">The lab architecture</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Everyone works against one small environment: an attacker workstation, the defended hosts and
          their exposed services, the SOC that watches them, and the governance layer that documents it all.
          Your role decides where on this map you operate.
        </p>
        <ArchitectureDiagram roles={course.roles} highlightRole={member?.role} />
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lab requirements &amp; setup</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Build the small VM lab you&apos;ll work against — what machines to create, how to network them, and
          how to run the DVWA target.
        </p>
        <LabSetupGuide />
      </section>

      <section id="command-help" className="scroll-mt-24 space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Running commands &amp; getting unstuck</h2>
        <p className="text-gray-600 dark:text-gray-400">
          How to use a terminal, and what to do when a command errors out — the fixes for the problems almost
          every beginner hits.
        </p>
        <CommandTroubleshooting />
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Evidence handling &amp; chain of custody</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Keep your proof on your machine and document it like a real case — naming, hashing, and a custody
          log you can download and fill in.
        </p>
        <EvidenceGuide />
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Documentation by week &amp; role</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Each role produces specific documents each week — these are your evidence for the gates and the
          final report.
        </p>
        <DeliverablesMatrix course={course} highlightRole={member?.role} />
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What you owe, and when</h2>
        <p className="text-gray-600 dark:text-gray-400">
          The whole engagement comes down to a set of <strong>graded deliverables</strong>. Here&apos;s who owns
          each one, the week it&apos;s due, and the gate it clears — and the single flow every one of them
          follows.
        </p>
        <WorkflowFlow />
        <DeliverablesIndex />
        <div className="rounded-lg border border-gray-200 bg-white px-5 dark:border-gray-700 dark:bg-gray-800">
          <Collapsible title="More reference — weekly flow, folder layout & cheat sheet" defaultOpen={false}>
            <div className="space-y-4 pb-2">
              <WeeklyFlow course={course} />
              <DocsReductionTable />
              <FolderTree />
              <QuickReferenceCard />
            </div>
          </Collapsible>
        </div>
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

      {frameworkIds.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Frameworks we use & why</h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Every task is mapped to recognized security frameworks. Tags aren’t decoration — they
              show which standard your work satisfies and how an auditor or employer would read it.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {frameworkIds.map((fw) => (
              <div key={fw} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getFrameworkColor(fw)}`}>
                    {getFrameworkLabel(fw)}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{getFrameworkDescription(fw)}</span>
                </div>
                {getFrameworkWhy(fw) && (
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{getFrameworkWhy(fw)}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col items-center gap-4 rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
        {member ? (
          <>
            <p className="text-gray-600 dark:text-gray-400">You’re enrolled. Jump back into your work.</p>
            <Link href={`/courses/${course.id}`}>
              <Button size="lg" className="flex items-center gap-2">
                Go to Course <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </>
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-400">Ready to start? Open the course to pick a team and role.</p>
            <Link href={`/courses/${course.id}`}>
              <Button size="lg" className="flex items-center gap-2">
                Open Course <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </>
        )}
      </section>
    </div>
  );
}

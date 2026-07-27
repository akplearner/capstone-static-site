'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button, Collapsible } from '@/components/ui/Button';
import { RoleIcon } from '@/components/RoleIcon';
import { LifecycleFlow } from '@/components/diagrams/LifecycleFlow';
import { RoleInterplayDiagram } from '@/components/diagrams/RoleInterplayDiagram';
import { ArchitectureDiagram } from '@/components/diagrams/ArchitectureDiagram';
import { SocTopologyDiagram } from '@/components/diagrams/SocTopologyDiagram';
import { socTopology } from '@/lib/labTopology';
import { DeliverablesMatrix } from '@/components/diagrams/DeliverablesMatrix';
import { DeliverablesIndex } from '@/components/docs/DeliverablesIndex';
import { DocsReductionTable } from '@/components/docs/DocsReductionTable';
import { FolderTree } from '@/components/docs/FolderTree';
import { QuickReferenceCard } from '@/components/docs/QuickReferenceCard';
import { WeeklyFlow } from '@/components/docs/WeeklyFlow';
import { LabSetupGuide } from '@/components/docs/LabSetupGuide';
import { CysaLabSetup } from '@/components/docs/CysaLabSetup';
import { CommandTroubleshooting } from '@/components/docs/CommandTroubleshooting';
import { EvidenceGuide } from '@/components/docs/EvidenceGuide';
import { CourseSubNav } from '@/components/CourseSubNav';
import { isEngagement, unitWord } from '@/lib/course-helpers';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { getFrameworkLabel, getFrameworkDescription, getFrameworkWhy, getFrameworkColor } from '@/lib/utils';


export default function CourseGuidePage() {
  const course = useCourse();
  const { member } = useMember(course.id);

  const frameworkIds = Array.from(
    new Set(course.tasks.flatMap((t) => t.frameworks))
  ).sort();

  return (
    <div className="space-y-12">
      <CourseSubNav courseId={course.id} active="guide" teamId={member?.teamId ?? null} />
      <div className="space-y-3 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">How {course.title} Works</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">{course.description}</p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
        <Collapsible title="The lifecycle" defaultOpen={false}>
          <div className="space-y-4 pb-2">
            <p className="text-gray-600 dark:text-gray-400">
              {course.gates.length} gates across the {isEngagement(course) ? 'engagement' : 'course'} — clear each{' '}
              {unitWord(course).toLowerCase()}&apos;s required tasks to advance.
            </p>
            <LifecycleFlow weeks={course.weeks} gates={course.gates} currentWeek={course.weeks[0]?.number} />
          </div>
        </Collapsible>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
        <Collapsible title="The lab architecture" defaultOpen={false}>
          <div className="space-y-4 pb-2">
            <p className="text-gray-600 dark:text-gray-400">
              Everyone works against one shared environment — the systems in scope, their exposed services, the
              monitoring that watches them, and the governance layer that documents it all. Your role decides
              where on this map you operate.
            </p>
            {socTopology(course.id) ? (
              <SocTopologyDiagram topo={socTopology(course.id)!} />
            ) : (
              <ArchitectureDiagram roles={course.roles} highlightRole={member?.role} />
            )}
          </div>
        </Collapsible>
      </section>

      {course.id === 'security-plus' && (
        <section className="rounded-lg border border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
          <Collapsible title="Lab requirements & setup" defaultOpen={false}>
            <div className="space-y-4 pb-2">
              <p className="text-gray-600 dark:text-gray-400">
                Build the small VM lab you&apos;ll work against — what machines to create, how to network them, and
                how to run the DVWA target.
              </p>
              <LabSetupGuide />
            </div>
          </Collapsible>
        </section>
      )}

      {course.id === 'cysa-plus' && (
        <section className="rounded-lg border border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
          <Collapsible title="Lab requirements & setup" defaultOpen={false}>
            <div className="space-y-4 pb-2">
              <p className="text-gray-600 dark:text-gray-400">
                The shared Wazuh SOC and your team&apos;s pods — what each machine is, its address, and how to
                confirm you&apos;re ready before Week 1.
              </p>
              <CysaLabSetup courseId={course.id} />
            </div>
          </Collapsible>
        </section>
      )}

      <section id="command-help" className="scroll-mt-24 space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Running commands &amp; getting unstuck</h2>
        <p className="text-gray-600 dark:text-gray-400">
          How to use a terminal, and what to do when a command errors out — the fixes for the problems almost
          every beginner hits.
        </p>
        <CommandTroubleshooting />
      </section>

      <section className="rounded-lg border border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
        <Collapsible title="Evidence handling & chain of custody" defaultOpen={false}>
          <div className="space-y-4 pb-2">
            <p className="text-gray-600 dark:text-gray-400">
              Keep your proof on your machine and document it like a real case — naming, hashing, and a custody
              log you can download and fill in.
            </p>
            <EvidenceGuide />
          </div>
        </Collapsible>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
        <Collapsible title="Documentation by week & role" defaultOpen={false}>
          <div className="space-y-4 pb-2">
            <p className="text-gray-600 dark:text-gray-400">
              Each role produces specific documents each week — these are your evidence for the gates and the
              final report.
            </p>
            <DeliverablesMatrix course={course} highlightRole={member?.role} />
          </div>
        </Collapsible>
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What you owe, and when</h2>
        <p className="text-gray-600 dark:text-gray-400">
          The whole {isEngagement(course) ? 'engagement' : 'course'} comes down to a set of{' '}
          <strong>graded deliverables</strong> — who owns each one, the {unitWord(course).toLowerCase()} it&apos;s due,
          and the gate it clears.
        </p>
        <DeliverablesIndex courseId={course.id} />
        <div className="rounded-lg border border-gray-200 bg-white px-5 dark:border-gray-700 dark:bg-gray-800">
          <Collapsible title="More reference — weekly flow, folder layout & cheat sheet" defaultOpen={false}>
            <div className="space-y-4 pb-2">
              <WeeklyFlow course={course} />
              {course.id === 'security-plus' && <DocsReductionTable />}
              <FolderTree courseId={course.id} />
              {['security-plus', 'cysa-plus', 'mssp'].includes(course.id) && (
                <QuickReferenceCard courseId={course.id} />
              )}
            </div>
          </Collapsible>
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

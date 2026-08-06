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
import { DocsReductionTable } from '@/components/docs/DocsReductionTable';
import { FolderTree } from '@/components/docs/FolderTree';
import { QuickReferenceCard } from '@/components/docs/QuickReferenceCard';
import { WeekGoals } from '@/components/docs/WeekGoals';
import { LabSetupGuide } from '@/components/docs/LabSetupGuide';
import { CysaLabSetup } from '@/components/docs/CysaLabSetup';
import { CysaToolGuide } from '@/components/docs/CysaToolGuide';
import { CommandTroubleshooting } from '@/components/docs/CommandTroubleshooting';
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

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What each week is about</h2>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            The goal of each {unitWord(course).toLowerCase()} in plain words — what you&apos;ll actually do, and why
            it matters.
          </p>
        </div>
        <WeekGoals weeks={course.weeks} />
      </section>

      <section className="rounded-lg border border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
        <Collapsible title="The lab — architecture, setup and the arc" defaultOpen={false}>
          <div className="space-y-6 pb-2">
            <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              {course.noGatekeeping
                ? `Every ${unitWord(course).toLowerCase()} is open from the start — the flow below shows the arc of the ${isEngagement(course) ? 'engagement' : 'course'}, not locks.`
                : `${course.gates.length} gates across the ${isEngagement(course) ? 'engagement' : 'course'} — clear each ${unitWord(course).toLowerCase()}'s required tasks to advance.`}
            </p>
            <LifecycleFlow
              weeks={course.weeks}
              gates={course.gates}
              currentWeek={course.weeks[0]?.number}
              noGatekeeping={course.noGatekeeping}
            />
            </div>

            <div className="space-y-4">
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

            {course.id === 'security-plus' && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Build the small VM lab you&apos;ll work against — what machines to create, how to network them, and
                how to run the DVWA target.
              </p>
              <LabSetupGuide />
            </div>
            )}

            {course.id === 'cysa-plus' && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                The shared Wazuh SOC and your team&apos;s pods — what each machine is, its address, and how to
                confirm you&apos;re ready before Week 1.
              </p>
              <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-200">
                <span className="font-semibold">Already built for you.</span> The classroom SOC is running at{' '}
                <span className="font-mono text-xs">https://10.10.100.100</span> (student / @Pass@2026). The build
                steps below are only if you&apos;re setting up your own lab at home.
              </div>
              <CysaLabSetup courseId={course.id} />
            </div>
            )}
          </div>
        </Collapsible>
      </section>

      {course.id === 'cysa-plus' && (
        <section className="rounded-lg border border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
          <Collapsible title="Week 1 — install & verify your sensors" defaultOpen={false}>
            <div className="space-y-4 pb-2">
              <p className="text-gray-600 dark:text-gray-400">
                Week 1 is about standing up the three sensors that feed the SOC. Here&apos;s what each one is, the one
                command that proves it&apos;s working, and the official guide — the step-by-step commands live in each
                role&apos;s Week-1 task.
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    tool: 'Suricata',
                    where: 'Ubuntu server',
                    what: 'Network IDS — watches your server’s traffic and raises alerts.',
                    verify: 'sudo systemctl status suricata',
                    expect: 'active (running)',
                    href: 'https://docs.suricata.io/en/latest/quickstart.html',
                    guide: 'Suricata quickstart',
                  },
                  {
                    tool: 'Sysmon',
                    where: 'Windows PC',
                    what: 'Rich Windows telemetry — process starts, network connections, file changes.',
                    verify: 'Get-Service Sysmon*',
                    expect: 'Status: Running',
                    href: 'https://learn.microsoft.com/sysinternals/downloads/sysmon',
                    guide: 'Sysmon (Sysinternals)',
                  },
                  {
                    tool: 'Wazuh agent',
                    where: 'The machine you own',
                    what: 'Ships that machine’s logs (and its Suricata or Sysmon events) to the SOC at 10.10.100.100.',
                    verify: 'Dashboard › Agents',
                    expect: 'Active, recent check-in',
                    href: 'https://documentation.wazuh.com/current/installation-guide/wazuh-agent/index.html',
                    guide: 'Wazuh agent guide',
                  },
                ].map((s) => (
                  <div key={s.tool} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{s.tool}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{s.where}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{s.what}</p>
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Verify it:</div>
                    <code className="mt-1 block rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      {s.verify}
                    </code>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Expect: <span className="font-medium text-gray-700 dark:text-gray-300">{s.expect}</span>
                    </div>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline dark:text-sky-400"
                    >
                      {s.guide} <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Want the deeper how-to — dashboard searches, Suricata rules, Sysmon event IDs? See{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">Using the tools — Wazuh, Suricata &amp; Sysmon</span> below.
              </p>
            </div>
          </Collapsible>
        </section>
      )}

      {course.id === 'cysa-plus' && (
        <section className="rounded-lg border border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
          <Collapsible title="Using the tools — Wazuh, Suricata & Sysmon" defaultOpen={false}>
            <div className="pb-2">
              <CysaToolGuide />
            </div>
          </Collapsible>
        </section>
      )}

      <section id="command-help" className="scroll-mt-24 rounded-lg border border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
        <Collapsible title="Running commands & getting unstuck" defaultOpen={false}>
          <div className="space-y-4 pb-2">
            <p className="text-gray-600 dark:text-gray-400">
              How to use a terminal, and what to do when a command errors out — the fixes for the problems almost
              every beginner hits.
            </p>
            <CommandTroubleshooting />
          </div>
        </Collapsible>
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What you owe, and when</h2>
        <p className="text-gray-600 dark:text-gray-400">
          The whole {isEngagement(course) ? 'engagement' : 'course'} comes down to a set of{' '}
          <strong>graded deliverables</strong>. Each role fills <strong>one form per week</strong>; the{' '}
          <strong>Deliverables</strong> tab lists them all with who owns each and when it is due, and the
          Overview shows how each one feeds the next.
        </p>
        <div className="rounded-lg border border-gray-200 bg-white px-5 dark:border-gray-700 dark:bg-gray-800">
          <Collapsible title="More reference — folder layout & cheat sheet" defaultOpen={false}>
            <div className="space-y-4 pb-2">
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
        <section className="rounded-lg border border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
          <Collapsible title="Frameworks we use & why" defaultOpen={false}>
          <div className="space-y-4 pb-2">
            <p className="text-gray-600 dark:text-gray-400">
              Every task is mapped to recognized security frameworks. Tags aren’t decoration — they
              show which standard your work satisfies and how an auditor or employer would read it.
            </p>
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
          </div>
          </Collapsible>
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

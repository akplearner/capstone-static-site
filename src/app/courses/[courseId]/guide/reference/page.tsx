'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CourseSubNav } from '@/components/CourseSubNav';
import { LifecycleFlow } from '@/components/diagrams/LifecycleFlow';
import { ArchitectureDiagram } from '@/components/diagrams/ArchitectureDiagram';
import { SocTopologyDiagram } from '@/components/diagrams/SocTopologyDiagram';
import { CaseLifecycleChain } from '@/components/diagrams/CaseLifecycleChain';
import { RoleInterplayDiagram } from '@/components/diagrams/RoleInterplayDiagram';
import { LogPipelineDiagram } from '@/components/diagrams/LogPipelineDiagram';
import { LabSetupGuide } from '@/components/docs/LabSetupGuide';
import { CysaLabSetup } from '@/components/docs/CysaLabSetup';
import { CysaToolGuide } from '@/components/docs/CysaToolGuide';
import { CommandTroubleshooting } from '@/components/docs/CommandTroubleshooting';
import { EvidenceGuide } from '@/components/docs/EvidenceGuide';
import { DocsReductionTable } from '@/components/docs/DocsReductionTable';
import { FolderTree } from '@/components/docs/FolderTree';
import { QuickReferenceCard } from '@/components/docs/QuickReferenceCard';
import { RoleExtractionGuide } from '@/components/docs/RoleExtractionGuide';
import { socTopology } from '@/lib/labTopology';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { getFrameworkLabel, getFrameworkDescription, getFrameworkWhy, getFrameworkColor } from '@/lib/utils';

/**
 * The course manual — everything you look up rather than read.
 *
 * This is the other half of the Guide split. The Guide used to be both an
 * orientation page and a reference manual, which made it 3,318 words behind six
 * collapsed sections on CySA+. Collapsing was never compaction: the words were
 * still there, just unfindable, and `#command-help` scroll-targeted a panel that
 * was shut.
 *
 * So the rule this page enforces: **every section renders open.** No Collapsible
 * anywhere on this route. You arrive here from a link or an anchor already knowing
 * what you want, and Ctrl-F has to work. `src/lib/page-shape.test.ts` asserts it.
 *
 * It is a nested route rather than a sixth tab on purpose — `CourseSubNav` already
 * hides two of its five tabs when you haven't joined a team, and it is sticky on
 * every screen. Growing permanent chrome to shrink two pages is a bad trade. The
 * URL says "an appendix to the Guide", and `active="guide"` keeps the parent lit.
 */

interface Section {
  id: string;
  title: string;
  blurb: string;
  body: React.ReactNode;
}

export default function CourseReferencePage() {
  const course = useCourse();
  const { member } = useMember(course.id);
  const topo = socTopology(course.id);
  const isCysa = course.id === 'cysa-plus';

  const frameworkIds = Array.from(new Set(course.tasks.flatMap((t) => t.frameworks))).sort();

  const sections: Section[] = [
    {
      id: 'lab',
      title: 'The lab',
      blurb:
        'Every machine in the environment, what runs on it, and how to confirm you can reach it before Week 1.',
      body: (
        <div className="space-y-6">
          {topo ? <SocTopologyDiagram topo={topo} /> : <ArchitectureDiagram roles={course.roles} highlightRole={member?.role} />}
          {course.id === 'security-plus' && <LabSetupGuide />}
          {isCysa && (
            <>
              {/* The build steps below are for home labs only, so say that before
                  a classroom student starts installing Wazuh by hand. */}
              <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-200">
                <span className="font-semibold">Already built for you.</span> The build steps below are only for
                students setting up their own lab at home.
              </div>
              <CysaLabSetup courseId={course.id} />
            </>
          )}
          <LifecycleFlow
            weeks={course.weeks}
            gates={course.gates}
            noGatekeeping={course.noGatekeeping}
          />
        </div>
      ),
    },
    ...(isCysa
      ? [
          {
            id: 'tools',
            title: 'Using the tools — Wazuh, Suricata & Sysmon',
            blurb:
              'What each tool is, how it is configured, and the exact searches and event IDs you reuse all course. The step-by-step commands live in each week’s task.',
            body: (
              <div className="space-y-6">
                <LogPipelineDiagram />
                <CysaToolGuide />
              </div>
            ),
          },
        ]
      : []),
    {
      id: 'terminal',
      // Keeps the historical #command-help anchor working too — see the <span id>
      // below. Unlike before, the content it lands on is open.
      title: 'Running commands & getting unstuck',
      blurb: 'How to use a terminal, and the fixes for the errors almost every beginner hits.',
      body: <CommandTroubleshooting />,
    },
    {
      id: 'evidence',
      title: 'Evidence & chain of custody',
      blurb:
        'How to name, hash, log and hand off an artifact so it would hold up under scrutiny — and a ready-to-fill custody log.',
      body: <EvidenceGuide />,
    },
    {
      id: 'forms',
      title: 'The deliverables',
      blurb: 'Every form in the course, where its content comes from, and the folder layout you submit.',
      body: (
        <div className="space-y-6">
          {member && <RoleExtractionGuide role={member.role} courseId={course.id} />}
          <FolderTree courseId={course.id} />
          {['security-plus', 'cysa-plus', 'mssp'].includes(course.id) && (
            <QuickReferenceCard courseId={course.id} />
          )}
          {course.id === 'security-plus' && <DocsReductionTable />}
        </div>
      ),
    },
    ...(course.roles.length > 1
      ? [
          {
            id: 'roles',
            title: 'How the roles hand off',
            blurb:
              'Each role works its own lane, but the week only closes when the hand-offs land. The Guide lists what each role owns; this is how the work moves between them.',
            body: (
              <div className="rounded-[var(--radius-card)] border border-line bg-panel p-5">
                <RoleInterplayDiagram roles={course.roles} highlightRole={member?.role} />
              </div>
            ),
          },
        ]
      : []),
    ...(course.lifecyclePath && course.lifecyclePath.length > 0
      ? [
          {
            id: 'lifecycle',
            title: 'The case lifecycle',
            blurb: 'The path every case follows, whatever raised it. The specific attack this course runs is on the Guide.',
            body: <CaseLifecycleChain stages={course.lifecyclePath} />,
          },
        ]
      : []),
    ...(frameworkIds.length > 0
      ? [
          {
            id: 'frameworks',
            title: 'Frameworks',
            blurb:
              'Every task is mapped to a recognized standard. The tags on a task aren’t decoration — they say how an auditor or employer would read your work.',
            body: (
              <div className="grid gap-3 md:grid-cols-2">
                {frameworkIds.map((fw) => (
                  <div key={fw} className="rounded-lg border border-line bg-panel p-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getFrameworkColor(fw)}`}>
                        {getFrameworkLabel(fw)}
                      </span>
                      <span className="text-sm text-muted">{getFrameworkDescription(fw)}</span>
                    </div>
                    {getFrameworkWhy(fw) && <p className="mt-2 text-sm text-body">{getFrameworkWhy(fw)}</p>}
                  </div>
                ))}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-8">
      <CourseSubNav courseId={course.id} active="guide" teamId={member?.teamId ?? null} />

      <header className="space-y-2">
        <Link
          href={`/courses/${course.id}/guide`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Guide
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Reference</h1>
        <p className="max-w-2xl text-muted">
          The manual for {course.title} — the lab, the tools, evidence handling and the forms. Everything here
          is open, so you can search the page.
        </p>
      </header>

      {/* The index. On a manual this earns its keep: it is how you skip to the
          one section you came for without scrolling past the others. */}
      <nav aria-label="Reference sections" className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-md border border-line bg-panel px-3 py-1.5 text-sm font-medium text-body transition-colors hover:border-accent hover:text-accent"
          >
            {s.title}
          </a>
        ))}
      </nav>

      {sections.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-16 space-y-3 border-t border-line pt-6">
          <div>
            <h2 className="text-xl font-bold text-ink">{s.title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted">{s.blurb}</p>
          </div>
          {/* The Lab access panel and older bookmarks point at #command-help; keep
              it resolving rather than silently scrolling to the top of the page. */}
          {s.id === 'terminal' && <span id="command-help" className="sr-only" />}
          {s.body}
        </section>
      ))}
    </div>
  );
}

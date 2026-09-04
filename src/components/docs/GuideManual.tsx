'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArchitectureDiagram } from '@/components/diagrams/ArchitectureDiagram';
import { SocTopologyDiagram } from '@/components/diagrams/SocTopologyDiagram';
import { ServerTopologyDiagram } from '@/components/diagrams/ServerTopologyDiagram';
import { CaseLifecycleChain } from '@/components/diagrams/CaseLifecycleChain';
import { RoleInterplayDiagram } from '@/components/diagrams/RoleInterplayDiagram';
import { LogPipelineDiagram } from '@/components/diagrams/LogPipelineDiagram';
import { DeliverableChainDiagram } from '@/components/quarry/DeliverableChain';
import { LabSetupGuide } from '@/components/docs/LabSetupGuide';
import { CysaLabSetup } from '@/components/docs/CysaLabSetup';
import { CysaToolGuide } from '@/components/docs/CysaToolGuide';
import { ServerConfigGuide } from '@/components/docs/ServerConfigGuide';
import { CommandTroubleshooting } from '@/components/docs/CommandTroubleshooting';
import { EvidenceGuide } from '@/components/docs/EvidenceGuide';
import { DocsReductionTable } from '@/components/docs/DocsReductionTable';
import { FolderTree } from '@/components/docs/FolderTree';
import { QuickReferenceCard } from '@/components/docs/QuickReferenceCard';
import { RoleExtractionGuide } from '@/components/docs/RoleExtractionGuide';
import { TeamBusinessPicker } from '@/components/TeamBusinessPicker';
import { socTopology } from '@/lib/labTopology';
import { HOST } from '@/lib/serverTopology';
import { docsRepo } from '@/lib/data';
import { useClientStore } from '@/lib/useClientStore';
import { buildDeliverableChain } from '@/lib/deliverableChain';
import { getFrameworkLabel, getFrameworkDescription, getFrameworkWhy, getFrameworkColor } from '@/lib/utils';
import type { Course, Member } from '@/lib/types';
import { Alert } from '@/components/ui/Alert';

/**
 * The course manual — everything you look up rather than read.
 *
 * This used to be its own route (`/guide/reference`), which the sub-nav showed
 * as "Guide", so a student on it could not tell where they were and a student
 * on the Guide had to find a card to get here. It renders on the Guide now,
 * below the orientation, with the same rule it always had: **every section
 * renders open.** No Collapsible anywhere in this file. You arrive from a link
 * or an anchor already knowing what you want, and Ctrl-F has to work.
 * `src/lib/page-shape.test.ts` asserts it, and holds this file to the Guide's
 * one-arc rule as well.
 *
 * Each diagram renders once per course. The build topology used to draw on the
 * Overview and again here; the week arc drew on the Guide, here, and the
 * Overview. Now: the topology is here (with the business picker that labels
 * it), the arc is `WeekGoals` on the Guide above, and the deliverable chain —
 * formerly the Team page — sits with the forms it connects.
 */

interface Section {
  id: string;
  title: string;
  blurb: string;
  body: React.ReactNode;
}

export function GuideManual({ course, member }: { course: Course; member: Member }) {
  const topo = socTopology(course.id);
  const isServerDeployment = course.id === 'server-plus';
  const isCysa = course.id === 'cysa-plus';
  const [teamBusiness, setTeamBusiness] = useState<{ name?: string; industry?: string }>({});

  // What this course actually uses, derived from its own content rather than
  // hardcoded by id. A build-and-document course has no commands at all, and
  // rendering a full terminal-troubleshooting manual for it was the single
  // biggest block of irrelevant reading on this page.
  const hasCommands = course.tasks.some((t) =>
    t.steps.some((s) => !!s.command || (s.commands?.length ?? 0) > 0)
  );

  // The deliverable chain, with filed status recomputed whenever docs change,
  // so the diagram reads as a live status board rather than a static plan.
  //
  // The server value is memoised because `useClientStore` documents that it must
  // be referentially stable — passing `buildDeliverableChain(course, {})` inline
  // rebuilt the whole chain on every render and handed React a new object each
  // time, which is exactly the case that hook's docblock warns about.
  const emptyChain = useMemo(() => buildDeliverableChain(course, {}), [course]);
  const chain = useClientStore(
    () => buildDeliverableChain(course, docsRepo.get(course.id, member.teamId) ?? {}),
    emptyChain
  );

  // A section anchor on arrival. The page renders behind a member check, so the
  // element the hash names does not exist when the browser tries to jump to it;
  // once this is mounted it does. Procedure anchors inside the config guide are
  // handled by that component, which has to select the week first.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (el && el.closest('[data-manual]')) el.scrollIntoView({ block: 'start' });
  }, []);

  const frameworkIds = Array.from(new Set(course.tasks.flatMap((t) => t.frameworks))).sort();

  const sections: Section[] = [
    {
      id: 'lab',
      title: isServerDeployment ? 'The build' : 'The lab',
      blurb: isServerDeployment
        ? `One rack-mount server on the campus LAN running a hypervisor with two zones — a DMZ for the website, a private network for the Windows server and the Linux database. Your host is ${HOST.rule} (${HOST.teamMarker} = your team number).`
        : 'Every machine in the environment, what runs on it, and how to confirm you can reach it before Week 1.',
      body: (
        <div className="space-y-6">
          {/* Three shapes, three diagrams. The generic ArchitectureDiagram draws a
              red/blue/grc attack lab and hardcodes those role ids, so it is the
              fallback only — a four-bridge deployment gets its own picture. */}
          {topo ? (
            <SocTopologyDiagram topo={topo} />
          ) : isServerDeployment ? (
            <>
              <TeamBusinessPicker courseId={course.id} teamId={member.teamId} onBusiness={setTeamBusiness} />
              <div className="rounded-[var(--radius-card)] border border-line bg-panel p-5">
                <ServerTopologyDiagram business={teamBusiness} />
              </div>
            </>
          ) : (
            <ArchitectureDiagram roles={course.roles} highlightRole={member.role} />
          )}
          {course.id === 'security-plus' && <LabSetupGuide />}
          {isCysa && (
            <>
              {/* The build steps below are for home labs only, so say that before
                  a classroom student starts installing Wazuh by hand. */}
              <Alert variant="info" title="Already built for you.">
                The build steps below are only for students setting up their own lab at home.
              </Alert>
              <CysaLabSetup courseId={course.id} />
            </>
          )}
        </div>
      ),
    },
    // Straight after the lab: that section shows what you are building, this one
    // is how you build it. Every "Exact clicks →" row on a task step lands here.
    ...(isServerDeployment
      ? [
          {
            id: 'config-guide',
            title: 'Configuration guide',
            blurb:
              'Every build procedure for the deployment, week by week — the exact commands, click-paths and BIOS keystrokes, written against this topology. The task steps say what to do; this is how.',
            body: <ServerConfigGuide />,
          },
        ]
      : []),
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
    // Only for a course that actually runs commands. `#command-help` still
    // resolves on those; a course with no CLI simply never links to it. The
    // section composes its rows from that course's own lab, so the generic
    // terminal help renders everywhere while the panel- and tool-specific fixes
    // appear only where they are true. See `CommandTroubleshooting`.
    ...(hasCommands
      ? [
          {
            id: 'terminal',
            title: 'Running commands & getting unstuck',
            blurb: 'How to use a terminal, and the fixes for the errors almost every beginner hits.',
            body: <CommandTroubleshooting courseId={course.id} />,
          },
        ]
      : []),
    {
      id: 'evidence',
      title: 'Evidence & chain of custody',
      blurb:
        'How to name, hash, log and hand off an artifact so it would hold up under scrutiny — and a ready-to-fill custody log.',
      body: <EvidenceGuide />,
    },
    {
      id: 'forms',
      title: 'The forms, and how they connect',
      blurb: 'Every form in the course, which one feeds the next, where its content comes from, and the folder layout you submit. The forms themselves are filled on the Deliverables tab.',
      body: (
        <div className="space-y-6">
          <DeliverableChainDiagram course={course} chain={chain} highlightRole={member.role} />
          <RoleExtractionGuide role={member.role} courseId={course.id} />
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
              'Each role works its own lane, but the week only closes when the hand-offs land. The strip above lists what each role owns; this is how the work moves between them.',
            body: (
              <div className="rounded-[var(--radius-card)] border border-line bg-panel p-5">
                <RoleInterplayDiagram roles={course.roles} highlightRole={member.role} />
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
            blurb: 'The path every case follows, whatever raised it. The specific attack this course runs is drawn above, under the arc.',
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
    <div data-manual className="space-y-8">
      {/* The manual's own head and index. On a manual the index earns its keep:
          it is how you skip to the one section you came for without scrolling
          past the others. Sticky under the sub-nav, so it is still the way back
          out from the bottom of the configuration guide. */}
      <div
        style={{ top: 'calc(var(--nav-h, 0px) + 3rem)' }}
        className="sticky z-20 -mx-4 space-y-2 border-b border-line bg-surface/95 px-4 py-2 backdrop-blur"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-xl font-bold text-ink">The manual</h2>
          <span className="text-sm text-muted">Look things up here. Everything is open, so search the page.</span>
        </div>
        <nav aria-label="Manual sections" className="flex flex-wrap gap-1.5">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-md border border-line bg-panel px-2.5 py-1 text-xs font-medium text-body transition-colors hover:border-accent hover:text-accent"
            >
              {s.title}
            </a>
          ))}
        </nav>
      </div>

      {sections.map((s) => (
        <section key={s.id} id={s.id} className="scroll-under-chrome space-y-3 border-t border-line pt-6">
          <div>
            <h3 className="text-lg font-bold text-ink">{s.title}</h3>
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

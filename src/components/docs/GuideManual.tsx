'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArchitectureDiagram } from '@/components/diagrams/ArchitectureDiagram';
import { SocTopologyDiagram } from '@/components/diagrams/SocTopologyDiagram';
import { ServerTopologyDiagram } from '@/components/diagrams/ServerTopologyDiagram';
import { CcnaTopologyDiagram } from '@/components/diagrams/CcnaTopologyDiagram';
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
import { TeamBusinessPicker } from '@/components/team/TeamBusinessPicker';
import { socTopology } from '@/lib/labTopology';
import { manualHas, manualSectionsFor } from '@/lib/docs/manual';
import { useCourseDocument } from '@/lib/useCourse';
import { manualOf } from '@/lib/content/read';
import { docsRepo } from '@/lib/data';
import { useClientStore } from '@/lib/useClientStore';
import { buildDeliverableChain } from '@/lib/deliverableChain';
import { getFrameworkLabel, getFrameworkDescription, getFrameworkWhy, getFrameworkColor } from '@/lib/utils';
import type { Course, Member } from '@/lib/types';
import { Alert } from '@/components/ui/Alert';
import { Surface } from '@/components/ui/Surface';

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

/**
 * The sections' titles, blurbs and course gating are content — see
 * `lib/docs/manual.ts`. What is left here is each section's BODY: which
 * diagrams and panels it composes, which is the one part of a manual section
 * that is not text.
 */

export function GuideManual({ course, member }: { course: Course; member: Member }) {
  const { MANUAL_COPY, MANUAL_SECTIONS } = manualOf(useCourseDocument());
  const topo = socTopology(course.id);
  // A course that ships a SIEM tool manual, by its own declaration rather than by
  // its id — the same test the manual's own section gating uses.
  const isCysa = manualHas(course, 'tools');
  // WHICH PICTURE this course draws is its own declaration, not an inference.
  // It used to be inferred from the configuration-guide flag, which was a
  // coincidence: the one course with a build guide happened to be the one with a
  // rack, so the second course to ship a guide would have drawn its rack.
  const picture = course.topologyPicture ?? (topo ? 'soc' : undefined);
  const [teamBusiness, setTeamBusiness] = useState<{ name?: string; industry?: string }>({});

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

  /** Each section's body, by id. The manual renders the sections this course
   *  has, in the order `manual.ts` declares, and looks each body up here. */
  const bodies: Record<string, React.ReactNode> = {
    lab: (
        <div className="space-y-6">
          {/* Three shapes, three diagrams. The generic ArchitectureDiagram draws a
              red/blue/grc attack lab and hardcodes those role ids, so it is the
              fallback only — a four-bridge deployment gets its own picture. */}
          {picture === 'soc' && topo ? (
            <SocTopologyDiagram topo={topo} />
          ) : picture === 'rack' ? (
            <>
              <TeamBusinessPicker courseId={course.id} teamId={member.teamId} onBusiness={setTeamBusiness} />
              <Surface>
                <ServerTopologyDiagram business={teamBusiness} />
              </Surface>
            </>
          ) : picture === 'campus' ? (
            <Surface>
              <CcnaTopologyDiagram />
            </Surface>
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
    'config-guide': <ServerConfigGuide />,
    // The section composes its rows from that course's own lab, so the generic
    // terminal help renders everywhere while the panel- and tool-specific fixes
    // appear only where they are true. See `CommandTroubleshooting`.
    tools: (
      <div className="space-y-6">
        <LogPipelineDiagram />
        <CysaToolGuide />
      </div>
    ),
    terminal: <CommandTroubleshooting courseId={course.id} />,
    evidence: <EvidenceGuide />,
    forms: (
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
    roles: (
      <Surface>
        <RoleInterplayDiagram roles={course.roles} highlightRole={member.role} />
      </Surface>
    ),
    lifecycle: <CaseLifecycleChain stages={course.lifecyclePath ?? []} />,
    frameworks: (
      <div className="grid gap-3 md:grid-cols-2">
        {frameworkIds.map((fw) => (
          <div key={fw} className="rounded-lg depth-edge bg-panel p-4">
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
  };

  const sections = manualSectionsFor(course, MANUAL_SECTIONS);

  return (
    <div data-manual className="space-y-8">
      {/* The manual's own head and index. On a manual the index earns its keep:
          it is how you skip to the one section you came for without scrolling
          past the others. Sticky under the sub-nav, so it is still the way back
          out from the bottom of the configuration guide. */}
      <div
        style={{ top: 'calc(var(--nav-h, 0px) + 3rem)' }}
        className="glass sticky z-20 -mx-4 space-y-2 border-b px-4 py-2"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-xl font-bold text-ink">{MANUAL_COPY.title}</h2>
          <span className="text-sm text-muted">{MANUAL_COPY.subtitle}</span>
        </div>
        <nav aria-label={MANUAL_COPY.navLabel} className="flex flex-wrap gap-1.5">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="depth-edge depth-hover rounded-md bg-panel px-2.5 py-1 text-xs font-medium text-body transition-colors hover:text-accent"
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
          {bodies[s.id]}
        </section>
      ))}
    </div>
  );
}

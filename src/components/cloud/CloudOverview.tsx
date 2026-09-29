'use client';

import { useContext } from 'react';
import { cloudOf } from '@/lib/content/read';
import { courseDocument } from '@/lib/content/docs';
import { CourseDocumentContext, useCourseDocument } from '@/lib/useCourse';
import { Collapsible } from '@/components/ui/Button';
import { KitDiagram } from '@/components/diagrams/kit/KitDiagram';
import { CloudTopology } from '@/components/diagrams/cloud/CloudTopology';
import { CloudArchitecture } from './CloudArchitecture';

/**
 * The cloud capstones' overview (R87): one paragraph, then pictures.
 *
 *   home   — before joining: what you will build (the final topology) and the
 *            weekly cycle, with the other workflows one click away.
 *   guide  — the manual's "How the company works": the five workflows, the
 *            twelve-week arc and who does what.
 *
 * Everything drawn comes from the course document (`content.cloud`).
 */
export function CloudOverview({ variant, courseId }: { variant: 'home' | 'guide'; courseId: string }) {
  const cloud = cloudOf(useCourseDocument());
  if (!cloud) return null;
  const { topology, workflows, phases, raci, block } = cloud;
  const hi = block.weeks[1];
  const cycle = workflows[workflows.length - 1];
  const platform = topology.platform === 'azure' ? 'Azure' : 'AWS';

  if (variant === 'home') {
    return (
      <section aria-labelledby="cloud-build" className="space-y-4">
        <div className="space-y-1">
          <h2 id="cloud-build" className="text-xl font-bold text-ink">
            What you’ll build in four weeks
          </h2>
          <p className="max-w-prose text-sm text-body">
            {block.intro} Four roles in {platform}, one task each a week, $5 budget.
            {hi < 12 ? ' Later courses add more — switch on ' : ' Move the week to see it grow — switch on '}
            <em>Show what comes later</em> to see it.
          </p>
        </div>
        {/* This course's last week — the picture a newcomer can read, not the whole plan. */}
        <CloudTopology topology={topology} initialWeek={hi} weekRange={block.weeks} />
        {cycle && <KitDiagram spec={cycle} courseId={courseId} />}
        <Collapsible title="How it works — four more pictures">
          <div className="space-y-4 pt-2">
            {workflows.slice(0, -1).map((w) => (
              <KitDiagram key={w.title} spec={w} courseId={courseId} />
            ))}
          </div>
        </Collapsible>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <ol className="grid gap-2 sm:grid-cols-4">
        {phases.map((p, i) => (
          <li key={p.label} data-week={[1, 5, 9, 12][i]} className="rounded-lg depth-edge border-t-2 bg-panel px-3 py-2" style={{ borderTopColor: 'var(--week)' }}>
            <span className="block text-xs font-semibold text-ink">
              {p.label} <span className="font-normal text-muted">· weeks {p.weeks}</span>
            </span>
            <span className="mt-0.5 block text-xs text-muted">{p.detail}</span>
          </li>
        ))}
      </ol>
      {workflows.map((w) => (
        <KitDiagram key={w.title} spec={w} courseId={courseId} />
      ))}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <caption className="pb-2 text-left text-xs text-muted">
            Who does what — R does it, A answers for it, C is consulted.
          </caption>
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-1 pr-3 font-medium">Activity</th>
              <th className="py-1 pr-3 font-medium">Architect</th>
              <th className="py-1 pr-3 font-medium">Infrastructure</th>
              <th className="py-1 pr-3 font-medium">App &amp; DevOps</th>
              <th className="py-1 font-medium">Security &amp; Ops</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {raci.map((r) => (
              <tr key={r.activity}>
                <td className="py-1.5 pr-3 text-body">{r.activity}</td>
                <td className="py-1.5 pr-3 font-mono text-xs">{r.arch}</td>
                <td className="py-1.5 pr-3 font-mono text-xs">{r.infra}</td>
                <td className="py-1.5 pr-3 font-mono text-xs">{r.dev}</td>
                <td className="py-1.5 font-mono text-xs">{r.secops}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The manual's "Architecture & IaC" section: the diagram and its template. */
export function CloudManualArchitecture({ initialWeek }: { initialWeek: number }) {
  const cloud = cloudOf(useCourseDocument());
  if (!cloud) return null;
  // `initialWeek` is the course's own week (0–4); the picture counts 1–12.
  const global = cloud.block.weeks[0] - 1 + initialWeek;
  return <CloudArchitecture topology={cloud.topology} iac={cloud.iac} initialWeek={global} weekRange={cloud.block.weeks} />;
}

/** A document's picture (`visual.kit === 'cloud'`): Architecture vN. */
export function CloudWeekVisual({ week, courseId }: { week?: number; courseId?: string }) {
  // The instructor's editor renders forms outside a course page, so read the
  // document from context when there is one and by id when there is not.
  const inPage = useContext(CourseDocumentContext);
  const doc = inPage ?? (courseId ? courseDocument(courseId) : undefined);
  const cloud = doc ? cloudOf(doc) : null;
  if (!cloud) return null;
  return <CloudTopology topology={cloud.topology} week={week ?? cloud.block.weeks[1]} weekRange={cloud.block.weeks} />;
}

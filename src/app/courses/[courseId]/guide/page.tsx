'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AttackPathDiagram } from '@/components/diagrams/AttackPathDiagram';
import { WeekGoals } from '@/components/docs/WeekGoals';
import { GuideManual } from '@/components/docs/GuideManual';
import { CourseSubNav } from '@/components/CourseSubNav';
import { CourseEnrolGate } from '@/components/CourseEnrolGate';
import { PageHeader } from '@/components/ui/PageHeader';
import { isEngagement, unitWord } from '@/lib/course-helpers';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { GuideSkeleton } from '@/components/ui/Skeletons';

/**
 * The Guide: a screen of orientation, then the manual.
 *
 * Orientation is the arc, the roles and what you owe — the three things a
 * student needs once. The manual (`GuideManual`) is everything they look up:
 * the lab, the configuration procedures every "Exact clicks →" step link lands
 * on, terminal help, evidence, the forms. It used to be a separate Reference
 * route that the sub-nav could not name; it renders here now, open, with its
 * own index.
 *
 * The rule that keeps this page short: **disclosure is not compaction.** There
 * is no Collapsible on this page or in the manual. `src/lib/page-shape.test.ts`
 * budgets this file's prose, asserts the one arc (`WeekGoals`), and holds the
 * manual file to the same no-Collapsible rule.
 */
export default function CourseGuidePage() {
  const course = useCourse();
  const { member, loading } = useMember(course.id);
  const unit = unitWord(course).toLowerCase();

  // Orientation is course material, so it needs enrolment — the same rule the
  // Deliverables page has always applied. Wait for hydration first, or an
  // enrolled student sees the gate flash before their own content.
  if (loading) return <GuideSkeleton />;
  if (!member) return <CourseEnrolGate courseId={course.id} what="the guide" />;

  const formCount = deliverablesForCourse(course.id).length;

  return (
    <div className="space-y-10">
      <CourseSubNav courseId={course.id} active="guide" teamId={member.teamId} />

      <PageHeader eyebrow="Guide" title={`How ${course.title} works`} lede={course.description} />

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-ink">The arc</h2>
          <p className="mt-1 text-sm text-muted">
            Where each {unit} sits. The Tasks tab shows one {unit} at a time.
          </p>
        </div>
        <WeekGoals course={course} gates={course.noGatekeeping ? undefined : course.gates} />
        {/* The attack the course actually runs. Weeks 2-4 describe this chain over
            and over in prose; this is the only place it is drawn. */}
        {course.id === 'cysa-plus' && <AttackPathDiagram />}
      </section>

      {course.roles.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-bold text-ink">The roles</h2>
            <p className="mt-1 text-sm text-muted">
              {course.roles.length} lanes against one shared environment. Your role decides where on the map
              you operate.
            </p>
          </div>
          {/* A strip, not RoleInterplayDiagram: a mission is one short line and a
              row shows it whole. The diagram draws the hand-offs, in the manual. */}
          <ul className="grid gap-2 sm:grid-cols-3">
            {course.roles.map((r) => (
              <li key={r.id} className="rounded-lg border border-line bg-panel p-3">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="font-semibold text-ink">{r.name}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{r.mission}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-ink">What you owe</h2>
        <p className="max-w-2xl text-sm text-muted">
          The {isEngagement(course) ? 'engagement' : 'course'} comes down to {formCount} graded deliverables.
          The <strong>Deliverables</strong> tab shows the ones you own for the {unit} you&apos;re on; how
          each feeds the next is drawn in the manual below.
        </p>
        <Link
          href={`/courses/${course.id}/docs`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          Open Deliverables <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <GuideManual course={course} member={member} />
    </div>
  );
}

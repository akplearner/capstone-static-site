'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { AttackPathDiagram } from '@/components/diagrams/AttackPathDiagram';
import { WeekGoals } from '@/components/docs/WeekGoals';
import { CourseSubNav } from '@/components/CourseSubNav';
import { isEngagement, unitWord } from '@/lib/course-helpers';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';

/**
 * "How this course works" — orientation, and nothing else.
 *
 * This page used to be an orientation page and a reference manual at once: on
 * CySA+ it was 3,318 words across ten screens, hidden behind six collapsed
 * sections. Four rounds of rewriting the prose didn't fix that, because the prose
 * was never the problem — the same *topics* rendered repeatedly. The sensors were
 * explained three times, the week arc twice on one page, each role's mission twice
 * inside a single two-column section.
 *
 * So the manual moved to `./reference`, and everything with a home elsewhere was
 * deleted rather than collapsed:
 *
 *   · the three sensor cards → the verify commands live in each role's Week-1 task
 *     and the tool descriptions in CysaToolGuide, both on Reference
 *   · LifecycleFlow → Reference; WeekGoals below is the one arc, and it now carries
 *     the gate chips that were LifecycleFlow's only unique contribution
 *   · RoleInterplayDiagram → Reference; at this page's width it clipped every
 *     mission it was supposed to show, so a plain row does the job in less space
 *   · CommandTroubleshooting → already renders inside every command-bearing step
 *   · the framework cards → the chips already render per task on Weekly Tasks
 *   · the "go to course" CTA → the sticky sub-nav above already does that
 *
 * The rule that keeps it this way: **disclosure is not compaction.** There is no
 * Collapsible on this page. Anything long enough to want one belongs on Reference,
 * where it renders open and Ctrl-F finds it. `src/lib/page-shape.test.ts` asserts
 * both halves of that.
 */
export default function CourseGuidePage() {
  const course = useCourse();
  const { member } = useMember(course.id);
  const unit = unitWord(course).toLowerCase();

  // The real count, not a slogan. The page used to claim "each role fills one form
  // per week", which is true for CySA+ and false for Security+, where GRC owns five
  // deliverables in Week 1 alone.
  const formCount = deliverablesForCourse(course.id).length;

  return (
    <div className="space-y-10">
      <CourseSubNav courseId={course.id} active="guide" teamId={member?.teamId ?? null} />

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-ink">How {course.title} works</h1>
        <p className="max-w-2xl text-muted">{course.description}</p>
      </header>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-ink">The arc</h2>
          <p className="mt-1 text-sm text-muted">
            {/* Explicit {' '}: JSX strips the leading whitespace of a text node that
                spans a newline, which silently glued "week" to "you're". */}
            Where each {unit} sits. The plain-words goal for the {unit}
            {' '}
            you&apos;re on is on the Weekly Tasks tab, above its tasks.
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
          {/* A strip, not RoleInterplayDiagram.
              The diagram was the plan here — it draws the hand-offs, which this
              doesn't. But rendered on a compact page it took ~470px of mostly
              empty box and clipped every mission to "Watch the alerts — decide
              what is real, what is noi…". A role's mission is one short line; a
              row shows it whole in a quarter of the height. The diagram moved to
              Reference, where it has the room to be legible. */}
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
          The <strong>Deliverables</strong> tab shows the ones you own for the {unit} you&apos;re on; the{' '}
          <strong>Team</strong> tab shows how each one feeds the next.
        </p>
        <Link
          href={`/courses/${course.id}/docs`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          Open Deliverables <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="rounded-[var(--radius-card)] border border-line bg-panel-2 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
              <BookOpen className="h-5 w-5 text-accent" /> Reference
            </h2>
            <p className="mt-1 text-sm text-muted">
              The manual: the lab and every machine in it
              {course.id === 'cysa-plus' && ', how to drive Wazuh, Suricata and Sysmon'}, terminal help and
              command fixes, evidence and chain of custody, and the full deliverable list with its folder
              layout.
            </p>
          </div>
          <Link
            href={`/courses/${course.id}/guide/reference`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-strong"
          >
            Open reference <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

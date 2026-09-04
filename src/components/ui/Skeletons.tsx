import { Skeleton } from './Spinner';

/**
 * Loading states shaped like the thing that is loading.
 *
 * Every in-course route showed the same centred spinner, and it was the wrong
 * shape twice over. First literally: the page that arrives is a header, a
 * sub-nav, a week rail and a list, and a spinner in the middle of the viewport
 * shares none of that outline, so the content does not appear — it *replaces*
 * something, and the eye has to re-find everything. Second, and worse, it was
 * dishonest about what was happening. `loading` here is not a network fetch;
 * it is hydration reading localStorage. The shell — the sub-nav, the rail, the
 * page frame — is statically known and could always have been painted on the
 * first frame. Only the student's own progress has to wait.
 *
 * So these draw the real layout in grey, at the real sizes, and the content
 * lands in place rather than shoving a spinner aside. The `Skeleton` primitive
 * they are built from already carries `motion-reduce:animate-none`.
 *
 * The rule when editing a page: if you change its top-level shape, change its
 * skeleton. A skeleton that no longer matches is worse than a spinner, because
 * it promises a layout and then delivers a different one.
 */

/** The four-tab sub-nav that sits on every in-course page. */
function SubNavSkeleton() {
  return (
    <div className="flex items-center gap-2 border-b border-line pb-2">
      {[64, 60, 92, 62].map((w, i) => (
        <Skeleton key={i} className="h-8" style={{ width: w }} />
      ))}
      <Skeleton className="ml-auto h-6 w-28" />
    </div>
  );
}

/** Eyebrow · title · lede — the PageHeader outline. */
function HeaderSkeleton({ eyebrow = true }: { eyebrow?: boolean }) {
  return (
    <div className="space-y-2">
      {eyebrow && <Skeleton className="h-3 w-16" />}
      <Skeleton className="h-8 w-64 max-w-[70%]" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
  );
}

/** The week rail: Setup + four weeks.
 *  Widths trace `WeekRail`'s real buttons — `px-3 py-1.5 text-sm` plus a dot
 *  and a label. It was a third hand-copy of that geometry before R64 unified
 *  the two live rails; it is still a copy, but now there is exactly one thing
 *  left for it to drift from. */
function WeekRailSkeleton() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {[72, 84, 84, 84, 84].map((w, i) => (
        <Skeleton key={i} className="h-8 rounded-md" style={{ width: w }} />
      ))}
    </div>
  );
}

/** One collapsed task row — number, title, meter. */
function TaskRowSkeleton() {
  return (
    <div className="stratum-task flex items-center gap-3 p-4">
      <Skeleton className="h-7 w-7 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="h-1.5 w-20 rounded-full" />
    </div>
  );
}

/**
 * The course page — Home and Tasks share this outline closely enough that one
 * skeleton serves both, and guessing wrong about which tab is about to render
 * would be a worse lie than not guessing.
 */
export function CoursePageSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading course">
      <HeaderSkeleton eyebrow={false} />
      <SubNavSkeleton />
      {/* The status strip: where you are, what is filed, what is next. */}
      <div className="flex items-center gap-6 rounded-[var(--radius-card)] border border-line bg-panel p-5">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-9 w-48 rounded-lg" />
      </div>
      <WeekRailSkeleton />
      <div className="stratum-week space-y-3 p-5">
        <Skeleton className="h-5 w-72 max-w-full" />
        {[0, 1, 2, 3].map((i) => (
          <TaskRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** The Deliverables page — week rail, then one long form. */
export function DeliverablesSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading deliverables">
      <SubNavSkeleton />
      <HeaderSkeleton />
      <WeekRailSkeleton />
      <div className="space-y-4 rounded-[var(--radius-card)] border border-line bg-panel p-6">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-3 w-full max-w-xl" />
        {/* Field rows: label above input, which is what the form actually is. */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5 pt-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** The Guide — orientation, then the manual's section index. */
export function GuideSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading guide">
      <SubNavSkeleton />
      <HeaderSkeleton />
      <div className="flex flex-wrap gap-1.5">
        {[86, 120, 104, 96, 130, 78].map((w, i) => (
          <Skeleton key={i} className="h-7 rounded-md" style={{ width: w }} />
        ))}
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="space-y-3 border-t border-line pt-6">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-3 w-full max-w-2xl" />
          <Skeleton className="h-48 w-full rounded-[var(--radius-card)]" />
        </div>
      ))}
    </div>
  );
}

/**
 * A page whose shape we do not know.
 *
 * The root `app/loading.tsx` is the fallback for the landing page, explore,
 * dashboard, portfolio, account, login and legal — genuinely different layouts
 * — so any specific outline would be a lie on six of the seven. This draws only
 * what they all share: a header and a block of content. That is less than the
 * skeletons above promise, deliberately; per the rule at the top of this file,
 * a skeleton that promises a layout and delivers a different one is worse than
 * a spinner, and this is the one case where a spinner's honesty was its only
 * virtue. Being the right SHAPE is what it gives up; being the right WEIGHT and
 * in the right place is what it keeps.
 */
export function PageSkeleton() {
  return (
    <div className="space-y-8 py-2" aria-busy="true" aria-label="Loading">
      <HeaderSkeleton />
      <Skeleton className="h-64 w-full rounded-[var(--radius-card)]" />
    </div>
  );
}

/**
 * The narrow centred card behind a passcode or a sign-in.
 *
 * `InstructorGate` resolves to one of four things, and three of them are this:
 * a round icon badge over a heading, a line of explanation, and either a form
 * or a button. The fourth is the unlocked studio, which is a passthrough to
 * arbitrary content — unguessable, and not worth guessing when the wait is an
 * auth check that resolves in a frame.
 */
export function AuthCardSkeleton() {
  return (
    <div className="mx-auto max-w-md space-y-5 py-16" aria-busy="true" aria-label="Checking access">
      <Skeleton className="mx-auto h-12 w-12 rounded-2xl" />
      <Skeleton className="mx-auto h-7 w-56" />
      <Skeleton className="mx-auto h-4 w-full max-w-sm" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

/**
 * The course editor — the one remaining spinner with a single stable shape.
 *
 * Header row (back-link over title, then a button cluster), the tab strip, then
 * a panel of form fields. The field rows are the same outline as
 * `DeliverablesSkeleton`'s, because they are the same thing: a label over an
 * input.
 */
export function EditorSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading course editor">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-64 max-w-full" />
        </div>
        <div className="flex gap-2">
          {[72, 76, 64].map((w, i) => (
            <Skeleton key={i} className="h-9 rounded-lg" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-line pb-2">
        {[68, 60, 74, 58, 66].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-md" style={{ width: w }} />
        ))}
      </div>
      <div className="max-w-xl space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

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

/** The week rail: Setup + four weeks. */
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

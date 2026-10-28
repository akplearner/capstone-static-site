'use client';

import { ConfirmDialog } from '@/components/ui/Dialog';
import { PauseCover } from '@/components/course/PauseCover';
import { SOC_LOGIN_LABEL, SOC_URL } from '@/lib/labTopology';
import type { Course } from '@/lib/types';

/**
 * The course page's overlays, mounted whatever tab is open: the home-build gate
 * for the Week-0 build task, and (R140) the pause cover that hides the course
 * content while a task is paused. Props only; the page owns the state.
 */
export function CourseOverlays({
  course,
  homeBuild,
  paused,
}: {
  course: Course;
  homeBuild: { open: boolean; onClose: () => void; onConfirm: () => void };
  /** The paused task's id and elapsed time, or null when nothing is paused. */
  paused: { taskId: string; elapsedMs: number; onResume: () => void } | null;
}) {
  return (
    <>
      {paused && (
        <PauseCover taskTitle={course.tasks.find((t) => t.id === paused.taskId)?.title ?? 'This task'} elapsedMs={paused.elapsedMs} onResume={paused.onResume} />
      )}
      <ConfirmDialog
        open={homeBuild.open}
        onClose={homeBuild.onClose}
        onConfirm={homeBuild.onConfirm}
        destructive={false}
        title="Only if you're building your own lab at home"
        message={`The classroom SOC is already built and running at ${SOC_URL} (sign in: ${SOC_LOGIN_LABEL}). You don't need these build steps — start at Week 1. Open them only if you're setting up your own lab at home.`}
        confirmLabel="Yes, I'm building from home"
        cancelLabel="Back"
      />
    </>
  );
}

import { CoursePageSkeleton } from '@/components/ui/Skeletons';

/**
 * The route-transition state for every in-course page.
 *
 * Without this the root `app/loading.tsx` applies, which is the centred
 * spinner — so clicking from the dashboard into a course replaced the whole
 * viewport with a spinner and then painted a page. The shell is known before
 * the route resolves, so draw it.
 */
export default function Loading() {
  return <CoursePageSkeleton />;
}

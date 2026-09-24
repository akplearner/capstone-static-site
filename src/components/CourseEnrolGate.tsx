'use client';

import { EmptyState } from './EmptyState';
import { SignInPanel } from './auth/SignInPanel';
import { useAuth } from '@/lib/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/**
 * What a signed-in-but-not-enrolled student sees in place of course material.
 *
 * The access model is: the course **dashboard** (`/courses/<id>`) is public so a
 * prospective student can see what they'd be enrolling in; the course
 * **material** — weekly tasks, the guide, the reference, the deliverables, the
 * team space — needs an account AND a membership row for that course.
 *
 * `lib/routeGate.ts` enforces the account half in the proxy. This is the
 * enrolment half, and it has to live in the page: the proxy would need a database
 * round trip on every navigation to know whether *this* user is on a team for
 * *this* course, which is both slow and redundant (RLS already returns a
 * non-member zero rows).
 *
 * Four surfaces render this, so the copy lives here rather than being typed out
 * four times and drifting. `what` completes "Join this course … to " — keep it a
 * short noun phrase naming the thing they were reaching for.
 *
 * Worth being precise about what this is: a **product gate, not a content
 * boundary**. Course content currently ships inside the client bundle, so this
 * hides the material from the page but does not withhold it from someone reading
 * the bundle. Moving seed content behind a server route is tracked as R37.
 */
export function CourseEnrolGate({ courseId, what }: { courseId: string; what: string }) {
  const { user, loading } = useAuth();
  // R81: with accounts on, a signed-out visitor is asked for the account first —
  // "enrol" is not something they can do yet, and the sign-in panel returns
  // them here. (The proxy already sends most deep links to /login; this is the
  // client-side render of the same rule for the tabs on the course page.)
  if (isSupabaseConfigured() && !loading && !user) {
    return (
      <div className="mx-auto max-w-md py-10">
        <SignInPanel
          title="Create an account or sign in"
          subtitle={`Your progress, gems and team are saved to your account. Sign in to open ${what}.`}
        />
      </div>
    );
  }
  return (
    <EmptyState
      title="Enrol first"
      message={`Join this course — pick a team and a role — to open ${what}.`}
      miner="idle"
      href={`/courses/${courseId}`}
      cta="Go to course"
    />
  );
}

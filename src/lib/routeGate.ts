/**
 * Which paths require an account — the server-side half of the access model.
 *
 * This is a pure module (no `next/server`, no Supabase) so the rules can be unit
 * tested directly; `src/proxy.ts` is the only caller. Same split as
 * `safeRedirect.ts`: the decision lives here, the framework plumbing lives there.
 *
 * ── The access model, in one place ──────────────────────────────────────────
 *
 *   public          `/`, `/explore`, `/login`, `/register`, `/legal/*`
 *   public          `/courses/<id>`      ← the course DASHBOARD
 *   needs account   `/courses/<id>/...`  ← the course MATERIAL
 *   needs account   `/dashboard`, `/portfolio`, `/account`, `/instructor`
 *
 * The course dashboard is deliberately public: it is how a prospective student
 * decides whether to enrol, and gating it meant nobody could see what they were
 * signing up for. Two existing contracts already said so and were being
 * contradicted by the old blanket `/courses` entry — `SUPABASE_SETUP.md`
 * ("Browsing is never gated") and `useRequireAuth` ("Reading is open; saving
 * needs an account"). Please don't "fix" it back.
 *
 * Everything *below* the dashboard is the material a student enrols for, so it
 * needs an account. Note what that does and does not mean:
 *
 *   - This file checks AUTHENTICATION only — is there a session at all. It runs
 *     in the proxy on every navigation, so it must stay free of I/O.
 *   - ENROLMENT (is this user on a team for THIS course) is checked in-page
 *     against the membership row, via `useMember` + `CourseEnrolGate`. Doing it
 *     here would put a database round trip in front of every navigation, and it
 *     would be redundant: RLS already returns zero rows to a non-member.
 *
 * Neither layer is a content boundary — course content currently ships in the
 * client bundle. Withholding it properly needs a server route, tracked as R37.
 */

/** Prefixes that require an account outright, matched exactly or as a path segment. */
const PROTECTED_PREFIXES = ['/dashboard', '/portfolio', '/account', '/instructor'];

/**
 * Anything under a course id — `/courses/<id>/<something>`.
 *
 * `[^/]+` is the course id and `/.+` is the requirement that something follows
 * it, which is what keeps the bare dashboard public. Matches `/docs`, `/guide`,
 * `/guide/reference` and `/team/<teamId>` without naming them, so a new course
 * sub-route is private by default rather than public by omission.
 */
const COURSE_MATERIAL = /^\/courses\/[^/]+\/.+/;

/** True when the path may only be viewed by a signed-in user. */
export function isProtected(pathname: string): boolean {
  // `pathname === p` or `p` followed by `/` — never a bare `startsWith`, which
  // would also catch `/dashboardxyz`.
  if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  return COURSE_MATERIAL.test(pathname);
}

# Security

Capstone Quarry is a private, proprietary project. If you have found a
security problem in the application, the database rules, the edge functions
or the deployment, please report it privately.

**How to report:** open a private security advisory on the GitHub repository
(Security → Advisories → Report a vulnerability), or contact the owner,
akplearner, directly through GitHub. Do not open a public issue and do not
post details anywhere public.

**What to include:** what you found, where (a file, a route, a table, a
function), how to reproduce it, and what you think the impact is.

**What happens next:** the owner acknowledges the report, fixes the problem
in a numbered round (see `docs/FIX_LIST.md`), re-runs the database rule tests
(`supabase/tests/rls.sql`) and the CI security job, and tells you when it has
shipped.

**What is in scope:** anything in this repository and the deployment it
describes. The lab networks the courses teach on are classroom equipment and
are out of scope.

## What the code enforces (R135)

- **Database:** row-level security on every table (`supabase/tests/rls.sql` proves it on every push); no
  self-inserted profile row; an unreviewed `reviewed` level is clamped; 50 reports and 100 support rows per
  member per day; size caps on forms, snapshots, state and notes; https-only avatars; a form write names its
  author only as the writer; trigger functions pin `search_path`.
- **Functions:** `APP_ORIGIN` required, fail closed on any other origin; 20 live candidate links, 120 stamps
  an hour, 10 report emails a day per member; a fixed email template; fixed error codes.
- **App:** strict CSP and security headers (`next.config.ts`); CSV cells cannot be formulas; sign-out clears
  cached rows, the worker cache and the deliverables outbox; sessions revoked locally, never globally.
- **CI:** read-only token, actions pinned to commits, `npm audit` on runtime dependencies and gitleaks over
  the full history on every push; Dependabot weekly.

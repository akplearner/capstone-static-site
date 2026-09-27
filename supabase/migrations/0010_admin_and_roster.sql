-- 0010_admin_and_roster.sql — two staff roles, and a roster someone can fix (R85).
--
-- WHAT THIS IS. Until now the platform had one staff flag, `is_instructor`,
-- and it did two unrelated jobs: running the class (grading, cohort dates,
-- resolving reports) AND owning the content (writing course documents). This
-- migration splits them:
--
--   instructor — runs the class: sees every student, team and submission,
--                grades, resolves reports, sets cohort dates, and can now
--                FIX THE ROSTER (move a student between teams, change their
--                role, remove them from a course).
--   admin      — owns the platform: everything an instructor can do, PLUS
--                writing course documents (the Studio: course structure,
--                deliverable definitions, reference content).
--
-- HOW ADMIN INHERITS. `public.is_instructor()` now answers true for admins
-- too (`is_instructor OR is_admin`), so every instructor policy from
-- 0001–0009 covers admins with no policy churn — one definition, not thirty
-- edits. `public.is_admin()` exists for the few places that are admin-only.
--
-- WHAT ELSE THIS FIXES. An instructor with no team membership could read only
-- their OWN profile row — so the cohort dashboard could not put a name or a
-- picture next to a single student. Instructors now read all profiles, which
-- carry a display name and an avatar URL and nothing else (grades, notes and
-- credentials live in other tables with their own rules).
--
-- Granting either flag is an operator action in the SQL Editor (documented in
-- SUPABASE_SETUP.md); students cannot set either on themselves — the 0006
-- column grant already limits their UPDATE to display_name and avatar_url,
-- and this migration re-asserts it now that a second privileged column exists.
--
-- Idempotent for the same reason as 0001–0009.

-- ── 1. The admin flag and the two helpers ───────────────────────────────────
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Re-assert the column grants (0006): request roles update ONLY the two
-- columns a person owns. `is_admin` is covered by the same revoke.
revoke update on public.profiles from anon, authenticated;
grant  update (display_name, avatar_url) on public.profiles to authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
$$;

-- Admins ARE instructors everywhere the platform asks: one definition covers
-- every instructor policy written since 0001.
create or replace function public.is_instructor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p
                 where p.id = auth.uid() and (p.is_instructor or p.is_admin))
$$;

revoke execute on function public.is_admin() from public;
grant  execute on function public.is_admin() to anon, authenticated, service_role;

-- ── 2. Instructors read every profile (name + picture, nothing else) ───────
drop policy if exists "profiles instructor read" on public.profiles;
create policy "profiles instructor read" on public.profiles for select
  using (public.is_instructor());

-- ── 3. Content belongs to admins ────────────────────────────────────────────
-- The Studio's write path. Read stays signed-in (0005); grading, reports,
-- cohorts and everything else instructors do is untouched.
drop policy if exists "course documents instructor writes" on public.course_documents;
drop policy if exists "course documents admin writes"      on public.course_documents;
create policy "course documents admin writes" on public.course_documents for all
  using (public.is_admin()) with check (public.is_admin());

-- ── 4. Instructors manage the roster ────────────────────────────────────────
-- Students still join and leave themselves ("memberships self write", 0001).
-- What was impossible was CORRECTING a roster: a student on the wrong team,
-- a wrong role, someone who left the class. Update and delete only — an
-- instructor never enrols someone who didn't sign up themselves.
drop policy if exists "memberships instructor manage" on public.memberships;
drop policy if exists "memberships instructor remove" on public.memberships;
create policy "memberships instructor manage" on public.memberships for update
  using (public.is_instructor()) with check (public.is_instructor());
create policy "memberships instructor remove" on public.memberships for delete
  using (public.is_instructor());

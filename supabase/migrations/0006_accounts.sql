-- 0006_accounts.sql — the R81 round: every student has an account, and the
-- team can see each other's progress and badges.
--
-- WHAT THIS FIXES. This schema was written without a project to run it on
-- (docs/OPERATIONS.md §0). The first time it ran on a real Postgres
-- (scripts/db-check.sh) the first team join failed:
--
--   ERROR: infinite recursion detected in policy for relation "memberships"
--
-- "memberships course read" subqueried `memberships` from inside a policy ON
-- `memberships`, and every teammate policy on the other tables subqueried
-- `memberships` too, so each of them re-entered the same policy. Postgres
-- accepts that at CREATE POLICY time and only fails at the first SELECT.
--
-- THE FIX is the standard one: the membership question is asked by a small
-- `security definer` function. It runs as the function's owner, so RLS on the
-- table it reads is not re-applied inside it, and there is nothing to recurse
-- into. Four questions cover every policy in the schema:
--
--   is_instructor()                 the caller's profile has the flag
--   shares_course(course)           the caller has a membership on the course
--   on_team(course, team)           the caller's membership is that team
--   same_team_as(other, course)     the caller and `other` share a team
--                                   (course null = on any course)
--
-- Each is STABLE (one evaluation per row set), has a fixed `search_path`
-- (so nobody can shadow `memberships` in a schema of their own), and is callable
-- by the request roles only. Every policy below is re-created to call them;
-- WHO CAN READ WHAT DOES NOT CHANGE, except for the one widening after it.
--
-- WHAT THIS WIDENS. `step_evidence` becomes readable by TEAMMATES (it was
-- owner + instructor). A task's gem rarity is derived from it — verified output
-- vs a self-attested tick, and whether it was on time — and the team page shows
-- each teammate's gems. 0003's privacy note still holds: the row carries a hash
-- and counts, never the pasted text, so a teammate learns "verified" or "ticked",
-- nothing about the machine. `lab_access`, `step_notes`, `user_course_state`,
-- `evidence_artifacts` and `user_paths` stay owner-only (+ instructor where 0004
-- said so).
--
-- WHAT THIS ADDS. `profiles.avatar_url`, and a signup trigger that reads the
-- name and picture Google and GitHub put in `raw_user_meta_data` (they use
-- different keys: Google `full_name`/`name`, GitHub `user_name`/
-- `preferred_username`; both `avatar_url`), falling back to the local part of
-- the email rather than the whole address.
--
-- The mine's "weeks already played" pointer moves into `user_course_state.data`
-- as `mineSeen` — jsonb, so no schema change.
--
-- Idempotent for the same reason as 0001–0005.

-- ── 1. The four membership questions ────────────────────────────────────────
create or replace function public.is_instructor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_instructor)
$$;

create or replace function public.shares_course(c text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.course_id = c)
$$;

create or replace function public.on_team(c text, t text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships m
                 where m.user_id = auth.uid() and m.course_id = c and m.team_id = t)
$$;

create or replace function public.same_team_as(other uuid, c text default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships me
                 join public.memberships them
                   on them.course_id = me.course_id and them.team_id = me.team_id
                 where me.user_id = auth.uid()
                   and them.user_id = other
                   and (c is null or me.course_id = c))
$$;

revoke execute on function public.is_instructor()            from public;
revoke execute on function public.shares_course(text)        from public;
revoke execute on function public.on_team(text, text)        from public;
revoke execute on function public.same_team_as(uuid, text)   from public;
grant  execute on function public.is_instructor()            to anon, authenticated, service_role;
grant  execute on function public.shares_course(text)        to anon, authenticated, service_role;
grant  execute on function public.on_team(text, text)        to anon, authenticated, service_role;
grant  execute on function public.same_team_as(uuid, text)   to anon, authenticated, service_role;

-- ── 2. Every policy that asked the membership question, re-created ──────────
-- profiles: teammates (on any course) read each other's name and picture.
drop policy if exists "profiles teammates read" on public.profiles;
create policy "profiles teammates read" on public.profiles for select
  using (public.same_team_as(id));

-- memberships: the roster is visible to everyone on the course; the instructor
-- sees every course.
drop policy if exists "memberships course read"      on public.memberships;
drop policy if exists "instructor reads memberships" on public.memberships;
create policy "memberships course read"      on public.memberships for select using (public.shares_course(course_id));
create policy "instructor reads memberships" on public.memberships for select using (public.is_instructor());

-- step_completions: teammates and the instructor read.
drop policy if exists "completions teammates read" on public.step_completions;
drop policy if exists "instructor reads completions" on public.step_completions;
create policy "completions teammates read"  on public.step_completions for select using (public.same_team_as(user_id, course_id));
create policy "instructor reads completions" on public.step_completions for select using (public.is_instructor());

-- deliverables + gate_status: the team reads and writes; the instructor reads.
drop policy if exists "deliverables team rw"          on public.deliverables;
drop policy if exists "instructor reads deliverables" on public.deliverables;
create policy "deliverables team rw" on public.deliverables for all
  using (public.on_team(course_id, team_id)) with check (public.on_team(course_id, team_id));
create policy "instructor reads deliverables" on public.deliverables for select using (public.is_instructor());

drop policy if exists "gate team rw"           on public.gate_status;
drop policy if exists "instructor reads gates" on public.gate_status;
create policy "gate team rw" on public.gate_status for all
  using (public.on_team(course_id, team_id)) with check (public.on_team(course_id, team_id));
create policy "instructor reads gates" on public.gate_status for select using (public.is_instructor());

-- step_evidence: owner writes (0003); TEAMMATES read (new); instructor reads.
drop policy if exists "step evidence team read"        on public.step_evidence;
drop policy if exists "instructor reads step evidence" on public.step_evidence;
create policy "step evidence team read"        on public.step_evidence for select using (public.same_team_as(user_id, course_id));
create policy "instructor reads step evidence" on public.step_evidence for select using (public.is_instructor());

-- evidence_artifacts: owner (0003) + instructor.
drop policy if exists "instructor reads artifacts" on public.evidence_artifacts;
create policy "instructor reads artifacts" on public.evidence_artifacts for select using (public.is_instructor());

-- deliverable_reviews: the team reads its verdicts; the instructor writes them.
drop policy if exists "reviews team read"      on public.deliverable_reviews;
drop policy if exists "reviews instructor all" on public.deliverable_reviews;
create policy "reviews team read"      on public.deliverable_reviews for select using (public.on_team(course_id, team_id));
create policy "reviews instructor all" on public.deliverable_reviews for all
  using (public.is_instructor()) with check (public.is_instructor());

-- cohorts: anyone signed in reads (0004); the instructor writes.
drop policy if exists "cohorts instructor writes" on public.cohorts;
create policy "cohorts instructor writes" on public.cohorts for all
  using (public.is_instructor()) with check (public.is_instructor());

-- step_flags: owner writes (0004); teammates and the instructor read.
drop policy if exists "step_flags team read"       on public.step_flags;
drop policy if exists "step_flags instructor read" on public.step_flags;
create policy "step_flags team read"       on public.step_flags for select using (public.same_team_as(user_id, course_id));
create policy "step_flags instructor read" on public.step_flags for select using (public.is_instructor());

-- course_documents: anyone signed in reads (0005); the instructor writes.
drop policy if exists "course documents instructor writes" on public.course_documents;
create policy "course documents instructor writes" on public.course_documents for all
  using (public.is_instructor()) with check (public.is_instructor());

-- ── 3. profiles: the picture, and a signup trigger that knows both providers ─
alter table public.profiles add column if not exists avatar_url text;

-- THE HOLE THE HARNESS FOUND. "profiles self update" (0001) lets a user update
-- their own row — and `is_instructor` is a column on that row, so any student
-- could promote themselves and read the whole class. A row policy cannot say
-- "except this column"; a column grant can. The request roles may now update
-- only the two columns a person legitimately owns. The flag is still set the
-- way SUPABASE_SETUP.md says: in the SQL editor, as the project owner.
revoke update on public.profiles from anon, authenticated;
grant  update (display_name, avatar_url) on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(meta->>'full_name', ''),           -- Google
      nullif(meta->>'name', ''),                -- Google, GitHub (when public)
      nullif(meta->>'user_name', ''),           -- GitHub login
      nullif(meta->>'preferred_username', ''),  -- GitHub login (OIDC shape)
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Student'
    ),
    nullif(meta->>'avatar_url', '')
  )
  on conflict (id) do update
    set avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

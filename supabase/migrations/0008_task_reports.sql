-- 0008_task_reports.sql — a "Report an issue" button on every task (R83).
--
-- WHAT THIS IS. A student stuck on unclear wording, a broken command, a lab
-- problem, a question, or content that no longer matches the tools can file a
-- structured report from inside the task. Teammates see that a report exists
-- (so they don't file duplicates); the instructor sees every report on the
-- cohort dashboard, grouped by task, and resolves it there.
--
-- WHO SEES WHAT. The reporter owns the row; teammates read it (same predicate
-- as step_flags — a report is about the shared work, not a private note); the
-- instructor reads everything and is the only one who can resolve. All
-- policies go through the 0006 security-definer helpers — never a subquery on
-- memberships/profiles (the recursion 0006 fixed; a page-shape guard enforces
-- this for every migration from 0006 on).
--
-- Idempotent for the same reason as 0001–0007.

create table if not exists public.task_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  task_id text not null,
  team_id text not null,
  kind text not null default 'question'
    check (kind in ('unclear', 'broken', 'environment', 'question', 'outdated')),
  note text not null default '',
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id)
);
alter table public.task_reports enable row level security;

drop policy if exists "task reports self insert"     on public.task_reports;
drop policy if exists "task reports self read"       on public.task_reports;
drop policy if exists "task reports team read"       on public.task_reports;
drop policy if exists "task reports instructor read" on public.task_reports;
drop policy if exists "task reports instructor update" on public.task_reports;

create policy "task reports self insert" on public.task_reports for insert
  with check (auth.uid() = user_id);
create policy "task reports self read" on public.task_reports for select
  using (auth.uid() = user_id);
create policy "task reports team read" on public.task_reports for select
  using (public.same_team_as(user_id, course_id));
create policy "task reports instructor read" on public.task_reports for select
  using (public.is_instructor());
-- Resolution is the instructor's verdict; the reporter withdraws by talking to
-- them, which keeps the record honest.
create policy "task reports instructor update" on public.task_reports for update
  using (public.is_instructor()) with check (public.is_instructor());

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- A filed report should reach the team's rows and the instructor's dashboard
-- without a reload.
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.task_reports';
  exception when duplicate_object then null;
  end;
end $$;

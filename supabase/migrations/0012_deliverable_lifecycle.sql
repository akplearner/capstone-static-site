-- 0012_deliverable_lifecycle.sql — the document lifecycle (R103).
--
-- WHAT THIS IS. A deliverable is a document in an organisation: one role
-- drafts it, another reviews it, a third approves it, and then it is issued
-- to whoever consumes it. This table is the team's own record of that
-- movement: one append-only row per transition (draft → in_review →
-- approved → issued, or a return to draft with a reason). The current state
-- of a form is its latest row. WHO may make which transition is decided by
-- the app from the form's RACI (src/lib/docs/lifecycle.ts); the database
-- guarantees the row is the caller's own, on the caller's own team, and
-- never rewritten.
--
-- WHO SEES WHAT. Team members insert and read their team's rows; instructors
-- and admins read every team's. NOBODY updates or deletes — history is
-- history (trigger below, the 0009 pattern). Deletes stay possible for
-- `on delete cascade` when an account is erased.
--
-- All policies use the 0006 definer helpers — never a subquery on
-- memberships/profiles (the recursion 0006 fixed; guarded).
--
-- Idempotent for the same reason as 0001–0011.

create table if not exists public.deliverable_status (
  id uuid primary key default gen_random_uuid(),
  course_id text not null,
  team_id text not null,
  deliverable_id text not null,
  status text not null check (status in ('draft', 'in_review', 'approved', 'issued')),
  changed_by uuid not null references auth.users(id) on delete cascade,
  role text not null,
  note text not null default '',
  version int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists deliverable_status_team_idx on public.deliverable_status (course_id, team_id, deliverable_id, created_at);
alter table public.deliverable_status enable row level security;

drop policy if exists "status team insert"     on public.deliverable_status;
drop policy if exists "status team read"       on public.deliverable_status;
drop policy if exists "status instructor read" on public.deliverable_status;

create policy "status team insert" on public.deliverable_status for insert
  with check (changed_by = auth.uid() and public.on_team(course_id, team_id));
create policy "status team read" on public.deliverable_status for select
  using (public.on_team(course_id, team_id));
create policy "status instructor read" on public.deliverable_status for select
  using (public.is_instructor());

-- Append-only, enforced below RLS too: a new state is a new row.
create or replace function public.forbid_status_update()
returns trigger language plpgsql as $$
begin
  raise exception 'deliverable_status is append-only — record a new transition instead';
end $$;
drop trigger if exists deliverable_status_immutable on public.deliverable_status;
create trigger deliverable_status_immutable
  before update on public.deliverable_status
  for each row execute function public.forbid_status_update();

-- Realtime: a teammate's approval or return reaches the form live.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'deliverable_status') then
    execute 'alter publication supabase_realtime add table public.deliverable_status';
  end if;
end $$;

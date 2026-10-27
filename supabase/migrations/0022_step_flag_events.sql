-- 0022_step_flag_events.sql — the stuck flag's history, append-only (R132).
--
-- WHAT THIS IS. `step_flags` holds the CURRENT flag per (member, course, task, step), overwritten on
-- every save: a member who raised a flag, got help and cleared it leaves a row that says "not stuck",
-- and nothing says they were ever stuck or that they got past it. The workforce-readiness record reads
-- problem solving from exactly that: flags raised and later cleared. So every raise and every clear
-- leaves a row here, beside the overwritten flag; the metric catalogue's `ability-independence` and
-- `ability-flags-cleared` read this table. No note text, ever: the flag was always the shareable half.
--
-- WHO CAN DO WHAT. A member inserts their OWN events and reads them; teammates read them (as they read
-- the flag); an instructor reads every row. Nobody updates or deletes by request; the account page's
-- "Reset my progress" leaves the history (it is a record, like the earned-skills ledger), and
-- deleting the account cascades it away.
--
-- Idempotent, like 0001–0021.

create table if not exists public.step_flag_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null check (char_length(course_id) between 1 and 80),
  task_id text not null check (char_length(task_id) between 1 and 120),
  step_id text not null check (char_length(step_id) between 1 and 120),
  kind text not null check (kind in ('raised', 'cleared')),
  -- the database's clock, never the client's
  at timestamptz not null default clock_timestamp()
);

create index if not exists step_flag_events_member_idx on public.step_flag_events (user_id, course_id);

alter table public.step_flag_events enable row level security;

drop policy if exists "flag events self add" on public.step_flag_events;
create policy "flag events self add" on public.step_flag_events for insert
  with check (user_id = auth.uid());

drop policy if exists "flag events read" on public.step_flag_events;
create policy "flag events read" on public.step_flag_events for select
  using (user_id = auth.uid() or public.is_instructor() or public.same_team_as(user_id, course_id));

revoke update, delete, truncate on public.step_flag_events from anon, authenticated;
revoke insert on public.step_flag_events from anon;

create or replace function public.step_flag_events_stamp() returns trigger
language plpgsql as $$
begin
  new.at := clock_timestamp();
  return new;
end $$;

drop trigger if exists step_flag_events_stamp on public.step_flag_events;
create trigger step_flag_events_stamp
  before insert on public.step_flag_events
  for each row execute function public.step_flag_events_stamp();

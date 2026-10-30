-- 0028_cohort_forward.sql — a class session is joined forward only (R150).
--
-- WHAT THIS IS. A cohort is a month ("2026-10"), and it lives inside every team id ("2026-10-t1"). A
-- student may join THIS month's session or NEXT month's, never an earlier one; and once they have been
-- in a session they may only ever move forward — leave the October team, join the November team the
-- newcomers are on, but never back. Until now the browser alone decided the cohort and the
-- "memberships self write" policy let a student write any cohort they liked. This file makes the rule
-- the database's:
--
--   membership_cohort_floor  the latest session each student has belonged to on a course, kept even
--                            after they leave (the membership row is deleted so the seat frees; the
--                            floor is what remembers). Written only by the triggers below.
--   cohort_today()           the clock, pinnable for tests (`set local app.cohort_today = '…'`).
--   membership_guard         BEFORE INSERT OR UPDATE on memberships: the cohort must prefix the team
--                            id; it must be this month or next (UTC, with a two-day grace below, because
--                            browsers compute the month in local time — the browser is the precise window,
--                            this is the backstop); an update may not move the cohort backward; an insert
--                            may not go below the floor. Staff (is_instructor) are exempt: they place and
--                            move students by hand.
--   membership_floor         BEFORE DELETE: raise the floor to the cohort being left.
--
-- Idempotent, like 0001–0027.

create table if not exists public.membership_cohort_floor (
  user_id   uuid not null references auth.users(id) on delete cascade,
  course_id text not null check (char_length(course_id) between 1 and 80),
  cohort    text not null check (cohort ~ '^[0-9]{4}-[0-9]{2}$'),
  set_at    timestamptz not null default now(),
  primary key (user_id, course_id)
);
alter table public.membership_cohort_floor enable row level security;

drop policy if exists "cohort floor self read" on public.membership_cohort_floor;
drop policy if exists "cohort floor instructor read" on public.membership_cohort_floor;
create policy "cohort floor self read" on public.membership_cohort_floor
  for select using (auth.uid() = user_id);
create policy "cohort floor instructor read" on public.membership_cohort_floor
  for select using (public.is_instructor());
-- Nobody writes it from a request: the triggers below do, as the table owner.
revoke insert, update, delete, truncate on public.membership_cohort_floor from anon, authenticated;
grant select on public.membership_cohort_floor to authenticated;

-- The clock. UTC date, or the pinned date a test sets with `set local app.cohort_today = 'YYYY-MM-DD'`.
create or replace function public.cohort_today()
returns date
language sql
stable
set search_path = public
as $$
  select coalesce(nullif(current_setting('app.cohort_today', true), '')::date, (now() at time zone 'utc')::date);
$$;

create or replace function public.membership_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := public.cohort_today();
  v_low   text := to_char(v_today - 2, 'YYYY-MM');
  v_high  text := to_char(v_today + interval '1 month', 'YYYY-MM');
  v_floor text;
  -- A role or name change inside the session they are already in touches neither the team nor the
  -- cohort: it is never a "join", so an older session's member may still edit their row.
  v_moved boolean := tg_op = 'INSERT' or new.cohort is distinct from old.cohort or new.team_id is distinct from old.team_id;
begin
  if public.is_instructor() then
    return new;
  end if;
  if v_moved and new.team_id not like new.cohort || '-%' then
    raise exception 'the cohort must prefix the team id (% / %)', new.cohort, new.team_id using errcode = '23514';
  end if;
  if (tg_op = 'INSERT' or new.cohort is distinct from old.cohort) and (new.cohort < v_low or new.cohort > v_high) then
    raise exception 'a session is joined this month or next, never earlier (% is outside %–%)', new.cohort, v_low, v_high using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and new.cohort < old.cohort then
    raise exception 'a cohort moves forward only (% → %)', old.cohort, new.cohort using errcode = '23514';
  end if;
  if tg_op = 'INSERT' then
    select cohort into v_floor from public.membership_cohort_floor where user_id = new.user_id and course_id = new.course_id;
    if v_floor is not null and new.cohort < v_floor then
      raise exception 'you left the % session; join it or a later one, not an earlier one', v_floor using errcode = '23514';
    end if;
  end if;
  insert into public.membership_cohort_floor (user_id, course_id, cohort)
    values (new.user_id, new.course_id, new.cohort)
    on conflict (user_id, course_id) do update
      set cohort = greatest(public.membership_cohort_floor.cohort, excluded.cohort), set_at = now();
  return new;
end
$$;

create or replace function public.membership_floor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.membership_cohort_floor (user_id, course_id, cohort)
    values (old.user_id, old.course_id, old.cohort)
    on conflict (user_id, course_id) do update
      set cohort = greatest(public.membership_cohort_floor.cohort, excluded.cohort), set_at = now();
  return old;
end
$$;

drop trigger if exists memberships_guard on public.memberships;
create trigger memberships_guard
  before insert or update on public.memberships
  for each row execute function public.membership_guard();

drop trigger if exists memberships_floor on public.memberships;
create trigger memberships_floor
  before delete on public.memberships
  for each row execute function public.membership_floor();

revoke all on function public.cohort_today() from public;
grant execute on function public.cohort_today() to authenticated;
revoke all on function public.membership_guard() from public;
revoke all on function public.membership_floor() from public;

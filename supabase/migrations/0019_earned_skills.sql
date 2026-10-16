-- 0019_earned_skills.sql — the earned-skills ledger: what a member has reached, kept apart from the progress it was reached with (R125).
--
-- WHAT THIS IS. The member profile is a projection over the ticks and the evidence a member has
-- NOW, so "Reset my progress" (the way to retake a course) emptied the record with it: skills
-- earned on the first run were gone the moment the second began. The rule the admin asked for is
-- the opposite one: a skill is earned the first time it is reached; a retake only adds what is
-- missing and never lowers, rewrites or re-dates what was earned.
--
-- `earned_skills` holds one row per member, dimension (skills, tools, procedures, tactics,
-- practices, standards, exam domains) and id: the highest level reached (practised < verified <
-- reviewed), the course it was first reached in, when it was first reached, when it got to its
-- level, and the steps behind that level (ids only; the words come from the course). The app lays
-- this over the live profile, so the record, the board, the PDF and a link's copy all see it.
--
-- THE RULE IS THE DATABASE'S, not the client's. A trigger enforces it for every writer:
--   * a new row is stamped with the database's clock (first_at, level_at), whatever the client sent;
--   * an update that does not RAISE the level changes nothing (the row is written back as it was),
--     so a client that tries to lower a skill, rewrite its steps or re-date it simply does not;
--   * an update that raises the level keeps who, what, where and when it was first reached
--     (user_id, dimension, skill_id, course_id, first_at) and stamps when it reached the new level.
-- That makes `insert ... on conflict do update` safe for every client, in any order.
--
-- WHO CAN DO WHAT. A member reads, adds, raises and erases their OWN rows; erasing exists so that
-- deleting an account removes the ledger too (the account page clears it with the other tables;
-- `on delete cascade` does the same when the login goes). "Reset my progress" never touches this
-- table. An instructor or admin reads every member's rows (for the cohort), writes none.
--
-- Idempotent, like 0001–0018.

create table if not exists public.earned_skills (
  user_id uuid not null references auth.users(id) on delete cascade,
  dimension text not null check (dimension in ('skills', 'tools', 'procedures', 'tactics', 'practices', 'standards', 'domains')),
  skill_id text not null check (char_length(skill_id) between 1 and 120),
  course_id text not null check (char_length(course_id) between 1 and 80),
  level text not null check (level in ('practised', 'verified', 'reviewed')),
  first_at timestamptz not null default now(),
  level_at timestamptz not null default now(),
  via jsonb not null default '[]'::jsonb check (jsonb_typeof(via) = 'array' and octet_length(via::text) <= 20000),
  primary key (user_id, dimension, skill_id)
);

create index if not exists earned_skills_course_idx on public.earned_skills (user_id, course_id);

alter table public.earned_skills enable row level security;

drop policy if exists "earned skills read" on public.earned_skills;
create policy "earned skills read" on public.earned_skills for select
  using (user_id = auth.uid() or public.is_instructor());

drop policy if exists "earned skills add own" on public.earned_skills;
create policy "earned skills add own" on public.earned_skills for insert
  with check (user_id = auth.uid());

drop policy if exists "earned skills raise own" on public.earned_skills;
create policy "earned skills raise own" on public.earned_skills for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "earned skills erase own" on public.earned_skills;
create policy "earned skills erase own" on public.earned_skills for delete
  using (user_id = auth.uid());

-- Truncate bypasses row policies and row triggers: nobody gets it from a request. The signed-out write nothing.
revoke truncate on public.earned_skills from anon, authenticated;
revoke insert, update, delete on public.earned_skills from anon;

-- ── the rule ────────────────────────────────────────────────────────────────────────────
create or replace function public.earned_skill_rank(level text) returns int
language sql immutable as $$
  select case level when 'practised' then 1 when 'verified' then 2 when 'reviewed' then 3 else 0 end
$$;

create or replace function public.earned_skills_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    -- The database's clock, never the client's.
    new.first_at := clock_timestamp();
    new.level_at := new.first_at;
    return new;
  end if;
  -- UPDATE. A level that is not higher changes nothing: not the level, the steps behind it or either time.
  if public.earned_skill_rank(new.level) <= public.earned_skill_rank(old.level) then
    return old;
  end if;
  -- A raise keeps who, what, where and when it was first reached; only the level, its time and its steps move.
  new.user_id := old.user_id;
  new.dimension := old.dimension;
  new.skill_id := old.skill_id;
  new.course_id := old.course_id;
  new.first_at := old.first_at;
  new.level_at := clock_timestamp();
  return new;
end $$;

drop trigger if exists earned_skills_guard on public.earned_skills;
create trigger earned_skills_guard
  before insert or update on public.earned_skills
  for each row execute function public.earned_skills_guard();

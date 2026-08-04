-- 0001_init.sql — accounts, roster, progress and team artifacts.
--
-- This is the schema that used to live only inside SUPABASE_SETUP.md as a block
-- to copy-paste. It is the same schema, made **idempotent** so it can be re-run
-- safely: some projects were set up by pasting the markdown by hand, and a
-- second run must be a no-op rather than an error.
--
-- Every table is row-level secured. The rules, in one sentence each:
--   profiles          — you read/write your own; teammates may read your name.
--   memberships       — you write your own; anyone on the course may read it.
--   step_completions  — you write your own; teammates may read yours.
--   deliverables      — the whole team reads and writes (shared documents).
--   gate_status       — same as deliverables.
-- Instructors may additionally read (never write) the first four.

-- ── 1. profiles (1:1 with auth.users) ────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_instructor boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles self read"      on public.profiles;
drop policy if exists "profiles self update"    on public.profiles;
drop policy if exists "profiles self insert"    on public.profiles;
drop policy if exists "profiles teammates read" on public.profiles;

create policy "profiles self read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);
-- teammates may read each other's display name
create policy "profiles teammates read" on public.profiles for select using (
  exists (select 1 from public.memberships m1
          join public.memberships m2
            on m1.course_id = m2.course_id and m1.team_id = m2.team_id
          where m1.user_id = auth.uid() and m2.user_id = profiles.id)
);

-- auto-create a profile row on signup, so the app never has to.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ── 2. memberships (roster). user_id replaces the old synthesized memberId ───
create table if not exists public.memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  team_id text not null,
  role text not null,
  display_name text not null,
  cohort text not null,
  joined_at timestamptz not null default now(),
  primary key (user_id, course_id)              -- one team per user per course
);
alter table public.memberships enable row level security;

drop policy if exists "memberships self write"  on public.memberships;
drop policy if exists "memberships course read" on public.memberships;

create policy "memberships self write" on public.memberships for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "memberships course read" on public.memberships for select using (
  exists (select 1 from public.memberships me
          where me.user_id = auth.uid() and me.course_id = memberships.course_id)
);

-- ── 3. step_completions ──────────────────────────────────────────────────────
create table if not exists public.step_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  task_id text not null,
  step_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, course_id, task_id, step_id)
);
alter table public.step_completions enable row level security;

drop policy if exists "completions self write"     on public.step_completions;
drop policy if exists "completions teammates read" on public.step_completions;

create policy "completions self write" on public.step_completions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "completions teammates read" on public.step_completions for select using (
  exists (select 1 from public.memberships me
          join public.memberships them
            on me.course_id = them.course_id and me.team_id = them.team_id
          where me.user_id = auth.uid()
            and them.user_id = step_completions.user_id
            and them.course_id = step_completions.course_id)
);

-- ── 4. deliverables (team-scoped form data) ──────────────────────────────────
create table if not exists public.deliverables (
  course_id text not null,
  team_id text not null,
  deliverable_id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (course_id, team_id, deliverable_id)
);
alter table public.deliverables enable row level security;

drop policy if exists "deliverables team rw" on public.deliverables;

create policy "deliverables team rw" on public.deliverables for all
  using (exists (select 1 from public.memberships me
                 where me.user_id = auth.uid()
                   and me.course_id = deliverables.course_id
                   and me.team_id = deliverables.team_id))
  with check (exists (select 1 from public.memberships me
                 where me.user_id = auth.uid()
                   and me.course_id = deliverables.course_id
                   and me.team_id = deliverables.team_id));

-- ── 5. gate_status (team-scoped) ─────────────────────────────────────────────
create table if not exists public.gate_status (
  course_id text not null,
  team_id text not null,
  gate_id int not null,
  status text not null check (status in ('locked','ready','passed')),
  updated_at timestamptz not null default now(),
  primary key (course_id, team_id, gate_id)
);
alter table public.gate_status enable row level security;

drop policy if exists "gate team rw" on public.gate_status;

create policy "gate team rw" on public.gate_status for all
  using (exists (select 1 from public.memberships me
                 where me.user_id = auth.uid()
                   and me.course_id = gate_status.course_id
                   and me.team_id = gate_status.team_id))
  with check (exists (select 1 from public.memberships me
                 where me.user_id = auth.uid()
                   and me.course_id = gate_status.course_id
                   and me.team_id = gate_status.team_id));

-- ── Instructor read-only access (for a future dashboard) ─────────────────────
drop policy if exists "instructor reads memberships"  on public.memberships;
drop policy if exists "instructor reads completions"  on public.step_completions;
drop policy if exists "instructor reads deliverables" on public.deliverables;

create policy "instructor reads memberships"  on public.memberships      for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_instructor));
create policy "instructor reads completions"  on public.step_completions for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_instructor));
create policy "instructor reads deliverables" on public.deliverables     for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_instructor));

-- ── Realtime: stream teammates' changes ──────────────────────────────────────
-- `add table` errors if the table is already in the publication, so each is
-- guarded. Wrapped individually so one already-added table doesn't abort the rest.
do $$
declare t text;
begin
  foreach t in array array['step_completions','deliverables','memberships','gate_status'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

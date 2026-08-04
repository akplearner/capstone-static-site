-- 0002_student_state.sql — the student data that had no cloud path.
--
-- Before this, four things lived only in localStorage, so a student who changed
-- browser or device silently lost them: where they left off, the Week-0
-- acknowledgement, their GRC registers, and their lab access details.
--
-- Each payload is already a self-contained JSON object in the app, so each table
-- stores one `data jsonb` rather than a column per field. That keeps these
-- migrations stable when a field is added to the shape later — which has
-- happened to all three at least once already.
--
-- Idempotent for the same reason as 0001.

-- ── user_course_state — resume pointer + per-course acknowledgements ─────────
-- Shape of `data`:
--   { "resume": { "week": 2, "taskId": "cb-w2", "stepId": "cb-w2-s1", "at": 172… },
--     "homeBuildAck": true }
-- Owner-only: this is a private UI pointer, of no interest to anyone else.
create table if not exists public.user_course_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);
alter table public.user_course_state enable row level security;

drop policy if exists "user state self rw" on public.user_course_state;

create policy "user state self rw" on public.user_course_state for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── grc_registers — team-scoped GRC workspace ───────────────────────────────
-- Team-shared like `deliverables`, and deliberately using the identical
-- membership-join policy so the two behave the same way.
create table if not exists public.grc_registers (
  course_id text not null,
  team_id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (course_id, team_id)
);
alter table public.grc_registers enable row level security;

drop policy if exists "grc team rw" on public.grc_registers;

create policy "grc team rw" on public.grc_registers for all
  using (exists (select 1 from public.memberships me
                 where me.user_id = auth.uid()
                   and me.course_id = grc_registers.course_id
                   and me.team_id = grc_registers.team_id))
  with check (exists (select 1 from public.memberships me
                 where me.user_id = auth.uid()
                   and me.course_id = grc_registers.course_id
                   and me.team_id = grc_registers.team_id));

-- ── lab_access — the student's own lab IPs, credentials and checklist ────────
-- Shape of `data`: { "values": {...}, "checks": {...}, "notes": "..." }
--
-- STRICTLY OWNER-ONLY. This is the one table in the schema that teammates
-- CANNOT read and that instructors CANNOT read, because the `notes` field
-- explicitly invites students to record lab passwords. There is no teammate
-- policy and no instructor policy here, and that omission is deliberate — do not
-- "make it consistent" with the tables above.
create table if not exists public.lab_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);
alter table public.lab_access enable row level security;

drop policy if exists "lab access self rw" on public.lab_access;

create policy "lab access self rw" on public.lab_access for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Only the team-shared table needs to stream: the other two are single-user, so
-- there is no second party to notify, and publishing lab_access would put
-- credentials on a realtime channel for no benefit.
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.grc_registers';
  exception when duplicate_object then null;
  end;
end $$;

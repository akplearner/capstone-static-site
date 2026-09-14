-- 0004_cohort_review_notes.sql — the R68 round: an instructor can see and
-- judge the cohort, a cohort has dates, and a student can keep notes on a step
-- and say "I'm stuck" where the team can see it.
--
-- WHAT THIS WIDENS. 0001 already lets an instructor read memberships,
-- step_completions and deliverables. The cohort dashboard also needs the
-- evidence ledger (verified-vs-self-attested is the single most useful column
-- it shows) and gate status, so those gain the same read-only policy. Reads
-- only, and 0003's privacy note still holds: the ledger carries hashes and
-- counts, never pasted text.
--
-- TWO TABLES FOR NOTES, ON PURPOSE. A student's note is private (like
-- lab_access: no teammate or instructor policy). The one bit of it teammates
-- and the instructor may see is that they are stuck. RLS is row-level, so a
-- column that must hide from teammates cannot live in a row they may read —
-- hence `step_notes` (owner-only) and `step_flags` (team + instructor read).
-- The app writes both from one save and presents one record.
--
-- Idempotent for the same reason as 0001–0003.

-- ── Instructor reads the ledger and gates ────────────────────────────────────
drop policy if exists "instructor reads step evidence" on public.step_evidence;
drop policy if exists "instructor reads artifacts"     on public.evidence_artifacts;
drop policy if exists "instructor reads gates"         on public.gate_status;

create policy "instructor reads step evidence" on public.step_evidence      for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_instructor));
create policy "instructor reads artifacts"     on public.evidence_artifacts for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_instructor));
create policy "instructor reads gates"         on public.gate_status        for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_instructor));

-- ── deliverable_reviews — one verdict per (team, form, week) ────────────────
create table if not exists public.deliverable_reviews (
  course_id text not null,
  team_id text not null,
  deliverable_id text not null,
  week int not null,
  status text not null check (status in ('approved', 'revise', 'pending')),
  comment text not null default '',
  reviewer text not null default '',
  reviewer_id uuid references auth.users(id),
  reviewed_at timestamptz not null default now(),
  primary key (course_id, team_id, deliverable_id, week)
);
alter table public.deliverable_reviews enable row level security;

drop policy if exists "reviews team read"       on public.deliverable_reviews;
drop policy if exists "reviews instructor all"  on public.deliverable_reviews;

create policy "reviews team read" on public.deliverable_reviews for select
  using (exists (select 1 from public.memberships me
                 where me.user_id = auth.uid()
                   and me.course_id = deliverable_reviews.course_id
                   and me.team_id = deliverable_reviews.team_id));
create policy "reviews instructor all" on public.deliverable_reviews for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_instructor))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_instructor));

-- ── cohorts — the one date everything is derived from ────────────────────────
create table if not exists public.cohorts (
  course_id text not null,
  cohort text not null,
  starts_on date not null,
  set_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (course_id, cohort)
);
alter table public.cohorts enable row level security;

drop policy if exists "cohorts anyone reads"     on public.cohorts;
drop policy if exists "cohorts instructor writes" on public.cohorts;

create policy "cohorts anyone reads" on public.cohorts for select using (auth.uid() is not null);
create policy "cohorts instructor writes" on public.cohorts for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_instructor))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_instructor));

-- ── step_notes — OWNER-ONLY, like lab_access ─────────────────────────────────
create table if not exists public.step_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  task_id text not null,
  step_id text not null,
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id, task_id, step_id)
);
alter table public.step_notes enable row level security;

drop policy if exists "step_notes self rw" on public.step_notes;
create policy "step_notes self rw" on public.step_notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── step_flags — the shareable half ──────────────────────────────────────────
create table if not exists public.step_flags (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  task_id text not null,
  step_id text not null,
  stuck boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id, task_id, step_id)
);
alter table public.step_flags enable row level security;

drop policy if exists "step_flags self rw"         on public.step_flags;
drop policy if exists "step_flags team read"       on public.step_flags;
drop policy if exists "step_flags instructor read" on public.step_flags;

create policy "step_flags self rw" on public.step_flags for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "step_flags team read" on public.step_flags for select
  using (exists (select 1 from public.memberships me
                 join public.memberships them on them.course_id = me.course_id and them.team_id = me.team_id
                 where me.user_id = auth.uid()
                   and them.user_id = step_flags.user_id
                   and me.course_id = step_flags.course_id));
create policy "step_flags instructor read" on public.step_flags for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_instructor));

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Reviews reach the team, flags reach the team, a cohort date reaches the class.
-- step_notes is deliberately absent: owner-only data has no second party.
do $$
declare t text;
begin
  foreach t in array array['deliverable_reviews','step_flags','cohorts'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

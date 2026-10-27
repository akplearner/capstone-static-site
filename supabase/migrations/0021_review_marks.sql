-- 0021_review_marks.sql — the instructor's marks per rubric category, kept as history (R132).
--
-- WHAT THIS IS. `deliverable_reviews` holds ONE verdict per (team, form, week), overwritten on every
-- save: a reviewer who marked a form "revise" and later "approved" leaves one row and no trace of the
-- first reading. The workforce-readiness record reads documentation quality from the reviewer's
-- judgement, so it needs the judgement per category (completeness, correctness, authenticity,
-- consistency: the four words the whole platform grades on) and it needs the history. This table is
-- that: one row per category per verdict, appended, never updated or deleted by a request.
--
-- WHO CAN DO WHAT. An instructor inserts (reviewer_id is their own id). The team reads its own rows;
-- an instructor reads every row. Nobody updates or deletes: a mark is history. The admin prunes in SQL.
--
-- Idempotent, like 0001–0020.

create table if not exists public.deliverable_review_marks (
  id uuid primary key default gen_random_uuid(),
  course_id text not null check (char_length(course_id) between 1 and 80),
  team_id text not null check (char_length(team_id) between 1 and 80),
  deliverable_id text not null check (char_length(deliverable_id) between 1 and 120),
  week int not null check (week between 0 and 52),
  category text not null check (category in ('completeness', 'correctness', 'authenticity', 'consistency')),
  ok boolean not null,
  note text not null default '' check (char_length(note) <= 2000),
  reviewer text not null default '' check (char_length(reviewer) <= 320),
  reviewer_id uuid not null references auth.users(id) on delete set null,
  -- the database's clock, never the client's
  marked_at timestamptz not null default clock_timestamp()
);

create index if not exists deliverable_review_marks_team_idx on public.deliverable_review_marks (course_id, team_id, deliverable_id, week);

alter table public.deliverable_review_marks enable row level security;

drop policy if exists "review marks team read" on public.deliverable_review_marks;
create policy "review marks team read" on public.deliverable_review_marks for select
  using (public.on_team(course_id, team_id) or public.is_instructor());

drop policy if exists "review marks instructor add" on public.deliverable_review_marks;
create policy "review marks instructor add" on public.deliverable_review_marks for insert
  with check (public.is_instructor() and reviewer_id = auth.uid());

-- A mark is history: no request updates, deletes or truncates one. The signed-out write nothing.
revoke update, delete, truncate on public.deliverable_review_marks from anon, authenticated;
revoke insert on public.deliverable_review_marks from anon;

-- The database stamps the mark, whatever the client sent.
create or replace function public.review_marks_stamp() returns trigger
language plpgsql as $$
begin
  new.marked_at := clock_timestamp();
  return new;
end $$;

drop trigger if exists review_marks_stamp on public.deliverable_review_marks;
create trigger review_marks_stamp
  before insert on public.deliverable_review_marks
  for each row execute function public.review_marks_stamp();

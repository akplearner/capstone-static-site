-- 0009_evidence_bundles.sql — immutable submissions and blind peer review (R84).
--
-- WHAT THIS IS. A team member submits a deliverable once its four rubric
-- categories are green: the submission FREEZES a snapshot (form data, the
-- validator results, the category booleans, a sha256 of the content) as an
-- append-only row. The platform then assigns the submission to two reviewers
-- from OTHER teams in the same course and cohort, chosen deterministically, who
-- answer a short binary questionnaire without ever learning whose work it is.
-- Verdicts are never stored — the app derives them (`verdictOf`) from the frozen
-- categories, the reviews, and the instructor's `deliverable_reviews` override,
-- so there is no state machine to desync.
--
-- WHO SEES WHAT.
--   deliverable_submissions — the submitting team and the instructor read;
--     anyone on the team inserts their own; NOBODY updates (trigger raises).
--     Reviewers never touch this table: they read through `get_review_packet`,
--     which strips team_id and submitted_by. Deletes have no policy — no
--     client role can delete — but stay possible for `on delete cascade` when
--     an account is erased, which an UPDATE trigger must not block.
--   peer_review_assignments — the reviewer reads their own; instructor all.
--     Writes only through `assign_peer_reviews` (security definer).
--   peer_reviews — the reviewer reads their own; instructor all. Writes only
--     through `submit_peer_review`; the primary key makes a review final.
--   The submitting team follows progress through `get_submission_progress`,
--   which returns COUNTS — never who is reviewing.
--
-- All policies use the 0006 definer helpers or same-row predicates — never a
-- subquery on memberships/profiles (the recursion 0006 fixed; guarded).
--
-- HONESTY. Same stance as 0003: the snapshot proves what was in the form and
-- what the checks said at submission time — hashes, timestamps and blind
-- review, not surveillance or cryptographic proof of who typed.
--
-- Idempotent for the same reason as 0001–0008.

create table if not exists public.deliverable_submissions (
  id uuid primary key default gen_random_uuid(),
  course_id text not null,
  team_id text not null,
  deliverable_id text not null,
  week int not null,
  version int not null default 1,
  submitted_by uuid not null references auth.users(id) on delete cascade,
  content_sha256 text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (course_id, team_id, deliverable_id, week, version)
);
alter table public.deliverable_submissions enable row level security;

drop policy if exists "submissions team insert"     on public.deliverable_submissions;
drop policy if exists "submissions team read"       on public.deliverable_submissions;
drop policy if exists "submissions instructor read" on public.deliverable_submissions;

create policy "submissions team insert" on public.deliverable_submissions for insert
  with check (submitted_by = auth.uid() and public.on_team(course_id, team_id));
create policy "submissions team read" on public.deliverable_submissions for select
  using (public.on_team(course_id, team_id));
create policy "submissions instructor read" on public.deliverable_submissions for select
  using (public.is_instructor());

-- Append-only, enforced below RLS too: even a role that could write rows
-- cannot rewrite history. A new version is a new row.
create or replace function public.forbid_submission_update()
returns trigger language plpgsql as $$
begin
  raise exception 'deliverable_submissions is append-only — submit a new version instead';
end $$;
drop trigger if exists deliverable_submissions_immutable on public.deliverable_submissions;
create trigger deliverable_submissions_immutable
  before update on public.deliverable_submissions
  for each row execute function public.forbid_submission_update();

create table if not exists public.peer_review_assignments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.deliverable_submissions(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (submission_id, reviewer_id)
);
alter table public.peer_review_assignments enable row level security;

drop policy if exists "assignments own read"        on public.peer_review_assignments;
drop policy if exists "assignments instructor read" on public.peer_review_assignments;

create policy "assignments own read" on public.peer_review_assignments for select
  using (reviewer_id = auth.uid());
create policy "assignments instructor read" on public.peer_review_assignments for select
  using (public.is_instructor());
-- No insert/update/delete policies: `assign_peer_reviews` is the only writer.

-- `submission_id` is denormalised in on purpose: the submitting team may read
-- these rows (that is how the verdict banner flips live) but must never read
-- the assignment that would name the reviewer — so the row itself has to say
-- which submission it judges, and carries no reviewer column at all.
create table if not exists public.peer_reviews (
  assignment_id uuid primary key references public.peer_review_assignments(id) on delete cascade,
  submission_id uuid not null references public.deliverable_submissions(id) on delete cascade,
  answers jsonb not null,
  confirm boolean not null,
  created_at timestamptz not null default now()
);
alter table public.peer_reviews enable row level security;

drop policy if exists "peer reviews own read"        on public.peer_reviews;
drop policy if exists "peer reviews team read"       on public.peer_reviews;
drop policy if exists "peer reviews instructor read" on public.peer_reviews;

create policy "peer reviews own read" on public.peer_reviews for select
  using (exists (select 1 from public.peer_review_assignments a
                 where a.id = assignment_id and a.reviewer_id = auth.uid()));
-- The submitting team reads the verdict rows (anonymous by construction); the
-- subquery runs under the caller's own RLS, which serves exactly their team's
-- submissions.
create policy "peer reviews team read" on public.peer_reviews for select
  using (exists (select 1 from public.deliverable_submissions s
                 where s.id = submission_id and public.on_team(s.course_id, s.team_id)));
create policy "peer reviews instructor read" on public.peer_reviews for select
  using (public.is_instructor());
-- No insert/update/delete policies: `submit_peer_review` is the only writer.

-- ── The four review verbs, as security-definer functions ────────────────────
-- The 0006 pattern: fixed search_path, revoke from public, grant to the
-- request roles. Definer, because the rows they touch are deliberately
-- unreachable by the callers' own policies (blindness cuts both ways).

-- Deterministically assign a submission to (up to) two reviewers from OTHER
-- teams of the same course and cohort — both attendance modes, ordered by
-- md5(submission || user) so the pick is stable and ungameable-by-refresh.
-- The cohort is the leading YYYY-MM of the team id (splitting on '-' would
-- return just the year). Returns how many reviewers were ELIGIBLE — fewer
-- than 2 tells the app this submission takes the platform-verdict path.
create or replace function public.assign_peer_reviews(p_submission uuid)
returns integer language plpgsql volatile security definer set search_path = public as $$
declare
  s record;
  v_cohort text;
  v_eligible integer;
begin
  select * into s from public.deliverable_submissions where id = p_submission;
  if s.id is null then
    raise exception 'no such submission';
  end if;
  if not public.on_team(s.course_id, s.team_id) then
    raise exception 'not your team''s submission';
  end if;
  v_cohort := substring(s.team_id from '^\d{4}-\d{2}');

  select count(*) into v_eligible from (
    select distinct m.user_id from public.memberships m
    where m.course_id = s.course_id
      and m.team_id <> s.team_id
      and substring(m.team_id from '^\d{4}-\d{2}') = v_cohort
  ) c;

  insert into public.peer_review_assignments (submission_id, reviewer_id)
  select p_submission, c.user_id from (
    select distinct m.user_id from public.memberships m
    where m.course_id = s.course_id
      and m.team_id <> s.team_id
      and substring(m.team_id from '^\d{4}-\d{2}') = v_cohort
  ) c
  order by md5(p_submission::text || c.user_id::text)
  limit 2
  on conflict (submission_id, reviewer_id) do nothing;

  return v_eligible;
end $$;

-- The reviewer's queue: what to review, never whose it is.
create or replace function public.get_review_queue()
returns table (assignment_id uuid, course_id text, deliverable_id text, week int,
               assigned_at timestamptz, done boolean)
language sql stable security definer set search_path = public as $$
  select a.id, s.course_id, s.deliverable_id, s.week, a.created_at,
         exists (select 1 from public.peer_reviews r where r.assignment_id = a.id)
  from public.peer_review_assignments a
  join public.deliverable_submissions s on s.id = a.submission_id
  where a.reviewer_id = auth.uid()
  order by a.created_at
$$;

-- One assignment's packet: the frozen snapshot with the identifying keys
-- stripped, and no team_id/submitted_by columns selected at all.
create or replace function public.get_review_packet(p_assignment uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'assignmentId',  a.id,
    'courseId',      s.course_id,
    'deliverableId', s.deliverable_id,
    'week',          s.week,
    'version',       s.version,
    'contentSha256', s.content_sha256,
    'snapshot',      (s.snapshot - 'teamId') - 'submittedBy',
    'submittedAt',   s.created_at
  )
  from public.peer_review_assignments a
  join public.deliverable_submissions s on s.id = a.submission_id
  where a.id = p_assignment and a.reviewer_id = auth.uid()
$$;

-- One review per assignment, by its assignee, final on insert (the pk).
create or replace function public.submit_peer_review(p_assignment uuid, p_answers jsonb, p_confirm boolean)
returns void language plpgsql volatile security definer set search_path = public as $$
declare v_submission uuid;
begin
  select a.submission_id into v_submission from public.peer_review_assignments a
    where a.id = p_assignment and a.reviewer_id = auth.uid();
  if v_submission is null then
    raise exception 'not your assignment';
  end if;
  insert into public.peer_reviews (assignment_id, submission_id, answers, confirm)
  values (p_assignment, v_submission, p_answers, p_confirm);
end $$;

-- The submitting team's (and instructor's) progress view: counts and the
-- confirm tally — never reviewer identities.
create or replace function public.get_submission_progress(p_submission uuid)
returns table (assigned integer, reviewed integer, confirms integer)
language sql stable security definer set search_path = public as $$
  select count(a.id)::int,
         count(r.assignment_id)::int,
         count(*) filter (where r.confirm)::int
  from public.deliverable_submissions s
  left join public.peer_review_assignments a on a.submission_id = s.id
  left join public.peer_reviews r on r.assignment_id = a.id
  where s.id = p_submission
    and (public.on_team(s.course_id, s.team_id) or public.is_instructor())
$$;

revoke execute on function public.assign_peer_reviews(uuid)                 from public;
revoke execute on function public.get_review_queue()                        from public;
revoke execute on function public.get_review_packet(uuid)                   from public;
revoke execute on function public.submit_peer_review(uuid, jsonb, boolean)  from public;
revoke execute on function public.get_submission_progress(uuid)             from public;
grant  execute on function public.assign_peer_reviews(uuid)                 to authenticated, service_role;
grant  execute on function public.get_review_queue()                        to authenticated, service_role;
grant  execute on function public.get_review_packet(uuid)                   to authenticated, service_role;
grant  execute on function public.submit_peer_review(uuid, jsonb, boolean)  to authenticated, service_role;
grant  execute on function public.get_submission_progress(uuid)             to authenticated, service_role;

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- A submission should reach teammates' pages, and a finished review should
-- reach the submitting team's verdict banner, without a reload.
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.deliverable_submissions';
  exception when duplicate_object then null;
  end;
  begin
    execute 'alter publication supabase_realtime add table public.peer_reviews';
  exception when duplicate_object then null;
  end;
end $$;

-- 0023_hardening.sql — the limits a public, open-sign-up platform needs (R135).
--
-- WHAT THIS IS. Two read-only audits of the schema found the row-level security sound and three
-- kinds of gap beside it: a self-promotion hole, no limits on volume or size anywhere, and a few
-- loose ends (an echoed avatar URL, a write that could name someone else as its author, trigger
-- functions without a pinned search_path, a reviewer column that blocked account deletion). Each
-- fix below is one of those, and `supabase/tests/rls.sql` proves each refusal.
--
--   1. profiles: nobody inserts their own row any more. The signup trigger (security definer) makes
--      it; a user who had no row could insert one with is_admin = true, and the column grants that
--      close the UPDATE path did not cover INSERT.
--   2. earned_skills: a `reviewed` level is clamped to `verified` unless an instructor has actually
--      approved something of the member's team in that course (deliverable_reviews or
--      deliverable_status). The ledger stays raise-only; a client cannot award itself a review.
--   3. Volume: at most 50 task reports and 100 client-error rows per user per day, counted by the
--      database. Sizes: a report note 2,000 chars, a step note 4,000, a deliverable or a submission
--      snapshot 512 KB, lab access and course state 64 KB, peer-review answers 4 KB.
--   4. client_errors: the email on a row is the account's own, read from auth.users, never the body.
--   5. profiles.avatar_url: https only, or null. Which hosts may serve it is the CSP's job.
--   6. deliverables: a write may name its author only as the writer themself.
--   7. task_reports: a report names a team the reporter is actually on.
--   8. Loose ends: review RPCs revoked from anon explicitly; every trigger function gets
--      `search_path = public`; deliverable_review_marks.reviewer_id is nullable so an instructor's
--      account can be deleted; its policy keeps requiring the inserter's own id.
--
-- Size and shape checks are added NOT VALID: rows already there are left alone, every new or
-- changed row is checked. Idempotent, like 0001–0022.

-- ── 1. profiles: the signup trigger is the only writer of a new row ─────────
drop policy if exists "profiles self insert" on public.profiles;
revoke insert on public.profiles from anon, authenticated;

-- ── 2. earned_skills: `reviewed` needs a review ──────────────────────────────
-- True when an instructor approved a form of this member's team in this course, by either
-- lifecycle (the instructor's grade in deliverable_reviews, or an approved/issued status row).
create or replace function public.team_has_review(u uuid, c text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = u and m.course_id = c
      and (exists (select 1 from public.deliverable_reviews r
                   where r.course_id = m.course_id and r.team_id = m.team_id and r.status = 'approved')
        or exists (select 1 from public.deliverable_status s
                   where s.course_id = m.course_id and s.team_id = m.team_id and s.status in ('approved', 'issued')))
  )
$$;
revoke execute on function public.team_has_review(uuid, text) from public, anon;
grant  execute on function public.team_has_review(uuid, text) to authenticated, service_role;

create or replace function public.earned_skills_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- R135: a client may claim `reviewed` only where an instructor has reviewed; otherwise it is `verified`.
  if new.level = 'reviewed' and not public.team_has_review(new.user_id, new.course_id) then
    new.level := 'verified';
  end if;
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

-- ── 3. Volume and size ───────────────────────────────────────────────────────
-- One helper adds a check constraint once, NOT VALID, so re-running this file is a no-op.
create or replace function public.add_check_once(tbl regclass, cname text, expr text)
returns void language plpgsql as $$
begin
  if not exists (select 1 from pg_constraint where conrelid = tbl and conname = cname) then
    execute format('alter table %s add constraint %I check (%s) not valid', tbl, cname, expr);
  end if;
end $$;
revoke execute on function public.add_check_once(regclass, text, text) from public, anon, authenticated;

select public.add_check_once('public.task_reports',            'task_reports_note_len',            'char_length(note) <= 2000');
select public.add_check_once('public.step_notes',              'step_notes_note_len',              'char_length(note) <= 4000');
select public.add_check_once('public.deliverables',            'deliverables_data_size',           'pg_column_size(data) <= 524288');
select public.add_check_once('public.deliverable_submissions', 'deliverable_submissions_snapshot_size', 'pg_column_size(snapshot) <= 524288');
select public.add_check_once('public.lab_access',              'lab_access_data_size',             'pg_column_size(data) <= 65536');
select public.add_check_once('public.user_course_state',       'user_course_state_data_size',      'pg_column_size(data) <= 65536');
select public.add_check_once('public.peer_reviews',            'peer_reviews_answers_size',        'pg_column_size(answers) <= 4096');

-- Per-user daily caps. Counted as the function's owner so a row policy cannot hide rows from the
-- count; raised as a check violation (23514) so the client can tell it from a permission refusal.
create or replace function public.task_reports_cap() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.task_reports
      where user_id = new.user_id and created_at > clock_timestamp() - interval '1 day') >= 50 then
    raise exception 'task_reports: at most 50 reports per day' using errcode = 'check_violation';
  end if;
  return new;
end $$;
drop trigger if exists task_reports_cap on public.task_reports;
create trigger task_reports_cap
  before insert on public.task_reports
  for each row execute function public.task_reports_cap();

-- ── 4. client_errors: the email is the account's own ────────────────────────
create or replace function public.client_errors_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.client_errors
      where user_id = new.user_id and occurred_at > clock_timestamp() - interval '1 day') >= 100 then
    raise exception 'client_errors: at most 100 rows per day' using errcode = 'check_violation';
  end if;
  new.occurred_at := clock_timestamp();
  new.user_email := (select email from auth.users where id = new.user_id);
  return new;
end $$;
drop trigger if exists client_errors_guard on public.client_errors;
create trigger client_errors_guard
  before insert on public.client_errors
  for each row execute function public.client_errors_guard();

-- ── 5. avatars: https or nothing ─────────────────────────────────────────────
select public.add_check_once('public.profiles', 'profiles_avatar_https', $c$avatar_url is null or (avatar_url ~ '^https://[^[:space:]]+$' and char_length(avatar_url) <= 2000)$c$);

-- ── 6. deliverables: the author named is the writer ──────────────────────────
drop policy if exists "deliverables team rw" on public.deliverables;
create policy "deliverables team rw" on public.deliverables for all
  using (public.on_team(course_id, team_id))
  with check (public.on_team(course_id, team_id) and (updated_by is null or updated_by = auth.uid()));

-- ── 7. task_reports: the team named is the reporter's ───────────────────────
drop policy if exists "task reports self insert" on public.task_reports;
create policy "task reports self insert" on public.task_reports for insert
  with check (
    auth.uid() = user_id
    and public.on_team(course_id, team_id)
    -- 0016's conditions, kept: a student files an OPEN report with no resolution.
    and status = 'open'
    and resolution_note = ''
    and fix_revision is null
    and resolved_at is null
    and resolved_by is null
  );

-- ── 8. Loose ends ────────────────────────────────────────────────────────────
revoke execute on function public.assign_peer_reviews(uuid)                 from anon;
revoke execute on function public.get_review_queue()                        from anon;
revoke execute on function public.get_review_packet(uuid)                   from anon;
revoke execute on function public.submit_peer_review(uuid, jsonb, boolean)  from anon;
revoke execute on function public.get_submission_progress(uuid)             from anon;

alter function public.forbid_submission_update()               set search_path = public;
alter function public.forbid_status_update()                   set search_path = public;
alter function public.forbid_consent_update()                  set search_path = public;
alter function public.forbid_outcome_update()                  set search_path = public;
alter function public.forbid_receipt_update()                  set search_path = public;
alter function public.forbid_rehash_update()                   set search_path = public;
alter function public.guard_share_update()                     set search_path = public;
alter function public.freeze_task_report()                     set search_path = public;
alter function public.content_fix_before_insert()              set search_path = public;
alter function public.content_fix_forbid_rewrite()             set search_path = public;
alter function public.course_document_version_forbid_rewrite() set search_path = public;
alter function public.review_marks_stamp()                     set search_path = public;
alter function public.step_flag_events_stamp()                 set search_path = public;

alter table public.deliverable_review_marks alter column reviewer_id drop not null;

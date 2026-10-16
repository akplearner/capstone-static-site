-- 0016_report_context.sql — a report says where it is, who filed it and which version they saw (R120).
--
-- WHAT THIS IS. A report held a task and a kind. The admin working the queue also
-- needs the STEP, the week, who filed it and in what role, and which version of the
-- course the student was looking at — and needs to follow a report from filed to
-- fixed. So the row gains:
--   step_id, week         where (the week is the task's, as filed)
--   reporter_name, _role  who, as filed (a roster can move later; the record does not)
--   content_version       the course version the reporter saw, e.g. '1.7'
--   resolution_note       what the instructor told the reporter
--   fix_revision          the content fix that resolved it (R121)
-- and `status` gains 'in_progress' and 'wont_fix' beside 'open' and 'resolved'.
--
-- WHO CAN DO WHAT. Unchanged (0008) except two tightenings. A student can only FILE
-- an open report — closing one is the instructor's act. And who, what, when and which
-- version are frozen by the trigger below: after filing, only the status and the
-- resolution may change, for staff as for anyone. (To correct a snapshot by hand, an
-- operator disables `task_reports_frozen` in the SQL Editor for that one statement.)
--
-- Every new column is nullable or defaulted, so a row filed before this migration
-- reads exactly as it did; the app tells the reader "not recorded" for those.
--
-- Idempotent for the same reason as 0001–0015.

alter table public.task_reports
  add column if not exists step_id text,
  add column if not exists week int,
  add column if not exists reporter_name text not null default '',
  add column if not exists reporter_role text not null default '',
  add column if not exists content_version text not null default '',
  add column if not exists resolution_note text not null default '',
  add column if not exists fix_revision int;

alter table public.task_reports drop constraint if exists task_reports_status_check;
alter table public.task_reports
  add constraint task_reports_status_check check (status in ('open', 'in_progress', 'resolved', 'wont_fix'));

-- The inbox reads by course, then by status, newest first.
create index if not exists task_reports_course_status_idx
  on public.task_reports (course_id, status, created_at desc);

-- ── A student files an OPEN report ───────────────────────────────────────────
drop policy if exists "task reports self insert" on public.task_reports;
create policy "task reports self insert" on public.task_reports for insert
  with check (
    auth.uid() = user_id
    and status = 'open'
    and resolution_note = ''
    and fix_revision is null
    and resolved_at is null
    and resolved_by is null
  );

-- ── Who, what, when and which version: frozen ────────────────────────────────
create or replace function public.freeze_task_report()
returns trigger language plpgsql as $$
begin
  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.course_id is distinct from old.course_id
     or new.task_id is distinct from old.task_id
     or new.team_id is distinct from old.team_id
     or new.kind is distinct from old.kind
     or new.note is distinct from old.note
     or new.created_at is distinct from old.created_at
     or new.step_id is distinct from old.step_id
     or new.week is distinct from old.week
     or new.reporter_name is distinct from old.reporter_name
     or new.reporter_role is distinct from old.reporter_role
     or new.content_version is distinct from old.content_version
  then
    raise exception 'task_reports identity is frozen — only the status and the resolution may change';
  end if;
  return new;
end $$;
drop trigger if exists task_reports_frozen on public.task_reports;
create trigger task_reports_frozen
  before update on public.task_reports
  for each row execute function public.freeze_task_report();

-- 0026_validation_answers.sql — the answers to the validation activities, append-only (R140).
--
-- WHAT THIS IS. From the middle graded week on, the course asks each member about what THEIR TEAM
-- recorded earlier: recall a value (the address, the VLAN, the port, the size, the decision), explain
-- why it was chosen, apply it in a scenario built from the record, or resolve a conflict the record
-- found. The activities are generated in the browser from the team's own forms (the project record,
-- R139); this table keeps every answer. The answer travels as a hash — the record is never written
-- here — and an explanation is the only free text. A retry is a second row; nothing is rewritten.
-- The Understanding score and the Validation KPI family read this table.
--
-- WHO CAN DO WHAT. A member inserts their OWN answers (the row names the writer; the stamp is the
-- database's); the team reads the team's; an instructor reads every row. At most 200 rows per member
-- per day. Nobody updates or deletes; "Reset my progress" leaves it (it is a record, like the earned
-- ledger); deleting the account cascades it away.
--
-- Idempotent, like 0001–0025.

create table if not exists public.validation_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null check (char_length(course_id) between 1 and 80),
  team_id text not null check (char_length(team_id) between 1 and 80),
  activity_id text not null check (char_length(activity_id) between 1 and 300),
  checkpoint integer not null check (checkpoint between 0 and 52),
  kind text not null check (kind in ('recall', 'apply', 'explain', 'consistency')),
  record_key text not null check (char_length(record_key) between 1 and 240),
  answer_sha256 text not null check (answer_sha256 ~ '^[0-9a-f]{64}$'),
  -- null for an explanation until an instructor marks it (R141)
  correct boolean,
  explanation text not null default '' check (char_length(explanation) <= 2000),
  -- the database's clock, never the client's
  at timestamptz not null default clock_timestamp()
);

create index if not exists validation_answers_member_idx on public.validation_answers (user_id, course_id);
create index if not exists validation_answers_team_idx on public.validation_answers (course_id, team_id);

alter table public.validation_answers enable row level security;

drop policy if exists "validation answers self add" on public.validation_answers;
create policy "validation answers self add" on public.validation_answers for insert
  with check (user_id = auth.uid() and public.on_team(course_id, team_id));

drop policy if exists "validation answers read" on public.validation_answers;
create policy "validation answers read" on public.validation_answers for select
  using (user_id = auth.uid() or public.is_instructor() or public.on_team(course_id, team_id));

revoke update, delete, truncate on public.validation_answers from anon, authenticated;
revoke insert, select on public.validation_answers from anon;

create or replace function public.validation_answers_stamp() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.validation_answers
      where user_id = new.user_id and at > clock_timestamp() - interval '1 day') >= 200 then
    raise exception 'validation_answers: at most 200 answers per day' using errcode = 'check_violation';
  end if;
  new.at := clock_timestamp();
  return new;
end $$;

drop trigger if exists validation_answers_stamp on public.validation_answers;
create trigger validation_answers_stamp
  before insert on public.validation_answers
  for each row execute function public.validation_answers_stamp();

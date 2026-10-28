-- 0025_deliverable_history.sql — what a team's form held before, append-only (R139).
--
-- WHAT THIS IS. `deliverables` holds the CURRENT version of each team form, overwritten on every save.
-- The project record (the addresses, prefixes, ports, sizes, rules, accounts and decisions a team
-- actually recorded) is read out of those forms, and a later week asks the team about values they
-- recorded earlier — so the earlier values have to still exist. Every time a form's data changes,
-- the row it is replacing is copied here: the previous data, who had saved it and when, who
-- replaced it, and the database's own clock for when.
--
-- A version is a sitting, not a keystroke: the autosave writes often, so a second change by the
-- SAME author within five minutes of the last version of that form is not recorded (the version
-- at the start of the sitting is). A change by a different author always is. At most 500 versions
-- per team per day; past that the current form still saves and the history stops for the day.
--
-- WHO CAN DO WHAT. Only the trigger writes (it runs as the owner, so no insert policy exists for
-- anyone). Members of the team read their team's history; an instructor reads every team's.
-- Nobody updates or deletes; "Reset my progress" leaves it; deleting the team's forms leaves it
-- (the record of a project outlives the project); deleting an account nulls the author columns.
--
-- Idempotent, like 0001–0024.

create table if not exists public.deliverable_history (
  id bigint generated always as identity primary key,
  course_id text not null check (char_length(course_id) between 1 and 80),
  team_id text not null check (char_length(team_id) between 1 and 80),
  deliverable_id text not null check (char_length(deliverable_id) between 1 and 120),
  -- the data as it stood BEFORE the change
  data jsonb not null,
  -- who had saved that version and when (deliverables.updated_by / updated_at of the replaced row)
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null,
  -- who replaced it (deliverables.updated_by of the new row), and the database's clock
  replaced_by uuid references auth.users(id) on delete set null,
  at timestamptz not null default clock_timestamp(),
  constraint deliverable_history_size check (pg_column_size(data) <= 524288)
);

create index if not exists deliverable_history_team_idx on public.deliverable_history (course_id, team_id, at desc);
create index if not exists deliverable_history_form_idx on public.deliverable_history (course_id, team_id, deliverable_id, at desc);

alter table public.deliverable_history enable row level security;

drop policy if exists "deliverable history read" on public.deliverable_history;
create policy "deliverable history read" on public.deliverable_history for select
  using (public.is_instructor() or public.on_team(course_id, team_id));

-- No insert, update or delete for anyone through the API: the trigger below is the only writer.
revoke insert, update, delete, truncate on public.deliverable_history from anon, authenticated;
revoke select on public.deliverable_history from anon;

create or replace function public.deliverables_keep_history() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  last_at timestamptz;
  last_by uuid;
begin
  if old.data is not distinct from new.data then
    return new;
  end if;
  select h.at, h.replaced_by into last_at, last_by
    from public.deliverable_history h
    where h.course_id = old.course_id and h.team_id = old.team_id and h.deliverable_id = old.deliverable_id
    order by h.at desc limit 1;
  -- the same author, within the sitting: the version at the start of the sitting stands
  if last_at is not null and last_by is not distinct from new.updated_by and last_at > clock_timestamp() - interval '5 minutes' then
    return new;
  end if;
  if (select count(*) from public.deliverable_history h
      where h.course_id = old.course_id and h.team_id = old.team_id and h.at > clock_timestamp() - interval '1 day') >= 500 then
    raise notice 'deliverable_history: 500 versions today for % %; this change is not recorded', old.course_id, old.team_id;
    return new;
  end if;
  insert into public.deliverable_history (course_id, team_id, deliverable_id, data, updated_by, updated_at, replaced_by, at)
    values (old.course_id, old.team_id, old.deliverable_id, old.data, old.updated_by, old.updated_at, new.updated_by, clock_timestamp());
  return new;
end $$;

drop trigger if exists deliverables_keep_history on public.deliverables;
create trigger deliverables_keep_history
  before update on public.deliverables
  for each row execute function public.deliverables_keep_history();

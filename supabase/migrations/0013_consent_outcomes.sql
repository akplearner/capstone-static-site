-- 0013_consent_outcomes.sql — the text hash on acknowledgements, consent
-- grants, and the consented learner outcomes (R110).
--
-- WHAT THIS IS. Three small additions to the member's own record:
--
--   1. agreement_acceptances.text_sha256 — the SHA-256 of the agreement text
--      (its sections) a person accepted, beside the version, so the log says
--      exactly which words were agreed to even if a version is ever re-edited.
--      Nullable: rows from before R110 carry no hash.
--
--   2. consent_grants — one append-only row per change to one of three grants
--      ('share-employer', 'benchmark', 'outcome'): granted true or false, and
--      when. The latest row per grant is the current answer. Nothing about a
--      member reaches a third party unless a grant allows it; every grant is
--      off until the member turns it on, and revoking is a new row, never an
--      edit. There is deliberately no 'train' grant: the Terms say content is
--      never used to train models.
--
--   3. learner_outcomes — the member's own answers to "where did the work take
--      you" (status, role title, employer, start month, which courses were used
--      at work), appended each time they are saved; the latest row is current.
--      The employer name is visible to the member alone. Instructors read only
--      COUNTS PER STATUS for a course, through outcome_counts(), and only when
--      at least five members of that course with the outcome grant have
--      answered — the k floor lives in SQL, not in the app.
--
-- WHO SEES WHAT. A person inserts and reads their own consent and outcome
-- rows. Nobody updates or deletes either table (no policies; append-only
-- triggers, the 0009 pattern). No instructor read policy on either: the only
-- aggregate is the function, and it names nobody.
--
-- All policies use auth.uid() on the row's own user_id; the functions are
-- security definers that go through memberships themselves — never a policy
-- subquery on memberships/profiles (the recursion 0006 fixed; guarded).
--
-- Idempotent for the same reason as 0001–0012.

-- ── 1. which text was accepted ────────────────────────────────────────────
alter table public.agreement_acceptances
  add column if not exists text_sha256 text
  check (text_sha256 is null or text_sha256 ~ '^[0-9a-f]{64}$');

-- ── 2. consent grants ─────────────────────────────────────────────────────
create table if not exists public.consent_grants (
  user_id     uuid not null references auth.users(id) on delete cascade,
  grant_id    text not null check (grant_id in ('share-employer', 'benchmark', 'outcome')),
  granted     boolean not null,
  -- clock_timestamp(), not now(): two changes inside one transaction must
  -- still be two rows.
  recorded_at timestamptz not null default clock_timestamp(),
  primary key (user_id, grant_id, recorded_at)
);
alter table public.consent_grants enable row level security;

drop policy if exists "consents self insert" on public.consent_grants;
drop policy if exists "consents self read"   on public.consent_grants;
create policy "consents self insert" on public.consent_grants for insert
  with check (auth.uid() = user_id);
create policy "consents self read" on public.consent_grants for select
  using (auth.uid() = user_id);
-- No update or delete policies: a change of mind is a new row.

create or replace function public.forbid_consent_update()
returns trigger language plpgsql as $$
begin
  raise exception 'consent_grants is append-only — record a new grant or revocation instead';
end $$;
drop trigger if exists consent_grants_immutable on public.consent_grants;
create trigger consent_grants_immutable
  before update on public.consent_grants
  for each row execute function public.forbid_consent_update();

-- The current answer for one person and one grant. For the platform's own
-- functions (below, and the edge functions): never callable by a signed-in
-- member about someone else.
create or replace function public.has_consent(u uuid, g text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select c.granted from public.consent_grants c
      where c.user_id = u and c.grant_id = g
      order by c.recorded_at desc limit 1),
    false)
$$;
revoke execute on function public.has_consent(uuid, text) from public, anon, authenticated;
grant  execute on function public.has_consent(uuid, text) to service_role;

-- ── 3. learner outcomes ───────────────────────────────────────────────────
create table if not exists public.learner_outcomes (
  user_id      uuid not null references auth.users(id) on delete cascade,
  recorded_at  timestamptz not null default clock_timestamp(),
  status       text not null check (status in ('studying', 'searching', 'placed', 'promoted', 'not-seeking')),
  role_title   text not null default '' check (char_length(role_title) <= 120),
  employer     text not null default '' check (char_length(employer) <= 120),
  started_on   text not null default '' check (started_on = '' or started_on ~ '^\d{4}-\d{2}$'),
  used_at_work jsonb not null default '{}'::jsonb,
  primary key (user_id, recorded_at)
);
alter table public.learner_outcomes enable row level security;

drop policy if exists "outcomes self insert" on public.learner_outcomes;
drop policy if exists "outcomes self read"   on public.learner_outcomes;
create policy "outcomes self insert" on public.learner_outcomes for insert
  with check (auth.uid() = user_id);
create policy "outcomes self read" on public.learner_outcomes for select
  using (auth.uid() = user_id);
-- No update or delete policies, no instructor read: counts only, below.

create or replace function public.forbid_outcome_update()
returns trigger language plpgsql as $$
begin
  raise exception 'learner_outcomes is append-only — save a new answer instead';
end $$;
drop trigger if exists learner_outcomes_immutable on public.learner_outcomes;
create trigger learner_outcomes_immutable
  before update on public.learner_outcomes
  for each row execute function public.forbid_outcome_update();

-- Counts per status among the members of one course who hold the outcome
-- grant, for instructors and admins only, and only when at least five such
-- members have answered. Below the floor the function returns no rows at
-- all, so a small class can never be read one person at a time.
create or replace function public.outcome_counts(c text)
returns table(status text, members int)
language sql stable security definer set search_path = public as $$
  with latest as (
    select distinct on (o.user_id) o.user_id, o.status
      from public.learner_outcomes o
      join public.memberships m on m.user_id = o.user_id and m.course_id = c
     where public.is_instructor()
       and public.has_consent(o.user_id, 'outcome')
     order by o.user_id, o.recorded_at desc
  ),
  n as (select count(*) as total from latest)
  select l.status, count(*)::int as members
    from latest l, n
   where n.total >= 5
   group by l.status
   order by l.status
$$;
revoke execute on function public.outcome_counts(text) from public, anon;
grant  execute on function public.outcome_counts(text) to authenticated, service_role;

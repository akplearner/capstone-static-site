-- 0011_agreement_log.sql — the acknowledgement log, and a last-seen clock (R86).
--
-- WHAT THIS IS. Before using the platform every account acknowledges the
-- click-through agreements (terms/no-exam-guarantee, acceptable use, lab
-- responsibility, data notice, conduct — the registry in
-- src/lib/legal/agreements.ts). This table is the LOG of those clicks: one
-- append-only row per (user, agreement, version), so the record says exactly
-- which text a person agreed to and when, and a version bump makes the gate
-- ask again without erasing what they agreed to before.
--
-- WHO SEES WHAT. A person inserts and reads their own rows; instructors and
-- admins read everyone's (the metrics view shows who has signed what).
-- NOBODY updates or deletes — an acknowledgement is history, and disagreeing
-- later is an account-deletion conversation, not an edit.
--
-- ALSO HERE: profiles.last_seen_at — the small clock behind "who is on the
-- platform right now / when were they last active" on the admin metrics page.
-- The app updates the caller's OWN column on a throttled heartbeat; the 0006
-- column grant is re-issued to allow exactly the three self-owned columns.
--
-- Idempotent for the same reason as 0001–0010.

create table if not exists public.agreement_acceptances (
  user_id uuid not null references auth.users(id) on delete cascade,
  agreement_id text not null,
  version int not null,
  accepted_at timestamptz not null default now(),
  primary key (user_id, agreement_id, version)
);
alter table public.agreement_acceptances enable row level security;

drop policy if exists "acceptances self insert"     on public.agreement_acceptances;
drop policy if exists "acceptances self read"       on public.agreement_acceptances;
drop policy if exists "acceptances instructor read" on public.agreement_acceptances;

create policy "acceptances self insert" on public.agreement_acceptances for insert
  with check (auth.uid() = user_id);
create policy "acceptances self read" on public.agreement_acceptances for select
  using (auth.uid() = user_id);
create policy "acceptances instructor read" on public.agreement_acceptances for select
  using (public.is_instructor());
-- No update or delete policies: the log only ever grows.

-- ── last activity ───────────────────────────────────────────────────────────
alter table public.profiles add column if not exists last_seen_at timestamptz;

revoke update on public.profiles from anon, authenticated;
grant  update (display_name, avatar_url, last_seen_at) on public.profiles to authenticated;

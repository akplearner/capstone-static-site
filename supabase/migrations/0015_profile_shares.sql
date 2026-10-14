-- 0015_profile_shares.sql — candidate links and published employer profiles
-- (R114).
--
-- WHAT THIS IS.
--
--   profile_shares — one row per link a member created to a frozen copy of
--     their portfolio export (`capstone-member-profile/1`) or their unsigned
--     credential. The row holds the copy, the SHA-256 of the link's token
--     (never the token itself), a label, the profile the board was measured
--     against, when it was made, when it expires (at most ninety days later)
--     and when it was revoked. Only the `share` edge function inserts, as the
--     service role, after checking the member's share-employer consent and
--     the copy's shape (no insert policy). The owner lists their links,
--     revokes them and deletes them; they can never read the copy or the
--     token hash back, change the expiry or the copy, or un-revoke (column
--     grants and a trigger). Signed-out visitors read nothing here: the
--     `shared-profile` function serves one live link by its token's hash.
--
--   environment_profiles — what an employer's environment looks like (the
--     `environment-profile.schema.json` shape), published by an instructor so
--     every signed-in member can measure their Skill board against it.
--     Instructors publish and remove their own; nobody edits one in place (a
--     new version is a new publish).
--
-- WHAT THIS DOES NOT CLAIM. A link shows a frozen, unsigned copy of what the
-- member chose to share: browser-side checks, hashes and server receipts of
-- stamps. The server cannot recompute the numbers; it keeps identity out of
-- the copy and makes the link unguessable, expiring and revocable.
--
-- All policies use auth.uid() on the row's own user id or the 0006 definer
-- helpers — never a subquery on memberships/profiles (the recursion 0006
-- fixed; guarded). Idempotent for the same reason as 0001–0014.

-- ── 1. candidate links ─────────────────────────────────────────────────────
create table if not exists public.profile_shares (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  token_hash       text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  kind             text not null check (kind in ('profile', 'credential')),
  label            text not null default '' check (char_length(label) <= 60),
  snapshot         jsonb not null check (pg_column_size(snapshot) <= 262144),
  measured_against text not null default '' check (char_length(measured_against) <= 120),
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null,
  revoked_at       timestamptz,
  check (expires_at > created_at and expires_at <= created_at + interval '90 days')
);
alter table public.profile_shares enable row level security;

-- The owner sees a link's facts, never its copy or its token hash, and may
-- change one column. Column grants, so PostgREST refuses the rest outright.
revoke all on public.profile_shares from anon, authenticated;
grant select (id, user_id, kind, label, measured_against, created_at, expires_at, revoked_at)
  on public.profile_shares to authenticated;
grant update (revoked_at) on public.profile_shares to authenticated;
grant delete on public.profile_shares to authenticated;
grant all on public.profile_shares to service_role;

drop policy if exists "shares self read"   on public.profile_shares;
drop policy if exists "shares self revoke" on public.profile_shares;
drop policy if exists "shares self delete" on public.profile_shares;
create policy "shares self read" on public.profile_shares for select
  using (auth.uid() = user_id);
create policy "shares self revoke" on public.profile_shares for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "shares self delete" on public.profile_shares for delete
  using (auth.uid() = user_id);
-- No insert policy: the `share` function is the only writer.

-- Below RLS too: an update may only revoke a live link, the database clock
-- dates the revocation, and every other column stays as it was written.
create or replace function public.guard_share_update()
returns trigger language plpgsql as $$
begin
  if old.revoked_at is not null then
    raise exception 'profile_shares: a revoked link stays revoked';
  end if;
  if new.revoked_at is null then
    raise exception 'profile_shares: an update can only revoke a link';
  end if;
  if (new.id, new.user_id, new.token_hash, new.kind, new.label, new.snapshot, new.measured_against, new.created_at, new.expires_at)
     is distinct from
     (old.id, old.user_id, old.token_hash, old.kind, old.label, old.snapshot, old.measured_against, old.created_at, old.expires_at) then
    raise exception 'profile_shares: only revoked_at may change';
  end if;
  new.revoked_at := now();
  return new;
end $$;
drop trigger if exists profile_shares_guard on public.profile_shares;
create trigger profile_shares_guard
  before update on public.profile_shares
  for each row execute function public.guard_share_update();

create index if not exists profile_shares_owner on public.profile_shares (user_id, created_at desc);

-- ── 2. published employer profiles ────────────────────────────────────────
create table if not exists public.environment_profiles (
  id                text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  publisher_user_id uuid not null references auth.users(id) on delete cascade,
  profile           jsonb not null check (pg_column_size(profile) <= 131072),
  published_at      timestamptz not null default now()
);
alter table public.environment_profiles enable row level security;

drop policy if exists "environment profiles signed-in read" on public.environment_profiles;
drop policy if exists "environment profiles instructor publish" on public.environment_profiles;
drop policy if exists "environment profiles instructor remove" on public.environment_profiles;
create policy "environment profiles signed-in read" on public.environment_profiles for select
  using (auth.uid() is not null);
create policy "environment profiles instructor publish" on public.environment_profiles for insert
  with check (public.is_instructor() and publisher_user_id = auth.uid());
create policy "environment profiles instructor remove" on public.environment_profiles for delete
  using (public.is_instructor() and publisher_user_id = auth.uid());
-- No update policy: a new version is a new publish.

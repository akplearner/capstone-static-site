-- 0014_verification_receipts.sql — server-issued stamps, verification
-- receipts and artifact re-hash checks (R113).
--
-- WHAT THIS IS. Until now the stamp a member echoes into pasted output
-- (CQ- and six symbols) was computed in the browser from the member, course
-- and task ids, and the whole check ran client-side (0003). In cloud mode the
-- platform now issues the stamp itself and logs a receipt when output that
-- carries it comes back matched:
--
--   verification_stamps — one row per stamp the `stamp` edge function issued:
--     whose it is, the course and task, when it was issued, when it expires
--     (twenty minutes later) and when it was first receipted. Service role
--     only: RLS is on and there are NO policies, so no signed-in member reads
--     or writes a stamp row; a member learns their own live stamp from the
--     function's response and nowhere else.
--
--   verification_receipts — one row per (stamp, step) the `receipt` function
--     accepted: the step, the SHA-256 of the pasted output and the token
--     counts. Never the pasted text: the function has no field for it. The
--     member, their teammates and the instructor read; no client inserts,
--     updates or deletes (no policies; the function writes as the service
--     role), and an update trigger keeps rows frozen below RLS too. A stamp
--     receipts each step once (unique stamp_id, step_id).
--
--   rehash_checks — a member hashes a file they hashed before, in the
--     browser, and records whether the digest still matched: the course, the
--     digest, the filename, ok, and when. Append-only: self insert and read,
--     instructor read. The file never leaves the browser (ADR-0004).
--
-- WHAT THIS DOES NOT CLAIM. Same stance as 0003: a receipt records that the
-- server issued this stamp to this account and that output containing it and
-- every expected token was hashed in the browser while the stamp was live.
-- It does not prove a command ran on a real machine, or who typed it. A
-- re-hash check records that the member still holds a file with that digest.
-- The UI wording says exactly that and no more.
--
-- All policies use auth.uid() on the row's own user_id or the 0006 definer
-- helpers — never a subquery on memberships/profiles (the recursion 0006
-- fixed; guarded). Deletes have no policy but stay possible for `on delete
-- cascade` when an account is erased, which an UPDATE trigger must not block.
--
-- Idempotent for the same reason as 0001–0013.

-- ── 1. stamps: the server's half, readable by nobody but the service role ──
create table if not exists public.verification_stamps (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  course_id  text not null,
  task_id    text not null,
  -- Exactly the client stamp's alphabet: no I, L, O or U, no 0 or 1.
  stamp      text not null check (stamp ~ '^CQ-[A-HJKMNP-TV-Z2-9]{6}$'),
  issued_at  timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at    timestamptz,
  unique (user_id, stamp),
  check (expires_at > issued_at and expires_at <= issued_at + interval '1 hour')
);
alter table public.verification_stamps enable row level security;
-- No policies at all: the `stamp` and `receipt` functions are the only
-- readers and writers, and they act as the service role.
create index if not exists verification_stamps_live
  on public.verification_stamps (user_id, course_id, task_id, expires_at desc);

-- ── 2. receipts: written by the platform, read by the member's circle ─────
create table if not exists public.verification_receipts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  course_id      text not null,
  task_id        text not null,
  step_id        text not null,
  stamp_id       uuid not null references public.verification_stamps(id) on delete cascade,
  output_sha256  text not null check (output_sha256 ~ '^[0-9a-f]{64}$'),
  matched_tokens int not null check (matched_tokens >= 2),
  total_tokens   int not null check (total_tokens = matched_tokens),
  receipted_at   timestamptz not null default now(),
  unique (stamp_id, step_id)
);
alter table public.verification_receipts enable row level security;

drop policy if exists "receipts self read"       on public.verification_receipts;
drop policy if exists "receipts team read"       on public.verification_receipts;
drop policy if exists "receipts instructor read" on public.verification_receipts;
create policy "receipts self read" on public.verification_receipts for select
  using (auth.uid() = user_id);
create policy "receipts team read" on public.verification_receipts for select
  using (public.same_team_as(user_id, course_id));
create policy "receipts instructor read" on public.verification_receipts for select
  using (public.is_instructor());
-- No insert, update or delete policies: the `receipt` function is the only writer.

create or replace function public.forbid_receipt_update()
returns trigger language plpgsql as $$
begin
  raise exception 'verification_receipts is append-only — a receipt is never rewritten';
end $$;
drop trigger if exists verification_receipts_immutable on public.verification_receipts;
create trigger verification_receipts_immutable
  before update on public.verification_receipts
  for each row execute function public.forbid_receipt_update();

create index if not exists verification_receipts_course
  on public.verification_receipts (course_id, user_id);

-- ── 3. re-hash checks: the member's own, append-only ──────────────────────
create table if not exists public.rehash_checks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  course_id  text not null,
  sha256     text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  filename   text not null default '' check (char_length(filename) <= 255),
  ok         boolean not null,
  checked_at timestamptz not null default clock_timestamp()
);
alter table public.rehash_checks enable row level security;

drop policy if exists "rehash self insert"     on public.rehash_checks;
drop policy if exists "rehash self read"       on public.rehash_checks;
drop policy if exists "rehash instructor read" on public.rehash_checks;
create policy "rehash self insert" on public.rehash_checks for insert
  with check (auth.uid() = user_id);
create policy "rehash self read" on public.rehash_checks for select
  using (auth.uid() = user_id);
create policy "rehash instructor read" on public.rehash_checks for select
  using (public.is_instructor());
-- No update or delete policies: a later check is a new row.

create or replace function public.forbid_rehash_update()
returns trigger language plpgsql as $$
begin
  raise exception 'rehash_checks is append-only — record a new check instead';
end $$;
drop trigger if exists rehash_checks_immutable on public.rehash_checks;
create trigger rehash_checks_immutable
  before update on public.rehash_checks
  for each row execute function public.forbid_rehash_update();

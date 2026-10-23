-- 0020_client_errors.sql — the support log: what failed, for whom, kept on OUR side only (R129).
--
-- WHAT THIS IS. When something fails in a student's browser (today: recording the agreements), the
-- student is shown only a support code and the time, "E-7K2M9Q at 14:05 UTC". The database error
-- itself (its code, message and status), the account it happened to and the page it happened on are
-- written here, where only an admin can read them, so support looks the code up instead of asking the
-- student to copy technical text, and nothing technical is left in the browser console.
--
-- WHO CAN DO WHAT. A signed-in person inserts rows about THEMSELVES (user_id = auth.uid()); the
-- signed-out insert nothing. Only an admin reads. Nobody updates or deletes: a log is history. The
-- account may be erased, which detaches its rows (user_id becomes null, the email already written
-- stays for support until the table is pruned by the admin in SQL).
--
-- Idempotent, like 0001-0019.

create table if not exists public.client_errors (
  id uuid primary key default gen_random_uuid(),
  support_code text not null check (support_code ~ '^E-[A-Z0-9]{6}$'),
  -- the database's clock decides when it was recorded; the client's is what the student was shown
  occurred_at timestamptz not null default clock_timestamp(),
  client_at timestamptz,
  user_id uuid references auth.users(id) on delete set null,
  user_email text check (user_email is null or char_length(user_email) <= 320),
  area text not null check (char_length(area) between 1 and 40),
  reason text check (reason is null or char_length(reason) <= 40),
  db_code text check (db_code is null or char_length(db_code) <= 40),
  http_status int,
  message text check (message is null or char_length(message) <= 2000),
  details text check (details is null or char_length(details) <= 4000),
  path text check (path is null or char_length(path) <= 300),
  user_agent text check (user_agent is null or char_length(user_agent) <= 400)
);

create index if not exists client_errors_code_idx on public.client_errors (support_code);
create index if not exists client_errors_time_idx on public.client_errors (occurred_at desc);

alter table public.client_errors enable row level security;

drop policy if exists "client errors add own" on public.client_errors;
create policy "client errors add own" on public.client_errors for insert
  with check (user_id = auth.uid());

drop policy if exists "client errors admin read" on public.client_errors;
create policy "client errors admin read" on public.client_errors for select
  using (public.is_admin());

-- No update or delete policy; the grants go too, and truncate bypasses policies, so it is revoked.
revoke update, delete, truncate on public.client_errors from anon, authenticated;
revoke insert on public.client_errors from anon;

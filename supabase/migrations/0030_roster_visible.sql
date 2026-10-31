-- 0030_roster_visible.sql — the join panel sees the roster before you join, and it stays live (R155).
--
-- WHAT WENT WRONG. The join panel shows, to a student who has NOT yet joined, every team's seats
-- (n/6), each role's state (open / peer welcome / taken / full) and the online lobbies — all read
-- from `memberships` and `role_peering`. But both read policies were `shares_course(course_id)`,
-- which is true only for a caller who ALREADY has a membership on the course. A signed-in student
-- about to join therefore read an empty roster: every team 0/6, every role open, every lobby
-- empty — and, since Realtime only delivers rows the caller may select, nothing changed while
-- they watched. Exactly the moment the facts matter was the moment they were hidden.
--
-- THE RULE NOW. Any SIGNED-IN user may read the roster (team, role, display name, class session)
-- and the peer flags. Anonymous visitors still read nothing. Everything a team WORKS on (forms,
-- gates, evidence, flags, receipts…) keeps its `shares_course` rule — only the two tables the
-- join panel shows pre-join are widened. The policy bodies have no subquery, so the 0006 recursion
-- cannot return. `role_peering` joins the Realtime publication so a leader opening a peer seat
-- reaches every open join panel.
--
-- Idempotent, like 0001–0029.

drop policy if exists "memberships course read" on public.memberships;
create policy "memberships course read" on public.memberships
  for select using (auth.uid() is not null);

drop policy if exists "role peering read" on public.role_peering;
create policy "role peering read" on public.role_peering
  for select using (auth.uid() is not null);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'role_peering') then
    execute 'alter publication supabase_realtime add table public.role_peering';
  end if;
end $$;

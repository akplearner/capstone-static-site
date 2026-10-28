-- 0024_history_realtime.sql — the two history tables reach open tabs live (R136).
--
-- WHAT THIS IS. 0021 (`deliverable_review_marks`) and 0022 (`step_flag_events`) are append-only history
-- the workforce-readiness profile reads: the instructor's marks per rubric category, and every raise and
-- clear of a stuck flag. Until R136 nothing handed them to the profile, so nothing noticed that they were
-- not published either: a mark saved by the instructor, or a teammate's flag history, reached another tab
-- only on the next full reload. Both tables are team-readable under their own policies (0021, 0022), so
-- publishing them says nothing to anyone the policies do not already allow.
--
-- Idempotent, like 0001–0023.

do $$
declare t text;
begin
  foreach t in array array['deliverable_review_marks', 'step_flag_events'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

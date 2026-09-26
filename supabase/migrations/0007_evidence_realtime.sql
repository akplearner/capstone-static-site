-- 0007_evidence_realtime.sql — teammates' gems arrive live.
--
-- 0006 made `step_evidence` readable by teammates: the gems on the team table
-- are derived from it (verified vs self-attested, on time). But the table was
-- never added to the realtime publication, so a teammate's freshly earned gem
-- only appeared when some OTHER table happened to change, or on reload. One
-- statement, same duplicate_object guard as 0001/0004/0005.
--
-- Idempotent for the same reason as 0001–0006. Already ran setup.sql? Paste
-- this file alone, or re-run all of setup.sql — every statement in it is safe
-- to run twice.
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.step_evidence';
  exception when duplicate_object then null;
  end;
end $$;
